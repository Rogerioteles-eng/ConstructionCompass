import { type Express } from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";

export function registerShareRoutes(app: Express) {
  app.get("/api/share/images", isAuthenticated, async (_req, res) => {
    const diaries = await storage.getAllWorkDiariesWithPhotos();
    res.json(diaries);
  });

  app.get("/api/share/documents", isAuthenticated, async (_req, res) => {
    const expenses = await storage.getAllExpensesWithReceipts();
    res.json(expenses);
  });
}