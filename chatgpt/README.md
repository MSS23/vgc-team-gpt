# ChatGPT Custom GPT Setup

This folder contains configuration for using VGC Team Finder with ChatGPT Custom GPTs.

## Setup Instructions

1. Go to [ChatGPT](https://chat.openai.com) and click "Explore GPTs" > "Create"

2. Configure your GPT:
   - **Name**: VGC Team Finder
   - **Description**: Search 6000+ competitive Pokemon VGC teams, find rental codes, check usage stats, and get team building inspiration.

3. In the "Configure" tab, scroll to "Actions" and click "Create new action"

4. Click "Import from URL" and enter:
   ```
   https://vgc-team-gpt.onrender.com/.well-known/openapi.yaml
   ```

   Or copy the contents of `openapi.yaml` from this folder.

5. Set Authentication to "None"

6. Save and publish your GPT

## Available Actions

| Endpoint | Description |
|----------|-------------|
| `/api/search` | Search teams by Pokemon, player, event |
| `/api/random` | Get a random team for inspiration |
| `/api/rental/{code}` | Look up team by rental code |
| `/api/usage` | Pokemon usage statistics |
| `/api/rentals` | Teams with rental codes |
| `/api/regulations` | List available regulations |
| `/api/teammates/{pokemon}` | Common teammates for a Pokemon |
| `/api/items/{pokemon}` | Common items for a Pokemon |
| `/api/player/{name}` | Teams by player name |

## Example Prompts

- "Find teams with Incineroar and Flutter Mane in Regulation G"
- "What are the most popular Pokemon in Reg J?"
- "Show me rental teams with Urshifu"
- "What items are commonly used on Rillaboom?"
- "Find Wolfe Glick's teams"

## Limitations

- ChatGPT Custom GPTs only support text output (no card UI or images)
- For rich UI with Pokemon sprites, use Claude Desktop with MCP (see `/claude` folder)
