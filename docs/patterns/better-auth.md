# Patroon: Better Auth

> Gebaseerd op `better-auth@1.7.15` (`repos/better-auth`, tag `v1.7.15`).

Better Auth draait in de API-Worker, met de Drizzle-adapter op de database per request. Waar het in de architectuur zit: [security.md](../architecture/security.md#authenticatie). Hoe `Database` en `RequestServices` werken: [drizzle.md](drizzle.md) en [effect-http-api.md](effect-http-api.md#de-httpapi-als-handler-op-workers).

## Hoe het hoort

### Eén instantie per request

De Drizzle-adapter wordt bij `betterAuth()` aan één `db` gekoppeld, en Better Auth biedt geen publieke manier om per request een andere adapter mee te geven. Omdat de verbinding per request leeft, maak je ook Better Auth per request aan.

Dat is goedkoop: `betterAuth()` met de Drizzle-adapter opent bij het aanmaken geen verbinding. De schemacontrole leest alleen de lokale Drizzle-tabellen. Gemeten: twee instanties samen in een paar milliseconden, zonder enige databasecall.

```ts
// auth/auth.ts
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Context, Effect, Layer, Redacted } from "effect";

export const createAuth = (db: PostgresJsDatabase, config: AuthConfig) =>
  betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
    secret: Redacted.value(config.secret),
    baseURL: config.baseURL,
    trustedOrigins: [config.webOrigin],
    emailAndPassword: { enabled: true },
    rateLimit: { enabled: true, storage: "database" },
    advanced: {
      crossSubDomainCookies: { enabled: true, domain: config.cookieDomain },
    },
  });

export class Auth extends Context.Service<Auth, ReturnType<typeof createAuth>>()(
  "@repo/api/Auth",
) {}

export const AuthLayer = Layer.effect(
  Auth,
  Effect.gen(function* () {
    const db = yield* Database;
    return createAuth(db, authConfig);
  }),
);
```

- `AuthLayer` hangt af van `Database` en hoort dus in `RequestServices`, naast de adapters.
- `better-auth/minimal` laat Kysely weg. Met de Drizzle-adapter is Kysely niet nodig, en de Worker wordt kleiner.
- `authSchema` zijn de Drizzle-tabellen in `authTable.ts`, gegenereerd met de CLI _(komt in BOO-124)_.
- `AuthConfig` komt uit `AppConfig`; het secret is een `Config.Redacted` en wordt pas hier uitgelezen.

### Rate limiting staat niet vanzelf aan

Zonder `rateLimit.enabled` zet Better Auth rate limiting alleen aan als `NODE_ENV === "production"`. Op Workers is `NODE_ENV` meestal niet gezet, dus dan staat het stil uit. Zet daarom altijd `enabled: true`. De opslag is `"database"`: `"memory"` overleeft op Workers geen request.

### De sessie in de middleware

De authenticatie-middleware ([effect-http-api.md](effect-http-api.md#middleware-die-een-effect-service-levert)) zet de sessie om in `CurrentUser`. Een HttpApi-middleware kan getypeerd geen service per request opvragen: wat hij in `requires` noemt, wordt bij het opbouwen op module-niveau geleverd. Daarom leest hij `Auth` met `Effect.serviceOption`. `RequestServices` draait eerder en heeft `Auth` dan al in de context gezet.

```ts
// auth/authenticationMiddleware.ts
import { Effect, Layer, Option } from "effect";
import { HttpServerRequest } from "effect/http";

export const AuthenticationMiddleware = Layer.succeed(Authentication)(
  Authentication.of((httpEffect) =>
    Effect.gen(function* () {
      const auth = yield* Effect.serviceOption(Auth);
      if (Option.isNone(auth)) {
        return yield* Effect.die("Auth ontbreekt: hij hoort in RequestServices");
      }
      const request = yield* HttpServerRequest.HttpServerRequest;
      const webRequest = yield* HttpServerRequest.toWeb(request).pipe(Effect.orDie);
      const session = yield* Effect.tryPromise(() =>
        auth.value.api.getSession({ headers: webRequest.headers }),
      ).pipe(Effect.orDie);
      if (session === null) {
        return yield* new Unauthorized();
      }
      return yield* Effect.provideService(httpEffect, CurrentUser, {
        id: UserId.make(session.user.id),
      });
    }),
  ),
);
```

- Geen sessie is een verwachte uitkomst (`getSession` geeft `null`), dus `Unauthorized`. Een fout van Better Auth of de database is een defect.
- Ontbreekt `Auth` in `RequestServices`, dan is dat een bug in de bedrading: een 500, geen compileerfout. De API-test "zonder sessie 401" _(BOO-125)_ vangt dat, omdat hij dan 500 krijgt.
- De sessie wordt alleen opgezocht op endpoints achter de middleware, niet op publieke routes.

### Workers

- Better Auth gebruikt `AsyncLocalStorage`. De Worker heeft daarom `nodejs_compat` nodig in `wrangler.jsonc`; dat staat aan.
- Werk dat Better Auth na de response wil afmaken, kan via `advanced.backgroundTasks.handler`, bijvoorbeeld met `ctx.waitUntil`. `ctx` lees je in een per-request-Layer met `yield* WorkerContext` (zie [effect-http-api.md](effect-http-api.md#env-en-ctx-per-request)).
- `auth.handler(request)` beantwoordt de routes onder `/api/auth/*` met een Web `Response`. Hoe die naast HttpApi in de Worker wordt gerouteerd, komt in BOO-124.

## Wat je niet doet

- Geen Better Auth-instantie op module-niveau: die zou één verbinding over requests heen delen.
- Geen `rateLimit` zonder `enabled: true`, en geen `storage: "memory"`.
- Geen `betterAuth` uit `"better-auth"` als je de Drizzle-adapter gebruikt; gebruik `"better-auth/minimal"`.
- Geen `auth.api.*` in services of handlers. Alleen de middleware leest de sessie; services gebruiken `CurrentUser`.
- Geen Better Auth-fouten naar domeinfouten vertalen buiten de auth-formulieren (zie [errors.md](../architecture/errors.md#in-de-web-app)).
- Geen secret als gewone string in config; altijd `Config.Redacted`.

## Open voor BOO-124

- **De CLI.** `auth generate --adapter drizzle --dialect postgresql` laadt een configbestand en zoekt daarin een export `auth` (een instantie). Wij hebben een functie `createAuth`, geen vaste instantie. Hoe de CLI aan een instantie komt (bijvoorbeeld een apart bestand alleen voor de CLI), wordt daar beslist.
- **Cookies.** Of de standaardattributen al `HttpOnly`, `Secure` en `SameSite=Lax` zijn, zoals [security.md](../architecture/security.md#authenticatie) eist, wordt daar gecontroleerd.

## Meer in `repos/better-auth`

- `packages/better-auth/src/auth/base.ts`: wat `betterAuth()` bij het aanmaken doet, en `handler`.
- `packages/better-auth/src/auth/minimal.ts`: de variant zonder Kysely.
- `packages/core/src/types/init-options.ts`: alle opties, waaronder `rateLimit`, `crossSubDomainCookies`, `backgroundTasks` en `validateSchema`.
- `packages/better-auth/src/context/create-context.ts` (zoek op `rateLimit?.enabled`) en `packages/core/src/env/env-impl.ts` (`isProduction`): waarom rate limiting standaard uit staat.
- `packages/core/src/db/schema-check.ts`: de schemacontrole.
- `packages/drizzle-adapter/src/drizzle-adapter.ts`: `drizzleAdapter` en zijn opties.
- `packages/cli/src/utils/get-config.ts`: hoe de CLI de instantie zoekt.
- `docs/content/docs/guides/optimizing-for-performance.mdx`: `better-auth/minimal`.
- `docs/content/docs/integrations/hono.mdx`: `nodejs_compat` op Workers.
- `docs/content/docs/concepts/cli.mdx` en `docs/content/docs/adapters/drizzle.mdx`.
