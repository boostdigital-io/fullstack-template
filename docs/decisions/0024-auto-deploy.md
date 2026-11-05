# 0024. Automatische deploy na merge, preview per PR

Status: Aanvaard (2026-11-04)

## Context

Handmatige releases kosten tijd en gaan mis. Een wijziging wil je kunnen bekijken voordat hij gemerged wordt.

## Besluit

- Na een merge naar `main` draait CI eerst de migraties en deployt daarna de API- en web-Worker.
- Elke PR krijgt een preview-deploy van web en API, tegen een aparte preview-omgeving.

## Gevolgen

- Geen handwerk bij releases.
- Welke database de preview-omgeving gebruikt, is een keuze per project.
- Komt in BOO-135 (preview) en BOO-136 (deploy).
