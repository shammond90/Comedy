/**
 * Applies Drizzle migrations, then runs the SQL files in
 * supabase/policies (RLS + extra constraints).
 *
 * Usage: npm run db:setup
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const migrationClient = postgres(url, { max: 1 });
  const db = drizzle(migrationClient);

  console.log("→ Applying Drizzle migrations…");
  await migrate(db, { migrationsFolder: "src/db/migrations" });

  const policiesDir = "supabase/policies";
  const files = readdirSync(policiesDir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    console.log(`→ Applying ${f}…`);
    const sql = readFileSync(join(policiesDir, f), "utf8");
    await migrationClient.unsafe(sql);
  }

  await migrationClient.end();
  console.log("✓ Database setup complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
