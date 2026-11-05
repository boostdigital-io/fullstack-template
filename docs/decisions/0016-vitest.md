# 0016. Vitest als enige test-runner

Status: Aanvaard (2026-11-04)

## Context

Bun heeft een eigen test-runner, maar die draait niet in workerd en kent de Effect-testhelpers niet. Twee runners naast elkaar is dubbel onderhoud.

## Besluit

- Vitest is de enige test-runner, met `@effect/vitest` voor Effect-code en Cloudflare's Workers-integratie voor API-tests in workerd.
- Bun blijft de package manager.
- Nooit `bun test`.

## Gevolgen

- API-tests draaien in de echte runtime.
- Vitest draait niet in Bun, dus `Bun.*` werkt niet in tests.
- De opzet komt in BOO-120. Zie [testing.md](../architecture/testing.md).
