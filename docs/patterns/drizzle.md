# Patroon: Drizzle

> Gebaseerd op `drizzle-orm@0.45.4` (`repos/drizzle`, tag `0.45.4`).

Tabellen, de Effect service `Database` en adapters in `apps/api`. We blijven op 0.45.x ([ADR 0006](../decisions/0006-drizzle-stable.md)). Drizzle komt alleen in adapters en in `db/`; services kennen het niet (Biome blokkeert `drizzle-orm` in `services/**`). Hoe ports en adapters werken staat in [effect-services.md](effect-services.md).

## Hoe het hoort

### Tabel

Een tabel staat in een eigen bestand, `todoTable.ts`. Kolommen in de database zijn snake_case, velden in TypeScript camelCase.

```ts
// todoTable.ts
import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const todoTable = pgTable(
  "todo",
  {
    id: uuid("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    title: text("title").notNull(),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("todo_owner_title_unique").on(table.ownerId, table.title)],
);

export type TodoRow = typeof todoTable.$inferSelect;
```

- `$inferSelect` is het type van een rij; `$inferInsert` dat van een insert. Dat zijn databasetypes, geen domeintypes.
- Het ID komt van `IdGenerator` in de service, niet van de database (zie [security.md](../architecture/security.md#autorisatie)). Daarom geen `defaultRandom()` op `id`.

### De Effect service `Database`

`Database` is een infrastructuur-dependency: alleen adapters vragen hem op. Het type is de Drizzle-database voor postgres.js.

```ts
// db/database.ts
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Context } from "effect";

export class Database extends Context.Service<Database, PostgresJsDatabase>()(
  "@repo/api/Database",
) {}
```

De Layer die de verbinding opent (postgres.js op de Hyperdrive-binding) en hem aan het eind van het request sluit, komt in BOO-117. Hij hoort in `RequestServices`, nooit op module-niveau (zie [effect-http-api.md](effect-http-api.md#de-httpapi-als-handler-op-workers)).

### Adapter

De adapter vraagt `Database` op, voert de query uit en zet de rij om naar het domeintype.

```ts
// repositories/todoRepository.drizzle.ts
import { and, eq } from "drizzle-orm";
import { DrizzleQueryError } from "drizzle-orm/errors";
import { Effect, Layer, Predicate, Schema } from "effect";

const isUniqueViolation = (error: unknown) =>
  error instanceof DrizzleQueryError &&
  Predicate.hasProperty(error.cause, "code") &&
  error.cause.code === "23505";

const decodeTodo = Schema.decodeUnknownEffect(Todo);

export const TodoRepositoryDrizzle = Layer.effect(
  TodoRepository,
  Effect.gen(function* () {
    const db = yield* Database;

    return TodoRepository.of({
      findById: Effect.fn("TodoRepository.findById")(function* (ownerId, id) {
        const rows = yield* Effect.tryPromise(() =>
          db
            .select()
            .from(todoTable)
            .where(and(eq(todoTable.id, id), eq(todoTable.ownerId, ownerId)))
            .limit(1),
        ).pipe(Effect.orDie);
        const row = rows[0];
        if (row === undefined) {
          return yield* new TodoNotFound({ id });
        }
        return yield* decodeTodo(row).pipe(Effect.orDie);
      }),
      insert: Effect.fn("TodoRepository.insert")(function* (todo) {
        yield* Effect.tryPromise(() =>
          db.insert(todoTable).values({
            id: todo.id,
            ownerId: todo.ownerId,
            title: todo.title,
            completed: todo.completed,
          }),
        ).pipe(
          Effect.catch((error) =>
            isUniqueViolation(error.cause) ? Effect.fail(new TodoTitleTaken()) : Effect.die(error),
          ),
        );
      }),
    });
  }),
);
```

- **Promises**: een Drizzle-query is een Promise. Die komt alleen via `Effect.tryPromise` de Effect-wereld in, en alleen in een adapter.
- **Fouten**: Drizzle verpakt elke fout van de driver in een `DrizzleQueryError`, met de originele fout in `cause`. Een Postgres-fout met betekenis wordt een domeinfout (`23505`, unique violation → `TodoTitleTaken`); al het andere wordt een defect (zie [errors.md](../architecture/errors.md#regels-per-laag)).
- **Rij naar domein**: decodeer de rij met het domeinschema. Extra kolommen (zoals `createdAt`) vallen weg; een rij die niet aan de regels voldoet is een bug en wordt een defect.
- **Eigenaar**: filter in de query zelf op `ownerId`, ook als de service al controleert (zie [security.md](../architecture/security.md#autorisatie)).
- Condities (`eq`, `and`, `or`, `inArray`, …) komen uit `drizzle-orm`.

### Ruwe SQL

Alleen via de `sql`-template: waarden worden dan parameters.

```ts
import { sql } from "drizzle-orm";

db.select().from(todoTable).where(sql`lower(${todoTable.title}) = ${search}`);
```

## Wat je niet doet

- Geen string-interpolatie in SQL en geen `sql.raw` met input van buiten.
- Geen Drizzle-database op module-niveau of in `AppServices`. De verbinding leeft per request.
- Geen `drizzle-orm` in `services/`, en geen rijtypes (`TodoRow`) buiten de adapter.
- Geen rij als domeinobject teruggeven zonder te decoderen.
- Geen `try/catch` of `await` in de adapter; gebruik `Effect.tryPromise`.
- Geen `drizzle-zod` of andere validatie naast Effect Schema ([ADR 0011](../decisions/0011-effect-schema-only.md)).
- Geen Drizzle 1.0-API's (zoals `defineRelations`): die horen bij de RC.
- Transacties en migraties staan hier nog niet in. Migraties met `drizzle-kit` komen in BOO-116.

## Meer in `repos/drizzle`

- `drizzle-orm/src/pg-core/table.ts` en `drizzle-orm/src/pg-core/columns/`: `pgTable` en de kolomtypes.
- `drizzle-orm/src/pg-core/indexes.ts`: `index` en `uniqueIndex`.
- `drizzle-orm/src/sql/expressions/conditions.ts`: `eq`, `and`, `or` en de rest.
- `drizzle-orm/src/sql/sql.ts`: de `sql`-template.
- `drizzle-orm/src/errors.ts` en `drizzle-orm/src/pg-core/session.ts`: `DrizzleQueryError` en waar die wordt gegooid.
- `drizzle-orm/src/postgres-js/driver.ts`: `drizzle()` en `PostgresJsDatabase`.
- `integration-tests/tests/pg/pg-common.ts` en `postgres-js.test.ts`: queries en tabelconfiguratie in de praktijk.
