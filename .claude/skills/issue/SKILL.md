---

name: issue
description: Werk een Linear-issue uit in één sessie, van issue tot PR. Haalt het issue op, maakt de branch, legt een plan voor en bouwt pas na akkoord.
argument-hint: "[BOO-123]"
disable-model-invocation: true
---

# /issue $0

Werk Linear-issue **$0** uit. Eén issue is één sessie, één branch en één PR ([ADR 0013](../../../docs/decisions/0013-human-review.md)). Het issue is de bron van waarheid en bepaalt de scope: doe niets daarbuiten. Vind je onderweg iets anders, meld het of stel een nieuw issue voor.

Is er geen issue-ID meegegeven, vraag er dan om en stop.

Volg de stappen hieronder in deze volgorde. Sla er geen over; kan een stap niet, zeg dat dan en vraag hoe verder.

## 1. Issue ophalen

- Haal het issue op via de Linear-connector (`get_issue` met `includeRelations: true`) en lees de commentaren (`list_comments`). Commentaren kunnen de beschrijving aanvullen of corrigeren.
- Werkt de connector niet (niet goedgekeurd of niet ingelogd), stop dan en vraag de gebruiker `/mcp` te openen en in te loggen bij Linear.
- Controleer de blokkerende issues (`blockedBy`). Is er een nog niet klaar, meld dat en vraag of je toch begint.
- Zijn de acceptatiecriteria onduidelijk, onvolledig of tegenstrijdig, **stop dan en vraag**. Gok niet.
- Lees ook "Buiten scope", "Notities" en de inklapbare sectie "Agent notes".

## 2. Werkmap controleren

- `git status --porcelain` moet leeg zijn. Is hij dat niet, stop en vraag wat er met de wijzigingen moet gebeuren.
- `git fetch origin`, zodat `origin/main` actueel is.

## 3. Branch maken

- Gebruik `gitBranchName` uit het issue, ongewijzigd.
- Bestaat de branch al (lokaal of op `origin`), vraag dan of de sessie verder moet op die branch. Zo ja: `git switch <branch>`.
- Anders: `git switch -c <branch> origin/main`. Dit werkt ook in een worktree, waar `main` elders uitgecheckt kan zijn.

## 4. Context lezen

- `CLAUDE.md` in de root, en de geneste `CLAUDE.md` van elke workspace die het issue raakt.
- De docs die bij het issue horen, via de tabel "Welk document voor welke vraag" in `CLAUDE.md`, en de ADR's die het issue noemt.
- De patroonbestanden in `docs/patterns/` voor elke library die je gaat gebruiken. Bij een nieuwe feature: de structuur in `example/`.

## 5. Plan voorleggen

Leg een plan voor en **bouw pas na akkoord**. De gebruiker stuurt bij voordat er code is, niet pas in de review. Het plan bevat:

- per acceptatiecriterium hoe je het invult;
- welke bestanden je toevoegt of wijzigt, per laag;
- welke tests je schrijft;
- welke docs je bijwerkt;
- open vragen en keuzes die je hebt gemaakt waar het issue niets over zegt.

Wacht op antwoord. Past de gebruiker het plan aan, leg dan de gewijzigde punten opnieuw voor.

## 6. Bouwen

- Van binnen naar buiten: `packages/domain` → `packages/contract` → `apps/api` → `apps/web`. Sla lagen over die het issue niet raakt.
- Per laag de tests uit `docs/architecture/testing.md`, zodra Vitest er is (BOO-120). Elke nieuwe service: een test voor het succes-pad en een test per fout in zijn signatuur.
- Volg de harde regels en de anti-slop-regels uit `CLAUDE.md`. Geen nieuwe dependency zonder eerst te vragen.

## 7. Controleren

- Draai `bun run check` en los alles op tot hij groen is.
- Heb je adapters of de API geraakt, draai dan ook de integratie- of API-tests, zodra die bestaan (BOO-120).
- Gebruik nooit `bun test`.

## 8. Docs bijwerken

Voeg je een nieuw patroon, commando of map toe, werk dan de docs en `CLAUDE.md` bij. Haal markeringen _(komt in BOO-…)_ weg voor wat dit issue oplevert.

## 9. Committen

- Conventional Commits: `type(scope): onderwerp`, eerste regel maximaal 100 tekens.
- Footer `Refs: $0`, met een lege regel ervoor.
- Liever een paar logische commits dan één grote. De commit-msg-hook controleert de vorm; omzeil hem nooit met `--no-verify`.

## 10. PR openen

- `git push -u origin <branch>`. Nooit naar `main`.
- Schrijf de PR-body naar een tijdelijk bestand (`mktemp`) en open de PR met `gh pr create --title "<eerste commitregel>" --body-file <bestand>`, zodat Markdown en checkboxen intact blijven.
- De body bevat, in deze volgorde:
  1. `Closes $0` als eerste regel, zodat Linear het issue na het mergen sluit;
  2. een korte samenvatting;
  3. de acceptatiecriteria uit het issue, afgevinkt (`- [x]`), met per criterium waar het zit; niet gehaald blijft `- [ ]` met de reden;
  4. bewijzen: uitvoer van `bun run check`, tests of andere controles die niet in de repo blijven;
  5. wat open blijft: vervolgwerk, voorgestelde issues, keuzes voor de reviewer.
- Geef de URL van de PR terug.

## Nooit

- Nooit mergen (`gh pr merge`) en nooit naar `main` pushen. Alleen een mens merget.
- Zet zelf geen status in Linear. De GitHub-integratie van Linear koppelt branch en PR via de branchnaam en zet de status zelf.
- Geen werk buiten de scope van het issue.
