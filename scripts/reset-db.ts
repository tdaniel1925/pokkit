/**
 * Database Reset Script
 * Deletes all data from the database
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: ".env.local" });

async function resetDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client);

  console.log("🗑️  Resetting database...\n");

  // Truncate all tables in order (respecting foreign keys)
  const tables = [
    "manifest_reactions",
    "manifestations",
    "safety_flags",
    "divine_inbox_items",
    "divine_influences",
    "social_influences",
    "collective_events",
    "cultural_movements",
    "relationship_events",
    "social_interactions",
    "divine_whispers",
    "divine_actions",
    "safety_events",
    "cultural_trends",
    "world_feed_items",
    "citizen_memories",
    "citizen_relationships",
    "citizen_beliefs",
    "citizens",
    "worlds",
  ];

  for (const table of tables) {
    try {
      await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
      console.log(`  ✓ Cleared ${table}`);
    } catch (err) {
      // Table might not exist yet
      console.log(`  - Skipped ${table} (may not exist)`);
    }
  }

  console.log("\n✅ Database reset complete!");
  console.log("   The void awaits your word.\n");

  await client.end();
  process.exit(0);
}

resetDatabase().catch((err) => {
  console.error("Failed to reset database:", err);
  process.exit(1);
});
