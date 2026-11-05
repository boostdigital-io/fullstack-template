# 0015. Meldingen per `_tag` en taal in de web-app

Status: Aanvaard (2026-11-04)

## Context

Als de server teksten stuurt, zit de taal vast in de API en kan web of mobile ze niet aanpassen. Een i18n-library is voor de basis te zwaar.

## Besluit

- De server stuurt data; de web-app kiest de woorden.
- Meldingen staan per feature in `features/<feature>/messages.ts`, per taal en per `_tag`. Algemene meldingen in `lib/messages.ts`.
- Geen i18n-library in de basis; alleen `nl`.

## Gevolgen

- Het type dwingt een melding af voor elke fout in elke taal.
- Een project kan een i18n-library toevoegen zonder de opbouw te veranderen.
- Zie [errors.md](../architecture/errors.md#vertaalbare-meldingen).
