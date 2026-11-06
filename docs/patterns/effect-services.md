# Patroon: Effect services, Layers, services en Config

> Gebaseerd op `effect@4.1.2` (`repos/effect`, tag `effect@4.1.2`). Het testdeel op `@effect/vitest@4.1.2`.

Ports, adapters, services en config in `apps/api`. De begrippen (service, Effect service, port, adapter) staan in [conventions.md](../architecture/conventions.md#begrippen); de lagen in [overview.md](../architecture/overview.md#lagen-in-appsapi).

## Hoe het hoort

### Port: een Effect service

Een port is een class die `Context.Service` uitbreidt. De eerste typeparameter is de class zelf, de tweede de interface. De string is een unieke sleutel: package plus pad.

```ts
// repositories/todoRepository.ts
import { Context, type Effect } from "effect";
import type { Todo, TodoId, TodoNotFound } from "@repo/domain/example/todos";

export class TodoRepository extends Context.Service<
  TodoRepository,
  {
    readonly findById: (id: TodoId) => Effect.Effect<Todo, TodoNotFound>;
    readonly insert: (todo: Todo) => Effect.Effect<void>;
  }
>()("@repo/api/todos/TodoRepository") {}
```

De interface bevat alleen domeintypes en domeinfouten. Het type van de implementatie is `TodoRepository["Service"]`.

### Adapter: een Layer

Een adapter is een `Layer` die de port levert, in een eigen bestand. Bouw de implementatie met `TodoRepository.of(...)`.

```ts
// repositories/todoRepository.memory.ts
import { Effect, Layer } from "effect";

export const TodoRepositoryMemory = Layer.effect(
  TodoRepository,
  Effect.sync(() => {
    const todos = new Map<TodoId, Todo>();
    return TodoRepository.of({
      findById: (id) => {
        const todo = todos.get(id);
        return todo === undefined ? Effect.fail(new TodoNotFound({ id })) : Effect.succeed(todo);
      },
      insert: (todo) =>
        Effect.sync(() => {
          todos.set(todo.id, todo);
        }),
    });
  }),
);
```

- Heeft de adapter zelf een Effect service nodig (zoals `Database`), dan `yield*` je die in een `Effect.gen` binnen `Layer.effect`. Die requirement staat dan in het derde type van de Layer.
- Een driverfout met betekenis wordt een domeinfout; de rest wordt een defect met `Effect.orDie` (zie [errors.md](../architecture/errors.md#regels-per-laag)).
- Koppelen gebeurt met `Layer.provide` (verbergt de dependency) of `Layer.provideMerge` (houdt hem zichtbaar). Alleen in `layers.ts` _(komt in BOO-117)_ en in tests.
- In de API is elke port een requirement per request. Welke adapters één keer en welke per request worden opgebouwd, staat in [effect-http-api.md](effect-http-api.md#de-httpapi-als-handler-op-workers).

### Service: een functie met `Effect.fn`

Een service is een functie, geen Effect service ([ADR 0008](../decisions/0008-services-as-functions.md)). Gebruik `Effect.fn` met de naam van de functie: dat geeft een tracing-span en betere stacktraces.

```ts
// services/getTodo.ts
import { Effect } from "effect";

export const getTodo = Effect.fn("getTodo")(function* (id: TodoId) {
  const todos = yield* TodoRepository;
  return yield* todos.findById(id);
});
```

Het type wordt afgeleid: `Effect<Todo, TodoNotFound, TodoRepository>`. Wil je het vastleggen, gebruik dan `Effect.fn.Return`. Een service die meer nodig heeft, vraagt meer ports op (`IdGenerator` _komt in BOO-118_):

```ts
// services/createTodo.ts
import { Effect, Schema } from "effect";

export const createTodo = Effect.fn("createTodo")(function* (input: {
  readonly title: TodoTitle;
}): Effect.fn.Return<Todo, never, TodoRepository | IdGenerator> {
  const todos = yield* TodoRepository;
  const ids = yield* IdGenerator;
  const id = yield* Schema.decodeEffect(TodoId)(yield* ids.uuid).pipe(Effect.orDie);
  const todo = new Todo({ id, title: input.title, completed: false });
  yield* todos.insert(todo);
  return todo;
});
```

Een ongeldige ID uit de generator is een bug, dus een defect (`Effect.orDie`), geen domeinfout.

Extra gedrag (zoals `Effect.catchTag`) geef je als extra argumenten aan `Effect.fn` mee, niet via `.pipe` erachter.

### Config

Config lees je met `Config`, in een Layer. Secrets altijd als `Config.Redacted`: de waarde is een `Redacted` die in logs en `toString` als `<redacted>` verschijnt.

```ts
import { Config, Context, Effect, Layer, type Redacted } from "effect";

export class AppConfig extends Context.Service<
  AppConfig,
  { readonly webOrigin: string; readonly authSecret: Redacted.Redacted }
>()("@repo/api/AppConfig") {
  static readonly layer = Layer.effect(
    AppConfig,
    Effect.gen(function* () {
      const webOrigin = yield* Config.String("WEB_ORIGIN");
      const authSecret = yield* Config.Redacted("BETTER_AUTH_SECRET");
      return AppConfig.of({ webOrigin, authSecret });
    }),
  );
}
```

- De constructors zijn PascalCase: `Config.String`, `Config.Number`, `Config.Boolean`, `Config.URL`, `Config.Redacted`. Een `Config` is direct te `yield*`en.
- Ontbreekt een sleutel, dan faalt de Layer met een `ConfigError`. Geen `Config.withDefault` voor waarden die in productie verplicht zijn.
- De waarden komen van de actieve `ConfigProvider`. In tests: `ConfigProvider.layer(ConfigProvider.fromUnknown({ … }))`. Hoe de Worker zijn `env` als provider aanbiedt, wordt vastgelegd in BOO-117.
- De secret lees je pas uit waar hij nodig is, met `Redacted.value(config.authSecret)`.

### Testen met `@effect/vitest`

> `@effect/vitest` en `vitest` komen in BOO-120. De Effect-code in de tests hieronder is getypecheckt en gedraaid; de aanroepen van `describe`, `it.effect` en `assert` volgen `ai-docs/src/09_testing/` en worden in BOO-120 gecontroleerd. `TestLayer` komt uit `src/testing/testLayer.ts`: alle `.memory`-adapters (zoals `TodoRepositoryMemory` en `IdGeneratorMemory`, die voorspelbare ID's geeft) plus een vaste `CurrentUser` _(BOO-118, BOO-123)_.

```ts
// services/getTodo.test.ts
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";

describe("getTodo", () => {
  it.effect("geeft de todo terug", () =>
    Effect.gen(function* () {
      const created = yield* createTodo({ title: TodoTitle.make("Boodschappen") });
      const todo = yield* getTodo(created.id);
      assert.strictEqual(todo.title, created.title);
    }).pipe(Effect.provide(TestLayer)),
  );

  it.effect("faalt met TodoNotFound", () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(
        getTodo(TodoId.make("00000000-0000-4000-8000-000000000000")),
      );
      assert.strictEqual(error._tag, "TodoNotFound");
    }).pipe(Effect.provide(TestLayer)),
  );
});
```

- `it.effect` draait met de TestClock; tijd verzet je met `TestClock.adjust` uit `effect/testing`. `it.live` draait met de echte klok.
- `it.layer(TestLayer)("naam", (it) => { … })` deelt één Layer over alle tests in het blok. Staat er state in, dan zien de tests elkaars wijzigingen. Per test `Effect.provide`, of `it.layer(TestLayer, { buildPerTest: true })`, geeft elke test een verse Layer.
- Fouten test je met `Effect.flip`: die zet de fout in het succes-kanaal.

## Wat je niet doet

- Geen `Effect.Service`, `Context.Tag` of `Context.GenericTag`: in 4.1.2 is het `Context.Service`.
- Geen services als Effect service (`class CreateTodo extends Context.Service`). Een service is een functie.
- Geen functie die alleen `Effect.gen` teruggeeft; gebruik `Effect.fn`.
- Geen `.pipe(...)` achter `Effect.fn(...)(...)`. Extra stappen gaan als argument mee.
- Geen adapter importeren in een service (Biome blokkeert `*.drizzle` en `*.memory` in `services/**`).
- Geen `Config.String` voor een secret, en geen `process.env`.
- Geen `Effect.runPromise` of `Effect.runSync` in applicatiecode; dat doet alleen de Worker-entry.
- Geen `try/catch` of `Promise` in Effect-code.

## Meer in `repos/effect`

- `ai-docs/src/01_effect/03_services/01_service.ts`: `Context.Service`, `.of`, een Layer als static.
- `ai-docs/src/01_effect/03_services/20_layer-composition.ts`: `Layer.provide` en `Layer.provideMerge`.
- `ai-docs/src/01_effect/01_basics/02_effect-fn.ts`: `Effect.fn`, `Effect.fn.Return`, extra argumenten.
- `packages/effect/src/Config.ts`: alle constructors (zoek op `export function Redacted`).
- `packages/effect/src/ConfigProvider.ts`: `layer`, `fromUnknown`, `fromEnvRecord`.
- `packages/effect/test/Config.test.ts` en `ConfigProvider.test.ts`.
- `ai-docs/src/09_testing/10_effect-tests.ts` en `20_layer-tests.ts`: `it.effect`, `it.layer`, `TestClock`.
- `packages/vitest/src/index.ts` en `packages/vitest/test/`.
