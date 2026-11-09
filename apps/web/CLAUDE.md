# apps/web

De web-app: TanStack Start, als Cloudflare Worker. Nu staat alleen `src/index.ts` er; de rest hieronder zijn de regels waar nieuwe code aan voldoet. Routes komen in BOO-126; bestandsnamen zoals `features/todos/` en `queries.ts` zijn voorbeelden uit de referentie-feature `todos`, die in `example/` komt _(BOO-132)_.

## Imports

Van de workspaces importeert web alleen `@repo/contract`, nooit `@repo/domain` of `@repo/api`. Isolated installs dwingen dat af. Libraries zoals `effect` mogen. Zie `docs/architecture/overview.md` (Apps en packages).

## Structuur

- **Routes** in `src/routes/` zijn dun: data laden in de loader en een feature tonen. Geen logica en geen API-calls in een routecomponent.
- **Features** in `features/todos/`: componenten, `queries.ts`, `mutations.ts` en `messages.ts`. Daar zit de logica.
- **Alle API-calls** gaan via `lib/apiClient.ts`, de enige brug van de Effect-client naar TanStack Query _(komt in BOO-128)_. Nooit zelf `fetch` naar de API.
- `routeTree.gen.ts` wordt gegenereerd; niet met de hand aanpassen.
- Routebestanden gebruiken de TanStack-syntax (`__root.tsx`, `_protected/`, `$todoId.tsx`); wat erna komt is camelCase. Componenten zijn PascalCase (`TodoList.tsx`).

Patronen: `docs/patterns/tanstack-router.md`, `docs/patterns/tanstack-query.md`, `docs/patterns/tanstack-form.md`.

## Fouten en meldingen

- De server stuurt data, de web-app kiest de woorden ([ADR 0015](../../docs/decisions/0015-translatable-messages.md)). Meldingen staan per feature in `messages.ts`, per taal en per `_tag`; algemene meldingen in `lib/messages.ts` _(komt in BOO-128)_.
- In een loader wordt `TodoNotFound` een `notFound()`. Onverwachte fouten komen in de `errorComponent`.
- Formulieren valideren met de schema's uit het contract; de server valideert opnieuw.
- Uitleg: `docs/architecture/errors.md` (In de web-app).

## Geen secrets

De web-app heeft geen secrets; die zitten allemaal in de API-Worker. Zie `docs/architecture/security.md`.

## Tests

Geen component-tests. Complexe logica in een component hoort in een losse functie met een unit-test; Playwright dekt de kritieke flows _(komt in BOO-133)_. Zie `docs/architecture/testing.md`.
