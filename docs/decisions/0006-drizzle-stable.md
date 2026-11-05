# 0006. Drizzle 0.45.x, niet de 1.0 RC

Status: Aanvaard (2026-11-04)

## Context

Drizzle 1.0 is nog een release candidate. 0.45.x is de bewezen stabiele lijn.

## Besluit

`drizzle-orm` 0.45.x, exact vastgepind, alleen in `apps/api`.

## Gevolgen

- Een latere upgrade naar 1.0 raakt alleen `apps/api`: adapters, tabellen en migraties.
- Services raken Drizzle niet aan; Biome verbiedt `drizzle-orm` in `services/**`.
