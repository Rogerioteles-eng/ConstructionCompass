import { type Express } from "express";
import { setupAuth, isAuthenticated } from "../auth";
import { storage } from "../storage";

export async function registerAuthRoutes(app: Express) {
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}