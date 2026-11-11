import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Context, Effect, Layer } from "effect";
import postgres from "postgres";
import { WorkerContext, WorkerEnv } from "../worker";

export class Database extends Context.Service<Database, PostgresJsDatabase>()(
  "@repo/api/Database",
) {
  // Per request opbouwen (RequestServices in layers.ts), nooit op module-niveau: op Workers mag een
  // verbinding niet over requests heen leven.
  static readonly layer = Layer.effect(
    Database,
    Effect.gen(function* () {
      const env = yield* WorkerEnv;
      const ctx = yield* WorkerContext;
      const sql = yield* Effect.acquireRelease(
        Effect.sync(() =>
          postgres(env.HYPERDRIVE.connectionString, {
            max: 5,
            // Uit: postgres.js haalt anders bij de eerste query de array-types op, een extra
            // round-trip per request.
            // biome-ignore lint/style/useNamingConvention: optienaam van postgres.js.
            fetch_types: false,
          }),
        ),
        // waitUntil: het sluiten houdt de response niet op, maar de Worker wacht er wel op.
        (client) => Effect.sync(() => ctx.waitUntil(client.end())),
      );
      return Database.of(drizzle({ client: sql }));
    }),
  );
}
