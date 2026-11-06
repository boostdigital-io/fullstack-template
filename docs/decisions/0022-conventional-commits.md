# 0022. Conventional Commits via een eigen script

Status: Aanvaard (2026-11-04)

## Context

Een leesbare historie helpt bij review en releases. commitlint en vergelijkbare tools voegen dependencies toe voor een simpele controle.

## Besluit

- Commits volgen Conventional Commits: `type(scope)!: onderwerp`, eerste regel maximaal 100 tekens.
- `scripts/commitMsg.ts` controleert dat in de commit-msg-hook, zonder extra dependency.
- Merge-, revert-, fixup-, squash- en amend-commits van git gaan ongecontroleerd door.
- De issue-ID staat als footer: `Refs: BOO-123`. De eerste regel blijft puur Conventional Commits.

## Gevolgen

- `git commit --no-verify` blijft mogelijk; CI is de echte poort.
- Zie [conventions.md](../architecture/conventions.md#commits-en-branches).
