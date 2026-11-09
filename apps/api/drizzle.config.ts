import process from "node:process";
import { defineConfig } from "drizzle-kit";

// Alleen voor drizzle-kit (lokaal of in CI). De Worker gebruikt DATABASE_URL niet; die praat via Hyperdrive.
const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl === undefined || databaseUrl === "") {
  throw new Error(
    "DATABASE_URL ontbreekt. Kopieer apps/api/.dev.vars.example naar apps/api/.dev.vars en start Postgres met `docker compose up -d`.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  // Het pad begint met ./src, dus tabellen in example/ doen niet mee.
  schema: "./src/**/*Table.ts",
  out: "./src/db/migrations",
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});
