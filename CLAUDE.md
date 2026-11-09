# CLAUDE.md

## Wat dit is

Een fullstack-template voor nieuwe projecten: een API en een web-app, elk als Cloudflare Worker, gebouwd met Effect v4, TanStack Start, Drizzle en Better Auth. De template is nog in opbouw. Wat nog niet bestaat, staat in de docs als regel, gemarkeerd met _(komt in BOO-…)_.

Hoe we bouwen staat in `docs/`. Het plan (https://claude.ai/artifact/ECzxwZiTRNPX9xww482Y8E) is alleen achtergrond; bij verschil geldt `docs/`.

## Werkwijze

- Eén Linear-issue is één sessie, één branch en één PR. Het issue is de bron van waarheid en bepaalt de scope: doe niets daarbuiten. Vind je onderweg iets anders, meld het of stel een issue voor.
- De PR-beschrijving begint met `Closes BOO-<n>`, zodat Linear het issue na het mergen sluit. In commits blijft het `Refs: BOO-<n>`.
- Start een issue met `/issue BOO-<n>`: issue ophalen, branch, plan, na akkoord bouwen en een PR openen.

## De repo

| Map                 | Wat                                                           |
| ------------------- | ------------------------------------------------------------- |
| `apps/api`          | De API-Worker. Eigen `CLAUDE.md`.                             |
| `apps/web`          | De web-app (TanStack Start). Eigen `CLAUDE.md`.               |
| `packages/domain`   | Entities, value objects, domeinfouten. Eigen `CLAUDE.md`.     |
| `packages/contract` | De HttpApi-definitie die api en web delen. Eigen `CLAUDE.md`. |
| `docs/`             | Architectuur, besluiten, patronen, guides en projectcontext.  |
| `repos/`            | Broncode van libraries op onze versie. Alleen-lezen.          |
| `scripts/`          | Tooling-scripts (draaien met Bun, niet op Workers).           |
| `.claude/`          | Claude Code-instellingen, hooks en skills (zie hieronder).    |
| `.mcp.json`         | MCP-servers voor elke sessie in deze repo (Linear).           |

Elke workspace heeft `src/` en `example/`. `example/` bevat de referentie-feature `todos`: die wordt niet gebouwd, en `src/` importeert er nooit uit.

## Commando's

| Commando              | Wat                                                       |
| --------------------- | --------------------------------------------------------- |
| `bun run check`       | Lint en typecheck. Draai dit voor elke commit.            |
| `bun run lint`        | Biome-check van de hele repo.                             |
| `bun run format`      | Biome met automatische fixes.                             |
| `bun run typecheck`   | Typecheck in alle workspaces (`effect-tsgo`).             |
| `bun run repos:sync`  | Zet `repos/` op de geïnstalleerde versies.                |
| `bun run repos:check` | Faalt als `repos/` afwijkt van de geïnstalleerde versies. |

Claude Code-hooks (`.claude/settings.json`): na elke `Edit` of `Write` draait `biome check --write` op het bestand; wat overblijft, krijg je meteen terug om op te lossen. Geweigerd zijn: schrijven in `repos/`, lezen van `.dev.vars` en `.env*`, `git push` naar `main` en `gh pr merge`. Persoonlijke instellingen horen in `.claude/settings.local.json` (staat in `.gitignore`).

Git-hooks: pre-commit draait Biome op de gestagede bestanden, commit-msg controleert de commitboodschap, pre-push draait de typecheck. Tests en hun commando's komen in BOO-120.

## Harde regels

- Geen `Bun.*`-API's in code die op Workers draait.
- Gebruik nooit `bun test`. Tests draaien met Vitest _(komt in BOO-120)_.
- Conventional Commits, met `Refs: BOO-<n>` als footer.
- Nooit naar `main` pushen en nooit zelf mergen.
- Geen nieuwe dependencies zonder eerst te vragen.

## Waar zoeken

- Applicatiecode zoek je in `apps/` en `packages/`.
- `repos/` alleen bij een vraag over een library. Lees dan eerst het patroonbestand in `docs/patterns/`, en daarna pas de broncode in `repos/`.

## Welk document voor welke vraag

| Vraag                                                      | Lees                                                   |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| Welke workspace mag wat importeren? Hoe loopt een request? | `docs/architecture/overview.md`                        |
| Mappen, bestandsnamen, begrippen, commits                  | `docs/architecture/conventions.md`                     |
| Welke fout waar, met welke statuscode en melding           | `docs/architecture/errors.md`                          |
| Welke test waar, en wat niet testen                        | `docs/architecture/testing.md`                         |
| Secrets, auth, autorisatie, input, headers                 | `docs/architecture/security.md`                        |
| Waarom iets zo is gekozen                                  | `docs/decisions/README.md` (overzicht van alle ADR's)  |
| Effect Schema, value objects, domeinfouten                 | `docs/patterns/effect-schema.md`                       |
| Ports, adapters, services, Config, tests                   | `docs/patterns/effect-services.md`                     |
| Contract, handlers, middleware, Workers-entry, client      | `docs/patterns/effect-http-api.md`                     |
| Tabellen, `Database`, Drizzle-adapters                     | `docs/patterns/drizzle.md`                             |
| Better Auth en de sessie in de middleware                  | `docs/patterns/better-auth.md`                         |
| Routes, loaders, `notFound()`, Cloudflare-opzet            | `docs/patterns/tanstack-router.md`                     |
| Queries en mutaties                                        | `docs/patterns/tanstack-query.md`                      |
| Formulieren                                                | `docs/patterns/tanstack-form.md`                       |
| Wat dit project doet, en zijn eigen begrippen              | `docs/project/overview.md`, `docs/project/glossary.md` |
| Aan meer issues tegelijk werken (worktrees)                | `docs/guides/parallel-sessions.md`                     |

Wil je iets anders doen dan een ADR zegt, schrijf dan een nieuwe ADR; wijk er niet stilzwijgend van af.

## Definition of Done

- `bun run check` is groen.
- Elke nieuwe service heeft een test voor het succes-pad en een test per fout in zijn signatuur (zodra Vitest er is, BOO-120).
- Voeg je een nieuw patroon, commando of map toe, dan werk je de docs en deze `CLAUDE.md` bij.
- Geen nieuwe dependencies zonder toestemming.

## Anti-slop-regels

- Een nieuwe feature kopieert de structuur uit `example/` en volgt het patroon exact. Afwijken alleen als het issue erom vraagt.
- Geen commentaar dat herhaalt wat de code doet; wel commentaar dat uitlegt waarom.
- Geen `any`, geen `as` om een typefout weg te werken, geen `@ts-ignore` of `@ts-expect-error`.
- Geen `try/catch` of `Promise` in Effect-code.
- Geen dependencies, abstracties of helpers die het issue niet vraagt.
- Bij twijfel over een library: kijk in `repos/` (of de geïnstalleerde package), niet op het web.
