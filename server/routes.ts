import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProjectSchema, insertBudgetSchema, insertBudgetStageSchema, insertBudgetItemSchema, insertBudgetSubitemSchema, insertExpenseSchema, insertWorkDiarySchema, insertWorkDiaryWorkerSchema, insertMeasurementSchema, insertScheduleItemSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const budgetData = insertBudgetSchema.parse({ ...req.body, projectId });
      const budget = await storage.createBudget(budgetData);
      res.status(201).json(budget);
    } catch (error) {
      console.error("Error creating budget:", error);
      res.status(400).json({ message: "Failed to create budget" });
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
      const { workers, ...diaryData } = req.body;
      
      const diary = await storage.createWorkDiary({
        ...insertWorkDiarySchema.parse(diaryData),
        projectId,
        createdBy: userId
      });

      if (workers && workers.length > 0) {
        const validatedWorkers = workers.map((worker: any) => insertWorkDiaryWorkerSchema.parse(worker));
        await storage.addWorkDiaryWorkers(diary.id, validatedWorkers);
      }

      res.status(201).json(diary);
    } catch (error) {
      console.error("Error creating work diary:", error);
      res.status(400).json({ message: "Failed to create work diary" });
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

  // AI Assistant routes
  app.post('/api/ai/process', isAuthenticated, async (req: any, res) => {
    try {
      const { command, projectId } = req.body;
      const userId = req.user.claims.sub;

      // Mock AI processing based on command content
      let response = { success: false, message: '', data: null };

      if (command.toLowerCase().includes('gastei') || command.toLowerCase().includes('gasto')) {
        // Extract expense information from command
        const amountMatch = command.match(/(\d+(?:,\d+)?)\s*reais?/i);
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0;
        
        if (amount > 0 && projectId) {
          const expense = await storage.createExpense({
            projectId: parseInt(projectId),
            date: new Date().toISOString().split('T')[0],
            description: `Gasto registrado via IA: ${command}`,
            amount: amount.toString(),
            createdBy: userId
          });

          response = {
            success: true,
            message: `Gasto de R$ ${amount.toFixed(2)} registrado com sucesso!`,
            data: expense
          };
        } else {
          response = {
            success: false,
            message: 'Não foi possível extrair o valor do gasto ou projeto não especificado.',
            data: null
          };
        }
      } else if (command.toLowerCase().includes('presentes') || command.toLowerCase().includes('funcionários')) {
        // Extract worker information from command
        const workerNames = command.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g) || [];
        const activities = command.toLowerCase().includes('reboco') ? 'Reboco das paredes' : 
                          command.toLowerCase().includes('elétrica') ? 'Instalação elétrica' : 
                          'Atividades diversas';

        if (workerNames.length > 0 && projectId) {
          const diary = await storage.createWorkDiary({
            projectId: parseInt(projectId),
            date: new Date().toISOString().split('T')[0],
            activities: activities,
            createdBy: userId
          });

          const workers = workerNames.map(name => ({
            diaryId: diary.id,
            workerName: name,
            role: 'Operário',
            dailyRate: '150.00',
            isContractor: false
          }));

          await storage.addWorkDiaryWorkers(diary.id, workers);

          response = {
            success: true,
            message: `Diário de obra atualizado com ${workerNames.length} funcionário(s): ${workerNames.join(', ')}`,
            data: diary
          };
        } else {
          response = {
            success: false,
            message: 'Não foi possível extrair os funcionários ou projeto não especificado.',
            data: null
          };
        }
      } else {
        response = {
          success: false,
          message: 'Comando não reconhecido. Tente comandos como "gastei X reais com Y" ou "hoje estiveram presentes João e Pedro".',
          data: null
        };
      }

      res.json(response);
    } catch (error) {
      console.error("Error processing AI command:", error);
      res.status(500).json({ message: "Failed to process AI command" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
