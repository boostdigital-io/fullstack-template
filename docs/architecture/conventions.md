# Conventies

Mappenstructuur, naamgeving, overige afspraken en de begrippen die we gebruiken. Code is camelCase, documentatie is kebab-case ([ADR 0010](../decisions/0010-naming.md)).

> De template is in opbouw. De structuur hieronder is het doel; bestanden die nog niet bestaan, zijn gemarkeerd met _(komt in BOO-…)_.

## Mappenstructuur

Per workspace de mappen en de bestanden die een rol hebben. `example/` volgt dezelfde structuur als `src/` (zie [overview.md](overview.md#example-de-referentie-feature)).

```
apps/api/
├── src/
│   ├── auth/            auth.ts, authTable.ts (gegenereerd), authenticationMiddleware.ts   (BOO-124, BOO-125)
│   ├── db/              database.ts (Drizzle via Hyperdrive, per request), migrations/      (BOO-116, BOO-117)
│   ├── shared/          gedeelde ports: idGenerator.ts, emailSender.ts                      (BOO-118)
│   ├── config/          appConfig.ts                                                       (BOO-117)
│   ├── testing/         testLayer.ts: .memory-adapters, vaste gebruiker en ID's            (BOO-118)
│   ├── layers.ts        composition root: ApiLayer, met AppServices en RequestServices      (BOO-117)
│   └── index.ts         Worker-entry: alleen toWebHandler en fetch
└── example/todos/       services/, repositories/, todoTable.ts, todosHandlers.ts           (BOO-123)

apps/web/
├── src/
│   ├── routes/          __root.tsx, index.tsx, _public/ (login, register), _protected/     (BOO-126, BOO-129)
│   ├── lib/             apiClient.ts, authClient.ts, messages.ts                           (BOO-128, BOO-129)
│   ├── components/ui/   shadcn, gegenereerd                                                (BOO-127)
│   └── styles/                                                                             (BOO-127)
├── example/
│   ├── routes/_protected/todos/   index.tsx, $todoId.tsx                                   (BOO-132)
│   └── features/todos/            components/, queries.ts, mutations.ts, messages.ts       (BOO-132)
└── e2e/                 auth.e2e.ts                                                        (BOO-133)

packages/domain/
├── src/shared/          userId.ts                                                          (BOO-118)
└── example/todos/       todo.ts, todoErrors.ts, todoRules.ts, index.ts                     (BOO-121)

packages/contract/
├── src/                 api.ts (HttpApi), index.ts                                         (BOO-117)
│   └── shared/          currentUser.ts, authentication.ts, authErrors.ts                   (BOO-125)
└── example/todos/       todosGroup.ts, index.ts                                            (BOO-122)
```

In de root: `docs/`, `repos/` (vendored, alleen-lezen, [ADR 0012](../decisions/0012-vendored-repos.md)), `scripts/`, `.github/`, `.husky/`, `.zed/`, `biome.json`, `bunfig.toml`, `tsconfig.base.json`.

## Naamgeving

**De regel voor code**: de bestandsnaam is in camelCase wat het bestand bevat. Een punt staat alleen voor een variant of een test, nooit voor een rol. Een map geeft de rol aan.

Biome dwingt dit af met `useFilenamingConvention` (camelCase, PascalCase of de naam van de export). Uitgezonderd: vaste bestandsnamen (`README.md`, `CLAUDE.md`, `package.json`), gegenereerde code in `components/ui/`, en de routesyntax van TanStack.

| Soort                           | Bestand                                      | Export                                       |
| ------------------------------- | -------------------------------------------- | -------------------------------------------- |
| Entity + value objects          | `todo.ts`                                    | `Todo`, `TodoId`, `TodoTitle`                |
| Domeinfouten                    | `todoErrors.ts`                              | `TodoNotFound`, `TodoTitleTaken`             |
| Domeinregels                    | `todoRules.ts`                               | pure functies, bijv. `isOwner`               |
| Service                         | `services/createTodo.ts`                     | `createTodo`                                 |
| Port                            | `repositories/todoRepository.ts`             | `TodoRepository`                             |
| Adapter                         | `repositories/todoRepository.drizzle.ts`     | `TodoRepositoryDrizzle`                      |
| Adapter voor tests              | `repositories/todoRepository.memory.ts`      | `TodoRepositoryMemory`                       |
| Databasetabel                   | `todoTable.ts`                               | Drizzle-tabel                                |
| Endpoints (contract)            | `todosGroup.ts`                              | HttpApi-groep, met domeinfouten + statuscode |
| Niet-domeinfouten (contract)    | `shared/authErrors.ts`                       | `Unauthorized`                               |
| Handlers                        | `todosHandlers.ts`                           | handlers voor de groep                       |
| Middleware-definitie (contract) | `shared/authentication.ts`                   | `Authentication`, levert `CurrentUser`       |
| Middleware-implementatie        | `authenticationMiddleware.ts`                | `AuthenticationMiddleware`                   |
| Gebruikersmeldingen (web)       | `features/todos/messages.ts`                 | `todoMessages`                               |
| Gedeelde test-opzet             | `testing/testLayer.ts`                       | `TestLayer`                                  |
| Unit-test                       | `createTodo.test.ts`                         |                                              |
| Integratietest                  | `todoRepository.drizzle.integration.test.ts` |                                              |
| API-test                        | `todosHandlers.api.test.ts`                  |                                              |
| End-to-end-test                 | `e2e/todos.e2e.ts`                           |                                              |
| React-component                 | `TodoList.tsx` (PascalCase)                  | `TodoList`                                   |
| Overige web-code                | `queries.ts`, `apiClient.ts`                 |                                              |

Bestandsnaam en exportnaam verschillen: in een bestandsnaam markeert een punt de variant (`todoRepository.drizzle.ts`); een exportnaam kan geen punt bevatten en plakt de variant erachter (`TodoRepositoryDrizzle`).

TanStack-routes gebruiken hun eigen syntax (`__root.tsx`, `_protected/`, `$todoId.tsx`); wat erna komt is camelCase.

Docs zijn kebab-case. ADR's zijn genummerd: `0001-bun-workspaces.md`.

## Overige afspraken

- Een nieuwe feature krijgt in `src/` dezelfde mapnaam in elke app en elk package (`todos` in `apps/api`, `apps/web`, `domain` en `contract`).
- Packages heten `@repo/domain` en `@repo/contract`. De scope `@repo/` blijft in elk project gelijk ([ADR 0028](../decisions/0028-repo-scope.md)).
- Eén service per bestand. Services zijn functies (`Effect.fn`), geen Effect services ([ADR 0008](../decisions/0008-services-as-functions.md)).
- Tests staan naast de code.
- Routes zijn dun: data laden en een feature tonen. Logica zit in `features/`.
- Alle API-calls in web gaan via `lib/apiClient.ts`.
- Validatie alleen met Effect Schema, nooit Zod ([ADR 0011](../decisions/0011-effect-schema-only.md)).
- Versies zijn exact vastgepind, zonder `^` (`exact = true` in `bunfig.toml`). Geen nieuwe dependency zonder eerst te vragen.
- Geen commentaar dat herhaalt wat de code doet; wel commentaar dat uitlegt waarom.
- Geen `any`, geen `as` om een typefout weg te werken, geen `@ts-ignore` of `@ts-expect-error`. Botst een library-type met een strikte optie, dan beslissen we per geval en leggen het vast.
- Geen `try/catch` of `Promise` in Effect-code.
- Geen abstracties of helpers die het issue niet vraagt.
- Bij twijfel over een library: kijk in `repos/`, niet op het web. Patroonbestanden per library staan in `docs/patterns/`: nu voor Effect (`effect-schema.md`, `effect-services.md`, `effect-http-api.md`), Drizzle (`drizzle.md`) en Better Auth (`better-auth.md`); TanStack _(komt in BOO-146)_.

### Commits en branches

- Conventional Commits: `type(scope)!: onderwerp`, met scope en `!` optioneel. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. De eerste regel is maximaal 100 tekens. `scripts/commitMsg.ts` controleert dit in de commit-msg-hook ([ADR 0022](../decisions/0022-conventional-commits.md)).
- De issue-ID staat als footer, niet in de eerste regel: `Refs: BOO-123`.
- Eén Linear-issue is één branch, met de naam die Linear voorstelt (`guus/boo-123-…`).
- Nooit naar `main` pushen, nooit zelf mergen. `main` accepteert alleen merge-commits via een PR met groene CI ([ADR 0023](../decisions/0023-ci-as-gate.md)).

## Begrippen

Elk begrip heeft precies één betekenis, in code, docs, issues en gesprekken. Bedoelen we het Effect-mechanisme (`Context` + `Layer`), dan zeggen we altijd voluit **Effect service**; een kale "service" is altijd een bestand in `services/`.

| Begrip                    | Betekenis                                                                           | Voorbeeld                                                     |
| ------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Service                   | Eén handeling van een gebruiker: een functie in `services/` die ports opvraagt      | `createTodo`                                                  |
| Effect service            | Het Effect-mechanisme: gedefinieerd via `Context`, geleverd via een `Layer`         | `TodoRepository`, `Database`                                  |
| Port                      | Effect service die een service opvraagt                                             | `TodoRepository`, `CurrentUser`, `IdGenerator`, `EmailSender` |
| Adapter                   | Layer die een port implementeert                                                    | `TodoRepositoryDrizzle`, `TodoRepositoryMemory`               |
| Infrastructuur-dependency | Effect service die alleen adapters gebruiken                                        | `Database`                                                    |
| Entity                    | Domeinobject met identiteit                                                         | `Todo`                                                        |
| Value object              | Klein type met eigen regels, gebrand                                                | `TodoId`, `TodoTitle`                                         |
| Domeinfout                | Verwachte fout in domeintermen, zonder HTTP; het contract geeft hem een statuscode  | `TodoNotFound`                                                |
| Defect                    | Onverwachte fout die niet in het type staat: gelogd, als 500 met referentie-ID      | database onbereikbaar                                         |
| Contract                  | De HttpApi-definitie die api, web en mobile delen                                   | `@repo/contract`                                              |
| Composition root          | De enige plek die ports aan adapters koppelt (`CurrentUser` komt uit de middleware) | `apps/api/src/layers.ts`                                      |

Projectspecifieke begrippen staan in [docs/project/glossary.md](../project/glossary.md).
