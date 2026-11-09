# apps/api

De API-Worker: HttpApi-handlers, services, ports en adapters, en Better Auth. Draait op Cloudflare Workers. Nu staat alleen `src/index.ts` er; de rest hieronder zijn de regels waar nieuwe code aan voldoet. Bestandsnamen zoals `todosHandlers.ts` en `services/` zijn voorbeelden uit de referentie-feature `todos`, die in `example/` komt _(BOO-123)_.

## Lagen

Van buiten naar binnen: handler → service → port → adapter. Uitleg: `docs/architecture/overview.md` (Lagen in `apps/api`).

- **Handlers** (`todosHandlers.ts`) roepen één service aan en geven fouten ongewijzigd door.
- **Services** zijn functies met `Effect.fn`, één per bestand in `services/`, geen Effect services ([ADR 0008](../../docs/decisions/0008-services-as-functions.md)). Ze vragen alleen ports op; Biome blokkeert `drizzle-orm`, `better-auth`, `cloudflare:workers`, `*.drizzle` en `*.memory` in `services/**`.
- **Ports** zijn Effect services (`Context.Service`), bijvoorbeeld `repositories/todoRepository.ts`.
- **Adapters** zijn Layers met de variant achter de naam: `todoRepository.drizzle.ts` → `TodoRepositoryDrizzle`, `todoRepository.memory.ts` → `TodoRepositoryMemory`.
- **`src/layers.ts`** is de enige composition root: alleen daar worden ports aan adapters gekoppeld _(komt in BOO-117)_. `CurrentUser` is de uitzondering: die levert `authenticationMiddleware` per request (zie `docs/patterns/effect-http-api.md`, Middleware die een Effect service levert). `src/index.ts` is alleen de Worker-entry.

Patronen: `docs/patterns/effect-services.md`, `docs/patterns/effect-http-api.md`, `docs/patterns/drizzle.md`.

## Database per request

Een I/O-object, zoals een databaseverbinding, leeft nooit over requests heen. `Database` en alles wat erop bouwt (adapters, `Auth`) wordt per request opgebouwd in `RequestServices`; adapters zonder I/O in `AppServices`. Beide staan in `layers.ts` _(komt in BOO-117)_. Zie `docs/patterns/effect-http-api.md` (De HttpApi als handler op Workers).

Better Auth draait met een instantie per request: `docs/patterns/better-auth.md`.

## Fouten

- Een port bevat alleen domeinfouten. Een driverfout met betekenis wordt een domeinfout (Postgres `23505` → `TodoTitleTaken`); de rest een defect via `Effect.orDie`.
- Services laten fouten doorstromen; handlers vertalen niets. De statuscode staat in het contract.
- Uitleg per laag: `docs/architecture/errors.md`.

## Config en secrets

- Config lees je met Effect `Config`, in `config/appConfig.ts` _(komt in BOO-117)_. Een ontbrekende of ongeldige waarde laat de Worker falen; geen stille standaardwaarde.
- Secrets altijd als `Config.Redacted`. Nooit `process.env`.
- Zie `docs/patterns/effect-services.md` (Config) en `docs/architecture/security.md`.

## Tests

Tests staan naast de code. Services testen met `.memory`-adapters via `testing/testLayer.ts` _(komt in BOO-118)_. Soorten tests en bestandsnamen: `docs/architecture/testing.md`. Gebruik nooit `bun test`.
