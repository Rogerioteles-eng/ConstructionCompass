import { isAuthenticated } from "./middlewares/auth.middleware";
import { setupAuth } from "./setupAuth";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parseConstructionCommand, transcribeAudio, analyzeImage } from "./openai";
import multer from "multer";
import {
  insertProjectSchema,
  insertBudgetSchema,
  insertBudgetStageSchema,
  insertBudgetItemSchema,
  insertBudgetSubitemSchema,
  insertExpenseSchema,
  insertWorkDiarySchema,
  insertWorkDiaryWorkerSchema,
  insertMeasurementSchema,
  insertScheduleItemSchema,
  insertEmployeeSchema,
  insertWorkDiaryAttendanceSchema,
  insertSupplierSchema,
  insertQuotationSchema,
  insertRegisterSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  await setupAuth(app);

  // ============================================
  // AUTH
  // ============================================
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ============================================
  // DASHBOARD
  // ============================================
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // ============================================
  // PROJECTS
  // ============================================
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) return res.status(404).json({ message: "Project not found" });
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, projectData);
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: "Failed to update project" });
    }
  });

  // ============================================
  // BUDGETS
  // ============================================
  app.get("/api/projects/:projectId/budgets", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const budgets = await storage.getBudgetsByProject(projectId);
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.get("/api/budgets/:id/structure", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const budget = await storage.getBudgetWithStructure(id);
      if (!budget) return res.status(404).json({ message: "Budget not found" });
      res.json(budget);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budget structure" });
    }
  });

  app.post("/api/projects/:projectId/budgets", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const budgetData = insertBudgetSchema.parse({ ...req.body, projectId });
      const budget = await storage.createBudget(budgetData);
      res.status(201).json(budget);
    } catch (error) {
      res.status(400).json({ message: "Failed to create budget" });
    }
  });

  // ============================================
  // BUDGET STRUCTURE
  // ============================================
  app.post("/api/budgets/:budgetId/stages", isAuthenticated, async (req, res) => {
    try {
      const budgetId = parseInt(req.params.budgetId);
      const stageData = insertBudgetStageSchema.parse({ ...req.body, budgetId });
      const stage = await storage.createBudgetStage(stageData);
      res.status(201).json(stage);
    } catch (error) {
      res.status(400).json({ message: "Failed to create budget stage" });
    }
  });

  app.post("/api/stages/:stageId/items", isAuthenticated, async (req, res) => {
    try {
      const stageId = parseInt(req.params.stageId);
      const itemData = insertBudgetItemSchema.parse({ ...req.body, stageId });
      const item = await storage.createBudgetItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: "Failed to create budget item" });
    }
  });

  app.post("/api/items/:itemId/subitems", isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const subitemData = insertBudgetSubitemSchema.parse({ ...req.body, itemId });
      const subitem = await storage.createBudgetSubitem(subitemData);
      res.status(201).json(subitem);
    } catch (error) {
      res.status(400).json({ message: "Failed to create budget subitem" });
    }
  });

  app.put("/api/subitems/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subitemData = insertBudgetSubitemSchema.partial().parse(req.body);
      const subitem = await storage.updateBudgetSubitem(id, subitemData);
      res.json(subitem);
    } catch (error) {
      res.status(400).json({ message: "Failed to update budget subitem" });
    }
  });

  // ============================================
  // EXPENSES
  // ============================================
  app.get("/api/projects/:projectId/expenses", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const expenses = await storage.getExpensesByProject(projectId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/projects/:projectId/expenses", isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user.claims.sub;
      const expenseData = insertExpenseSchema.parse({
        ...req.body,
        projectId,
        createdBy: userId,
      });
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ message: "Failed to create expense" });
    }
  });

  // ============================================
  // WORK DIARIES
  // ============================================
  app.get("/api/projects/:projectId/diaries", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const diaries = await storage.getWorkDiariesByProject(projectId);
      res.json(diaries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch diaries" });
    }
  });

  app.post("/api/projects/:projectId/diaries", isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user.claims.sub;
      const diaryData = insertWorkDiarySchema.parse({
        ...req.body,
        projectId,
        createdBy: userId,
      });
      const diary = await storage.createWorkDiary(diaryData);
      res.status(201).json(diary);
    } catch (error) {
      res.status(400).json({ message: "Failed to create diary" });
    }
  });

  app.delete("/api/diaries/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWorkDiary(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete diary" });
    }
  });

  // ============================================
  // DIARY ATTENDANCE
  // ============================================
  app.get("/api/diaries/:diaryId/attendance", isAuthenticated, async (req, res) => {
    try {
      const diaryId = parseInt(req.params.diaryId);
      const attendance = await storage.getWorkDiaryAttendance(diaryId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post("/api/diaries/:diaryId/attendance", isAuthenticated, async (req, res) => {
    try {
      const diaryId = parseInt(req.params.diaryId);
      const attendanceList = req.body.attendance.map((item: any) =>
        insertWorkDiaryAttendanceSchema.parse({ ...item, workDiaryId: diaryId })
      );
      const attendance = await storage.addWorkDiaryAttendance(attendanceList);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(400).json({ message: "Failed to add attendance" });
    }
  });

  app.delete("/api/diaries/:diaryId/attendance", isAuthenticated, async (req, res) => {
    try {
      const diaryId = parseInt(req.params.diaryId);
      await storage.deleteWorkDiaryAttendance(diaryId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete attendance" });
    }
  });

  // ============================================
  // MEASUREMENTS
  // ============================================
  app.get("/api/projects/:projectId/measurements", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const measurements = await storage.getMeasurementsByProject(projectId);
      res.json(measurements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch measurements" });
    }
  });

  app.post("/api/projects/:projectId/measurements", isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user.claims.sub;
      const measurementData = insertMeasurementSchema.parse({
        ...req.body,
        projectId,
        createdBy: userId,
      });
      const measurement = await storage.createMeasurement(measurementData);
      res.status(201).json(measurement);
    } catch (error) {
      res.status(400).json({ message: "Failed to create measurement" });
    }
  });

  // ============================================
  // SCHEDULE
  // ============================================
  app.get("/api/projects/:projectId/schedule", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const schedule = await storage.getScheduleByProject(projectId);
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schedule" });
    }
  });

  app.post("/api/projects/:projectId/schedule", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const itemData = insertScheduleItemSchema.parse({ ...req.body, projectId });
      const item = await storage.createScheduleItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: "Failed to create schedule item" });
    }
  });

  app.put("/api/schedule/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = insertScheduleItemSchema.partial().parse(req.body);
      const item = await storage.updateScheduleItem(id, itemData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Failed to update schedule item" });
    }
  });

  // ============================================
  // EMPLOYEES
  // ============================================
  app.get("/api/employees", isAuthenticated, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", isAuthenticated, async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ message: "Failed to create employee" });
    }
  });

  app.patch("/api/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employeeData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, employeeData);
      res.json(employee);
    } catch (error) {
      res.status(400).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEmployee(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete employee" });
    }
  });

  // ============================================
  // EMPLOYEE COSTS
  // ============================================
  app.get("/api/employee-costs", isAuthenticated, async (req, res) => {
    try {
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        projectId: req.query.projectId ? parseInt(req.query.projectId as string) : undefined,
        employeeType: req.query.employeeType as string,
        role: req.query.role as string,
        employeeId: req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined,
      };
      const costs = await storage.getEmployeeCosts(filters);
      res.json(costs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee costs" });
    }
  });

  // ============================================
  // SUPPLIERS
  // ============================================
  app.get("/api/projects/:projectId/suppliers", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const suppliersList = await storage.getSuppliersByProject(projectId);
      res.json(suppliersList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/projects/:projectId/suppliers", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const data = insertSupplierSchema.parse({ ...req.body, projectId });
      const supplier = await storage.createSupplier(data);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Failed to create supplier" });
    }
  });

  app.put("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, data);
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSupplier(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete supplier" });
    }
  });

  // ============================================
  // QUOTATIONS
  // ============================================
  app.get("/api/projects/:projectId/quotations", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const quotationsList = await storage.getQuotationsByProject(projectId);
      res.json(quotationsList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  app.post("/api/projects/:projectId/quotations", isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user.claims.sub;
      const data = insertQuotationSchema.parse({
        ...req.body,
        projectId,
        createdBy: userId,
      });
      const quotation = await storage.createQuotation(data);
      res.status(201).json(quotation);
    } catch (error) {
      res.status(400).json({ message: "Failed to create quotation" });
    }
  });

  app.put("/api/quotations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertQuotationSchema.partial().parse(req.body);
      const quotation = await storage.updateQuotation(id, data);
      res.json(quotation);
    } catch (error) {
      res.status(400).json({ message: "Failed to update quotation" });
    }
  });

  app.delete("/api/quotations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteQuotation(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete quotation" });
    }
  });

  // ============================================
  // REGISTERS
  // ============================================
  app.get("/api/projects/:projectId/registers", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const registersList = await storage.getRegistersByProject(projectId);
      res.json(registersList);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch registers" });
    }
  });

  app.post("/api/projects/:projectId/registers", isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user.claims.sub;
      const data = insertRegisterSchema.parse({
        ...req.body,
        projectId,
        createdBy: userId,
      });
      const register = await storage.createRegister(data);
      res.status(201).json(register);
    } catch (error) {
      res.status(400).json({ message: "Failed to create register" });
    }
  });

  app.delete("/api/registers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRegister(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: "Failed to delete register" });
    }
  });

  // ============================================
  // SHARE
  // ============================================
  app.get("/api/share/images", isAuthenticated, async (req, res) => {
    try {
      const diaries = await storage.getAllWorkDiariesWithPhotos();
      res.json(diaries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch diary images" });
    }
  });

  app.get("/api/share/documents", isAuthenticated, async (req, res) => {
    try {
      const expenses = await storage.getAllExpensesWithReceipts();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expense documents" });
    }
  });

  // ============================================
  // AI ASSISTANT
  // ============================================
  app.post("/api/ai/process", isAuthenticated, async (req: any, res) => {
    try {
      const { command, projectId } = req.body;
      if (!command || typeof command !== "string") {
        return res.status(400).json({ success: false, message: "Comando é obrigatório" });
      }

      const result = await parseConstructionCommand(command);
      const userId = req.user.claims.sub;
      const processedData: any = { expenses: [], diaryEntries: [], measurementNotes: [] };

      let targetProjectId = projectId;
      if (result.projectName && !targetProjectId) {
        const projects = await storage.getProjects();
        const project = projects.find((p: any) =>
          p.name.toLowerCase().includes(result.projectName!.toLowerCase())
        );
        if (project) targetProjectId = project.id;
      }
      if (!targetProjectId) {
        const projects = await storage.getProjects();
        if (projects.length > 0) targetProjectId = projects[0].id;
      }
      if (!targetProjectId) {
        return res.json({
          success: false,
          message: "Nenhum projeto disponível.",
          aiResult: result,
          processedData,
        });
      }

      if (result.data.expenses?.length > 0) {
        for (const expense of result.data.expenses) {
          const created = await storage.createExpense({
            projectId: targetProjectId,
            description: expense.description,
            amount: expense.amount.toString(),
            date: expense.date,
            createdBy: userId,
          });
          processedData.expenses.push(created);
        }
      }

      if (result.data.diaryEntries?.length > 0) {
        for (const entry of result.data.diaryEntries) {
          const diary = await storage.createWorkDiary({
            projectId: targetProjectId,
            date: entry.date,
            activities: entry.description,
            createdBy: userId,
          });
          if (entry.workers?.length > 0) {
            const workers = entry.workers.map((w: any) => ({
              diaryId: diary.id,
              workerName: w.name,
              role: w.role,
              dailyRate: (w.hourlyRate * w.hoursWorked).toString(),
              isContractor: false,
            }));
            await storage.addWorkDiaryWorkers(diary.id, workers);
          }
          processedData.diaryEntries.push(diary);
        }
      }

      if (result.data.measurements?.length > 0) {
        processedData.measurementNotes = result.data.measurements.map(
          (m: any) => `${m.description}: ${m.quantity} ${m.unit}`
        );
      }

      const count = processedData.expenses.length + processedData.diaryEntries.length;
      res.json({
        success: true,
        message: `Comando processado! ${count} itens criados.`,
        aiResult: result,
        processedData,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Erro ao processar" });
    }
  });

  app.post("/api/ai/transcribe-audio", isAuthenticated, upload.single("audio"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: "Arquivo de áudio é obrigatório" });
      const transcription = await transcribeAudio(req.file.buffer);
      res.json({ success: true, transcription });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/ai/analyze-image", isAuthenticated, upload.single("image"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: "Imagem é obrigatória" });
      const base64Image = req.file.buffer.toString("base64");
      const analysis = await analyzeImage(base64Image);
      res.json({ success: true, analysis });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}