# Patroon: Effect HttpApi

> Gebaseerd op `effect@4.1.2` (`repos/effect`, tag `effect@4.1.2`).

Het contract in `packages/contract`, de handlers en de middleware in `apps/api`, en de getypte client. Waarom HttpApi: [ADR 0005](../decisions/0005-effect-http-api.md). Hoe fouten lopen: [errors.md](../architecture/errors.md).

Importpaden: `effect/http-api` (HttpApi, HttpApiGroup, HttpApiEndpoint, HttpApiSchema, HttpApiMiddleware, HttpApiBuilder, HttpApiClient) en `effect/http` (HttpRouter, HttpServer, HttpServerRequest, FetchHttpClient). Niet `effect/unstable/...`.

Alles in `effect/http-api` en `effect/http` is gemarkeerd als `@stability unstable`: een minor-versie kan breken. Daarom staan alleen deze twee in `allowedUnstableApis` in `tsconfig.base.json`; elke andere unstable API geeft een warning en laat `typecheck` falen.

## Hoe het hoort

### Endpoints en fouten

Een groep is een class die `HttpApiGroup.make` uitbreidt. Een domeinfout krijgt zijn statuscode hier, met `HttpApiSchema.status`.

```ts
// packages/contract/example/todos/todosGroup.ts
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/http-api";
import { Todo, TodoId, TodoNotFound, TodoTitle } from "@repo/domain/example/todos";

export class TodosGroup extends HttpApiGroup.make("todos")
  .add(
    HttpApiEndpoint.get("getTodo", "/:id", {
      params: { id: TodoId },
      success: Todo,
      error: TodoNotFound.pipe(HttpApiSchema.status(404)),
    }),
    HttpApiEndpoint.post("createTodo", "/", {
      payload: Schema.Struct({ title: TodoTitle }),
      success: Todo,
    }),
  )
  .middleware(Authentication)
  .prefix("/todos") {}
```

- `params`, `query` en `payload` valideren de input; `success` bepaalt welke velden eruit gaan.
- `params` en `query` zijn een object met velden. `payload` bij een POST is een schema (`Schema.Struct`); bij een GET gaat `payload` via de query string.
- Meerdere fouten: `error: [TodoNotFound.pipe(HttpApiSchema.status(404)), TodoTitleTaken.pipe(HttpApiSchema.status(409))]`.
- `.middleware(...)` op de groep geldt voor alle endpoints erin.

De API zelf voegt de groepen samen:

```ts
// packages/contract/src/api.ts
import { HttpApi } from "effect/http-api";

export class Api extends HttpApi.make("api").add(TodosGroup) {}
```

### Middleware die een Effect service levert

De definitie staat in het contract, omdat de groep ernaar verwijst. `provides` is de Effect service die de middleware aan de handlers geeft; `error` de fout die hij kan geven. Omdat de definitie `CurrentUser` noemt, staat ook `CurrentUser` in het contract: `packages/contract/src/shared/`, naast `authErrors.ts`. Het is een port zonder serverimports, dus web en mobile kunnen het contract nog steeds importeren.

```ts
// packages/contract/src/shared/currentUser.ts, authErrors.ts en authentication.ts
import { Context, Schema } from "effect";
import { HttpApiMiddleware, HttpApiSchema } from "effect/http-api";

export class CurrentUser extends Context.Service<CurrentUser, { readonly id: UserId }>()(
  "@repo/contract/CurrentUser",
) {}

export class Unauthorized extends Schema.TaggedError<Unauthorized>()("Unauthorized", {}) {}

export class Authentication extends HttpApiMiddleware.Service<
  Authentication,
  { provides: CurrentUser; requires: never }
>()("@repo/contract/Authentication", {
  error: Unauthorized.pipe(HttpApiSchema.status(401)),
}) {}
```

De implementatie staat in de API. De middleware kan het request lezen via `HttpServerRequest.HttpServerRequest` en levert `CurrentUser` met `Effect.provideService`:

```ts
// apps/api/src/auth/authenticationMiddleware.ts
import { Effect, Layer } from "effect";
import { HttpServerRequest } from "effect/http";

export const AuthenticationLive = Layer.succeed(Authentication)(
  Authentication.of((httpEffect) =>
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const userId = yield* sessionUserId(request); // via Better Auth, BOO-125
      if (userId === undefined) {
        return yield* new Unauthorized();
      }
      return yield* Effect.provideService(httpEffect, CurrentUser, { id: userId });
    }),
  ),
);
```

### Handlers

Per groep één Layer met `HttpApiBuilder.group`. Elke handler roept één service aan en geeft de fout ongewijzigd door.

```ts
// apps/api/example/todos/todosHandlers.ts
import { HttpApiBuilder } from "effect/http-api";

export const TodosHandlers = HttpApiBuilder.group(Api, "todos", (handlers) =>
  handlers
    .handle("getTodo", ({ params }) => getTodo(params.id))
    .handle("createTodo", ({ payload }) => createTodo(payload)),
);
```

Een fout die het endpoint niet declareert, compileert niet ("Missing errors TodoNotFound in the expected Effect type"). Vang hem dus niet af om de compiler stil te krijgen: declareer hem in het contract, of maak er bewust een defect van met `Effect.orDie`.

### De HttpApi als handler op Workers

`HttpRouter.toWebHandler` maakt van de API een functie `(Request) => Promise<Response>`. Bouw hem één keer op module-niveau; de broncode waarschuwt dat de Layer-opbouw op Workers geen I/O per request mag doen.

Wat een handler via een service opvraagt (hier `TodoRepository` en `IdGenerator`), is een requirement **per request**, geen requirement van de Layer. `Layer.provide` op de handlers-Layer levert alleen wat de Layer zelf bij het opbouwen nodig heeft (zoals de middleware); een port lever je op een van deze twee manieren:

- **Eén keer, voor alle requests**: `HttpRouter.provideRequest(layer)`. Alleen voor adapters zonder I/O-object, zoals `IdGenerator`.
- **Per request**: een `HttpRouter.middleware` die de Layer opbouwt met `Layer.build`. Die draait in de scope van het request, dus de Layer wordt per request gemaakt en na de response opgeruimd. Hier horen `Database` en elke adapter die erop bouwt.

De composition root (`layers.ts`) levert beide:

```ts
// apps/api/src/layers.ts
import { Effect, Layer } from "effect";
import { HttpRouter } from "effect/http";

const PerRequestLayer = TodoRepositoryDrizzle.pipe(Layer.provide(DatabaseLive));

export const RequestServices = HttpRouter.middleware<{ provides: TodoRepository }>()((httpEffect) =>
  Effect.gen(function* () {
    const services = yield* Layer.build(PerRequestLayer);
    return yield* Effect.provideContext(httpEffect, services);
  }),
).layer;

export const AppServices = HttpRouter.provideRequest(IdGeneratorLive);
```

```ts
// apps/api/src/index.ts
import { Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/http";
import { HttpApiBuilder } from "effect/http-api";

const ApiLive = HttpApiBuilder.layer(Api).pipe(
  Layer.provide(TodosHandlers.pipe(Layer.provide(AuthenticationLive))),
  Layer.provide(RequestServices),
  AppServices,
  Layer.provide(HttpServer.layerServices),
);

const { handler } = HttpRouter.toWebHandler(ApiLive);

export default {
  fetch: (request: Request) => handler(request),
};
```

Vergeet je een port, dan eist `handler` hem als tweede argument (een `Context`), en compileert `handler(request)` niet. Zo valt een ontbrekende adapter op tijdens de typecheck.

### De getypte client

De client wordt afgeleid uit hetzelfde `Api`. Hij heeft een `HttpClient` nodig; in de browser en op Workers is dat `FetchHttpClient.layer`.

```ts
import { Effect } from "effect";
import { FetchHttpClient } from "effect/http";
import { HttpApiClient } from "effect/http-api";

export const loadTodo = (id: TodoId) =>
  Effect.gen(function* () {
    const client = yield* HttpApiClient.make(Api, { baseUrl: "https://api.example.com" });
    return yield* client.todos.getTodo({ params: { id } });
  }).pipe(Effect.provide(FetchHttpClient.layer));
```

Het resultaat is `Effect<Todo, TodoNotFound | Unauthorized | …>`: de fouten uit het contract komen getypt terug. In de web-app gaat dit alleen via `lib/apiClient.ts` _(komt in BOO-128)_.

## Wat je niet doet

- Geen `addError`: bestaat niet in 4.1.2. Fouten gaan via de optie `error` van het endpoint.
- Geen `{ httpApiStatus }` op een domeinfout; de status hoort in het contract ([ADR 0014](../decisions/0014-domain-errors-in-contract.md)). Op een contractfout als `Unauthorized` mag het, maar gebruik voor eenheid ook daar `HttpApiSchema.status`.
- Geen serverimports in het contract. Het contract wordt ook door web en mobile geïmporteerd.
- Geen domeinfout in de handler vertalen naar een andere fout of statuscode.
- Geen `HttpApiBuilder.layer(...)` of `toWebHandler` binnen `fetch`. Eén keer, op module-niveau.
- Geen database-client of andere I/O in een Layer die op module-niveau wordt gebouwd, en dus ook niet in `provideRequest`. Die horen in `RequestServices`.
- Geen `fetch` naar de eigen API buiten de getypte client.

## Meer in `repos/effect`

- `ai-docs/src/51_http-server/10_basics.ts`: API, handlers, `toWebHandler` en de client in één bestand.
- `ai-docs/src/51_http-server/fixtures/api/`: groep, endpoints, fouten en een middleware met `provides`.
- `ai-docs/src/51_http-server/fixtures/server/`: handlers en de middleware-implementatie.
- `ai-docs/src/51_http-server/20_testing.ts`: de API testen.
- `packages/effect/src/http/HttpRouter.ts`: `toWebHandler`, met de Workers-waarschuwing (zoek op `Cloudflare Workers`), `provideRequest` en `middleware`.
- `packages/effect/src/http-api/HttpApiSchema.ts`: `status`.
- `packages/effect/src/http-api/HttpApiMiddleware.ts`: `Service`, `HttpRouter.Provided` voor wat middleware kan lezen.
- `packages/effect/test/httpapi/`: tests voor builder, client, endpoints en fouten.
