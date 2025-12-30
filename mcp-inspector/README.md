# MCP Inspector Testing

This folder contains instructions for testing the VGC Team Finder with [MCP Inspector](https://github.com/anthropics/inspector).

## Quick Start

### Option 1: Use the Web Test Page (Recommended)

Open `test-mcp.html` in your browser - it tests all MCP tools directly via JSON-RPC.

### Option 2: Use MCP Inspector with Local Server

MCP Inspector requires a specific SSE protocol. Run the server locally with the inspector-compatible endpoint:

1. **Start the local server:**
   ```bash
   npm start
   ```

2. **Open MCP Inspector:**
   - Go to https://inspector.tools.anthropic.com/
   - Or run `npx @anthropic-ai/mcp-inspector`

3. **Connect with these settings:**
   - Transport Type: **SSE**
   - URL: `http://localhost:3000/mcp-sse`
   - Connection Type: **Direct** (not Via Proxy)

4. **Test the tools:**
   - Click "Connect"
   - Go to "Tools" tab
   - Try `get_regulations`, `random_team`, `search_teams`, etc.

## Available Tools

| Tool | Description | Example Arguments |
|------|-------------|-------------------|
| `search_teams` | Search by Pokemon, player, event | `{"query": "Incineroar and Flutter Mane"}` |
| `random_team` | Get random team | `{}` or `{"pokemon": "Urshifu"}` |
| `get_pokemon_usage` | Usage statistics | `{"limit": 20}` |
| `get_rental_teams` | Teams with rental codes | `{"pokemon": "Incineroar"}` |
| `get_pokemon_teammates` | Common teammates | `{"pokemon": "Flutter Mane"}` |
| `get_pokemon_items` | Item usage on Pokemon | `{"pokemon": "Incineroar"}` |
| `get_player_teams` | Player's teams | `{"player": "Wolfe"}` |
| `get_tournament_teams` | Event teams | `{"event": "Worlds"}` |
| `get_team_by_rental` | Lookup by rental code | `{"rental_code": "ABC123"}` |
| `get_regulations` | List regulations | `{}` |
| `get_item_usage` | Overall item stats | `{"limit": 20}` |
| `search_pokemon_with_item` | Pokemon + item combo | `{"pokemon": "Incineroar", "item": "Assault Vest"}` |

## Troubleshooting

**Connection Error:**
- Make sure the server is running locally (`npm start`)
- Use `http://localhost:3000/mcp-sse` (not `/sse`)
- Set Connection Type to "Direct"

**Tools not appearing:**
- Click "Refresh" after connecting
- Check the Console tab for errors

**Production Server:**
The production server at `https://vgc-team-gpt.onrender.com` uses `/sse` for Goose/Claude Desktop. For MCP Inspector testing, use the local server with `/mcp-sse`.
