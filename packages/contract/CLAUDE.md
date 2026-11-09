# packages/contract

Het contract: de HttpApi-definitie die de API implementeert en web (en later mobile) als getypte client gebruikt. Nu staat alleen `src/index.ts` er. Bestandsnamen zoals `todosGroup.ts` zijn voorbeelden uit de referentie-feature `todos`, die in `example/todos/` komt _(BOO-122)_.

## Wat erin hoort

- **`src/api.ts`**: de `Api`, die alle groepen samenvoegt _(komt in BOO-117)_.
- **Groepen** per feature (`todosGroup.ts`): endpoints met `params`, `query`, `payload` en `success`, gebouwd uit de value objects van het domein.
- **Domeinfouten met statuscode** per endpoint: `error: TodoNotFound.pipe(HttpApiSchema.status(404))`. Het contract gebruikt de domeinfouten direct ([ADR 0014](../../docs/decisions/0014-domain-errors-in-contract.md)).
- **Wat de middleware nodig heeft**, in `src/shared/` _(komt in BOO-125)_: `authErrors.ts` (`Unauthorized`), `currentUser.ts` (`CurrentUser`) en `authentication.ts` (de middleware-definitie).
- Grenzen op input: elke string een maximale lengte, elke lijst een maximum, paginering een bovengrens (zie `docs/architecture/security.md`).

Patroon: `docs/patterns/effect-http-api.md`.

## Wat er niet in hoort

- Geen servercode: geen handlers, services, database, Better Auth of `cloudflare:workers`. Web en mobile importeren dit package.
- Geen implementatie van de middleware; die staat in `apps/api`.
- Geen eigen fouten voor iets dat een domeinfout is, en geen vertaling van domeinfouten naar andere fouten.
- Geen imports behalve `@repo/domain` en `effect`.

## Exports

Zoals bij `domain`: `@repo/contract` voor `src/index.ts`, `@repo/contract/<feature>` per feature, en `@repo/contract/example/todos` voor het voorbeeld. Zie `docs/architecture/overview.md` (Importregels).

## Tests

Het contract wordt niet los getest; de API-tests dekken het. Zie `docs/architecture/testing.md`.
