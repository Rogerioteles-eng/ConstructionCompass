import { Express } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  app.use(session({
    secret: process.env.SESSION_SECRET || "construcao_secret_2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      const user = result[0];
      if (!user) return done(null, false, { message: "Usuário não encontrado" });

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return done(null, false, { message: "Senha incorreta" });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      done(null, result[0]);
    } catch (err) {
      done(err);
    }
  });

  // Rota de Login
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Credenciais inválidas" });

      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.json({
          id: user.id,
          username: user.username,
          email: user.email,
        });
      });
    })(req, res, next);
  });

  // Rota de Registro
  app.post("/api/register", async (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }

      const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (existing.length > 0) {
        return res.status(400).json({ message: "Usuário já existe" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const result = await db.insert(users).values({
        username,
        email,
        passwordHash,
      }).returning();

      const user = result[0];
      req.logIn(user, (err) => {
        if (err) return res.status(500).json({ message: "Erro ao fazer login" });
        return res.status(201).json({
          id: user.id,
          username: user.username,
          email: user.email,
        });
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });

  // Rota de Logout
  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Rota de verificação de usuário logado
  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
      });
    }
    return res.status(401).json({ message: "Não autorizado" });
  });
}