# MijnZaken - SSE Demo

Dit is een simpele front-end applicatie om te demonstreren hoe Server-Sent Events (SSE) zouden kunnen werken voor MijnZaken.

Dit project bevat:

- **Front-end voor MijnZaken**, met real-time updates, commenting, planningen, acties en overzichtweergave.
- **Back-end** met een `/events` endpoint.
- **AsyncAPI specificatie** voor het protocol, met daarin schemas voor de verschillende berichten.

## Lokaal draaien

```sh
# Zorg dat pnpm, node, cargo, en shuttle zijn geinstalleerd

# Installeer de vereiste dependencies
pnpm i

# Start de front-end applicatie
pnpm run dev

# Start de back-end applicatie
shuttle run

# Start de AsyncAPI portal voor de specificaties
pnpm run spec
```
