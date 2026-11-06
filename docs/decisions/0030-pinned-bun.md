# 0030. Bun vastgepind via `packageManager`

Status: Aanvaard (2026-11-04)

## Context

Verschillende Bun-versies geven verschillende lockfiles en gedrag. Bun dwingt `packageManager` zelf niet af.

## Besluit

- Bun staat vast op een stabiele versie in `packageManager` in de root-`package.json`. Geen canary.
- Het `preinstall`-script (`scripts/checkBunVersion.ts`) stopt `bun install` als de lokale versie afwijkt.
- CI leest de versie uit `packageManager`.

## Gevolgen

- Mens, CI en Claude draaien dezelfde versie.
- Renovate werkt de versie bij; daarna moet iedereen lokaal Bun bijwerken.
