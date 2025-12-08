import { type Express } from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";
import { insertEmployeeSchema } from "@shared/schema";

export function registerEmployeeRoutes(app: Express) {
  app.get('/api/employees', isAuthenticated, async (_req, res) => {
    const employees = await storage.getEmployees();
    res.json(employees);
  });

  app.post('/api/projects/:projectId/employees', isAuthenticated, async (req, res) => {
    const data = insertEmployeeSchema.parse({ ...req.body, projectId: parseInt(req.params.projectId) });
    const created = await storage.createEmployee(data);
    res.status(201).json(created);
  });
}