# vgc-team-gpt (VGC Team Finder)

An MCP server and REST API over the public [VGCPastes](https://docs.google.com/spreadsheets/d/1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw)
team sheets (Scarlet/Violet Regulations C to J). Ask "Reg F teams with Flutter Mane and Incineroar", "rental code for this
team", "most common Incineroar items" or "what leads are trending". It works in Claude Desktop, Goose (MCP-UI cards) and as
a ChatGPT Custom GPT action.

Hosted at `https://vgc-team-gpt.onrender.com` (Render free plan, so the first request after idling is slow).

## Run locally

```bash
npm ci
npm start               # PORT defaults to 3000
curl localhost:3000/health
```

On start it fetches every regulation sheet and parses the teams (about 1,200 as of Oct 2026), then refreshes them hourly.
Move, spread, Tera and ability stats are built from each team's Pokepaste the first time they are asked for. There is no
API key or database.

## Endpoints

| Path | What it is |
|---|---|
| `POST /mcp` | MCP JSON-RPC (`initialize`, `tools/list`, `tools/call`) |
| `GET /sse` + `POST /sse/message` | Legacy SSE transport (Claude Desktop through `mcp-remote`, Goose) |
| `GET /mcp-sse` + `POST /mcp-sse/message` | SSE variant for MCP Inspector |
| `GET /api/*` | REST mirror of the tools for the ChatGPT action (`/api/search`, `/api/rental/:code`, `/api/usage`, ...) |
| `GET /.well-known/openapi.yaml` | OpenAPI spec for ChatGPT (copy in `chatgpt/openapi.yaml`) |
| `GET /health`, `GET /validate?pokemon=X` | Health and team count; usage-count sanity check |

## Tools

24 tools, all in `index.js` (`TOOLS`): team search (`search_teams`, `get_top_teams`, `get_tournament_teams`,
`get_player_teams`, `get_similar_teams`, `recommend_teams`, `random_team`), rental codes (`get_team_by_rental`,
`get_rental_teams`), usage (`get_pokemon_usage`, `get_item_usage`, `get_trending`, `get_common_leads`,
`get_pokemon_teammates`, `get_pokemon_items`, `search_pokemon_with_item`), Pokepaste stats (`get_move_usage`,
`get_common_spreads`, `get_tera_usage`, `get_ability_usage`, `get_team_moveset`), analysis (`analyze_team_coverage`,
`get_counters`) and `get_regulations`. Common nicknames (`incin`, `kg`, `lando-t`, ...) are expanded before searching.

## Client setup

- Claude Desktop: [claude/README.md](claude/README.md)
- Goose: [goose/README.md](goose/README.md)
- ChatGPT Custom GPT: [chatgpt/README.md](chatgpt/README.md)
- MCP Inspector and `test-mcp.html`: [mcp-inspector/README.md](mcp-inspector/README.md)

## Layout

`index.js` holds the server, data loading and every tool. `lib/ui-templates.js`, `lib/styles.js` and `lib/sprite-utils.js`
build the Goose MCP-UI HTML. `render.yaml` is the Render blueprint. `preview-search.html` previews the search card.

There are no tests. The quickest check is `npm start`, then `POST /mcp` with `tools/list`.
