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
  suppliers,
  quotations,
  registers,
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
  type Supplier,
  type InsertSupplier,
  type Quotation,
  type InsertQuotation,
  type Register,
  type InsertRegister,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
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

  // Supplier operations
  getSuppliersByProject(projectId: number): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: number): Promise<void>;

  // Quotation operations
  getQuotationsByProject(projectId: number): Promise<Quotation[]>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: number, quotation: Partial<InsertQuotation>): Promise<Quotation>;
  deleteQuotation(id: number): Promise<void>;

  // Register operations
  getRegistersByProject(projectId: number): Promise<Register[]>;
  createRegister(register: InsertRegister): Promise<Register>;
  deleteRegister(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {

  // ============================================
  // USER OPERATIONS
  // ============================================
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
        set: { ...userData, updatedAt: new Date() },
      })
      .returning();
    return user;
  }

  // ============================================
  // PROJECT OPERATIONS
  // ============================================
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

  // ============================================
  // BUDGET OPERATIONS
  // ============================================
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

  async createBudgetStage(stage: InsertBudgetStage): Promise<BudgetStage> {
    const [newStage] = await db.insert(budgetStages).values(stage).returning();
    return newStage;
  }

  async createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem> {
    const [newItem] = await db.insert(budgetItems).values(item).returning();
    return newItem;
  }

  async createBudgetSubitem(subitem: InsertBudgetSubitem): Promise<BudgetSubitem> {
    const totalPrice = Number(subitem.quantity) * Number(subitem.unitPrice);
    const subitemWithTotal = { ...subitem, totalPrice: totalPrice.toString() };
    const [newSubitem] = await db.insert(budgetSubitems).values(subitemWithTotal).returning();
    return newSubitem;
  }

  async updateBudgetSubitem(id: number, subitem: Partial<InsertBudgetSubitem>): Promise<BudgetSubitem> {
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

  // ============================================
  // EXPENSE OPERATIONS
  // ============================================
  async getExpensesByProject(projectId: number): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.projectId, projectId))
      .orderBy(desc(expenses.date));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  // ============================================
  // WORK DIARY OPERATIONS
  // ============================================
  async getWorkDiariesByProject(projectId: number): Promise<any[]> {
    const diaries = await db
      .select()
      .from(workDiaries)
      .where(eq(workDiaries.projectId, projectId))
      .orderBy(desc(workDiaries.date));

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
        return { ...diary, attendance };
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

  // ============================================
  // MEASUREMENT OPERATIONS
  // ============================================
  async getMeasurementsByProject(projectId: number): Promise<Measurement[]> {
    return await db
      .select()
      .from(measurements)
      .where(eq(measurements.projectId, projectId))
      .orderBy(desc(measurements.date));
  }

  async createMeasurement(measurement: InsertMeasurement): Promise<Measurement> {
    const totalAmount = Number(measurement.executedQuantity) * Number(measurement.unitPrice);
    const measurementWithTotal = { ...measurement, totalAmount: totalAmount.toString() };
    const [newMeasurement] = await db.insert(measurements).values(measurementWithTotal).returning();
    return newMeasurement;
  }

  // ============================================
  // SCHEDULE OPERATIONS
  // ============================================
  async getScheduleByProject(projectId: number): Promise<ScheduleItem[]> {
    return await db
      .select()
      .from(scheduleItems)
      .where(eq(scheduleItems.projectId, projectId))
      .orderBy(scheduleItems.startDate);
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

  // ============================================
  // DASHBOARD STATISTICS
  // ============================================
  async getDashboardStats(): Promise<any> {
    const [activeProjects] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.status, "execution"));

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

  // ============================================
  // EMPLOYEE OPERATIONS
  // ============================================
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(employees.name);
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db
      .insert(employees)
      .values({
        name: employee.name,
        role: employee.role,
        dailyRate: employee.dailyRate.toString(),
        isContractor: employee.isContractor || false,
        phone: employee.phone,
        document: employee.document,
        status: employee.status || "ativo",
      })
      .returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee> {
    const updateData: any = { ...employee, updatedAt: new Date() };
    if (updateData.dailyRate !== undefined) {
      updateData.dailyRate = updateData.dailyRate.toString();
    }
    const [updatedEmployee] = await db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  // ============================================
  // WORK DIARY ATTENDANCE OPERATIONS
  // ============================================
  async getWorkDiaryAttendance(workDiaryId: number): Promise<WorkDiaryAttendance[]> {
    return await db
      .select()
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

  // ============================================
  // EMPLOYEE COST TRACKING
  // ============================================
  async getEmployeeCostsByProject(projectId: number): Promise<Record<number, { totalCost: number; workDays: number }>> {
    const costs = await db
      .select({
        employeeId: workDiaryAttendance.employeeId,
        dailyRate: workDiaryAttendance.dailyRate,
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
    if (filters?.employeeType === "funcionario") {
      conditions.push(eq(employees.isContractor, false));
    } else if (filters?.employeeType === "empreiteiro") {
      conditions.push(eq(employees.isContractor, true));
    }
    if (filters?.role) {
      conditions.push(eq(employees.role, filters.role));
    }
    if (filters?.employeeId) {
      conditions.push(eq(employees.id, Number(filters.employeeId)));
    }

    if (conditions.length === 0) return [];

    const results = await db
      .select({
        employeeId: employees.id,
        employeeName: employees.name,
        role: employees.role,
        isContractor: employees.isContractor,
        dailyRate: workDiaryAttendance.dailyRate,
        workDate: workDiaries.date,
        projectId: workDiaries.projectId,
        projectName: projects.name,
      })
      .from(workDiaryAttendance)
      .innerJoin(employees, eq(workDiaryAttendance.employeeId, employees.id))
      .innerJoin(workDiaries, eq(workDiaryAttendance.workDiaryId, workDiaries.id))
      .innerJoin(projects, eq(workDiaries.projectId, projects.id))
      .where(and(...conditions))
      .orderBy(desc(workDiaries.date), employees.name);

    return results.map(result => ({
      ...result,
      totalCost: Number(result.dailyRate || 0),
      hoursWorked: 8,
    }));
  }

  // ============================================
  // SHARING OPERATIONS
  // ============================================
  async getAllWorkDiariesWithPhotos(): Promise<any[]> {
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
      .where(sql`${workDiaries.photos} IS NOT NULL AND array_length(${workDiaries.photos}, 1) > 0`)
      .orderBy(desc(workDiaries.date));

    return diaries.filter(d => d.photos && Array.isArray(d.photos) && d.photos.length > 0);
  }

  async getAllExpensesWithReceipts(): Promise<any[]> {
    return await db
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
  }

  // ============================================
  // SUPPLIER OPERATIONS
  // ============================================
  async getSuppliersByProject(projectId: number): Promise<Supplier[]> {
    return await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.projectId, projectId))
      .orderBy(suppliers.name);
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [updated] = await db
      .update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return updated;
  }

  async deleteSupplier(id: number): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  // ============================================
  // QUOTATION OPERATIONS
  // ============================================
  async getQuotationsByProject(projectId: number): Promise<Quotation[]> {
    return await db
      .select()
      .from(quotations)
      .where(eq(quotations.projectId, projectId))
      .orderBy(desc(quotations.createdAt));
  }

  async createQuotation(quotation: InsertQuotation): Promise<Quotation> {
    const [newQuotation] = await db.insert(quotations).values(quotation).returning();
    return newQuotation;
  }

  async updateQuotation(id: number, quotation: Partial<InsertQuotation>): Promise<Quotation> {
    const [updated] = await db
      .update(quotations)
      .set({ ...quotation, updatedAt: new Date() })
      .where(eq(quotations.id, id))
      .returning();
    return updated;
  }

  async deleteQuotation(id: number): Promise<void> {
    await db.delete(quotations).where(eq(quotations.id, id));
  }

  // ============================================
  // REGISTER OPERATIONS
  // ============================================
  async getRegistersByProject(projectId: number): Promise<Register[]> {
    return await db
      .select()
      .from(registers)
      .where(eq(registers.projectId, projectId))
      .orderBy(desc(registers.createdAt));
  }

  async createRegister(register: InsertRegister): Promise<Register> {
    const [newRegister] = await db.insert(registers).values(register).returning();
    return newRegister;
  }

  async deleteRegister(id: number): Promise<void> {
    await db.delete(registers).where(eq(registers.id, id));
  }
}

export const storage = new DatabaseStorage();