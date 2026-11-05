# 0002. Web en API elk als Cloudflare Worker

Status: Aanvaard (2026-11-04)

## Context

Web en API moeten ergens draaien, in productie en lokaal. Twee platforms betekent twee keer deploy, config en gedrag om te kennen.

## Besluit

- Web (TanStack Start) en API draaien elk als eigen Cloudflare Worker, in productie en lokaal in workerd.
- Deploy met Wrangler.
- Web praat met de API via een service binding.
- Bun draait alleen tooling en scripts. Geen `Bun.*`-API's in code die op Workers draait.

## Gevolgen

- Lokaal draait dezelfde runtime als in productie.
- Een I/O-object, zoals een databaseverbinding, mag niet over requests heen leven. De database-Layer wordt per request opgebouwd.
- Postgres loopt via Hyperdrive. Migraties draaien buiten de Worker.
