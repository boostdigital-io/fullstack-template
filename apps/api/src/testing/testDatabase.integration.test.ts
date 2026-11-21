import { describe, expect, it } from "@effect/vitest";
import { sql } from "drizzle-orm";
import { Effect } from "effect";
import { Database } from "../db/database";
import { TestDatabase } from "./testDatabase";

const PROBE_TABLE = "public.test_database_rollback_probe";
const TEST_DATABASE_NAME = /_test$/u;

const tableExists = Effect.gen(function* () {
  const db = yield* Database;
  const rows = yield* Effect.promise(() =>
    db.execute<{ exists: boolean }>(sql`select to_regclass(${PROBE_TABLE}) is not null as exists`),
  );
  return rows[0]?.exists;
});

describe("TestDatabase", () => {
  it.effect("voert een query uit op de testdatabase", () =>
    Effect.gen(function* () {
      const db = yield* Database;
      const rows = yield* Effect.promise(() =>
        db.execute<{ one: number; name: string }>(sql`select 1 as one, current_database() as name`),
      );
      expect(rows[0]?.one).toBe(1);
      expect(rows[0]?.name).toMatch(TEST_DATABASE_NAME);
    }).pipe(Effect.provide(TestDatabase)),
  );

  // Samen tonen deze twee dat elke test in een eigen transactie draait die wordt teruggedraaid.
  // DDL is transactioneel in Postgres, dus ook de tabel zelf verdwijnt.
  it.effect("maakt een tabel binnen zijn eigen transactie", () =>
    Effect.gen(function* () {
      const db = yield* Database;
      yield* Effect.promise(() =>
        db.execute(sql`create table ${sql.raw(PROBE_TABLE)} (id integer primary key)`),
      );
      expect(yield* tableExists).toBe(true);
    }).pipe(Effect.provide(TestDatabase)),
  );

  it.effect("ziet niets van een andere test", () =>
    Effect.gen(function* () {
      expect(yield* tableExists).toBe(false);
    }).pipe(Effect.provide(TestDatabase)),
  );
});
