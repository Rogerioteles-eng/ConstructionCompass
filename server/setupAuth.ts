// server/setupAuth.ts
import { Express } from "express";
import authRoutes from "./routes/auth.routes";

export function setupAuth(app: Express) {
  app.use("/auth", authRoutes);
}
