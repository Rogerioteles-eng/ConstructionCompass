import { type Express } from "express";
import { registerAuthRoutes } from "./auth";
import { registerProjectRoutes } from "./projects";
import { registerDiaryRoutes } from "./diary";
import { registerEmployeeRoutes } from "./employees";
import { registerAiRoutes } from "./ai";
import { registerShareRoutes } from "./share";

export async function registerRoutes(app: Express) {
  await registerAuthRoutes(app);
  registerProjectRoutes(app);
  registerDiaryRoutes(app);
  registerEmployeeRoutes(app);
  registerAiRoutes(app);
  registerShareRoutes(app);
}