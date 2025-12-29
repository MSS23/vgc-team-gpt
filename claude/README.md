# Claude Desktop MCP Setup

This folder contains configuration for using VGC Team Finder with Claude Desktop via MCP (Model Context Protocol).

## Setup Instructions

### Windows

1. Download and install [Claude Desktop](https://claude.ai/download)

2. Find the Claude config file:
   ```
   %APPDATA%\Claude\claude_desktop_config.json
   ```

3. Copy the contents of `claude_desktop_config.json` from this folder into that file.

   If the file doesn't exist, create it. If it exists and has other servers, merge the config:
   ```json
   {
     "mcpServers": {
       "vgc-teams": {
         "command": "npx",
         "args": ["-y", "mcp-remote", "https://vgc-team-gpt.onrender.com/sse"]
       },
       // ... your other servers
     }
   }
   ```

4. Restart Claude Desktop

5. You should see the VGC team tools available in Claude

### macOS

1. Download and install [Claude Desktop](https://claude.ai/download)

2. Find the Claude config file:
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

3. Follow steps 3-5 from Windows instructions above

## Available Tools

Once connected, Claude will have access to these tools:

| Tool | Description |
|------|-------------|
| `search_teams` | Search teams by Pokemon, player, event, item |
| `get_regulations` | List available regulations with team counts |
| `search_pokemon_with_item` | Find Pokemon + item combinations |
| `get_pokemon_teammates` | Common teammates for a Pokemon |
| `get_pokemon_items` | Common items for a Pokemon |
| `random_team` | Get a random team for inspiration |
| `get_pokemon_usage` | Usage statistics |
| `get_team_by_rental` | Look up team by rental code |
| `get_rental_teams` | Teams with rental codes |
| `get_item_usage` | Item usage statistics |
| `get_tournament_teams` | Teams from specific events |
| `get_player_teams` | Teams by player name |

## Example Prompts

- "Search for Regulation G teams with Incineroar and Flutter Mane"
- "What are the most used Pokemon in Reg J?"
- "Find me a random team with Urshifu"
- "What items do people use on Rillaboom?"
- "Show me Wolfe Glick's teams"
- "Find teams from Worlds 2024"

## Local Development

To run the server locally and connect Claude Desktop:

1. Start the server:
   ```bash
   npm start
   ```

2. Update `claude_desktop_config.json` to use local server:
   ```json
   {
     "mcpServers": {
       "vgc-teams": {
         "command": "npx",
         "args": ["-y", "mcp-remote", "http://localhost:3000/sse"]
       }
     }
   }
   ```

3. Restart Claude Desktop

## Troubleshooting

- **Tools not appearing**: Make sure Claude Desktop is fully restarted after config changes
- **Connection errors**: Verify the server is running and accessible
- **npx errors**: Ensure Node.js is installed and in your PATH
