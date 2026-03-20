import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing!");
}

/**
 * Configuração ultra-resiliente para Supabase:
 * 1. max: 1 -> Evita estourar o limite de conexões do plano gratuito.
 * 2. prepare: false -> OBRIGATÓRIO para a porta 6543 (Transaction Mode).
 * 3. connect_timeout: 10 -> Evita que o Render fique esperando infinitamente.
 */
const client = postgres(process.env.DATABASE_URL, { 
  prepare: false,
  max: 1,
  connect_timeout: 10,
  ssl: 'require' 
});

export const db = drizzle(client, { schema });