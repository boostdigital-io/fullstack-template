# Security

De architectuur doet veel van het werk: de web-app heeft geen secrets, input wordt aan de grens van het contract gevalideerd, en het response-schema bepaalt welke velden eruit gaan. De rest zijn vaste afspraken per onderwerp.

> De template is in opbouw. Wat nog niet gebouwd is, staat hier als regel. Onderdelen die nog komen, zijn gemarkeerd met _(komt in BOO-…)_.

## Config en secrets

- Config wordt bij het opstarten gevalideerd met Effect `Config`. Ontbreekt er iets of is een waarde ongeldig, dan faalt de Worker; nooit een stille terugval op een standaardwaarde _(komt in BOO-117)_.
- Secrets lees je als `Config.redacted`, zodat ze nooit leesbaar in logs of foutmeldingen belanden.
- Productie via `wrangler secret`; lokaal via `.dev.vars`, met een `.dev.vars.example` zonder echte waarden. `.dev.vars` staat in `.gitignore`, `.dev.vars.example` niet.
- Alle secrets zitten in de API-Worker. De web-app heeft er geen.
- `.claude/settings.json` weigert het lezen van `.dev.vars` en `.env*` _(komt in BOO-113)_.

## Domeinen, CORS en cookies

Zie [ADR 0018](../decisions/0018-api-subdomain.md). Alles hieronder komt in BOO-124 en BOO-125.

- Web op `app.example.com`, API op `api.example.com`. Op het hoofddomein draaien alleen subdomeinen die je zelf beheert, omdat ze de sessie-cookie ontvangen.
- CORS in de API staat alleen de web-origin toe, met credentials; `Access-Control-Max-Age` beperkt preflights. Lokaal zijn het ook twee origins, dus CORS werkt lokaal hetzelfde als in productie.
- Calls vanuit de server van de web-app gaan via de service binding en hebben geen CORS nodig. Expo heeft geen CORS nodig.
- De domeinen komen uit Wrangler-variabelen en worden gelezen via `Config`, zodat een project ze zonder codewijziging instelt.

## Authenticatie

- Sessies via Better Auth, in de database, met cookies die `HttpOnly`, `Secure` en `SameSite=Lax` zijn, gezet op het hoofddomein (cross-subdomain) _(komt in BOO-124)_.
- E-mailverificatie staat standaard uit en is per project aan te zetten ([ADR 0020](../decisions/0020-optional-email-verification.md)). De port `EmailSender` is er wel, voor wachtwoordreset _(komt in BOO-118)_.
- Rate limiting op auth-endpoints via de limiter van Better Auth, met opslag in de database: geheugenopslag werkt niet op Workers. Per project eventueel aangevuld met Cloudflare-regels.
- CSRF: naast `SameSite=Lax` controleert een `originCheck`-middleware bij elke POST, PUT, PATCH en DELETE de `Origin`-header _(komt in BOO-125)_. Nodig omdat zuster-subdomeinen voor `SameSite` als dezelfde site tellen.

## Autorisatie

- Authenticatie in `authenticationMiddleware`: die zet `CurrentUser` of geeft `Unauthorized` _(komt in BOO-125)_. Autorisatie in domeinregels (`todoRules.ts`), gecontroleerd in de service. Nooit in de handler of de UI.
- Een resource van een andere gebruiker geeft `TodoNotFound` (404), niet 403, zodat niet uitlekt dat hij bestaat. Een 403 alleen voor rechten, zoals "alleen admins" ([ADR 0019](../decisions/0019-not-found-over-forbidden.md)).
- Lijsten filteren in de query zelf op eigenaar, ook als de service al controleert.
- `IdGenerator` maakt willekeurige UUID's, nooit oplopende nummers _(komt in BOO-118)_.

## Input en database

- Elke string in het contract heeft een maximale lengte, elke lijst een maximum aantal items, en paginering een bovengrens.
- Geen SQL met string-interpolatie. Ruwe SQL alleen via de `sql`-template van Drizzle.

## Headers

- De web-app zet `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy` en `frame-ancestors` _(komt in BOO-131)_. Hoe de CSP samengaat met de server-rendering van TanStack Start, verifiëren we daar.
- De API zet `X-Content-Type-Options: nosniff` en stuurt alleen JSON, ook bij 404 en 500 _(komt in BOO-119)_.

## Logging

- Log gebruikers-ID's, nooit e-mailadressen, wachtwoorden, tokens of cookies.
- Defects worden volledig gelogd met de trace-ID; de gebruiker ziet alleen die ID als referentie. Zie [errors.md](errors.md).

## Dependencies

- Bun voert install-scripts alleen uit voor packages in `trustedDependencies` in de root-`package.json`. Die lijst is leeg; een package toevoegen gebeurt bewust, met een reden in de PR.
- Versies zijn exact vastgepind (`exact = true` in `bunfig.toml`).
- Renovate wacht drie dagen na een release voordat het een update voorstelt ([ADR 0025](../decisions/0025-renovate-automerge.md)).
- CI installeert met `--frozen-lockfile`.
