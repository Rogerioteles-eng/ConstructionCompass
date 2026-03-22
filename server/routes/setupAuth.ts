import { Express } from "express";
import authRoutes from "./routes/auth.routes";

export function setupAuth(app: Express) {
  app.use("/api/auth", authRoutes);
}