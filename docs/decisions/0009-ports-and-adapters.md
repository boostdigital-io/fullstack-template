# 0009. Ports als Effect service, adapters als Layer

Status: Aanvaard (2026-11-04)

## Context

Services moeten testbaar zijn zonder database, en mogen niet afhangen van Drizzle, Better Auth of Workers-API's (Dependency Inversion).

## Besluit

- Een port is een Effect service die een service opvraagt, zoals `TodoRepository`.
- Een adapter is een Layer die de port implementeert. De variant staat achter de naam: `todoRepository.drizzle.ts` → `TodoRepositoryDrizzle`, `todoRepository.memory.ts` → `TodoRepositoryMemory`.
- Alleen de composition root (`apps/api/src/layers.ts`) koppelt ports aan adapters.

## Gevolgen

- Services testen met `.memory`-adapters, zonder database.
- Biome verbiedt in `services/**` imports van infrastructuur en adapters.
