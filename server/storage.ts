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
import { eq, desc, and, sql } from "drizzle-orm";

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
    const diaries = await db.query.workDiaries.findMany({
      where: eq(workDiaries.projectId, projectId),
      with: {
        workers: true,
        createdByUser: true,
      },
      orderBy: desc(workDiaries.date),
    });
    return diaries;
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
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee> {
    const [updatedEmployee] = await db.update(employees)
      .set({ ...employee, updatedAt: new Date() })
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

  async getEmployeeCostsByProject(projectId: number): Promise<Record<number, { totalCost: number; workDays: number }>> {
    // Para agora retornar custos vazios até implementarmos a nova estrutura de attendance
    return {};
  }

  async getEmployeeCosts(filters?: {
    startDate?: string;
    endDate?: string;
    projectId?: number;
    employeeType?: string;
    role?: string;
    search?: string;
  }): Promise<any[]> {
    // Retornar array vazio por enquanto - implementação completa será feita após ajustes no schema
    return [];
  }
}

export const storage = new DatabaseStorage();
