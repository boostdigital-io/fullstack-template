# Besluiten (ADR's)

Waarom we bouwen zoals we bouwen. Elk besluit staat in een eigen Architecture Decision Record (ADR). Wil je iets anders doen dan hier staat, schrijf dan een nieuwe ADR; ga er niet stilzwijgend van af.

## Overzicht

| ADR                                         | Besluit                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| [0001](0001-bun-workspaces.md)              | Bun-workspaces met isolated installs                                                  |
| [0002](0002-cloudflare-workers.md)          | Web en API elk als Cloudflare Worker                                                  |
| [0003](0003-separate-api.md)                | Aparte API-app naast web                                                              |
| [0004](0004-effect-v4.md)                   | Effect v4 voor alle backend-logica                                                    |
| [0005](0005-effect-http-api.md)             | Effect HttpApi als API-laag, exact vastgepind                                         |
| [0006](0006-drizzle-stable.md)              | Drizzle 0.45.x, niet de 1.0 RC                                                        |
| [0007](0007-packages-for-sharing.md)        | Packages alleen voor gedeelde code: `domain` en `contract`                            |
| [0008](0008-services-as-functions.md)       | Services zijn functies, één per bestand; het Effect-mechanisme heet "Effect service"  |
| [0009](0009-ports-and-adapters.md)          | Ports als Effect service, adapters als Layer met variant-achtervoegsel                |
| [0010](0010-naming.md)                      | Code camelCase (componenten PascalCase), docs kebab-case                              |
| [0011](0011-effect-schema-only.md)          | Effect Schema voor alle validatie, geen Zod                                           |
| [0012](0012-vendored-repos.md)              | Library-broncode via git subtree onder `repos/`, gepind op versie                     |
| [0013](0013-human-review.md)                | Claude opent PR's; alleen een mens merget                                             |
| [0014](0014-domain-errors-in-contract.md)   | Het contract gebruikt domeinfouten direct, met statuscode per endpoint                |
| [0015](0015-translatable-messages.md)       | Meldingen per `_tag` en taal in de web-app, zonder i18n-library                       |
| [0016](0016-vitest.md)                      | Vitest als enige test-runner                                                          |
| [0017](0017-test-pyramid.md)                | Tests vooral op services; geen component-tests; Playwright alleen voor kritieke flows |
| [0018](0018-api-subdomain.md)               | API op een eigen subdomein, met CORS, cross-subdomain cookies en een origin-check     |
| [0019](0019-not-found-over-forbidden.md)    | Resource van een ander geeft 404; 403 alleen voor rechten                             |
| [0020](0020-optional-email-verification.md) | E-mailverificatie standaard uit, per project aan te zetten                            |
| [0021](0021-strict-biome.md)                | Biome voor lint en format, alle regels op `error`                                     |
| [0022](0022-conventional-commits.md)        | Conventional Commits via een eigen script, issue-ID als `Refs:`-footer                |
| [0023](0023-ci-as-gate.md)                  | Groene CI is de poort naar `main`; geen verplichte goedkeuring, alleen merge-commits  |
| [0024](0024-auto-deploy.md)                 | Automatische deploy na merge, preview-deploy per PR                                   |
| [0025](0025-renovate-automerge.md)          | Renovate merget minor en patch automatisch; Effect alleen patches; majors nooit       |
| [0026](0026-zed.md)                         | Editorconfiguratie voor Zed in `.zed/`                                                |
| [0027](0027-example-folders.md)             | Referentie-feature in `example/` naast `src/`, als `@repo/<package>/example/todos`    |
| [0028](0028-repo-scope.md)                  | Package-scope `@repo/` blijft in elk project gelijk                                   |
| [0029](0029-github-template.md)             | Nieuwe projecten via "Use this template" en `bun run init`                            |
| [0030](0030-pinned-bun.md)                  | Bun vastgepind op een stabiele versie via `packageManager`                            |
| [0031](0031-typescript-7-effect-tsgo.md)    | TypeScript 7 met `effect-tsgo`, zodat Effect-diagnostiek CI laat falen                |

## Een nieuwe ADR toevoegen

1. Neem het volgende vrije nummer, vier cijfers.
2. Maak `NNNN-korte-naam.md`: een Engelse naam in kebab-case, zoals `0032-email-provider.md`.
3. Gebruik de vorm hieronder. Houd het kort: rond 10 tot 25 regels, de kern van het besluit en waarom. Details over hoe je bouwt horen in `docs/architecture/`, niet in de ADR.
4. Voeg een regel toe aan de tabel hierboven.
5. Vervangt de ADR een eerder besluit, zet dan in de oude ADR `Status: Vervangen door NNNN (datum)`. Pas de inhoud van een aanvaarde ADR verder niet aan; een nieuw besluit is een nieuwe ADR.

```markdown
# NNNN. Besluit in een paar woorden

Status: Aanvaard (JJJJ-MM-DD)

## Context

Welk probleem of welke keuze speelt er, en wat maakt het lastig.

## Besluit

Wat we doen, in korte, stellige zinnen.

## Gevolgen

Wat dit betekent: wat makkelijker wordt, wat het kost, waar je op moet letten.
```

Statussen: `Voorgesteld` (nog niet besloten), `Aanvaard`, `Vervangen door NNNN`.
