# 0003. Aparte API-app naast web

Status: Aanvaard (2026-11-04)

## Context

TanStack Start heeft server functions, waarmee de web-app zelf server-code kan draaien. Later komt er een Expo-app die dezelfde data nodig heeft.

## Besluit

Een aparte app `apps/api` naast `apps/web`. Alle businesslogica en data-toegang zit in de API. Web gebruikt geen server functions voor businesslogica.

## Gevolgen

- Web en Expo praten met dezelfde API, via dezelfde getypte client uit het contract.
- Server functions zijn geen publieke API en geen tweede plek voor logica.
- Twee Workers om te deployen, verbonden met een service binding ([ADR 0002](0002-cloudflare-workers.md)).
