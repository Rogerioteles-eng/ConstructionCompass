import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// SESSIONS - Replit Auth
// ============================================
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// ============================================
// USERS
// ============================================
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role").notNull().default("viewer"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// PROJECTS - Obras
// ============================================
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  client: varchar("client", { length: 255 }).notNull(),
  status: varchar("status").notNull().default("planning"),
  description: text("description"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectCollaborators = pgTable("project_collaborators", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// BUDGETS - Orçamentos
// ============================================
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  name: varchar("name", { length: 255 }).notNull(),
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const budgetStages = pgTable("budget_stages", {
  id: serial("id").primaryKey(),
  budgetId: integer("budget_id").notNull().references(() => budgets.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const budgetItems = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  stageId: integer("stage_id").notNull().references(() => budgetStages.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const budgetSubitems = pgTable("budget_subitems", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => budgetItems.id),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// EXPENSES - Gastos
// ============================================
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  subitemId: integer("subitem_id").references(() => budgetSubitems.id),
  date: date("date").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  receiptImage: text("receipt_image"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// WORK DIARIES - Diário de Obras
// ============================================
export const workDiaries = pgTable("work_diaries", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  date: date("date").notNull(),
  activities: text("activities").notNull(),
  photos: text("photos").array(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workDiaryWorkers = pgTable("work_diary_workers", {
  id: serial("id").primaryKey(),
  diaryId: integer("diary_id").notNull().references(() => workDiaries.id),
  workerName: varchar("worker_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  dailyRate: decimal("daily_rate", { precision: 8, scale: 2 }).notNull(),
  isContractor: boolean("is_contractor").notNull().default(false),
});

// ============================================
// MEASUREMENTS - Medições
// ============================================
export const measurements = pgTable("measurements", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  subitemId: integer("subitem_id").notNull().references(() => budgetSubitems.id),
  executedQuantity: decimal("executed_quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// SCHEDULE - Cronograma
// ============================================
export const scheduleItems = pgTable("schedule_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  stageId: integer("stage_id").references(() => budgetStages.id),
  name: varchar("name", { length: 255 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  duration: integer("duration").notNull(),
  progress: decimal("progress", { precision: 5, scale: 2 }).notNull().default("0"),
  dependencies: text("dependencies"),
  status: varchar("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// EMPLOYEES - Funcionários
// ============================================
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  dailyRate: decimal("daily_rate", { precision: 10, scale: 2 }).notNull(),
  isContractor: boolean("is_contractor").notNull().default(false),
  phone: varchar("phone", { length: 20 }),
  document: varchar("document", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("ativo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workDiaryAttendance = pgTable("work_diary_attendance", {
  id: serial("id").primaryKey(),
  workDiaryId: integer("work_diary_id").notNull().references(() => workDiaries.id),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  hoursWorked: decimal("hours_worked", { precision: 4, scale: 2 }).notNull().default("8.00"),
  dailyRate: decimal("daily_rate", { precision: 10, scale: 2 }).notNull(),
  activities: text("activities"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// SUPPLIERS - Fornecedores (NOVO)
// ============================================
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  name: text("name").notNull(),
  contact: text("contact"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  category: text("category"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// QUOTATIONS - Mapas de Cotação (NOVO)
// ============================================
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  title: text("title").notNull(),
  supplier: text("supplier"),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  status: text("status").default("pending"),
  validUntil: date("valid_until"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// REGISTERS - Registros de Obra (NOVO)
// ============================================
export const registers = pgTable("registers", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  title: text("title").notNull(),
  type: text("type").default("occurrence"),
  description: text("description"),
  priority: text("priority").default("normal"),
  date: date("date"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// RELATIONS
// ============================================
export const usersRelations = relations(users, ({ many }) => ({
  projectCollaborators: many(projectCollaborators),
  expenses: many(expenses),
  workDiaries: many(workDiaries),
  measurements: many(measurements),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  collaborators: many(projectCollaborators),
  budgets: many(budgets),
  expenses: many(expenses),
  workDiaries: many(workDiaries),
  measurements: many(measurements),
  scheduleItems: many(scheduleItems),
  suppliers: many(suppliers),
  quotations: many(quotations),
  registers: many(registers),
}));

export const projectCollaboratorsRelations = relations(projectCollaborators, ({ one }) => ({
  project: one(projects, {
    fields: [projectCollaborators.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectCollaborators.userId],
    references: [users.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  project: one(projects, {
    fields: [budgets.projectId],
    references: [projects.id],
  }),
  stages: many(budgetStages),
}));

export const budgetStagesRelations = relations(budgetStages, ({ one, many }) => ({
  budget: one(budgets, {
    fields: [budgetStages.budgetId],
    references: [budgets.id],
  }),
  items: many(budgetItems),
  scheduleItems: many(scheduleItems),
}));

export const budgetItemsRelations = relations(budgetItems, ({ one, many }) => ({
  stage: one(budgetStages, {
    fields: [budgetItems.stageId],
    references: [budgetStages.id],
  }),
  subitems: many(budgetSubitems),
}));

export const budgetSubitemsRelations = relations(budgetSubitems, ({ one, many }) => ({
  item: one(budgetItems, {
    fields: [budgetSubitems.itemId],
    references: [budgetItems.id],
  }),
  expenses: many(expenses),
  measurements: many(measurements),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  project: one(projects, {
    fields: [expenses.projectId],
    references: [projects.id],
  }),
  subitem: one(budgetSubitems, {
    fields: [expenses.subitemId],
    references: [budgetSubitems.id],
  }),
  createdByUser: one(users, {
    fields: [expenses.createdBy],
    references: [users.id],
  }),
}));

export const workDiariesRelations = relations(workDiaries, ({ one, many }) => ({
  project: one(projects, {
    fields: [workDiaries.projectId],
    references: [projects.id],
  }),
  createdByUser: one(users, {
    fields: [workDiaries.createdBy],
    references: [users.id],
  }),
  workers: many(workDiaryWorkers),
}));

export const workDiaryWorkersRelations = relations(workDiaryWorkers, ({ one }) => ({
  diary: one(workDiaries, {
    fields: [workDiaryWorkers.diaryId],
    references: [workDiaries.id],
  }),
}));

export const measurementsRelations = relations(measurements, ({ one }) => ({
  project: one(projects, {
    fields: [measurements.projectId],
    references: [projects.id],
  }),
  subitem: one(budgetSubitems, {
    fields: [measurements.subitemId],
    references: [budgetSubitems.id],
  }),
  createdByUser: one(users, {
    fields: [measurements.createdBy],
    references: [users.id],
  }),
}));

export const scheduleItemsRelations = relations(scheduleItems, ({ one }) => ({
  project: one(projects, {
    fields: [scheduleItems.projectId],
    references: [projects.id],
  }),
  stage: one(budgetStages, {
    fields: [scheduleItems.stageId],
    references: [budgetStages.id],
  }),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  attendance: many(workDiaryAttendance),
}));

export const workDiaryAttendanceRelations = relations(workDiaryAttendance, ({ one }) => ({
  workDiary: one(workDiaries, {
    fields: [workDiaryAttendance.workDiaryId],
    references: [workDiaries.id],
  }),
  employee: one(employees, {
    fields: [workDiaryAttendance.employeeId],
    references: [employees.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ one }) => ({
  project: one(projects, {
    fields: [suppliers.projectId],
    references: [projects.id],
  }),
}));

export const quotationsRelations = relations(quotations, ({ one }) => ({
  project: one(projects, {
    fields: [quotations.projectId],
    references: [projects.id],
  }),
}));

export const registersRelations = relations(registers, ({ one }) => ({
  project: one(projects, {
    fields: [registers.projectId],
    references: [projects.id],
  }),
}));

// ============================================
// INSERT SCHEMAS
// ============================================
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBudgetStageSchema = createInsertSchema(budgetStages).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetItemSchema = createInsertSchema(budgetItems).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetSubitemSchema = createInsertSchema(budgetSubitems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
});

export const insertWorkDiarySchema = createInsertSchema(workDiaries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkDiaryWorkerSchema = createInsertSchema(workDiaryWorkers).omit({
  id: true,
});

export const insertMeasurementSchema = createInsertSchema(measurements).omit({
  id: true,
  createdAt: true,
});

export const insertScheduleItemSchema = createInsertSchema(scheduleItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dailyRate: z.union([z.string(), z.number()]).transform(val => Number(val)),
});

export const insertWorkDiaryAttendanceSchema = createInsertSchema(workDiaryAttendance).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuotationSchema = createInsertSchema(quotations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRegisterSchema = createInsertSchema(registers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============================================
// TYPES
// ============================================
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type BudgetStage = typeof budgetStages.$inferSelect;
export type InsertBudgetStage = z.infer<typeof insertBudgetStageSchema>;

export type BudgetItem = typeof budgetItems.$inferSelect;
export type InsertBudgetItem = z.infer<typeof insertBudgetItemSchema>;

export type BudgetSubitem = typeof budgetSubitems.$inferSelect;
export type InsertBudgetSubitem = z.infer<typeof insertBudgetSubitemSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type WorkDiary = typeof workDiaries.$inferSelect;
export type InsertWorkDiary = z.infer<typeof insertWorkDiarySchema>;

export type WorkDiaryWorker = typeof workDiaryWorkers.$inferSelect;
export type InsertWorkDiaryWorker = z.infer<typeof insertWorkDiaryWorkerSchema>;

export type Measurement = typeof measurements.$inferSelect;
export type InsertMeasurement = z.infer<typeof insertMeasurementSchema>;

export type ScheduleItem = typeof scheduleItems.$inferSelect;
export type InsertScheduleItem = z.infer<typeof insertScheduleItemSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type WorkDiaryAttendance = typeof workDiaryAttendance.$inferSelect;
export type InsertWorkDiaryAttendance = z.infer<typeof insertWorkDiaryAttendanceSchema>;

export type ProjectCollaborator = typeof projectCollaborators.$inferSelect;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;

export type Register = typeof registers.$inferSelect;
export type InsertRegister = z.infer<typeof insertRegisterSchema>;