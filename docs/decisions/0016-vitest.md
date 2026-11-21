# 0016. Vitest als enige test-runner

Status: Aanvaard (2026-11-04)

## Context

Bun heeft een eigen test-runner, maar die draait niet in workerd en kent de Effect-testhelpers niet. Twee runners naast elkaar is dubbel onderhoud.

## Besluit

- Vitest is de enige test-runner, met `@effect/vitest` voor Effect-code en Cloudflare's Workers-integratie voor API-tests in workerd. Die integratie is `unstable_startWorker` uit wrangler geworden, niet `@cloudflare/vitest-pool-workers` ([ADR 0032](0032-api-tests-via-wrangler.md)).
- Bun blijft de package manager.
- Nooit `bun test`.

## Gevolgen

- API-tests draaien in de echte runtime.
- Vitest draait niet in Bun, dus `Bun.*` werkt niet in tests.
- `bun test` stopt meteen met een melding (preload in `bunfig.toml`).
- Uitwerking: [testing.md](../architecture/testing.md).
