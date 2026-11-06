# 0027. Referentie-feature in `example/`

Status: Aanvaard (2026-11-04)

## Context

Claude schrijft betere code als hij een correct voorbeeld kan kopiëren. Een voorbeeld in losse docs veroudert; een voorbeeld in `src/` moet per project opgeruimd worden.

## Besluit

- Elke app en elk package heeft naast `src/` een map `example/` met de referentie-feature `todos`, in dezelfde structuur als `src/`.
- `example/` wordt meegetypecheckt en getest, maar nooit gebouwd of aangesloten op de app.
- `src/` importeert niets uit `example/`; Biome dwingt dat af.
- Het voorbeeld heet `@repo/domain/example/todos`, niet `@repo/domain/todos`. Zo kan `src/` het niet via de package-naam importeren, langs de Biome-regel heen.

## Gevolgen

- Altijd een levend, correct voorbeeld; geen opruimwerk per project.
- Een nieuwe feature `invoices` heet gewoon `@repo/domain/invoices`.
- Zie [overview.md](../architecture/overview.md#example-de-referentie-feature).
