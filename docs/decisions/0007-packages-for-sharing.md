# 0007. Packages alleen voor gedeelde code

Status: Aanvaard (2026-11-04)

## Context

Lagen kun je scheiden met packages (een package per laag) of met mappen binnen een app. Packages per laag geven veel `package.json`-bestanden, exports en build-gedoe.

## Besluit

- Er zijn precies twee packages: `domain` en `contract`. Een package bestaat alleen om code te delen tussen apps.
- Lagen binnen een app scheid je met mappen (`services/`, `repositories/`) en lint-regels.

## Gevolgen

- `api` → `domain` en `contract`; `web` → alleen `contract`; `contract` → `domain`; `domain` → niets.
- Packages hebben geen build-stap: hun exports wijzen naar `.ts`-bronbestanden.
- Zie [overview.md](../architecture/overview.md).
