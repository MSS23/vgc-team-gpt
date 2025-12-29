# Goose Desktop MCP-UI Setup

This folder contains configuration for using VGC Team Finder with Goose Desktop, featuring beautiful animated Pokemon sprites and a dark esports-themed UI.

## Features

- **Animated Pokemon Sprites** from Pokemon Showdown
- **Dark Gaming UI** with glowing accents and glassmorphism
- **Team Cards** showing Pokemon, items, rental codes, and pokepaste links
- **Usage Statistics** with visual bar charts
- **Teammate Analysis** with sprite grids

## Setup Instructions

### 1. Install Goose Desktop

Download and install [Goose Desktop](https://block.github.io/goose/) if you haven't already.

### 2. Add the Extension

Open your Goose config file:

**macOS/Linux:**
```bash
~/.config/goose/config.yaml
```

**Windows:**
```
%APPDATA%\goose\config.yaml
```

Add the following under `extensions:`:

```yaml
extensions:
  vgc-team-finder:
    name: VGC Team Finder
    type: sse
    uri: https://vgc-team-gpt.onrender.com/sse
    enabled: true
    description: Search 6000+ Pokemon VGC teams with animated sprites
```

### 3. Restart Goose

Fully restart Goose Desktop to load the extension.

### 4. Test It

Try these prompts in Goose:

- "Search for VGC teams with Incineroar and Flutter Mane"
- "What Pokemon are most used in Regulation J?"
- "Find rental teams with Urshifu"
- "What items do people use on Rillaboom?"
- "Show me Wolfe Glick's teams"
- "Get a random team for inspiration"

## Available Tools

| Tool | Description | UI |
|------|-------------|-----|
| `search_teams` | Search by Pokemon, player, event | Team card grid |
| `random_team` | Get random team | Featured card |
| `get_pokemon_usage` | Usage statistics | Bar chart |
| `get_rental_teams` | Teams with rental codes | Card grid with badges |
| `get_pokemon_teammates` | Common teammates | Sprite grid |
| `get_pokemon_items` | Common items | Item list |
| `get_player_teams` | Player's teams | Card grid |
| `get_tournament_teams` | Event teams | Card grid |
| `get_team_by_rental` | Lookup by rental code | Featured card |
| `get_regulations` | Available regulations | Bar chart |

## UI Preview

The MCP-UI returns beautiful HTML widgets with:

- Dark glassmorphism cards
- Animated Pokemon GIFs from Pokemon Showdown
- Glowing accent colors (red, blue, gold)
- Responsive grid layouts
- Smooth hover animations
- Rental code badges
- Pokepaste link buttons

## Troubleshooting

**Tools not appearing:**
- Make sure Goose is fully restarted
- Check that the config YAML is valid (proper indentation)
- Verify the extension is enabled

**Sprites not loading:**
- Some regional/variant forms may fall back to static sprites
- Network issues may cause temporary sprite failures

**UI not rendering:**
- Ensure you're using Goose Desktop (not CLI)
- MCP-UI requires a client that supports HTML resources

## Local Development

To test locally:

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Update your Goose config to use local server:
   ```yaml
   vgc-team-finder:
     uri: http://localhost:3000/sse
   ```

4. Restart Goose
