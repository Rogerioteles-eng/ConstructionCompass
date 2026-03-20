import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// O Supabase no Render funciona melhor com o driver 'postgres-js'
// O disable_prepare: true é importante para o modo "Transaction" do Supabase (porta 6543)
const client = postgres(process.env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });