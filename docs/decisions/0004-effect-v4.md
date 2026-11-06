# 0004. Effect v4 voor alle backend-logica

Status: Aanvaard (2026-11-04)

## Context

De backend heeft dependency injection, getypte fouten, validatie, config en observability nodig. Losse libraries daarvoor passen slecht op elkaar.

## Besluit

- Effect v4 voor alle logica in `apps/api`, `packages/domain` en `packages/contract`.
- `effect` staat in die drie workspaces op exact dezelfde versie.
- v4 is LTS, met bugfixes tot minimaal september 2029.

## Gevolgen

- Fouten en afhankelijkheden staan in het type van elke functie.
- Geen `try/catch` of `Promise` in Effect-code.
- De exacte v4-API's komen uit `repos/effect` ([ADR 0012](0012-vendored-repos.md)), niet uit geheugen of het web.
