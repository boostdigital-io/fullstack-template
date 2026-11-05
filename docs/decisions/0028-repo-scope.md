# 0028. Package-scope `@repo/` blijft gelijk

Status: Aanvaard (2026-11-04)

## Context

Bij een nieuw project kun je de package-scope hernoemen naar de projectnaam. Dat raakt elke import.

## Besluit

De scope `@repo/` blijft in elk project gelijk: `@repo/api`, `@repo/web`, `@repo/domain`, `@repo/contract`.

## Gevolgen

- De packages zijn intern en worden nooit gepubliceerd, dus de naam botst nergens.
- `bun run init` laat de scope ongewijzigd (komt in BOO-138).
