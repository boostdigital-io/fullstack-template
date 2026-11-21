// globalSetup van de Vitest-projects `integration` en `api` (vitest.config.ts in de root): maakt de
// testdatabase aan als hij ontbreekt en migreert hem, één keer voor alle testbestanden.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { Effect } from "effect";
import postgres from "postgres";
import { testDatabaseUrl } from "./testDatabase";

const MIGRATIONS_FOLDER = fileURLToPath(new URL("../db/migrations", import.meta.url).href);

const connect = (url: URL) =>
  Effect.acquireRelease(
    Effect.sync(() => postgres(url.href, { max: 1, onnotice: () => undefined })),
    (sql) => Effect.promise(() => sql.end()),
  );

const createIfMissing = Effect.fn("createIfMissing")(function* (url: URL, name: string) {
  // CREATE DATABASE kan niet binnen de database zelf; de standaarddatabase `postgres` bestaat altijd.
  const serverUrl = new URL(url);
  serverUrl.pathname = "/postgres";
  const sql = yield* connect(serverUrl);
  const existing = yield* Effect.promise(
    () => sql`select 1 from pg_database where datname = ${name}`,
  );
  if (existing.length === 0) {
    // De naam is gecontroleerd door testDatabaseUrl, dus veilig als identifier.
    yield* Effect.promise(() => sql.unsafe(`create database "${name}"`));
  }
});

const migrateTestDatabase = Effect.fn("migrateTestDatabase")(function* (url: URL) {
  // Zolang er nog geen tabellen zijn, bestaat de map met migraties niet; dan valt er niets te doen.
  if (!existsSync(`${MIGRATIONS_FOLDER}/meta/_journal.json`)) {
    return;
  }
  const sql = yield* connect(url);
  yield* Effect.promise(() =>
    migrate(drizzle({ client: sql }), { migrationsFolder: MIGRATIONS_FOLDER }),
  );
});

const program = Effect.gen(function* () {
  const { url, name } = yield* testDatabaseUrl;
  yield* createIfMissing(url, name);
  yield* migrateTestDatabase(url);
}).pipe(Effect.scoped);

export const setup = () => Effect.runPromise(program);
