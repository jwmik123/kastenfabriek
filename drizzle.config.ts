import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

/**
 * drizzle-kit needs a session; the app needs pooled statements.
 *
 * The app talks to the transaction pooler (port 6543), which hands out a
 * different backend per statement — fine for queries, but it breaks migrations
 * and studio, which rely on session state. The session pooler is the same host
 * on 5432, so only the port is swapped. Everything else, credentials included,
 * is left untouched.
 *
 * This file is read by drizzle-kit alone, never by the app.
 */
function sessionPoolerUrl(url: string): string {
  return url.replace(/(@aws-[^/@]*\.pooler\.supabase\.com):6543\b/, "$1:5432");
}

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: sessionPoolerUrl(process.env.DATABASE_URL!),
  },
});
