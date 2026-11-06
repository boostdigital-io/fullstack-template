# Foutafhandeling

Verwachte fouten zijn domeinfouten en staan in het type; het contract koppelt ze aan een statuscode, zodat handlers niets vertalen ([ADR 0014](../decisions/0014-domain-errors-in-contract.md)). Onverwachte fouten zijn defects: gelogd, nooit in detail getoond.

> De template is in opbouw. Nog geen van de bestanden hieronder bestaat; dit zijn de regels waar ze aan moeten voldoen. De exacte Effect-API's staan in [effect-schema.md](../patterns/effect-schema.md) en [effect-http-api.md](../patterns/effect-http-api.md).

## Soorten fouten

| Soort               | Voorbeeld                              | Ontstaat in                | HTTP                                    | Gebruiker ziet                   |
| ------------------- | -------------------------------------- | -------------------------- | --------------------------------------- | -------------------------------- |
| Verwacht            | `TodoNotFound`, `TodoTitleTaken`       | domein of service          | per endpoint in het contract (404, 409) | specifieke melding               |
| Geen rechten        | een rechtenfout, zoals "alleen admins" | domein of service          | 403                                     | specifieke melding               |
| Validatie           | titel te lang, veld ontbreekt          | grens van het contract     | 400                                     | melding bij het veld             |
| Niet ingelogd       | `Unauthorized`                         | `authenticationMiddleware` | 401                                     | doorverwijzing naar login        |
| Onverwacht (defect) | database onbereikbaar, bug             | overal                     | 500                                     | algemene melding + referentie-ID |

Een resource van een andere gebruiker geeft `TodoNotFound`, niet een 403, zodat niet uitlekt dat hij bestaat ([ADR 0019](../decisions/0019-not-found-over-forbidden.md)).

## Regels per laag

- **Domein**: fouten zijn `Schema.TaggedError` in `todoErrors.ts` (zie [effect-schema.md](../patterns/effect-schema.md#domeinfout)), met alleen veilige velden zoals een ID, want ze gaan naar de client. Geen teksten voor gebruikers.
- **Adapters**: een port bevat alleen domeinfouten. Een driverfout met betekenis wordt een domeinfout (Postgres `23505` → bijvoorbeeld `TodoTitleTaken`); al het andere wordt een defect via `Effect.orDie`.
- **Services**: fouten stromen door. Afvangen alleen om er echt iets mee te doen; nooit afvangen en opnieuw gooien.
- **Contract**: elk endpoint declareert zijn domeinfouten met statuscode, bijvoorbeeld `error: TodoNotFound.pipe(HttpApiSchema.status(404))` (zie [effect-http-api.md](../patterns/effect-http-api.md#endpoints-en-fouten)). Fouten die niet uit het domein komen, zoals `Unauthorized`, staan in `contract/src/shared/authErrors.ts` _(komt in BOO-125)_.
- **Handlers**: geven fouten ongewijzigd door. Een fout die het endpoint niet declareert, compileert niet.
- **Defects**: HttpApi maakt er een 500 van met een algemene body: geen foutmelding, geen stacktrace, geen interne namen. De volledige fout wordt één keer gelogd, met de trace-ID, en die ID gaat als response-header mee _(komt in BOO-119)_.
- Verwachte fouten (domeinfouten, validatie, 401) worden niet als Error gelogd.

## In de web-app

- `lib/apiClient.ts` is de enige brug van Effect naar TanStack Query en behoudt de getypte fout _(komt in BOO-128)_.
- In loaders wordt `TodoNotFound` een `notFound()`, zodat de route zijn not-found-pagina toont.
- Formulieren valideren in de client met dezelfde contract-Schema's via TanStack Form; de server valideert opnieuw.
- Onverwachte fouten komen in de `errorComponent` van de route: algemene melding, referentie-ID, opnieuw proberen _(komt in BOO-130)_.
- Fouten van Better Auth worden alleen in de auth-formulieren afgehandeld.

## Vertaalbare meldingen

De server stuurt data, de web-app kiest de woorden ([ADR 0015](../decisions/0015-translatable-messages.md)). Meldingen staan per feature in `features/todos/messages.ts`, per taal en per `_tag`; algemene meldingen (onverwacht, niet ingelogd, geen verbinding) staan in `lib/messages.ts` _(komt in BOO-128)_.

```ts
// illustratief
export const todoMessages = {
  nl: {
    TodoNotFound: "Deze todo bestaat niet (meer).",
    TodoTitleTaken: "Je hebt al een todo met deze titel.",
  },
} satisfies Record<Locale, Record<TodoError["_tag"], string>>;
```

Het type dwingt een melding af voor elke fout in elke taal. Een nieuwe domeinfout zonder melding, of een nieuwe taal met een ontbrekende vertaling, compileert niet. De basis bevat alleen `nl` en geen i18n-library; per project kun je er een toevoegen zonder de opbouw te veranderen.

## Eén fout van begin tot eind

1. `getTodo` vindt niets: `TodoRepositoryDrizzle` geeft `TodoNotFound`.
2. De service geeft hem ongewijzigd door.
3. Het contract maakt er een 404 van.
4. De client ontvangt `TodoNotFound`, getypt.
5. De loader roept `notFound()` aan.
6. De gebruiker ziet de not-found-pagina.
