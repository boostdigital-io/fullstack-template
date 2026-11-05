# 0001. Bun-workspaces met isolated installs

Status: Aanvaard (2026-11-04)

## Context

De repo bevat twee apps en twee gedeelde packages. Web mag nooit bij services of de database kunnen. Met een gedeelde, platte `node_modules` kan elk package alles importeren wat ergens in de repo geïnstalleerd is.

## Besluit

- Bun is de package manager, met workspaces `apps/*` en `packages/*`.
- Isolated installs staan aan (`linker = "isolated"` in `bunfig.toml`): een package kan alleen importeren wat in zijn eigen `package.json` staat.
- Interne afhankelijkheden als `"@repo/domain": "workspace:*"`.

## Gevolgen

- "Web importeert alleen `@repo/contract`" hoeft niet in Biome: de import vindt de module gewoon niet.
- Elke dependency moet expliciet in de workspace staan die hem gebruikt, ook tooling die een workspace-script aanroept.
- Zie [overview.md](../architecture/overview.md#importregels).
