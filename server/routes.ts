import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { parseConstructionCommand, transcribeAudio, analyzeImage } from "./openai";
import multer from "multer";
import { insertProjectSchema, insertBudgetSchema, insertBudgetStageSchema, insertBudgetItemSchema, insertBudgetSubitemSchema, insertExpenseSchema, insertWorkDiarySchema, insertWorkDiaryWorkerSchema, insertMeasurementSchema, insertScheduleItemSchema, insertEmployeeSchema, insertWorkDiaryAttendanceSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  });

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Failed to create project" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, projectData);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ message: "Failed to update project" });
    }
  });

  // Budget routes
  app.get('/api/projects/:projectId/budgets', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const budgets = await storage.getBudgetsByProject(projectId);
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.get('/api/budgets/:id/structure', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const budget = await storage.getBudgetWithStructure(id);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      res.json(budget);
    } catch (error) {
      console.error("Error fetching budget structure:", error);
      res.status(500).json({ message: "Failed to fetch budget structure" });
    }
  });

  app.post('/api/projects/:projectId/budgets', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      console.log("Creating budget with data:", req.body);
      console.log("Project ID:", projectId);
      
      const budgetData = insertBudgetSchema.parse({ ...req.body, projectId });
      console.log("Parsed budget data:", budgetData);
      
      const budget = await storage.createBudget(budgetData);
      console.log("Created budget:", budget);
      
      res.status(201).json(budget);
    } catch (error) {
      console.error("Error creating budget:", error);
      console.error("Error details:", error);
      res.status(400).json({ 
        message: "Failed to create budget",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Budget structure routes
  app.post('/api/budgets/:budgetId/stages', isAuthenticated, async (req, res) => {
    try {
      const budgetId = parseInt(req.params.budgetId);
      const stageData = insertBudgetStageSchema.parse({ ...req.body, budgetId });
      const stage = await storage.createBudgetStage(stageData);
      res.status(201).json(stage);
    } catch (error) {
      console.error("Error creating budget stage:", error);
      res.status(400).json({ message: "Failed to create budget stage" });
    }
  });

  app.post('/api/stages/:stageId/items', isAuthenticated, async (req, res) => {
    try {
      const stageId = parseInt(req.params.stageId);
      const itemData = insertBudgetItemSchema.parse({ ...req.body, stageId });
      const item = await storage.createBudgetItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating budget item:", error);
      res.status(400).json({ message: "Failed to create budget item" });
    }
  });

  app.post('/api/items/:itemId/subitems', isAuthenticated, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const subitemData = insertBudgetSubitemSchema.parse({ ...req.body, itemId });
      const subitem = await storage.createBudgetSubitem(subitemData);
      res.status(201).json(subitem);
    } catch (error) {
      console.error("Error creating budget subitem:", error);
      res.status(400).json({ message: "Failed to create budget subitem" });
    }
  });

  app.put('/api/subitems/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subitemData = insertBudgetSubitemSchema.partial().parse(req.body);
      const subitem = await storage.updateBudgetSubitem(id, subitemData);
      res.json(subitem);
    } catch (error) {
      console.error("Error updating budget subitem:", error);
      res.status(400).json({ message: "Failed to update budget subitem" });
    }
  });

  // Get budget structure for expense linking
  app.get('/api/budgets/:id/structure', isAuthenticated, async (req, res) => {
    try {
      const budgetId = parseInt(req.params.id);
      const budget = await storage.getBudgetWithStructure(budgetId);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      res.json(budget);
    } catch (error) {
      console.error("Error fetching budget structure:", error);
      res.status(500).json({ message: "Failed to fetch budget structure" });
    }
  });

  // Expense routes
  app.get('/api/projects/:projectId/expenses', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const expenses = await storage.getExpensesByProject(projectId);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post('/api/projects/:projectId/expenses', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user.claims.sub;
      const expenseData = insertExpenseSchema.parse({ ...req.body, projectId, createdBy: userId });
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(400).json({ message: "Failed to create expense" });
    }
  });

  // Work diary routes
  app.get('/api/projects/:projectId/diaries', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const diaries = await storage.getWorkDiariesByProject(projectId);
      res.json(diaries);
    } catch (error) {
      console.error("Error fetching work diaries:", error);
      res.status(500).json({ message: "Failed to fetch work diaries" });
    }
  });

  app.post('/api/projects/:projectId/diaries', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user.claims.sub;
      const { attendance, date, activities, photos } = req.body;
      
      const diaryToCreate = {
        date,
        activities,
        photos: photos || [],
        projectId: projectId,
        createdBy: userId
      };
      
      const diary = await storage.createWorkDiary(
        insertWorkDiarySchema.parse(diaryToCreate)
      );

      if (attendance && attendance.length > 0) {
        console.log('Processing attendance data:', attendance);
        const validatedAttendance = attendance.map((att: any) => {
          const attendanceData = {
            workDiaryId: diary.id,
            employeeId: parseInt(att.employeeId),
            hoursWorked: 8.0,
            dailyRate: att.dailyRate ? parseFloat(att.dailyRate.toString()) : 0,
            activities: att.role || ""
          };
          console.log('Validated attendance item:', attendanceData);
          return attendanceData;
        });
        
        const savedAttendance = await storage.addWorkDiaryAttendance(validatedAttendance);
        console.log('Saved attendance:', savedAttendance);
      }

      res.status(201).json(diary);
    } catch (error: any) {
      console.error("Error creating work diary:", error);
      if (error.issues) {
        console.error("Validation issues:", error.issues);
      }
      res.status(400).json({ message: "Failed to create work diary", error: error.message });
    }
  });

  app.delete('/api/diaries/:id', isAuthenticated, async (req, res) => {
    try {
      const diaryId = parseInt(req.params.id);
      
      // Primeiro, excluir registros de presença
      await storage.deleteWorkDiaryAttendance(diaryId);
      
      // Depois, excluir o diário
      await storage.deleteWorkDiary(diaryId);
      
      res.status(200).json({ message: "Diário excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting work diary:", error);
      res.status(400).json({ message: "Failed to delete work diary" });
    }
  });

  // Employee cost tracking
  app.get('/api/projects/:projectId/employee-costs', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const costs = await storage.getEmployeeCostsByProject(projectId);
      res.json(costs);
    } catch (error) {
      console.error("Error fetching employee costs:", error);
      res.status(500).json({ message: "Failed to fetch employee costs" });
    }
  });

  // Measurement routes
  app.get('/api/projects/:projectId/measurements', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const measurements = await storage.getMeasurementsByProject(projectId);
      res.json(measurements);
    } catch (error) {
      console.error("Error fetching measurements:", error);
      res.status(500).json({ message: "Failed to fetch measurements" });
    }
  });

  app.post('/api/projects/:projectId/measurements', isAuthenticated, async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user.claims.sub;
      const measurementData = insertMeasurementSchema.parse({ ...req.body, projectId, createdBy: userId });
      const measurement = await storage.createMeasurement(measurementData);
      res.status(201).json(measurement);
    } catch (error) {
      console.error("Error creating measurement:", error);
      res.status(400).json({ message: "Failed to create measurement" });
    }
  });

  // Schedule routes
  app.get('/api/projects/:projectId/schedule', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const schedule = await storage.getScheduleByProject(projectId);
      res.json(schedule);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      res.status(500).json({ message: "Failed to fetch schedule" });
    }
  });

  app.post('/api/projects/:projectId/schedule', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const scheduleData = insertScheduleItemSchema.parse({ ...req.body, projectId });
      const scheduleItem = await storage.createScheduleItem(scheduleData);
      res.status(201).json(scheduleItem);
    } catch (error) {
      console.error("Error creating schedule item:", error);
      res.status(400).json({ message: "Failed to create schedule item" });
    }
  });

  app.put('/api/schedule/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const scheduleData = insertScheduleItemSchema.partial().parse(req.body);
      const scheduleItem = await storage.updateScheduleItem(id, scheduleData);
      res.json(scheduleItem);
    } catch (error) {
      console.error("Error updating schedule item:", error);
      res.status(400).json({ message: "Failed to update schedule item" });
    }
  });

  // Employee routes
  app.get('/api/employees', isAuthenticated, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post('/api/projects/:projectId/employees', isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const employeeData = insertEmployeeSchema.parse({ ...req.body, projectId });
      const employee = await storage.createEmployee(employeeData);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(400).json({ message: "Failed to create employee" });
    }
  });

  app.put('/api/employees/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employeeData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, employeeData);
      res.json(employee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(400).json({ message: "Failed to update employee" });
    }
  });

  app.delete('/api/employees/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEmployee(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(400).json({ message: "Failed to delete employee" });
    }
  });

  app.post('/api/employees', isAuthenticated, async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(400).json({ message: "Failed to create employee" });
    }
  });

  app.patch('/api/employees/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employeeData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, employeeData);
      res.json(employee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(400).json({ message: "Failed to update employee" });
    }
  });

  // Employee costs route
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
      
      console.log('Employee costs filters:', filters);
      const costs = await storage.getEmployeeCosts(filters);
      console.log('Employee costs results:', costs.length, 'records');
      res.json(costs);
    } catch (error) {
      console.error("Error fetching employee costs:", error);
      res.status(500).json({ message: "Failed to fetch employee costs" });
    }
  });

  // Work diary attendance routes
  app.get('/api/diaries/:diaryId/attendance', isAuthenticated, async (req, res) => {
    try {
      const diaryId = parseInt(req.params.diaryId);
      const attendance = await storage.getWorkDiaryAttendance(diaryId);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post('/api/diaries/:diaryId/attendance', isAuthenticated, async (req, res) => {
    try {
      const diaryId = parseInt(req.params.diaryId);
      const attendanceList = req.body.attendance.map((item: any) => 
        insertWorkDiaryAttendanceSchema.parse({ ...item, workDiaryId: diaryId })
      );
      const attendance = await storage.addWorkDiaryAttendance(attendanceList);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error adding attendance:", error);
      res.status(400).json({ message: "Failed to add attendance" });
    }
  });

  // AI Assistant routes with OpenAI integration
  app.post('/api/ai/process', isAuthenticated, async (req: any, res) => {
    try {
      const { command, projectId } = req.body;
      if (!command || typeof command !== 'string') {
        return res.status(400).json({ success: false, message: "Comando é obrigatório" });
      }

      const result = await parseConstructionCommand(command);
      const userId = req.user.claims.sub;
      const processedData: any = {
        expenses: [],
        diaryEntries: [],
        measurements: [],
        scheduleUpdates: []
      };

      // Determine target project
      let targetProjectId = projectId;
      if (result.projectName && !targetProjectId) {
        const projects = await storage.getProjects();
        const project = projects.find((p: any) => 
          p.name.toLowerCase().includes(result.projectName!.toLowerCase())
        );
        if (project) targetProjectId = project.id;
      }
      
      // Use first project if no specific project found
      if (!targetProjectId) {
        const projects = await storage.getProjects();
        if (projects.length > 0) targetProjectId = projects[0].id;
      }

      if (!targetProjectId) {
        return res.json({
          success: false,
          message: 'Nenhum projeto disponível para processar o comando.',
          aiResult: result,
          processedData
        });
      }

      // Process expenses
      if (result.data.expenses && result.data.expenses.length > 0) {
        for (const expense of result.data.expenses) {
          const createdExpense = await storage.createExpense({
            projectId: targetProjectId,
            description: expense.description,
            amount: expense.amount.toString(),
            date: expense.date,
            createdBy: userId
          });
          processedData.expenses.push(createdExpense);
        }
      }

      // Process diary entries
      if (result.data.diaryEntries && result.data.diaryEntries.length > 0) {
        for (const entry of result.data.diaryEntries) {
          const createdDiary = await storage.createWorkDiary({
            projectId: targetProjectId,
            date: entry.date,
            activities: entry.description,
            createdBy: userId
          });

          // Add workers
          if (entry.workers && entry.workers.length > 0) {
            const workers = entry.workers.map((worker: any) => ({
              diaryId: createdDiary.id,
              workerName: worker.name,
              role: worker.role,
              dailyRate: (worker.hourlyRate * worker.hoursWorked).toString(),
              isContractor: false
            }));
            
            const createdWorkers = await storage.addWorkDiaryWorkers(createdDiary.id, workers);
            processedData.diaryEntries.push({ ...createdDiary, workers: createdWorkers });
          } else {
            processedData.diaryEntries.push(createdDiary);
          }
        }
      }

      // Process measurements - skip for now since it requires subitemId from budget structure
      // TODO: Implement measurement processing after budget structure exists
      if (result.data.measurements && result.data.measurements.length > 0) {
        // For now, we'll add measurements as notes to be processed later
        processedData.measurementNotes = result.data.measurements.map(m => 
          `${m.description}: ${m.quantity} ${m.unit} ${m.location ? `em ${m.location}` : ''}`
        );
      }

      const processedCount = processedData.expenses.length + processedData.diaryEntries.length;
      
      res.json({
        success: true,
        message: `Comando processado com sucesso! ${processedCount} itens criados.`,
        aiResult: result,
        processedData
      });
    } catch (error: any) {
      console.error("Error processing AI command:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Erro ao processar comando"
      });
    }
  });

  // Audio transcription endpoint
  app.post('/api/ai/transcribe-audio', isAuthenticated, upload.single('audio'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Arquivo de áudio é obrigatório" });
      }

      const transcription = await transcribeAudio(req.file.buffer);
      res.json({ success: true, transcription });
    } catch (error: any) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ success: false, message: error.message || "Erro ao transcrever áudio" });
    }
  });

  // Image analysis endpoint  
  app.post('/api/ai/analyze-image', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Imagem é obrigatória" });
      }

      const base64Image = req.file.buffer.toString('base64');
      const analysis = await analyzeImage(base64Image);
      res.json({ success: true, analysis });
    } catch (error: any) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ success: false, message: error.message || "Erro ao analisar imagem" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
