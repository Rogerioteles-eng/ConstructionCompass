// server/routes/auth.routes.ts
import { Router } from "express";

const router = Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  // MOCK DE LOGIN
  if (email === "admin@admin.com" && password === "123456") {
    return res.json({ token: "fake-token", user: { name: "Administrador", email } });
  }

  return res.status(401).json({ message: "Credenciais inválidas" });
});

export default router;
