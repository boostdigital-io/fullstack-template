# 0023. Groene CI is de poort naar `main`

Status: Aanvaard (2026-11-04)

## Context

Claude opent PR's onder het account van de reviewer, en je kunt je eigen PR niet goedkeuren. Een verplichte goedkeuring zou elke PR blokkeren.

## Besluit

- Een ruleset op `main`, vastgelegd in `.github/rulesets/main.json`: alleen via een PR, status check `check` verplicht, geen verplichte goedkeuring.
- Force-push en verwijderen zijn geblokkeerd. Geen bypass, ook niet voor admins.
- Alleen merge-commits, geen squash of rebase ([ADR 0012](0012-vendored-repos.md)).

## Gevolgen

- Review is een afspraak; CI is de regel.
- Renovate kan mergen zodra CI groen is.
- De CI-job heet exact `check`, omdat de ruleset ernaar verwijst.
- "Use this template" kopieert de ruleset niet; die hoort op de checklist voor nieuwe projecten (komt in BOO-139).
