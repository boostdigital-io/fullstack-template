# Teststrategie

Vitest is de enige test-runner, met `@effect/vitest` voor Effect-code en Cloudflare's Workers-integratie voor API-tests ([ADR 0016](../decisions/0016-vitest.md)). De meeste tests zitten bij de services; Playwright dekt alleen de kritieke flows ([ADR 0017](../decisions/0017-test-pyramid.md)).

> De template is in opbouw. Vitest en de test-scripts komen in BOO-120, Playwright in BOO-133. Tot dan bestaan er geen tests en geen `test`-scripts. Gebruik nooit `bun test`: dat is een andere runner, die dezelfde `*.test.ts`-bestanden vindt.

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
- **Adapters**: draaien buiten workerd. De adapter krijgt in de test een `Database` met een directe verbinding; je test de query en de mapper, niet Hyperdrive.
- **API**: per feature de bedrading: zonder sessie 401, ongeldige input 400, onbekende ID 404, en één keer het succes-pad. De logica is al getest in de services.
- **Web**: geen component-tests. Complexe logica in een component hoort in een losse functie, met een unit-test. Playwright dekt registreren, inloggen, uitloggen en de doorverwijzing vanaf een beschermde route; elk project voegt flows toe voor zijn eigen kritieke features. Het voorbeeld in `example/` is niet aangesloten en heeft dus geen end-to-end-tests.
- **Niet testen**: internals van Drizzle, Better Auth of shadcn; routes die alleen een feature tonen; het contract los (dat dekken de API-tests).
- **Nog te verifiëren**: hoe de Hyperdrive-binding zich lokaal gedraagt in de Workers-test-runtime. Lukt dat niet soepel, dan draaien API-tests tegen `.memory`-adapters. De uitkomst komt hier te staan _(komt in BOO-120)_.

## Bestanden en commando's

De gedeelde test-opzet staat in `apps/api/src/testing/testLayer.ts`: alle `.memory`-adapters plus een vaste gebruiker en voorspelbare ID's _(komt in BOO-118)_.

| Bestand                 | Soort                 | Commando                   | Draait in      |
| ----------------------- | --------------------- | -------------------------- | -------------- |
| `*.test.ts`             | unit                  | `bun run test`             | pre-push en CI |
| `*.integration.test.ts` | integratie (Postgres) | `bun run test:integration` | CI             |
| `*.api.test.ts`         | API (workerd)         | `bun run test:api`         | CI             |
| `apps/web/e2e/*.e2e.ts` | end-to-end            | `bun run test:e2e`         | CI             |

`test`, `test:integration` en `test:api` komen in BOO-120, `test:e2e` in BOO-133. De CI-jobs voor integratie-, API- en end-to-end-tests komen in BOO-134.

Wat nu draait:

| Waar            | Wat                                                               |
| --------------- | ----------------------------------------------------------------- |
| `bun run check` | `lint` (Biome) en `typecheck`. Unit-tests komen erbij in BOO-120. |
| pre-commit      | `biome check --staged`                                            |
| pre-push        | `bun run typecheck`. Unit-tests komen erbij in BOO-120.           |
| CI-job `check`  | `bun install --frozen-lockfile`, `biome ci`, `bun run typecheck`  |
