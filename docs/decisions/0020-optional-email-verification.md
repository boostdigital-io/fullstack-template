# 0020. E-mailverificatie standaard uit

Status: Aanvaard (2026-11-04)

## Context

Verplichte e-mailverificatie vraagt vanaf dag één een e-mailprovider. Niet elk project heeft die meteen.

## Besluit

- E-mailverificatie staat standaard uit en is per project aan te zetten.
- De port `EmailSender` bestaat wel (voor wachtwoordreset), met een console-adapter voor lokaal gebruik.

## Gevolgen

- Geen vaste e-mailprovider in de basis.
- Een project dat e-mail nodig heeft, voegt een eigen adapter toe in de composition root.
