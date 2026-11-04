# CLAUDE.md

Tijdelijke versie. De volledige `CLAUDE.md` volgt in BOO-112.

## Wat dit is

Een fullstack-template, nog in opbouw. Het plan en het Linear-project "Fullstack template" zijn de bron van waarheid. Het issue van de sessie bepaalt de scope: doe niets daarbuiten.

## Stack

Bun als package manager en tooling, Cloudflare Workers als runtime, Effect v4, TanStack Start, Drizzle, Better Auth, Vitest.

## Wat er nu staat

- Workspaces: `apps/api`, `apps/web`, `packages/domain`, `packages/contract`, elk met `src/` en `example/`.
- Biome voor lint en formatting, Husky voor git hooks, CI in GitHub Actions.

## Commando's

- `bun run check`: lint en typecheck. Draai dit voor elke commit.
- `bun run lint`: Biome-check.
- `bun run format`: Biome met automatische fixes.
- `bun run typecheck`: typecheck in alle workspaces.

## Harde regels

- Geen `Bun.*`-API's in code die op Workers draait.
- Conventional Commits, met `Refs: BOO-<n>` als footer.
- Nooit naar `main` pushen en nooit zelf mergen.
- Geen nieuwe dependencies zonder eerst te vragen.
