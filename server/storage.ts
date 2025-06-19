import {
  users,
  projects,
  budgets,
  budgetStages,
  budgetItems,
  budgetSubitems,
  expenses,
  workDiaries,
  workDiaryWorkers,
  measurements,
  scheduleItems,
  projectCollaborators,
  employees,
  workDiaryAttendance,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type Budget,
  type InsertBudget,
  type BudgetStage,
  type InsertBudgetStage,
  type BudgetItem,
  type InsertBudgetItem,
  type BudgetSubitem,
  type InsertBudgetSubitem,
  type Expense,
  type InsertExpense,
  type WorkDiary,
  type InsertWorkDiary,
  type WorkDiaryWorker,
  type InsertWorkDiaryWorker,
  type Measurement,
  type InsertMeasurement,
  type ScheduleItem,
  type InsertScheduleItem,
  type ProjectCollaborator,
  type Employee,
  type InsertEmployee,
  type WorkDiaryAttendance,
  type InsertWorkDiaryAttendance,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte, or, like, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project>;

  // Budget operations
  getBudgetsByProject(projectId: number): Promise<Budget[]>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  getBudgetWithStructure(budgetId: number): Promise<any>;

  // Budget structure operations
  createBudgetStage(stage: InsertBudgetStage): Promise<BudgetStage>;
  createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem>;
  createBudgetSubitem(subitem: InsertBudgetSubitem): Promise<BudgetSubitem>;
  updateBudgetSubitem(id: number, subitem: Partial<InsertBudgetSubitem>): Promise<BudgetSubitem>;

  // Expense operations
  getExpensesByProject(projectId: number): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;

  // Work diary operations
  getWorkDiariesByProject(projectId: number): Promise<any[]>;
  createWorkDiary(diary: InsertWorkDiary): Promise<WorkDiary>;
  addWorkDiaryWorkers(diaryId: number, workers: InsertWorkDiaryWorker[]): Promise<WorkDiaryWorker[]>;

  // Measurement operations
  getMeasurementsByProject(projectId: number): Promise<Measurement[]>;
  createMeasurement(measurement: InsertMeasurement): Promise<Measurement>;

  // Schedule operations
  getScheduleByProject(projectId: number): Promise<ScheduleItem[]>;
  createScheduleItem(item: InsertScheduleItem): Promise<ScheduleItem>;
  updateScheduleItem(id: number, item: Partial<InsertScheduleItem>): Promise<ScheduleItem>;

  // Dashboard statistics
  getDashboardStats(): Promise<any>;

  // Employee operations
  getEmployees(): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;

  // Work diary attendance operations
  getWorkDiaryAttendance(workDiaryId: number): Promise<WorkDiaryAttendance[]>;
  addWorkDiaryAttendance(attendance: InsertWorkDiaryAttendance[]): Promise<WorkDiaryAttendance[]>;
  deleteWorkDiaryAttendance(workDiaryId: number): Promise<void>;
  deleteWorkDiary(id: number): Promise<void>;

  // Employee cost tracking
  getEmployeeCostsByProject(projectId: number): Promise<Record<number, { totalCost: number; workDays: number }>>;
  getEmployeeCosts(filters?: {
    startDate?: string;
    endDate?: string;
    projectId?: number;
    employeeType?: string;
    role?: string;
    search?: string;
  }): Promise<any[]>;

  // Sharing operations
  getAllWorkDiariesWithPhotos(): Promise<any[]>;
  getAllExpensesWithReceipts(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  // Budget operations
  async getBudgetsByProject(projectId: number): Promise<Budget[]> {
    return await db.select().from(budgets).where(eq(budgets.projectId, projectId));
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db.insert(budgets).values(budget).returning();
    return newBudget;
  }

  async getBudgetWithStructure(budgetId: number): Promise<any> {
    const budget = await db.query.budgets.findFirst({
      where: eq(budgets.id, budgetId),
      with: {
        stages: {
          with: {
            items: {
              with: {
                subitems: true,
              },
            },
          },
        },
      },
    });
    return budget;
  }

  // Budget structure operations
  async createBudgetStage(stage: InsertBudgetStage): Promise<BudgetStage> {
    const [newStage] = await db.insert(budgetStages).values(stage).returning();
    return newStage;
  }

  async createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem> {
    const [newItem] = await db.insert(budgetItems).values(item).returning();
    return newItem;
  }

  async createBudgetSubitem(subitem: InsertBudgetSubitem): Promise<BudgetSubitem> {
    // Calculate total price
    const totalPrice = Number(subitem.quantity) * Number(subitem.unitPrice);
    const subitemWithTotal = { ...subitem, totalPrice: totalPrice.toString() };
    
    const [newSubitem] = await db.insert(budgetSubitems).values(subitemWithTotal).returning();
    return newSubitem;
  }

  async updateBudgetSubitem(id: number, subitem: Partial<InsertBudgetSubitem>): Promise<BudgetSubitem> {
    // Recalculate total if quantity or unit price changed
    if (subitem.quantity !== undefined || subitem.unitPrice !== undefined) {
      const [existing] = await db.select().from(budgetSubitems).where(eq(budgetSubitems.id, id));
      const quantity = subitem.quantity !== undefined ? Number(subitem.quantity) : Number(existing.quantity);
      const unitPrice = subitem.unitPrice !== undefined ? Number(subitem.unitPrice) : Number(existing.unitPrice);
      subitem.totalPrice = (quantity * unitPrice).toString();
    }

    const [updatedSubitem] = await db
      .update(budgetSubitems)
      .set({ ...subitem, updatedAt: new Date() })
      .where(eq(budgetSubitems.id, id))
      .returning();
    return updatedSubitem;
  }

  // Expense operations
  async getExpensesByProject(projectId: number): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.projectId, projectId)).orderBy(desc(expenses.date));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  // Work diary operations
  async getWorkDiariesByProject(projectId: number): Promise<any[]> {
    const diaries = await db
      .select({
        id: workDiaries.id,
        projectId: workDiaries.projectId,
        date: workDiaries.date,
        activities: workDiaries.activities,
        photos: workDiaries.photos,
        createdBy: workDiaries.createdBy,
        createdAt: workDiaries.createdAt,
        updatedAt: workDiaries.updatedAt,
      })
      .from(workDiaries)
      .where(eq(workDiaries.projectId, projectId))
      .orderBy(desc(workDiaries.date));

    // Para cada diário, buscar os dados de presença
    const diariesWithAttendance = await Promise.all(
      diaries.map(async (diary) => {
        const attendance = await db
          .select({
            employeeId: workDiaryAttendance.employeeId,
            employeeName: employees.name,
            role: employees.role,
            isContractor: employees.isContractor,
            dailyRate: workDiaryAttendance.dailyRate,
            hoursWorked: workDiaryAttendance.hoursWorked,
            activities: workDiaryAttendance.activities,
          })
          .from(workDiaryAttendance)
          .innerJoin(employees, eq(workDiaryAttendance.employeeId, employees.id))
          .where(eq(workDiaryAttendance.workDiaryId, diary.id));

        return {
          ...diary,
          attendance,
        };
      })
    );

    return diariesWithAttendance;
  }

  async createWorkDiary(diary: InsertWorkDiary): Promise<WorkDiary> {
    const [newDiary] = await db.insert(workDiaries).values(diary).returning();
    return newDiary;
  }

  async addWorkDiaryWorkers(diaryId: number, workers: InsertWorkDiaryWorker[]): Promise<WorkDiaryWorker[]> {
    const workersWithDiaryId = workers.map(worker => ({ ...worker, diaryId }));
    return await db.insert(workDiaryWorkers).values(workersWithDiaryId).returning();
  }

  // Measurement operations
  async getMeasurementsByProject(projectId: number): Promise<Measurement[]> {
    return await db.select().from(measurements).where(eq(measurements.projectId, projectId)).orderBy(desc(measurements.date));
  }

  async createMeasurement(measurement: InsertMeasurement): Promise<Measurement> {
    // Calculate total amount
    const totalAmount = Number(measurement.executedQuantity) * Number(measurement.unitPrice);
    const measurementWithTotal = { ...measurement, totalAmount: totalAmount.toString() };
    
    const [newMeasurement] = await db.insert(measurements).values(measurementWithTotal).returning();
    return newMeasurement;
  }

  // Schedule operations
  async getScheduleByProject(projectId: number): Promise<ScheduleItem[]> {
    return await db.select().from(scheduleItems).where(eq(scheduleItems.projectId, projectId)).orderBy(scheduleItems.startDate);
  }

  async createScheduleItem(item: InsertScheduleItem): Promise<ScheduleItem> {
    const [newItem] = await db.insert(scheduleItems).values(item).returning();
    return newItem;
  }

  async updateScheduleItem(id: number, item: Partial<InsertScheduleItem>): Promise<ScheduleItem> {
    const [updatedItem] = await db
      .update(scheduleItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(scheduleItems.id, id))
      .returning();
    return updatedItem;
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<any> {
    const [activeProjects] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.status, 'execution'));

    const [totalBudget] = await db
      .select({ total: sql<number>`coalesce(sum(${budgetSubitems.totalPrice}), 0)` })
      .from(budgetSubitems)
      .innerJoin(budgetItems, eq(budgetSubitems.itemId, budgetItems.id))
      .innerJoin(budgetStages, eq(budgetItems.stageId, budgetStages.id))
      .innerJoin(budgets, eq(budgetStages.budgetId, budgets.id))
      .where(eq(budgets.isActive, true));

    const [monthlyExpenses] = await db
      .select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
      .from(expenses)
      .where(sql`date_trunc('month', ${expenses.date}) = date_trunc('month', current_date)`);

    const [totalWorkers] = await db
      .select({ count: sql<number>`count(distinct ${workDiaryWorkers.workerName})` })
      .from(workDiaryWorkers)
      .innerJoin(workDiaries, eq(workDiaryWorkers.diaryId, workDiaries.id))
      .where(sql`${workDiaries.date} >= current_date - interval '30 days'`);

    return {
      activeProjects: activeProjects.count || 0,
      totalBudget: totalBudget.total || 0,
      monthlyExpenses: monthlyExpenses.total || 0,
      totalWorkers: totalWorkers.count || 0,
    };
  }

  // Employee operations
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees)
      .orderBy(employees.name);
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values({
      name: employee.name,
      role: employee.role,
      dailyRate: employee.dailyRate.toString(),
      isContractor: employee.isContractor || false,
      phone: employee.phone,
      document: employee.document,
      status: employee.status || "ativo"
    }).returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee> {
    const updateData: any = { ...employee, updatedAt: new Date() };
    if (updateData.dailyRate !== undefined) {
      updateData.dailyRate = updateData.dailyRate.toString();
    }
    const [updatedEmployee] = await db.update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  // Work diary attendance operations
  async getWorkDiaryAttendance(workDiaryId: number): Promise<WorkDiaryAttendance[]> {
    return await db.select({
      id: workDiaryAttendance.id,
      workDiaryId: workDiaryAttendance.workDiaryId,
      employeeId: workDiaryAttendance.employeeId,
      hoursWorked: workDiaryAttendance.hoursWorked,
      dailyRate: workDiaryAttendance.dailyRate,
      activities: workDiaryAttendance.activities,
      createdAt: workDiaryAttendance.createdAt,
    })
    .from(workDiaryAttendance)
    .where(eq(workDiaryAttendance.workDiaryId, workDiaryId));
  }

  async addWorkDiaryAttendance(attendance: InsertWorkDiaryAttendance[]): Promise<WorkDiaryAttendance[]> {
    return await db.insert(workDiaryAttendance).values(attendance).returning();
  }

  async deleteWorkDiaryAttendance(workDiaryId: number): Promise<void> {
    await db.delete(workDiaryAttendance).where(eq(workDiaryAttendance.workDiaryId, workDiaryId));
  }

  async deleteWorkDiary(id: number): Promise<void> {
    await db.delete(workDiaries).where(eq(workDiaries.id, id));
  }

  async getEmployeeCostsByProject(projectId: number): Promise<Record<number, { totalCost: number; workDays: number }>> {
    const costs = await db
      .select({
        employeeId: workDiaryAttendance.employeeId,
        dailyRate: workDiaryAttendance.dailyRate,
        workDiaryId: workDiaryAttendance.workDiaryId,
      })
      .from(workDiaryAttendance)
      .innerJoin(workDiaries, eq(workDiaryAttendance.workDiaryId, workDiaries.id))
      .where(eq(workDiaries.projectId, projectId));

    const result: Record<number, { totalCost: number; workDays: number }> = {};
    
    costs.forEach(cost => {
      const employeeId = cost.employeeId;
      if (!result[employeeId]) {
        result[employeeId] = { totalCost: 0, workDays: 0 };
      }
      result[employeeId].totalCost += Number(cost.dailyRate);
      result[employeeId].workDays += 1;
    });

    return result;
  }

  async getEmployeeCosts(filters?: {
    startDate?: string;
    endDate?: string;
    projectId?: number;
    employeeType?: string;
    role?: string;
    employeeId?: number;
  }): Promise<any[]> {
    console.log('Employee costs filters:', filters);
    
    // Se não há filtros aplicados, retorna array vazio
    if (!filters || (!filters.startDate && !filters.endDate && !filters.projectId && !filters.employeeType && !filters.role && !filters.employeeId)) {
      return [];
    }
    
    const conditions = [];

    if (filters?.projectId) {
      conditions.push(eq(workDiaries.projectId, filters.projectId));
    }

    if (filters?.startDate) {
      conditions.push(sql`${workDiaries.date} >= ${filters.startDate}`);
    }

    if (filters?.endDate) {
      conditions.push(sql`${workDiaries.date} <= ${filters.endDate}`);
    }

    if (filters?.employeeType === 'funcionario') {
      conditions.push(eq(employees.isContractor, false));
    } else if (filters?.employeeType === 'empreiteiro') {
      conditions.push(eq(employees.isContractor, true));
    }

    if (filters?.role) {
      conditions.push(eq(employees.role, filters.role));
    }

    if (filters?.employeeId) {
      conditions.push(eq(employees.id, parseInt(filters.employeeId.toString())));
    }

    // Se ainda não há condições após os filtros, retorna array vazio
    if (conditions.length === 0) {
      return [];
    }

    const query = db
      .select({
        employeeId: employees.id,
        employeeName: employees.name,
        role: employees.role,
        isContractor: employees.isContractor,
        dailyRate: workDiaryAttendance.dailyRate,
        workDate: workDiaries.date,
        projectId: workDiaries.projectId,
        projectName: projects.name,
        totalCost: workDiaryAttendance.dailyRate,
        hoursWorked: sql<number>`8`
      })
      .from(workDiaryAttendance)
      .innerJoin(employees, eq(workDiaryAttendance.employeeId, employees.id))
      .innerJoin(workDiaries, eq(workDiaryAttendance.workDiaryId, workDiaries.id))
      .innerJoin(projects, eq(workDiaries.projectId, projects.id))
      .where(and(...conditions))
      .orderBy(desc(workDiaries.date), employees.name);

    console.log('Query conditions count:', conditions.length);
    const results = await query;
    console.log('Query results count:', results.length);
    
    // Transformar para o formato esperado pelo frontend
    return results.map(result => ({
      ...result,
      totalCost: Number(result.dailyRate || 0),
      hoursWorked: 8 // Sempre 8 horas pois é diária
    }));
  }

  // Sharing operations
  async getAllWorkDiariesWithPhotos(): Promise<any[]> {
    try {
      const diaries = await db
        .select({
          id: workDiaries.id,
          date: workDiaries.date,
          projectId: workDiaries.projectId,
          projectName: projects.name,
          photos: workDiaries.photos,
        })
        .from(workDiaries)
        .innerJoin(projects, eq(workDiaries.projectId, projects.id))
        .where(sql`${workDiaries.photos} IS NOT NULL AND jsonb_array_length(${workDiaries.photos}) > 0`)
        .orderBy(desc(workDiaries.date));

      return diaries.filter(diary => diary.photos && diary.photos.length > 0);
    } catch (error) {
      console.error("Error fetching diary images:", error);
      throw error;
    }
  }

  async getAllExpensesWithReceipts(): Promise<any[]> {
    try {
      const expensesWithReceipts = await db
        .select({
          id: expenses.id,
          date: expenses.date,
          projectId: expenses.projectId,
          projectName: projects.name,
          description: expenses.description,
          receipt: expenses.receiptImage,
          amount: expenses.amount,
        })
        .from(expenses)
        .innerJoin(projects, eq(expenses.projectId, projects.id))
        .where(sql`${expenses.receiptImage} IS NOT NULL`)
        .orderBy(desc(expenses.date));

      return expensesWithReceipts;
    } catch (error) {
      console.error("Error fetching expense documents:", error);
      throw error;
    }
  }

  // Photo management operations
  async getAllDiaryPhotos(): Promise<any[]> {
    try {
      const diaries = await db
        .select({
          id: workDiaries.id,
          workId: workDiaries.projectId,
          date: workDiaries.date,
          projectName: projects.name,
          photos: workDiaries.photos,
        })
        .from(workDiaries)
        .innerJoin(projects, eq(workDiaries.projectId, projects.id))
        .where(sql`${workDiaries.photos} IS NOT NULL AND jsonb_array_length(${workDiaries.photos}) > 0`)
        .orderBy(desc(workDiaries.date));

      // Flatten photos with individual IDs
      const allPhotos: any[] = [];
      let photoId = 1;
      
      diaries.forEach(diary => {
        if (diary.photos && diary.photos.length > 0) {
          diary.photos.forEach((photoData: string, index: number) => {
            allPhotos.push({
              id: photoId++,
              workId: diary.workId,
              date: diary.date,
              projectName: diary.projectName,
              url: photoData,
              data: photoData
            });
          });
        }
      });

      return allPhotos;
    } catch (error) {
      console.error("Error fetching all diary photos:", error);
      throw error;
    }
  }

  async getDiaryPhoto(id: number): Promise<any> {
    try {
      const photos = await this.getAllDiaryPhotos();
      return photos.find(photo => photo.id === id);
    } catch (error) {
      console.error("Error fetching diary photo:", error);
      throw error;
    }
  }

  async saveDiaryPhoto(photo: any): Promise<any> {
    // For now, return a mock response since photos are stored in the diary entries
    return {
      id: Date.now(),
      workId: photo.workId,
      date: photo.date,
      url: photo.data
    };
  }

  async getAllExpenseDocuments(): Promise<any[]> {
    try {
      const expensesWithReceipts = await db
        .select({
          id: expenses.id,
          workId: expenses.projectId,
          date: expenses.date,
          projectName: projects.name,
          name: expenses.description,
          url: expenses.receiptImage,
          amount: expenses.amount,
        })
        .from(expenses)
        .innerJoin(projects, eq(expenses.projectId, projects.id))
        .where(sql`${expenses.receiptImage} IS NOT NULL`)
        .orderBy(desc(expenses.date));

      return expensesWithReceipts;
    } catch (error) {
      console.error("Error fetching expense documents:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
