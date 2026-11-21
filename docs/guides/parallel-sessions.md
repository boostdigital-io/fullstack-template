# Parallel werken met worktrees

Eén Linear-issue is één Claude Code-sessie ([ADR 0013](../decisions/0013-human-review.md)). Wil je aan meer issues tegelijk werken, geef dan elke sessie een eigen git worktree. Zo hebben sessies geen last van elkaars branch en wijzigingen.

## Een sessie starten

Claude Code maakt de worktree zelf:

```sh
claude -w boo-123
```

Dit maakt `.claude/worktrees/boo-123/` (staat in `.gitignore`), op een hulpbranch `worktree-boo-123` vanaf `origin/HEAD`, en start de sessie daarin. Start daar het issue met `/issue BOO-123`. De skill maakt de branch met de naam die Linear voorstelt, vanaf `origin/main`.

Afsluiten gaat zoals gewoonlijk. Staat er nog werk in de worktree, dan vraagt Claude Code of hij moet blijven. Verder werken in een bewaarde worktree: `claude -w boo-123 --resume`. Opruimen met de hand: `git worktree remove .claude/worktrees/boo-123` en daarna `git branch -D worktree-boo-123`.

## Per worktree opnieuw

- **`bun install`**. Elke worktree heeft zijn eigen `node_modules`. Bun gebruikt een gedeelde cache, dus dit gaat snel.
- **`.dev.vars`**. Claude Code kopieert dit bestand vanzelf uit de hoofdmap, via `.worktreeinclude`. Pas je `.dev.vars` later aan, kopieer hem dan zelf opnieuw. Maak je een worktree met `git worktree add`, kopieer hem dan ook zelf.
- **De Linear-connector**: niets. Goedkeuring en login gelden per gebruiker, niet per map.

## Gedeeld

- **De Docker-database**. Alle worktrees gebruiken dezelfde lokale Postgres. Integratie- en API-tests delen de testdatabase `fullstack_template_test`. Elke integratietest draait in een transactie die wordt teruggedraaid, dus tests in twee worktrees zien elkaars data niet. Wel migreert elke run de testdatabase: hebben twee branches verschillende migraties, draai hun tests dan niet tegelijk.
- **De git-repository**. Branches, `git fetch` en stashes zijn zichtbaar in alle worktrees. Een branch kan maar in één worktree tegelijk uitgecheckt zijn.
- **Poorten**. Twee dev-servers tegelijk botsen op dezelfde poort. Draai er één, of geef de tweede een andere poort.
