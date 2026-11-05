# 0011. Effect Schema voor alle validatie, geen Zod

Status: Aanvaard (2026-11-04)

## Context

HttpApi gebruikt Effect Schema. Een tweede validatielibrary betekent twee definities van dezelfde vorm, die uit sync kunnen raken.

## Besluit

- Effect Schema voor alle validatie: contract, domein, config en formulieren.
- Geen Zod, ook niet als een library het aanbiedt.
- TanStack Form gebruikt de Schema's via Standard Schema.

## Gevolgen

- Eén bron van waarheid van databasetabel tot UI.
- Formulieren valideren in de client met dezelfde Schema's als de server.
