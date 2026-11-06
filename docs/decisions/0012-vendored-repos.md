# 0012. Library-broncode via git subtree onder `repos/`

Status: Aanvaard (2026-11-04)

## Context

Claude gokt bij library-API's die na zijn trainingsdata veranderd zijn, zoals Effect v4. De echte broncode op de geïnstalleerde versie is betrouwbaarder dan geheugen of het web.

## Besluit

- Effect, TanStack Router (inclusief Start), Better Auth en Drizzle staan als git subtree onder `repos/`, met `--squash`.
- Elke subtree staat op de git-tag van de geïnstalleerde versie. `repos/manifest.json` legt per repo URL, tagpatroon en bron-package vast.
- `bun run repos:sync` zet de subtrees op de versies uit `package.json`; `bun run repos:check` faalt als ze afwijken.
- `repos/` is alleen-lezen en blijft buiten Biome, typecheck, Zed en Renovate.

## Gevolgen

- Bij twijfel over een library kijkt Claude in `repos/`, niet op het web.
- `main` accepteert alleen merge-commits: squash- en rebase-merges laten de squash-commits van subtree weg, waar `repos:sync` op leunt ([ADR 0023](0023-ci-as-gate.md)).
- `repos:check` in CI komt in BOO-134. Een Renovate-update van een gevendorde library vraagt dan ook `repos:sync`; hoe dat met automerge samengaat, wordt daar besloten.
- Alleen uitbreiden als Claude merkbaar worstelt met een andere library.
