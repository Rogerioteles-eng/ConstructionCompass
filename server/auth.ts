import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "./schema"; // Tabela de usuários no drizzle
import { eq } from "drizzle-orm";

export function setupAuth() {
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
      const user = result[0];
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}
