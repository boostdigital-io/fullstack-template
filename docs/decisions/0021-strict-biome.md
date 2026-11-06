# 0021. Strikte Biome voor lint en format

Status: Aanvaard (2026-11-04)

## Context

Warnings worden genegeerd, en stijldiscussies kosten reviewtijd. Claude heeft baat bij directe, eenduidige feedback.

## Besluit

- Biome is linter en formatter, met één `biome.json` in de root.
- Alle regels staan aan, alle groepen op `error`. Geen warnings.
- Uitzonderingen alleen waar het moet, per map via overrides in `biome.json`, zoals default exports in `*.config.ts` en `console` in `scripts/`.
- Formatter: 2 spaties, dubbele quotes, puntkomma's, trailing commas, regelbreedte 100.
- Architectuur- en naamregels ook in Biome (`noRestrictedImports`, `useFilenamingConvention`).

## Gevolgen

- Dezelfde check draait in de editor, in de pre-commit-hook en in CI.
- Biome-overrides vervangen elkaar in plaats van samen te voegen. Houd ze zo weinig mogelijk.
- Uitgesloten: `repos/`, `components/ui/`, migraties en gegenereerde bestanden.
