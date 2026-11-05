# 0008. Services zijn functies, één per bestand

Status: Aanvaard (2026-11-04)

## Context

In Effect heet het DI-mechanisme ook "service". Als "service" twee dingen betekent, praten mens en Claude langs elkaar heen. Een klasse met veel methodes wordt bovendien een plek voor merge-conflicten.

## Besluit

- Een service is één handeling van een gebruiker: een functie (`Effect.fn`) in `services/`, één per bestand.
- Services zijn geen Effect services.
- Het Effect-mechanisme heet altijd voluit "Effect service".

## Gevolgen

- De afhankelijkheden van elke service staan in zijn type.
- Twee features raken zelden hetzelfde bestand.
- Zie [conventions.md](../architecture/conventions.md#begrippen).
