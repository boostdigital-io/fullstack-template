# Patroon: TanStack Router en Start

> Gebaseerd op `@tanstack/react-router@1.170.46` en `@tanstack/react-start@1.169.4` (`repos/tanstack-router`, tag `@tanstack/react-start@1.169.4`).

Routes in `apps/web`. Routes zijn dun: ze laden data en tonen een feature; logica zit in `features/` (zie [conventions.md](../architecture/conventions.md#overige-afspraken)). Data laden gaat via TanStack Query ([tanstack-query.md](tanstack-query.md)).

## Hoe het hoort

### Routesyntax

Routes zijn bestanden in `src/routes/`. De bestandsnaam bepaalt het pad.

| Bestand        | Betekenis                                                 |
| -------------- | --------------------------------------------------------- |
| `__root.tsx`   | De root-route; staat in de root van `routes/`             |
| `index.tsx`    | Het pad van de map zelf (`todos/index.tsx` → `/todos`)    |
| `$todoId.tsx`  | Een parameter (`todos/$todoId.tsx` → `/todos/$todoId`)    |
| `_protected/`  | Pathless layout: groepeert routes, komt niet in de URL    |
| `route.tsx`    | Het routebestand van een map (`_protected/route.tsx`)     |
| `-components/` | Map met `-` ervoor: geen route, voor bestanden bij routes |

`routeTree.gen.ts` wordt gegenereerd door de Start-plugin in Vite. Niet met de hand aanpassen. Na de bestandsnaam volgt de gewone naamregel: camelCase (zie [conventions.md](../architecture/conventions.md#naamgeving)).

### Root-route met context

De root-route geeft de `QueryClient` als context door aan alle loaders, en vangt fouten en not-found af voor routes die dat zelf niet doen.

```tsx
// src/routes/__root.tsx
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => <Outlet />,
  notFoundComponent: () => <p>Deze pagina bestaat niet.</p>,
  errorComponent: ({ reset }) => (
    <div>
      <p>Er ging iets mis.</p>
      <button type="button" onClick={reset}>
        Opnieuw proberen
      </button>
    </div>
  ),
});
```

De router zelf maakt de `QueryClient` aan en registreert zijn type, zodat links en params overal getypeerd zijn:

```tsx
// src/router.tsx
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const queryClient = new QueryClient();
  return createRouter({ routeTree, context: { queryClient } });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
```

### Route met loader en `notFound()`

```tsx
// src/routes/_protected/todos/$todoId.tsx
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/todos/$todoId")({
  params: {
    parse: ({ todoId }) => {
      if (!isTodoId(todoId)) {
        throw notFound();
      }
      return { todoId };
    },
  },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(todoQueryOptions(params.todoId)).catch((error: unknown) => {
      if (isTodoNotFound(error)) {
        throw notFound();
      }
      throw error;
    }),
  notFoundComponent: () => <p>Deze todo bestaat niet (meer).</p>,
  component: TodoPage,
});

function TodoPage() {
  const { todoId } = Route.useParams();
  const { data: todo } = useSuspenseQuery(todoQueryOptions(todoId));
  return <TodoDetail todo={todo} />;
}
```

- **Params**: `params.parse` maakt van de string een `TodoId`. `isTodoId` is `Schema.is(TodoId)`. Een ongeldige waarde is een URL die niet bestaat, dus `notFound()`. Een gewone fout (zoals `TodoId.make`) toont de `errorComponent`.
- **Loader**: laadt via de `QueryClient`, zodat het component dezelfde data uit de cache leest. `TodoNotFound` wordt `notFound()` (zie [errors.md](../architecture/errors.md#in-de-web-app)); elke andere fout gaat door naar de `errorComponent`.
- **`notFound()`** wordt afgehandeld door de `notFoundComponent` van dezelfde route, of anders van de dichtstbijzijnde ouder die er een heeft. Daarom heeft de route een eigen, specifieke melding.
- `isTodoNotFound` controleert de `_tag`. Hoe de getypeerde fout uit de client komt, legt `lib/apiClient.ts` vast _(komt in BOO-128)_.
- De teksten hierboven zijn voorbeelden; echte meldingen komen uit `messages.ts` ([ADR 0015](../decisions/0015-translatable-messages.md)).

### Start op Cloudflare Workers

> Niet getypecheckt: `vite`, `@vitejs/plugin-react`, `@cloudflare/vite-plugin` en `wrangler` worden geïnstalleerd in BOO-126. Overgenomen uit de hosting-gids en het voorbeeld `start-basic-cloudflare`.

```ts
// apps/web/vite.config.ts
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [cloudflare({ viteEnvironment: { name: "ssr" } }), tanstackStart(), viteReact()],
});
```

- De volgorde van de plugins is zoals in de gids: eerst `cloudflare`, dan `tanstackStart`, dan `viteReact`.
- In `wrangler.jsonc` wijst `main` naar `@tanstack/react-start/server-entry`, met `compatibility_flags: ["nodejs_compat"]`.
- De service binding naar de API, en `wrangler types`, komen in BOO-126.

## Open voor BOO-132

- **Routes in `example/`.** `createFileRoute("/…")` typecheckt alleen voor paden die in de gegenereerde `routeTree.gen.ts` staan. De voorbeeldroutes in `apps/web/example/routes/` worden meegetypecheckt, maar zijn niet aangesloten op de router. Dan compileren ze niet ("not assignable to parameter of type 'keyof FileRoutesByPath'"). Hoe het voorbeeld toch getypecheckt wordt, wordt daar beslist.

## Wat je niet doet

- Geen logica of API-calls in een routecomponent; die horen in `features/`.
- Geen `fetch` in een loader; laden gaat via de `QueryClient` en `lib/apiClient.ts`.
- Geen `useEffect` om data te laden; gebruik de loader.
- Geen `notFound()` in een component als het in de loader kan: dan zijn de loaderdata getypeerd en flikkert er niets.
- Geen `routeTree.gen.ts` met de hand aanpassen.
- Geen strings als route-pad zonder types: gebruik `<Link to="/todos/$todoId" params={…}>`. Een onbekend pad compileert niet.
- Geen `createServerFn` voor data die de API levert. De API is de enige backend ([ADR 0003](../decisions/0003-separate-api.md)).

## Meer in `repos/tanstack-router`

- `docs/router/routing/file-naming-conventions.md`: alle naamregels.
- `docs/router/guide/not-found-errors.md`: hoe `notFound()` en `notFoundMode` werken.
- `docs/start/framework/react/guide/hosting.md`: Cloudflare Workers (zoek op `Cloudflare Workers`).
- `docs/start/framework/react/guide/tanstack-query.md` en `error-boundaries.md`.
- `examples/react/start-basic-cloudflare/`: `vite.config.ts`, `wrangler.jsonc` en routes.
- `examples/react/start-basic-react-query/`: router-context met `QueryClient` en loaders met `ensureQueryData`.
- `packages/router-core/src/route.ts`: de opties van een route, zoals `params`, `loader`, `errorComponent` en `ErrorComponentProps`.
