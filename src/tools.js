/**
 * MCP Tools Definition
 * Defines all available tools for the MCP server
 */

const TOOLS = [
  {
    name: 'search_teams',
    description:
      'Search VGC teams by Pokemon, player, event, item, or regulation. Use "and" to combine terms (e.g., "Flutter Mane and Incineroar", "Worlds", "Reg G"). Searches across all regulations (J, I, H, G, F, E, D, C).',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query - Pokemon name, player name, event name, item, or regulation. Use "and" for multiple terms.',
        },
        regulation: {
          type: 'string',
          description: 'Filter by regulation (J, I, H, G, F, E, D, C). Leave empty for all regulations.',
        },
        limit: {
          type: 'integer',
          description: 'Number of results (default 50, max 500)',
          minimum: 1,
          maximum: 500,
        },
        sort: {
          type: 'string',
          enum: ['recent', 'oldest'],
          description: 'Sort by date',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_regulations',
    description: 'Get list of available regulations and how many teams are in each.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'search_pokemon_with_item',
    description:
      'Find teams where a specific Pokemon holds a specific item (e.g., Incineroar with Assault Vest, Flutter Mane with Choice Specs).',
    inputSchema: {
      type: 'object',
      properties: {
        pokemon: { type: 'string', description: 'Pokemon name (e.g., "Incineroar", "Flutter Mane")' },
        item: { type: 'string', description: 'Item name (e.g., "Assault Vest", "Choice Specs", "Booster Energy")' },
        limit: { type: 'integer', description: 'Number of results (default 20)', minimum: 1, maximum: 100 },
      },
      required: ['pokemon', 'item'],
    },
  },
  {
    name: 'get_pokemon_teammates',
    description: 'Find the most common teammates for a specific Pokemon. Shows which Pokemon are most often paired with your query.',
    inputSchema: {
      type: 'object',
      properties: {
        pokemon: { type: 'string', description: 'Pokemon to find teammates for (e.g., "Incineroar")' },
        limit: { type: 'integer', description: 'Number of teammates to show (default 10)', minimum: 1, maximum: 20 },
      },
      required: ['pokemon'],
    },
  },
  {
    name: 'get_pokemon_items',
    description: 'Find the most common items used on a specific Pokemon.',
    inputSchema: {
      type: 'object',
      properties: {
        pokemon: { type: 'string', description: 'Pokemon name (e.g., "Incineroar", "Flutter Mane")' },
      },
      required: ['pokemon'],
    },
  },
  {
    name: 'random_team',
    description: 'Get a random VGC team for inspiration. Optionally filter by Pokemon to get a random team containing that Pokemon.',
    inputSchema: {
      type: 'object',
      properties: {
        pokemon: { type: 'string', description: 'Optional: Get a random team containing this Pokemon' },
        regulation: { type: 'string', description: 'Optional: Filter by regulation (J, I, H, G, F, E, D, C)' },
      },
      required: [],
    },
  },
  {
    name: 'get_pokemon_usage',
    description: 'Get Pokemon usage statistics showing the most popular Pokemon across all teams in the database.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Number of Pokemon to show (default 20)', minimum: 1, maximum: 100 },
        regulation: { type: 'string', description: 'Optional: Filter by regulation' },
      },
      required: [],
    },
  },
  {
    name: 'get_team_by_rental',
    description: 'Look up a specific team by its rental code. Enter the 6-character code to find the team details.',
    inputSchema: {
      type: 'object',
      properties: {
        rental_code: { type: 'string', description: 'The rental code (e.g., "6NDSP1")' },
      },
      required: ['rental_code'],
    },
  },
  {
    name: 'get_rental_teams',
    description: 'Get teams that have rental codes available, optionally filtered by Pokemon.',
    inputSchema: {
      type: 'object',
      properties: {
        pokemon: { type: 'string', description: 'Optional: Filter to rental teams with this Pokemon' },
        regulation: { type: 'string', description: 'Optional: Filter by regulation' },
        limit: { type: 'integer', description: 'Number of results (default 20)', minimum: 1, maximum: 100 },
      },
      required: [],
    },
  },
  {
    name: 'get_item_usage',
    description: 'Get held item usage statistics showing the most popular items across all teams.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Number of items to show (default 20)', minimum: 1, maximum: 100 },
      },
      required: [],
    },
  },
  {
    name: 'get_tournament_teams',
    description: 'Get teams from a specific tournament or event type (e.g., "Worlds", "Regionals", "LAIC").',
    inputSchema: {
      type: 'object',
      properties: {
        event: { type: 'string', description: 'Tournament or event name to search for' },
        limit: { type: 'integer', description: 'Number of results (default 20)', minimum: 1, maximum: 100 },
      },
      required: ['event'],
    },
  },
  {
    name: 'get_player_teams',
    description: 'Get all teams from a specific player.',
    inputSchema: {
      type: 'object',
      properties: {
        player: { type: 'string', description: 'Player name to search for' },
        limit: { type: 'integer', description: 'Number of results (default 20)', minimum: 1, maximum: 50 },
      },
      required: ['player'],
    },
  },
];

module.exports = { TOOLS };
