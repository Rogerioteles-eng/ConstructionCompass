import { type Express } from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";
import { insertProjectSchema, insertBudgetSchema } from "@shared/schema";

export function registerProjectRoutes(app: Express) {
  app.get('/api/projects', isAuthenticated, async (_req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.post('/api/projects', isAuthenticated, async (req, res) => {
    const data = insertProjectSchema.parse(req.body);
    const created = await storage.createProject(data);
    res.status(201).json(created);
  });

  app.get('/api/projects/:id', isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    const project = await storage.getProject(id);
    if (!project) return res.status(404).json({ message: "Not found" });
    res.json(project);
  });

  app.post('/api/projects/:projectId/budgets', isAuthenticated, async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    const data = insertBudgetSchema.parse({ ...req.body, projectId });
    const created = await storage.createBudget(data);
    res.status(201).json(created);
  });
}