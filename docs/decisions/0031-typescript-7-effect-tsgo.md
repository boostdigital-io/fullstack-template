# 0031. TypeScript 7 met `effect-tsgo`

Status: Aanvaard (2026-11-05)

## Context

De Effect language service vangt fouten die TypeScript zelf niet ziet, zoals een Effect die nergens wordt uitgevoerd. Als plugin in gewone `tsc` verschijnen die alleen in de editor, niet in CI.

## Besluit

- De repo draait op TypeScript 7 (native).
- `@effect/tsgo` levert `effect-tsgo`: de TypeScript-compiler met de Effect language service erin.
- `typecheck` in elke workspace draait `effect-tsgo tsc --noEmit`. In Zed is `effect-tsgo` de TypeScript-server.
- Effect-errors en -warnings laten `typecheck` falen; suggesties niet (`tsconfig.base.json`).

## Gevolgen

- Effect-diagnostiek is in de editor, in pre-push en in CI hetzelfde.
- Niet terugzetten naar `tsc` of `vtsls`: dan verdwijnt de Effect-diagnostiek uit CI.
- `typescript` en `@effect/tsgo` werken altijd samen bij ([ADR 0025](0025-renovate-automerge.md)), omdat `effect-tsgo` alleen de geïnstalleerde TypeScript-build gebruikt als hij die versie meelevert.
