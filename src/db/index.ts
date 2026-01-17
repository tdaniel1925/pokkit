import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Allow running without DATABASE_URL in test environment
const isTestEnv = process.env.NODE_ENV === "test" || process.env.VITEST;

let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  const client = postgres(process.env.DATABASE_URL);
  db = drizzle(client, { schema });
} else if (!isTestEnv) {
  console.warn("DATABASE_URL not set - database operations will fail");
}

export { db };
export * from "./schema";
