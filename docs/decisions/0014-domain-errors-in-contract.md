# 0014. Het contract gebruikt domeinfouten direct

Status: Aanvaard (2026-11-04)

## Context

Een aparte set API-fouten naast de domeinfouten betekent dubbele definities en vertaalcode in elke handler, die uit sync kan raken.

## Besluit

- Het contract declareert per endpoint de domeinfouten, met een statuscode (`TodoNotFound` → 404).
- Handlers geven fouten ongewijzigd door.
- Fouten die niet uit het domein komen, zoals `Unauthorized`, staan in `contract/src/shared/`.

## Gevolgen

- Een fout die het endpoint niet declareert, compileert niet.
- Domeinfouten gaan naar de client en bevatten dus alleen veilige velden.
- Zie [errors.md](../architecture/errors.md).
