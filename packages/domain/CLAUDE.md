# packages/domain

Het domein: entities, value objects, domeinfouten en domeinregels. Wordt geïmporteerd door `packages/contract` en `apps/api`, nooit door web. Nu staat alleen `src/index.ts` er. Bestandsnamen zoals `todo.ts` en `todoErrors.ts` zijn voorbeelden uit de referentie-feature `todos`, die in `example/todos/` komt _(BOO-121)_.

## Wat erin hoort

- **Entities** als `Schema.Class`, met value objects als velden (`todo.ts`: `Todo`, `TodoId`, `TodoTitle`).
- **Value objects** als gebrand schema met hun regels als checks, zoals een maximale lengte.
- **Domeinfouten** als `Schema.TaggedError` in `todoErrors.ts`, met alleen veilige velden zoals een ID: ze gaan naar de client.
- **Domeinregels** als pure functies in `todoRules.ts`, zoals `isOwner`.
- Gedeelde value objects in `src/shared/`, zoals `userId.ts` _(komt in BOO-118)_.

Patroon: `docs/patterns/effect-schema.md`. Namen: `docs/architecture/conventions.md` (Naamgeving).

## Wat er niet in hoort

- Geen imports van andere workspaces. Alleen `effect`.
- Geen HTTP: geen statuscodes, ook niet als `httpApiStatus`-annotatie. Die staan in het contract ([ADR 0014](../../docs/decisions/0014-domain-errors-in-contract.md)).
- Geen teksten voor gebruikers in fouten; de web-app kiest de woorden.
- Geen I/O, geen Effect services, geen database- of auth-code.
- Geen Zod of andere validatie naast Effect Schema.

## Exports

Elke feature heeft een `index.ts`, bereikbaar als `@repo/domain/<feature>` (bijvoorbeeld `@repo/domain/shared`). Het voorbeeld is `@repo/domain/example/todos`. Imports zonder bestandsextensie. Zie `docs/architecture/overview.md` (Importregels).

## Tests

Value objects op hun grenzen (`TodoTitle` met 0, 1, 120 en 121 tekens) en regels met een paar voorbeelden. Zie `docs/architecture/testing.md`.
