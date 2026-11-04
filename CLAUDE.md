# CLAUDE.md

Tijdelijke versie. De volledige `CLAUDE.md` volgt in BOO-112.

## Wat dit is

Een fullstack-template, nog in opbouw.

- Het Linear-issue van de sessie is de bron van waarheid en bepaalt de scope: doe niets daarbuiten.
- Achtergrond, besluiten en conventies staan in het plan: https://claude.ai/artifact/ECzxwZiTRNPX9xww482Y8E

## Stack

Bun als package manager en tooling, Cloudflare Workers als runtime, Effect v4, TanStack Start, Drizzle, Better Auth, Vitest.

## Wat er nu staat

- Workspaces: `apps/api`, `apps/web`, `packages/domain`, `packages/contract`, elk met `src/` en `example/`.
- `example/` is voor de referentie-feature: wordt niet gebouwd, en `src/` importeert er nooit uit (Biome dwingt dat af).
- Biome voor lint en formatting, Husky voor git hooks, CI in GitHub Actions.

## Commando's

- `bun run check`: lint en typecheck. Draai dit voor elke commit.
- `bun run lint`: Biome-check.
- `bun run format`: Biome met automatische fixes.
- `bun run typecheck`: typecheck in alle workspaces.

## Harde regels

- Geen `Bun.*`-API's in code die op Workers draait.
- Tests komen met Vitest (BOO-120). Gebruik nooit `bun test`.
- Conventional Commits, met `Refs: BOO-<n>` als footer.
- Nooit naar `main` pushen en nooit zelf mergen.
- Geen nieuwe dependencies zonder eerst te vragen.
