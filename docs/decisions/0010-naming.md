# 0010. Code camelCase, docs kebab-case

Status: Aanvaard (2026-11-04)

## Context

Zonder vaste regel krijgt een repo een mix van stijlen, en moet Claude bij elk bestand gokken.

## Besluit

- Bestandsnamen in code zijn camelCase; React-componenten PascalCase.
- De bestandsnaam is wat het bestand bevat. Een punt staat alleen voor een variant of een test, nooit voor een rol. Een map geeft de rol aan.
- Documentatie is kebab-case; ADR's zijn genummerd.
- Biome dwingt de regel voor code af met `useFilenamingConvention`.

## Gevolgen

- Uitzonderingen: vaste namen (`README.md`, `CLAUDE.md`, `package.json`), gegenereerde code in `components/ui/` en de routesyntax van TanStack.
- Zie [conventions.md](../architecture/conventions.md#naamgeving).
