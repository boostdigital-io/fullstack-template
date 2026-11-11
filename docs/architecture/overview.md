# Architectuur: overzicht

Twee apps en twee gedeelde packages. Een package bestaat alleen om code te delen tussen apps; lagen scheid je binnen een app met mappen en lint-regels ([ADR 0007](../decisions/0007-packages-for-sharing.md)).

> De template is in opbouw. Wat nog niet gebouwd is, staat hier als regel. Bestanden die nog niet bestaan, zijn gemarkeerd met _(komt in BOO-…)_.

## Apps en packages

| Workspace                              | Wat                                                              | Mag importeren                                                            | Draait op          |
| -------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------ |
| `apps/api` (`@repo/api`)               | De API: HttpApi, services, adapters, Better Auth                 | `@repo/domain`, `@repo/contract`                                          | Cloudflare Worker  |
| `apps/web` (`@repo/web`)               | De web-app: TanStack Start                                       | van de workspaces alleen `@repo/contract`; libraries zoals `effect` mogen | Cloudflare Worker  |
| `packages/contract` (`@repo/contract`) | De HttpApi-definitie: endpoints, schema's, fouten met statuscode | `@repo/domain`                                                            | wordt geïmporteerd |
| `packages/domain` (`@repo/domain`)     | Entities, value objects, domeinfouten, domeinregels              | niets (alleen `effect`)                                                   | wordt geïmporteerd |
| Mobile (later)                         | Expo-app                                                         | alleen `@repo/contract`                                                   | telefoon           |

Pijlen van wie importeert wat:

```
apps/web ──────────────┐
(mobile, later) ───────┤
                       ▼
apps/api ──────► packages/contract ──────► packages/domain
    │                                            ▲
    └────────────────────────────────────────────┘
```

Web en mobile kunnen dus nooit bij services of de database.

## Importregels

Drie regels, elk met een eigen handhaving:

1. **Een workspace importeert alleen wat in zijn eigen `package.json` staat.** Isolated installs dwingen dat af (`linker = "isolated"` in `bunfig.toml`, [ADR 0001](../decisions/0001-bun-workspaces.md)). Een import van `@repo/domain` in `apps/web` vindt de module niet. Interne afhankelijkheden staan als `"@repo/domain": "workspace:*"`.
2. **`src/` importeert niets uit `example/`**, niet relatief en niet via `@repo/*/example/*`. Biome (`noRestrictedImports` in `biome.json`) geeft dan de fout "src/ importeert niets uit example/".
3. **Services hangen alleen af van ports.** Bestanden in `services/**`, onder `src/` en onder `example/`, importeren geen `drizzle-orm`, `better-auth`, `cloudflare:workers`, `*.drizzle` of `*.memory`. Tests (`*.test.ts`) zijn uitgezonderd. Biome geeft dan de fout "Services hangen alleen af van ports". Een service die een database of een adapter nodig heeft, vraagt de port op; welke adapter erachter zit, bepaalt de composition root.

`domain` en `contract` hebben drie exports, zonder build-stap en wijzend naar `.ts`-bronbestanden:

| Export          | Wijst naar                        | Voorbeeld                                      |
| --------------- | --------------------------------- | ---------------------------------------------- |
| `"."`           | `src/index.ts`                    | `@repo/contract`                               |
| `"./*"`         | `src/*/index.ts`, één per feature | `@repo/domain/invoices`, `@repo/domain/shared` |
| `"./example/*"` | `example/*/index.ts`              | `@repo/domain/example/todos`                   |

Imports zijn zonder bestandsextensie (`./todo`, niet `./todo.ts`).

## Lagen in `apps/api`

Van buiten naar binnen:

1. **Handler** (`todosHandlers.ts`) ontvangt input die het contract al heeft gevalideerd, en roept één service aan.
2. **Service** (`services/createTodo.ts`) is één handeling van een gebruiker. Hij vraagt ports op, zoals `TodoRepository` en `CurrentUser`, en controleert domeinregels.
3. **Port** (`repositories/todoRepository.ts`) is een Effect service die beschrijft wat de service nodig heeft, zonder implementatie.
4. **Adapter** (`repositories/todoRepository.drizzle.ts`) implementeert de port als Layer. Voor tests is er een `.memory`-adapter.
5. **Composition root** (`src/layers.ts`) koppelt elke port aan een adapter. Het is de enige plek die dat doet. Adapters zonder I/O-object (zoals `IdGenerator`) worden één keer gebouwd, in `AppServices`; `Database` en de adapters die erop bouwen per request, in `RequestServices`. `CurrentUser` is de uitzondering: die levert `authenticationMiddleware` per request. Zie [effect-http-api.md](../patterns/effect-http-api.md#de-httpapi-als-handler-op-workers).

Fouten lopen ongewijzigd terug: het contract koppelt domeinfouten aan statuscodes (`TodoNotFound` → 404) en de handler vertaalt niets. Zie [errors.md](errors.md).

De begrippen service, Effect service, port en adapter hebben elk precies één betekenis. Zie [conventions.md](conventions.md#begrippen).

## Eén request van begin tot eind

Een gebruiker maakt een todo aan:

1. `TodoForm` (web) valideert in de browser met de Schema's uit het contract ([tanstack-form.md](../patterns/tanstack-form.md)).
2. `mutations.ts` roept via TanStack Query de `apiClient` aan ([tanstack-query.md](../patterns/tanstack-query.md)).
3. `apiClient` gaat op de server van de web-app via de service binding naar de API, in de browser via de URL van de API.
4. `authenticationMiddleware` zet de sessie om in `CurrentUser`, of geeft `Unauthorized` (401).
5. `todosHandlers` krijgt gevalideerde input en roept `createTodo` aan.
6. `createTodo` vraagt `TodoRepository` op.
7. `TodoRepositoryDrizzle` schrijft via Drizzle en Hyperdrive naar Postgres.

Geen van deze bestanden bestaat al. Het voorbeeld wordt opgebouwd in BOO-121 (domain), BOO-122 (contract), BOO-123 (API) en BOO-132 (web); de middleware komt in BOO-125, de `apiClient` in BOO-128.

## Platform

- Web en API draaien elk als eigen Worker, in productie en lokaal in workerd ([ADR 0002](../decisions/0002-cloudflare-workers.md)). Bun draait alleen tooling en scripts.
- Geen `Bun.*`-API's in code die op Workers draait.
- Web praat met de API via een service binding; de browser en Expo via de URL van de API ([ADR 0018](../decisions/0018-api-subdomain.md)).
- Postgres via Hyperdrive, met postgres.js. De database-Layer wordt per request opgebouwd in `RequestServices` (zie [drizzle.md](../patterns/drizzle.md)), nooit globaal: een I/O-object mag op Workers niet over requests heen leven.
- Config komt uit het `env`-object van de Worker en wordt gelezen met Effect `Config`. `env` en `ctx` komen per request binnen als `WorkerEnv` en `WorkerContext` (zie [effect-http-api.md](../patterns/effect-http-api.md#env-en-ctx-per-request)).
- Migraties draaien met `drizzle-kit` via Bun, lokaal of in CI, nooit in de Worker (zie [drizzle.md](../patterns/drizzle.md#migraties)).

## `example/`: de referentie-feature

Elke app en elk package heeft naast `src/` een map `example/` met de referentie-feature `todos`, in exact dezelfde structuur als `src/` ([ADR 0027](../decisions/0027-example-folders.md)).

- Een nieuwe feature kopieert de structuur uit `example/` naar `src/` en volgt het patroon exact. Afwijken alleen als het issue erom vraagt.
- `example/` zit in de `include` van elke tsconfig, dus het voorbeeld wordt meegetypecheckt. Zodra Vitest er is, draaien de unit-tests ervan mee _(komt in BOO-120)_.
- Het voorbeeld wordt nooit gebouwd en nooit aangesloten op de app. `src/` importeert er niets uit (importregel 2).
- De map heet bewust `example/` zonder punt: zoektools (ripgrep), TypeScript en Vitest slaan verborgen mappen standaard over.
- `example/` blijft in elk project staan. Het wordt niet opgeruimd.

Nu bevat elke `example/` alleen een `.gitkeep`.
