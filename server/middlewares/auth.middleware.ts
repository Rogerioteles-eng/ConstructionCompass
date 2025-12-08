// server/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from "express";

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token || token !== "fake-token") {
    return res.status(401).json({ message: "Não autorizado" });
  }

  // Usuário fictício só para testes
  (req as any).user = { name: "Administrador", email: "admin@admin.com" };

  next();
}
