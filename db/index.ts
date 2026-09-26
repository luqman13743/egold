import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// A small pool is fine for serverless (Vercel) — each function instance
// gets its own connection; use a pooled connection string (e.g. Supabase/
// Neon pooler, or PgBouncer) in production rather than a direct connection.
const client = postgres(connectionString, { max: 1 });

export const db = drizzle(client, { schema });
export * from "./schema";
