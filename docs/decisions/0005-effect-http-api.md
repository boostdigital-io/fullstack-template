# 0005. Effect HttpApi als API-laag, exact vastgepind

Status: Aanvaard (2026-11-04)

## Context

We willen één contract voor server, web en later mobile, met getypte fouten tot in de client. HttpApi doet dat met Effect Schema, maar valt onder `effect/unstable`.

## Besluit

- Effect HttpApi is de API-laag. Het contract staat in `packages/contract`.
- Bewust ondanks het unstable-label.
- Effect is exact vastgepind. Renovate merget voor Effect alleen patches automatisch; minors komen bij een mens ([ADR 0025](0025-renovate-automerge.md)).

## Gevolgen

- Eén Schema-contract: validatie, response-vorm en foutcodes op één plek.
- Een Effect-minor kan HttpApi breken. Die update review je dus met de hand.
