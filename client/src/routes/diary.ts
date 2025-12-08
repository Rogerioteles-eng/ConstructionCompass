import { type Express } from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";
import { insertWorkDiarySchema } from "@shared/schema";

export function registerDiaryRoutes(app: Express) {
  app.get('/api/projects/:projectId/diaries', isAuthenticated, async (req, res) => {
    const diaries = await storage.getWorkDiariesByProject(parseInt(req.params.projectId));
    res.json(diaries);
  });

  app.post('/api/projects/:projectId/diaries', isAuthenticated, async (req: any, res) => {
    const projectId = parseInt(req.params.projectId);
    const userId = req.user.claims.sub;
    const diaryData = insertWorkDiarySchema.parse({ ...req.body, projectId, createdBy: userId });
    const diary = await storage.createWorkDiary(diaryData);
    res.status(201).json(diary);
  });
}