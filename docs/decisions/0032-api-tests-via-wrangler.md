# 0032. API-tests via wrangler, niet via `@cloudflare/vitest-pool-workers`

Status: Aanvaard (2026-11-21)

## Context

[ADR 0016](0016-vitest.md) koos Cloudflare's Workers-integratie voor Vitest (`@cloudflare/vitest-pool-workers`) om API-tests in workerd te draaien. Bij de opzet in BOO-120 bleek die niet te passen:

- `@effect/vitest` 4.x vereist Vitest 5. De nieuwste pool (0.23.0) ondersteunt alleen Vitest 4 en crasht op Vitest 5.
- Op Vitest 4 start de pool onze Worker niet: de workerd in de pool kent compatibility-datums tot 2026-08-22, en `wrangler.jsonc` gebruikt 2026-11-01.
- Twee Vitest-majors naast elkaar kan niet in één workspace, door de isolated linker ([ADR 0001](0001-bun-workspaces.md)).

## Besluit

- Eén runner: Vitest 5, met `@effect/vitest` voor Effect-code.
- API-tests starten de echte Worker in workerd met `unstable_startWorker` uit `wrangler`, met `wrangler.jsonc` als config. Wrangler staat al in `apps/api`, dus er komt geen dependency bij.
- `@cloudflare/vitest-pool-workers` gebruiken we niet.

## Gevolgen

- De Worker draait in tests met dezelfde workerd en dezelfde compatibility-datum als in `wrangler dev`.
- API-tests zijn black-box: `worker.fetch(...)`. De helpers uit `cloudflare:test` (zoals `runInDurableObject`) zijn er niet; die hebben we voor HTTP-tests ook niet nodig.
- `unstable_startWorker` is een `unstable_`-API. Wrangler is exact vastgepind, en een breuk na een update laat de API-tests falen ([ADR 0025](0025-renovate-automerge.md)).
- Ondersteunt de pool later Vitest 5 en een recente workerd, dan kan een nieuwe ADR dit terugdraaien.
- Uitwerking: [testing.md](../architecture/testing.md).
