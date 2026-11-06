# 0019. Resource van een ander geeft 404

Status: Aanvaard (2026-11-04)

## Context

Een 403 op een resource van een andere gebruiker verraadt dat die resource bestaat.

## Besluit

- Een resource van een andere gebruiker geeft dezelfde fout als een onbekende ID, zoals `TodoNotFound` (404).
- Een 403 alleen voor rechten, zoals "alleen admins".

## Gevolgen

- Lijsten filteren in de query op eigenaar, ook als de service al controleert.
- Zie [security.md](../architecture/security.md#autorisatie).
