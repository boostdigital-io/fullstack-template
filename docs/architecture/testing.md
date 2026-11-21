# Teststrategie

Vitest is de enige test-runner, met `@effect/vitest` voor Effect-code ([ADR 0016](../decisions/0016-vitest.md)). API-tests starten de echte Worker in workerd met `unstable_startWorker` uit wrangler ([ADR 0032](../decisions/0032-api-tests-via-wrangler.md)). De meeste tests zitten bij de services; Playwright dekt alleen de kritieke flows ([ADR 0017](../decisions/0017-test-pyramid.md)).

> Playwright komt in BOO-133. Gebruik nooit `bun test`: dat is een andere runner, die dezelfde `*.test.ts`-bestanden vindt. Een preload in `bunfig.toml` stopt hem met een melding.

## Welke test waar

| Laag     | Soort test                     | Waartegen                                    | Hoeveel                                            |
| -------- | ------------------------------ | -------------------------------------------- | -------------------------------------------------- |
| Domein   | unit                           | puur, zonder dependencies                    | elke regel en elk value object met een eigen regel |
| Services | unit (`it.effect`, `it.layer`) | `.memory`-adapters, vaste gebruiker en ID's  | het grootste deel van de tests                     |
| Adapters | integratie                     | echte Postgres in Docker, directe verbinding | elke query en mapper                               |
| API      | API-test                       | de echte Worker in workerd                   | een handvol per feature                            |
| Web      | end-to-end (Playwright)        | de volledige lokale stack                    | alleen kritieke flows                              |

De voorbeelden in `example/` worden meegetypecheckt en hun unit-tests draaien mee. De voorbeeldtabel bestaat alleen in de testdatabase.

## Regels

- **Domein**: value objects op hun grenzen testen (`TodoTitle` met 0, 1, 120 en 121 tekens); regels met een paar voorbeelden.
- **Services**: elke service heeft een test voor het succes-pad, plus één test per fout in zijn signatuur. Tijdsafhankelijke logica via de TestClock.
- **Adapters**: draaien buiten workerd. De adapter krijgt in de test een `Database` met een directe verbinding (`TestDatabase`); je test de query en de mapper, niet Hyperdrive.
- **API**: per feature de bedrading: zonder sessie 401, ongeldige input 400, onbekende ID 404, en één keer het succes-pad. De logica is al getest in de services.
- **Web**: geen component-tests. Complexe logica in een component hoort in een losse functie, met een unit-test. Playwright dekt registreren, inloggen, uitloggen en de doorverwijzing vanaf een beschermde route; elk project voegt flows toe voor zijn eigen kritieke features. Het voorbeeld in `example/` is niet aangesloten en heeft dus geen end-to-end-tests.
- **Niet testen**: internals van Drizzle, Better Auth of shadcn; routes die alleen een feature tonen; het contract los (dat dekken de API-tests).

## De testdatabase

Integratie- en API-tests draaien tegen een eigen database in de Docker-Postgres, naast de dev-database. De URL staat als `TEST_DATABASE_URL` in `apps/api/.dev.vars` (zie `.dev.vars.example`); in CI zet de workflow hem _(komt in BOO-134)_.

- **Aanmaken en migreren**: `apps/api/src/testing/globalSetup.ts` draait voor de projects `integration` en `api`. Hij maakt de database aan als hij ontbreekt en voert de migraties uit `src/db/migrations/` uit met de migrator van Drizzle.
- **Nooit de dev-database**: de setup en `TestDatabase` weigeren een URL waarvan de databasenaam niet op `_test` eindigt. Ontbreekt `TEST_DATABASE_URL`, dan faalt de setup en draait er geen enkele test.
- **Schoon achterlaten**: `TestDatabase` (`src/testing/testDatabase.ts`) levert `Database` met één verbinding (`max: 1`), opent een transactie en draait die terug als de Layer wordt vrijgegeven. Geef hem per test mee met `Effect.provide(TestDatabase)`, niet gedeeld via `it.layer`; dan maakt de volgorde niet uit.
- **Beperking**: een adapter die zelf `db.transaction` gebruikt, opent binnen de testtransactie een tweede `BEGIN`. Zijn `COMMIT` sluit dan de testtransactie af, en de data blijft staan. Zo'n adapter vraagt om een andere aanpak (bijvoorbeeld `TRUNCATE` na de test); die kiezen we als het eerste geval zich voordoet.

## Hyperdrive in API-tests

Geverifieerd in BOO-120: de Worker in `unstable_startWorker` krijgt een werkende Hyperdrive-binding. Wrangler start lokaal een proxy (`<id>.hyperdrive.local`) naar de database uit `localConnectionString`. API-tests draaien dus met de echte `Database.layer`, zonder `.memory`-adapters.

`localConnectionString` in `wrangler.jsonc` wijst naar de dev-database. Het project `api` in `vitest.config.ts` zet daarom `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` op `TEST_DATABASE_URL`. Dat is de officiële override van wrangler, en die wint van `localConnectionString`. Is de variabele leeg, dan valt wrangler terug op de dev-database; de globalSetup voorkomt dat door te falen zonder `TEST_DATABASE_URL`.

## Bestanden en commando's

De gedeelde test-opzet staat in `apps/api/src/testing/`: `testDatabase.ts` en `globalSetup.ts` voor de testdatabase, en `testLayer.ts` met alle `.memory`-adapters plus een vaste gebruiker en voorspelbare ID's _(komt in BOO-118)_.

De projects staan in `vitest.config.ts` in de root. Importeer `describe`, `it` en `expect` expliciet uit `vitest`, of uit `@effect/vitest` in Effect-code; er zijn geen globals.

| Bestand                 | Soort                 | Commando                   | Draait in      |
| ----------------------- | --------------------- | -------------------------- | -------------- |
| `*.test.ts`             | unit                  | `bun run test`             | pre-push en CI |
| `*.integration.test.ts` | integratie (Postgres) | `bun run test:integration` | CI             |
| `*.api.test.ts`         | API (workerd)         | `bun run test:api`         | CI             |
| `apps/web/e2e/*.e2e.ts` | end-to-end            | `bun run test:e2e`         | CI             |

`test:e2e` komt in BOO-133. De CI-jobs voor integratie-, API- en end-to-end-tests komen in BOO-134; tot dan draai je `test:integration` en `test:api` lokaal, met Docker aan.

Wat nu draait:

| Waar            | Wat                                                                              |
| --------------- | -------------------------------------------------------------------------------- |
| `bun run check` | `lint` (Biome), `typecheck` en `test` (unit)                                     |
| pre-commit      | `biome check --staged`                                                           |
| pre-push        | `bun run typecheck` en `bun run test`                                            |
| CI-job `check`  | `bun install --frozen-lockfile`, `biome ci`, `bun run typecheck`, `bun run test` |
