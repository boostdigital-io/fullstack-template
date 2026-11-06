# 0018. API op een eigen subdomein

Status: Aanvaard (2026-11-04)

## Context

De API moet bereikbaar zijn voor de browser en later Expo, los van de web-app. Een eigen subdomein vraagt CORS en cookies die over subdomeinen werken.

## Besluit

- Web op `app.example.com`, API op `api.example.com`.
- CORS staat alleen de web-origin toe, met credentials.
- Sessie-cookies op het hoofddomein (cross-subdomain).
- Een origin-check bij elke POST, PUT, PATCH en DELETE.

## Gevolgen

- Op het hoofddomein draaien alleen subdomeinen die je zelf beheert, omdat ze de sessie-cookie ontvangen.
- Lokaal zijn het ook twee origins, dus CORS werkt lokaal hetzelfde.
- Zie [security.md](../architecture/security.md#domeinen-cors-en-cookies). Komt in BOO-124 en BOO-125.
