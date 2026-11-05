# 0029. Nieuwe projecten via "Use this template"

Status: Aanvaard (2026-11-04)

## Context

Een nieuw project moet starten met een schone historie, meteen op GitHub, en zonder handmatig zoek-en-vervang.

## Besluit

- Nieuwe projecten starten met "Use this template" op GitHub.
- Daarna `bun install` en `bun run init`, dat projectnaam en domein in de repo zet.
- Wat accounts of tokens nodig heeft, staat in een handmatige checklist.

## Gevolgen

- De repo staat als template-repository op GitHub.
- Het init-script komt in BOO-138, de checklist in `docs/guides/new-project.md` (komt in BOO-139).
