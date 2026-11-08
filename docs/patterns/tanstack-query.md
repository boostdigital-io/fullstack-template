# Patroon: TanStack Query

> Gebaseerd op `@tanstack/react-query@5.105.1` (geïnstalleerde package; niet gevendord, zie [ADR 0012](../decisions/0012-vendored-repos.md)).

Server-data in `apps/web`: ophalen, cachen en na een wijziging verversen. Alle calls gaan via `lib/apiClient.ts` _(komt in BOO-128)_; Query weet niets van HTTP. Hoe routes de data laden: [tanstack-router.md](tanstack-router.md#route-met-loader-en-notfound).

## Hoe het hoort

### Queries: `queryOptions` per feature

Queries staan in `features/todos/queries.ts`, als functies die `queryOptions` teruggeven. Loader en component gebruiken dezelfde functie, dus dezelfde key en hetzelfde type.

```ts
// features/todos/queries.ts
import { queryOptions } from "@tanstack/react-query";

export const todoKeys = {
  all: ["todos"] as const,
  detail: (id: TodoId) => ["todos", id] as const,
};

export const todoQueryOptions = (id: TodoId) =>
  queryOptions<Todo, GetTodoError>({
    queryKey: todoKeys.detail(id),
    queryFn: () => apiClient.getTodo(id),
  });
```

- **Keys** komen uit één `todoKeys`-object per feature. Elke key begint met `todoKeys.all`, zodat je met één `invalidateQueries` alles van de feature ververst.
- **Fouttype**: zonder tweede typeparameter is de fout `Error`. Met `queryOptions<Todo, GetTodoError>` is `query.error` getypeerd, zodat je op `_tag` kunt matchen. Query controleert dat niet: het klopt alleen als `apiClient` precies die fouten gooit. Dat garandeert `lib/apiClient.ts` _(BOO-128)_.

### In het component

Na een loader met `ensureQueryData` staat de data al in de cache. Gebruik dan `useSuspenseQuery`: `data` is nooit `undefined`.

```tsx
const { data: todo } = useSuspenseQuery(todoQueryOptions(todoId));
```

`useQuery` alleen voor data die de route niet vooraf laadt; dan moet je zelf `isPending` en `error` afhandelen.

### Mutaties

Mutaties staan in `features/todos/mutations.ts`, als hook. Na succes ververs je de queries van de feature.

```ts
// features/todos/mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.createTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todoKeys.all }),
  });
};
```

- `mutationFn` neemt het gedecodeerde payload uit het contract (met value objects). Het formulier decodeert vóór het de mutatie aanroept ([tanstack-form.md](tanstack-form.md)).
- `invalidateQueries` met `todoKeys.all` ververst lijst en details in één keer.
- Een verwachte fout (zoals `TodoTitleTaken`) toon je bij het formulier, met de melding voor die `_tag` uit `messages.ts` ([ADR 0015](../decisions/0015-translatable-messages.md)). Een onverwachte fout gaat naar de algemene melding.

### De `QueryClient`

Eén `QueryClient` per router, aangemaakt in `getRouter()` en via de router-context doorgegeven aan loaders (zie [tanstack-router.md](tanstack-router.md#root-route-met-context)). Componenten krijgen hem via `QueryClientProvider` en `useQueryClient`.

## Wat je niet doet

- Geen `fetch` of `apiClient`-call in een component; altijd via een query of mutatie uit `features/`.
- Geen query keys als losse arrays in componenten; altijd via `todoKeys`.
- Geen `useQuery` gevolgd door `if (!data)` als de loader de data al laadt; gebruik `useSuspenseQuery`.
- Geen server-data kopiëren naar `useState`; de cache is de bron.
- Geen `setQueryData` om een lijst met de hand bij te werken na een mutatie; ververs met `invalidateQueries`, tenzij een issue om optimistic updates vraagt.
- Geen `Register.defaultError` voor de hele app: fouten verschillen per endpoint, dus geef het fouttype per query mee.

## Open voor BOO-128

- **Server-rendering.** Het Start-voorbeeld gebruikt `setupRouterSsrQueryIntegration` uit `@tanstack/react-router-ssr-query`, zodat de cache van de server naar de browser gaat. Die package is niet geïnstalleerd. Of en hoe we hem gebruiken, wordt daar beslist.
- **De brug vanuit Effect.** Hoe `apiClient` een Effect-call omzet naar een Promise die de getypeerde fout gooit.

## Meer

In de geïnstalleerde packages (vanuit `apps/web`):

- `node_modules/@tanstack/react-query/src/queryOptions.ts`: `queryOptions` en zijn typeparameters.
- `node_modules/@tanstack/react-query/src/useSuspenseQuery.ts` en `useMutation.ts`.
- `node_modules/.bun/@tanstack+query-core@5.105.1/node_modules/@tanstack/query-core/src/types.ts` (vanuit de repo-root): `Register` en `DefaultError`.

In `repos/tanstack-router`:

- `examples/react/start-basic-react-query/src/`: `router.tsx`, `utils/posts.tsx` en `routes/posts.$postId.tsx`.
- `docs/start/framework/react/guide/tanstack-query.md`.
