import { type Express } from "express";
import { isAuthenticated } from "../auth";
import { parseConstructionCommand } from "../openai";

export function registerAiRoutes(app: Express) {
  app.post('/api/ai/process', isAuthenticated, async (req, res) => {
    const { command } = req.body;
    if (!command) return res.status(400).json({ message: "Comando obrigatório" });

    const result = await parseConstructionCommand(command);
    res.json({ success: true, result });
  });
}