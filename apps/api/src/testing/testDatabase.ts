import { drizzle } from "drizzle-orm/postgres-js";
import { Config, Effect, Layer, Redacted } from "effect";
import postgres from "postgres";
import { Database } from "../db/database";

// Een vergissing in TEST_DATABASE_URL mag nooit de dev-database leegmaken of migreren.
const TEST_DATABASE_NAME = /^[a-z0-9_]+_test$/u;

export const testDatabaseUrl = Effect.gen(function* () {
  const url = new URL(Redacted.value(yield* Config.Redacted("TEST_DATABASE_URL")));
  const name = url.pathname.slice(1);
  if (!TEST_DATABASE_NAME.test(name)) {
    return yield* Effect.die(
      new Error(
        `TEST_DATABASE_URL wijst naar "${name}"; de naam van een testdatabase eindigt op _test.`,
      ),
    );
  }
  return { url, name };
});

// Directe verbinding, zonder Hyperdrive. Elke test draait in een eigen transactie die bij het
// vrijgeven wordt teruggedraaid, dus de database blijft schoon en de volgorde maakt niet uit.
// Geef de Layer daarom per test mee (Effect.provide), niet gedeeld via it.layer.
export const TestDatabase = Layer.effect(
  Database,
  Effect.gen(function* () {
    const { url } = yield* testDatabaseUrl;
    // max: 1, zodat elke query over dezelfde verbinding gaat en dus binnen de transactie valt.
    // (`sql.reserve()` kan niet: Drizzle verwacht een client met `options`.)
    const client = yield* Effect.acquireRelease(
      Effect.sync(() => postgres(url.href, { max: 1 })),
      (sql) => Effect.promise(() => sql.end()),
    );
    yield* Effect.acquireRelease(
      Effect.promise(() => client`begin`),
      () => Effect.promise(() => client`rollback`),
    );
    return Database.of(drizzle({ client }));
  }),
);
