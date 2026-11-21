# apps/api

De API-Worker: HttpApi-handlers, services, ports en adapters, en Better Auth. Draait op Cloudflare Workers. Nu staat het skelet er (Worker-entry, composition root, config en `Database`); de rest hieronder zijn de regels waar nieuwe code aan voldoet. Bestandsnamen zoals `todosHandlers.ts` en `services/` zijn voorbeelden uit de referentie-feature `todos`, die in `example/` komt _(BOO-123)_.

## Lagen

Van buiten naar binnen: handler → service → port → adapter. Uitleg: `docs/architecture/overview.md` (Lagen in `apps/api`).

- **Handlers** (`todosHandlers.ts`) roepen één service aan en geven fouten ongewijzigd door.
- **Services** zijn functies met `Effect.fn`, één per bestand in `services/`, geen Effect services ([ADR 0008](../../docs/decisions/0008-services-as-functions.md)). Ze vragen alleen ports op; Biome blokkeert `drizzle-orm`, `better-auth`, `cloudflare:workers`, `*.drizzle` en `*.memory` in `services/**`.
- **Ports** zijn Effect services (`Context.Service`), bijvoorbeeld `repositories/todoRepository.ts`.
- **Adapters** zijn Layers met de variant achter de naam: `todoRepository.drizzle.ts` → `TodoRepositoryDrizzle`, `todoRepository.memory.ts` → `TodoRepositoryMemory`.
- **`src/layers.ts`** is de enige composition root: alleen daar worden ports aan adapters gekoppeld. `CurrentUser` is de uitzondering: die levert `authenticationMiddleware` per request (zie `docs/patterns/effect-http-api.md`, Middleware die een Effect service levert). `src/index.ts` is alleen de Worker-entry.

Patronen: `docs/patterns/effect-services.md`, `docs/patterns/effect-http-api.md`, `docs/patterns/drizzle.md`.

## Database per request

Een I/O-object, zoals een databaseverbinding, leeft nooit over requests heen. `Database` en alles wat erop bouwt (adapters, `Auth`) wordt per request opgebouwd in `RequestServices`; adapters zonder I/O in `AppServices` _(komt in BOO-118)_. Beide staan in `layers.ts`. `env` en `ctx` van de Worker lees je in een per-request-Layer met `yield* WorkerEnv` en `yield* WorkerContext` (`src/worker.ts`), nooit via `cloudflare:workers`. Zie `docs/patterns/effect-http-api.md` (De HttpApi als handler op Workers).

Better Auth draait met een instantie per request: `docs/patterns/better-auth.md`.

## Fouten

- Een port bevat alleen domeinfouten. Een driverfout met betekenis wordt een domeinfout (Postgres `23505` → `TodoTitleTaken`); de rest een defect via `Effect.orDie`.
- Services laten fouten doorstromen; handlers vertalen niets. De statuscode staat in het contract.
- Uitleg per laag: `docs/architecture/errors.md`.

## Config en secrets

- Config lees je met Effect `Config`, in `config/appConfig.ts`. Een ontbrekende of ongeldige waarde laat elke request falen; geen stille standaardwaarde. Alleen een waarde die nergens verplicht is (`LOG_LEVEL`) krijgt `Config.withDefault`.
- Secrets altijd als `Config.Redacted`. Nooit `process.env`.
- Zie `docs/patterns/effect-services.md` (Config) en `docs/architecture/security.md`.

## Lokaal draaien

- `bun run --cwd apps/api dev` start de API met `wrangler dev` op `http://localhost:8787`. Eerst `docker compose up -d` en `.dev.vars` (kopie van `.dev.vars.example`).
- `bun run --cwd apps/api types` genereert `src/workerConfiguration.d.ts` (het type `Env`) opnieuw uit `wrangler.jsonc` en `.dev.vars.example`. Draai het na elke wijziging aan bindings of variabelen. Nooit een eigen `Env`-interface schrijven.
- Een nieuwe variabele of secret komt in `.dev.vars.example` (zonder echte waarde) en wordt gelezen in `config/appConfig.ts`.

## Database en migraties

- Lokale config staat in `.dev.vars` (kopie van `.dev.vars.example`). `DATABASE_URL` daarin is alleen voor `drizzle-kit`; de Worker praat via Hyperdrive.
- `db:generate`, `db:migrate` en `db:studio` draaien `drizzle-kit` met `drizzle.config.ts`. Tabellen: `src/**/*Table.ts`; migraties: `src/db/migrations/`. Zie `docs/patterns/drizzle.md` (Migraties).
- Nooit migraties in de Worker draaien.

## Tests

Tests staan naast de code. Services testen met `.memory`-adapters via `testing/testLayer.ts` _(komt in BOO-118)_. Soorten tests en bestandsnamen: `docs/architecture/testing.md`. Gebruik nooit `bun test`.
