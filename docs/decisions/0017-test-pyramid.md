# 0017. Tests vooral op services

Status: Aanvaard (2026-11-04)

## Context

De logica zit in services en domeinregels. Component- en end-to-end-tests zijn traag en vragen veel onderhoud.

## Besluit

- Het grootste deel van de tests zit bij de services, tegen `.memory`-adapters.
- Geen component-tests in de basis.
- Playwright alleen voor kritieke flows.

## Gevolgen

- Snelle feedback in pre-push en CI.
- Complexe logica in een component hoort in een losse functie, met een unit-test.
- Zie [testing.md](../architecture/testing.md).
