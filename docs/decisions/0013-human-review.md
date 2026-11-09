# 0013. Claude opent PR's; alleen een mens merget

Status: Aanvaard (2026-11-04)

## Context

Claude schrijft het grootste deel van de code. Kwaliteit en controle blijven bij een mens.

## Besluit

- Eén Linear-issue is één Claude Code-sessie, op een eigen branch.
- Claude opent een PR. Alleen een mens merget.
- Claude pusht nooit naar `main` en merget nooit zelf.

## Gevolgen

- Elke wijziging gaat langs een review.
- `git push` naar `main` en `gh pr merge` worden geweigerd in `.claude/settings.json`; een PreToolUse-hook vangt ook `git push` vanaf `main`. Dit voorkomt vergissingen; de echte poort is de ruleset op `main` (BOO-107).
