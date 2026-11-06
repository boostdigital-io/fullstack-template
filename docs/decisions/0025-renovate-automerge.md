# 0025. Renovate merget minor en patch automatisch

Status: Aanvaard (2026-11-04)

## Context

Dependency-updates met de hand bijhouden kost veel reviewwerk. Breaking changes moeten wel zichtbaar blijven.

## Besluit

- Renovate, wekelijks op maandagochtend (Europe/Amsterdam), met een minimum release age van drie dagen. Versies blijven exact vastgepind.
- Minor- en patch-updates mergen automatisch bij groene CI. Majors nooit.
- Uitzondering: voor Effect (`effect`, `@effect/*`) en `typescript` alleen patches. Ook een minor kan breken in `effect/unstable`.
- Groepen: alle Effect-packages plus `typescript` samen, alle TanStack-packages samen.
- GitHub Actions worden ook bijgewerkt, gepind op digest.

## Gevolgen

- `typescript` zit in de Effect-groep omdat `@effect/tsgo` de TypeScript-build meelevert ([ADR 0031](0031-typescript-7-effect-tsgo.md)).
- `repos/` valt buiten Renovate ([ADR 0012](0012-vendored-repos.md)).
