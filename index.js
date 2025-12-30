const express = require('express');
const cors = require('cors');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

// MCP-UI Templates for Goose
const {
  searchTeamsHTML,
  randomTeamHTML,
  pokemonUsageHTML,
  rentalTeamsHTML,
  pokemonTeammatesHTML,
  pokemonItemsHTML,
  playerTeamsHTML,
  tournamentTeamsHTML,
  rentalCodeTeamHTML,
  itemUsageHTML,
  regulationsHTML,
  recommendTeamsHTML
} = require('./lib/ui-templates');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// ============================================
// ABBREVIATION EXPANSION
// Expand common VGC abbreviations to full names
// so LLMs can pass shorthand and it still works
// ============================================

const POKEMON_ABBREVIATIONS = {
  // Common nicknames
  'incin': 'Incineroar',
  'incineroar': 'Incineroar',
  'rilla': 'Rillaboom',
  'amoong': 'Amoonguss',
  'fini': 'Tapu Fini',
  'lele': 'Tapu Lele',
  'koko': 'Tapu Koko',
  'bulu': 'Tapu Bulu',
  'lando': 'Landorus',
  'lando-t': 'Landorus-Therian',
  'landot': 'Landorus-Therian',
  'thundy': 'Thundurus',
  'thundy-i': 'Thundurus',
  'thundy-t': 'Thundurus-Therian',
  'torn': 'Tornadus',
  'torn-i': 'Tornadus',
  'torn-t': 'Tornadus-Therian',

  // Shorthand
  'kg': 'Kingambit',
  'gambit': 'Kingambit',
  'dnite': 'Dragonite',
  'pult': 'Dragapult',
  'ferro': 'Ferrothorn',
  'gastro': 'Gastrodon',
  'ttar': 'Tyranitar',
  'chomp': 'Garchomp',
  'caly': 'Calyrex',
  'caly-s': 'Calyrex-Shadow',
  'caly-i': 'Calyrex-Ice',
  'calys': 'Calyrex-Shadow',
  'calyi': 'Calyrex-Ice',
  'shadow rider': 'Calyrex-Shadow',
  'ice rider': 'Calyrex-Ice',
  'zacian': 'Zacian',
  'zacian-c': 'Zacian-Crowned',
  'zamazenta': 'Zamazenta',
  'kyogre': 'Kyogre',
  'groudon': 'Groudon',
  'pdon': 'Groudon',
  'ogre': 'Kyogre',

  // Gen 9 Pokemon
  'flutter': 'Flutter Mane',
  'fm': 'Flutter Mane',
  'fluttermane': 'Flutter Mane',
  'gouging': 'Gouging Fire',
  'gf': 'Gouging Fire',
  'gougingfire': 'Gouging Fire',
  'raging': 'Raging Bolt',
  'rb': 'Raging Bolt',
  'ragingbolt': 'Raging Bolt',
  'bolt': 'Raging Bolt',
  'iron hands': 'Iron Hands',
  'ih': 'Iron Hands',
  'ironhands': 'Iron Hands',
  'hands': 'Iron Hands',
  'iron crown': 'Iron Crown',
  'ic': 'Iron Crown',
  'ironcrown': 'Iron Crown',
  'crown': 'Iron Crown',
  'iron boulder': 'Iron Boulder',
  'ib': 'Iron Boulder',
  'ironboulder': 'Iron Boulder',
  'boulder': 'Iron Boulder',
  'chien': 'Chien-Pao',
  'cp': 'Chien-Pao',
  'chienpao': 'Chien-Pao',
  'pao': 'Chien-Pao',
  'chi-yu': 'Chi-Yu',
  'chiyu': 'Chi-Yu',
  'chi yu': 'Chi-Yu',
  'ting': 'Ting-Lu',
  'tinglu': 'Ting-Lu',
  'ting lu': 'Ting-Lu',
  'wo': 'Wo-Chien',
  'wochien': 'Wo-Chien',
  'wo chien': 'Wo-Chien',
  'urshifu': 'Urshifu',
  'urshi': 'Urshifu',
  'urshifu-r': 'Urshifu-Rapid-Strike',
  'urshifu-s': 'Urshifu',
  'rapid strike': 'Urshifu-Rapid-Strike',
  'single strike': 'Urshifu',
  'ogerpon': 'Ogerpon',
  'ogerpon-h': 'Ogerpon-Hearthflame',
  'ogerpon-w': 'Ogerpon-Wellspring',
  'ogerpon-c': 'Ogerpon-Cornerstone',
  'hearthflame': 'Ogerpon-Hearthflame',
  'wellspring': 'Ogerpon-Wellspring',
  'cornerstone': 'Ogerpon-Cornerstone',
  'ursaluna': 'Ursaluna',
  'bloodmoon': 'Ursaluna-Bloodmoon',
  'bm ursaluna': 'Ursaluna-Bloodmoon',
  'bmursaluna': 'Ursaluna-Bloodmoon',
  'pelipper': 'Pelipper',
  'peli': 'Pelipper',
  'torkoal': 'Torkoal',
  'tork': 'Torkoal',
  'whimsicott': 'Whimsicott',
  'whims': 'Whimsicott',
  'grimm': 'Grimmsnarl',
  'grimmsnarl': 'Grimmsnarl',
  'arcanine': 'Arcanine',
  'arc': 'Arcanine',
  'arc-h': 'Arcanine-Hisui',
  'hisui arc': 'Arcanine-Hisui',
  'ghold': 'Gholdengo',
  'gholdengo': 'Gholdengo',
  'annihilape': 'Annihilape',
  'ape': 'Annihilape',
  'farigiraf': 'Farigiraf',
  'giraffe': 'Farigiraf',
  'indeedee': 'Indeedee',
  'indeedee-f': 'Indeedee-F',
  'indeedee-m': 'Indeedee',
  'dondozo': 'Dondozo',
  'dozo': 'Dondozo',
  'tatsugiri': 'Tatsugiri',
  'tatsu': 'Tatsugiri',
  'palafin': 'Palafin',
  'pala': 'Palafin',
  'miraidon': 'Miraidon',
  'mirai': 'Miraidon',
  'koraidon': 'Koraidon',
  'korai': 'Koraidon',
  'terapagos': 'Terapagos',
  'tera': 'Terapagos',
  'pecharunt': 'Pecharunt',
  'pech': 'Pecharunt',
  'entei': 'Entei',
  'raikou': 'Raikou',
  'suicune': 'Suicune',
  'cune': 'Suicune'
};

const ITEM_ABBREVIATIONS = {
  // Common items
  'av': 'Assault Vest',
  'assault vest': 'Assault Vest',
  'lo': 'Life Orb',
  'life orb': 'Life Orb',
  'cb': 'Choice Band',
  'choice band': 'Choice Band',
  'band': 'Choice Band',
  'cs': 'Choice Specs',
  'choice specs': 'Choice Specs',
  'specs': 'Choice Specs',
  'scarf': 'Choice Scarf',
  'choice scarf': 'Choice Scarf',
  'sash': 'Focus Sash',
  'focus sash': 'Focus Sash',
  'fs': 'Focus Sash',
  'lefties': 'Leftovers',
  'leftovers': 'Leftovers',
  'lo': 'Life Orb',
  'orb': 'Life Orb',
  'sitrus': 'Sitrus Berry',
  'sitrus berry': 'Sitrus Berry',
  'lum': 'Lum Berry',
  'lum berry': 'Lum Berry',
  'berry': 'Sitrus Berry',
  'be': 'Booster Energy',
  'booster': 'Booster Energy',
  'booster energy': 'Booster Energy',
  'wp': 'Weakness Policy',
  'weakness policy': 'Weakness Policy',
  'policy': 'Weakness Policy',
  'goggles': 'Safety Goggles',
  'safety goggles': 'Safety Goggles',
  'sg': 'Safety Goggles',
  'eviolite': 'Eviolite',
  'evio': 'Eviolite',
  'boots': 'Heavy-Duty Boots',
  'heavy duty boots': 'Heavy-Duty Boots',
  'hdb': 'Heavy-Duty Boots',
  'mental herb': 'Mental Herb',
  'herb': 'Mental Herb',
  'mh': 'Mental Herb',
  'aguav': 'Aguav Berry',
  'aguav berry': 'Aguav Berry',
  'figy': 'Figy Berry',
  'figy berry': 'Figy Berry',
  'covert cloak': 'Covert Cloak',
  'cloak': 'Covert Cloak',
  'cc': 'Covert Cloak',
  'loaded dice': 'Loaded Dice',
  'dice': 'Loaded Dice',
  'ld': 'Loaded Dice',
  'clear amulet': 'Clear Amulet',
  'amulet': 'Clear Amulet',
  'ca': 'Clear Amulet',
  'mirror herb': 'Mirror Herb',
  'mirror': 'Mirror Herb',
  'shuca': 'Shuca Berry',
  'shuca berry': 'Shuca Berry',
  'yache': 'Yache Berry',
  'yache berry': 'Yache Berry',
  'chople': 'Chople Berry',
  'chople berry': 'Chople Berry',
  'rocky helmet': 'Rocky Helmet',
  'helmet': 'Rocky Helmet',
  'rh': 'Rocky Helmet',
  'throat spray': 'Throat Spray',
  'spray': 'Throat Spray',
  'ts': 'Throat Spray',
  'terrain extender': 'Terrain Extender',
  'extender': 'Terrain Extender',
  'te': 'Terrain Extender',
  'protective pads': 'Protective Pads',
  'pads': 'Protective Pads',
  'pp': 'Protective Pads'
};

// ============================================
// PLAYSTYLE & ARCHETYPE DETECTION
// Used for recommend_teams tool
// ============================================

const PLAYSTYLE_KEYWORDS = {
  // Offensive archetypes
  'hyper offense': ['hyper offense', 'hyper', 'aggressive', 'all-out', 'glass cannon'],
  'offense': ['offense', 'offensive', 'sweeper', 'attacker'],

  // Defensive/Balanced
  'balance': ['balance', 'balanced', 'bulky balance'],
  'bulky': ['bulky', 'defensive', 'tank', 'wall', 'bulk'],
  'stall': ['stall', 'defensive wall'],

  // Weather
  'rain': ['rain', 'drizzle', 'rain team'],
  'sun': ['sun', 'drought', 'sun team'],
  'sand': ['sand', 'sandstorm', 'sand team'],
  'snow': ['snow', 'hail', 'aurora veil'],

  // Speed control
  'trick room': ['trick room', 'tr ', 'slow mode'],
  'tailwind': ['tailwind', 'speed control'],

  // Specific strategies
  'setup': ['setup', 'boost', 'calm mind', 'swords dance', 'nasty plot'],
  'redirection': ['follow me', 'rage powder', 'redirection'],
  'terrain': ['terrain', 'psychic terrain', 'grassy terrain', 'electric terrain']
};

// Pokemon that indicate specific archetypes
const ARCHETYPE_POKEMON = {
  'rain': ['Kyogre', 'Pelipper', 'Tornadus', 'Urshifu-Rapid-Strike', 'Palafin', 'Barraskewda'],
  'sun': ['Groudon', 'Torkoal', 'Koraidon', 'Gouging Fire', 'Walking Wake', 'Venusaur'],
  'trick room': ['Porygon2', 'Dusclops', 'Hatterene', 'Indeedee-F', 'Armarouge', 'Ursaluna', 'Torkoal', 'Cresselia'],
  'hyper offense': ['Flutter Mane', 'Chien-Pao', 'Chi-Yu', 'Miraidon', 'Calyrex-Shadow', 'Iron Bundle'],
  'balance': ['Incineroar', 'Rillaboom', 'Amoonguss', 'Landorus-Therian', 'Farigiraf'],
  'sand': ['Tyranitar', 'Excadrill', 'Garchomp'],
  'tailwind': ['Tornadus', 'Whimsicott', 'Talonflame', 'Murkrow']
};

/**
 * Expand Pokemon abbreviation to full name
 */
function expandPokemonName(name) {
  if (!name) return name;
  const lower = name.toLowerCase().trim();
  return POKEMON_ABBREVIATIONS[lower] || name;
}

/**
 * Expand item abbreviation to full name
 */
function expandItemName(name) {
  if (!name) return name;
  const lower = name.toLowerCase().trim();
  return ITEM_ABBREVIATIONS[lower] || name;
}

let teams = [];

// VGCPastes public repository - multiple regulation sheets
const SPREADSHEET_ID = '1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw';
const REGULATIONS = [
  { name: 'J', sheet: 'SV Regulation J' },
  { name: 'I', sheet: 'SV Regulation I' },
  { name: 'H', sheet: 'SV Regulation H' },
  { name: 'G', sheet: 'SV Regulation G' },
  { name: 'F', sheet: 'SV Regulation F' },
  { name: 'E', sheet: 'SV Regulation E' },
  { name: 'D', sheet: 'SV Regulation D' },
  { name: 'C', sheet: 'SV Regulation C' }
];

// Helper to generate sprite URL
const getSpriteUrl = (name) => {
  if (!name) return null;
  let slug = name.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[''.]/g, '')
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .replace(/:/g, '');
  return `https://img.pokemondb.net/sprites/home/normal/${slug}.png`;
};

async function fetchSheetData(regulation) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(regulation.sheet)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`  ⚠️ Could not fetch ${regulation.sheet}: ${res.status}`);
      return [];
    }

    const csvData = await res.text();
    const records = parse(csvData, {
      columns: false,
      skip_empty_lines: true,
      relax_column_count: true,
      quote: '"',
      escape: '"'
    });

    // Skip header rows (first 2-3 rows are headers/info)
    const dataRows = records.slice(3);

    // VGCPastes CSV format (from actual CSV output):
    // 0: Team ID
    // 1: Description
    // 3: Player name
    // 7,10,13,16,19,22: Items (Slot 1-6)
    // 24: Pokepaste URL
    // 28: Rental Code
    // 29: Date
    // 30: Event
    // 31: Rank
    // 32: Source Link
    // 33: Video Link
    // 35: Owner
    // 37-42: Pokemon names (Slot 1-6)

    const itemIndices = [7, 10, 13, 16, 19, 22];
    const pokemonIndices = [37, 38, 39, 40, 41, 42];

    const sheetTeams = dataRows.map((cols, rowIdx) => {
      // Skip empty rows or rows without team ID
      const teamId = (cols[0] || '').trim();
      if (!teamId || teamId.toLowerCase() === 'team id' || !teamId.match(/^[A-Z]\d+$/i)) return null;

      // Get Pokemon names from columns 37-42
      const pokemonNames = pokemonIndices.map(i => (cols[i] || '').trim()).filter(p => p && p !== '-');

      // Get items from columns 7,10,13,16,19,22
      const items = itemIndices.map(i => (cols[i] || '').trim());

      // Build Pokemon array with items
      const teamPokemon = pokemonNames.map((name, i) => ({
        name,
        item: items[i] || 'Unknown',
        sprite: getSpriteUrl(name)
      })).filter(p => p.name);

      // If no Pokemon found, skip this row
      if (teamPokemon.length === 0) return null;

      // Extract fields
      const description = (cols[1] || '').trim();
      const player = (cols[3] || '').trim();
      const pokepaste = (cols[24] || '').trim();
      const rentalCode = (cols[28] || '').trim();
      const date = (cols[29] || '').trim();
      const event = (cols[30] || '').trim();
      const rank = (cols[31] || '').trim();
      const sourceLink = (cols[32] || '').trim();
      const videoLink = (cols[33] || '').trim();

      // Parse date
      let dateValue = 0;
      if (date) {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          dateValue = parsed.getTime();
        }
      }

      return {
        teamId,
        description,
        player,
        pokemon: teamPokemon,
        pokepaste: pokepaste.startsWith('http') ? pokepaste : (pokepaste ? `https://${pokepaste}` : ''),
        rentalCode: /^[A-Z0-9]{6}$/i.test(rentalCode) ? rentalCode.toUpperCase() : '',
        date,
        dateValue,
        event,
        rank,
        sourceLink,
        videoLink,
        regulation: regulation.name,
        format: `Regulation ${regulation.name}`
      };
    }).filter(t => t !== null);

    return sheetTeams;
  } catch (e) {
    console.log(`  ❌ Error fetching ${regulation.sheet}:`, e.message);
    return [];
  }
}

async function fetchTeams() {
  try {
    console.log('Fetching teams from VGCPastes repository...');

    const allTeams = [];

    for (const reg of REGULATIONS) {
      console.log(`  Fetching ${reg.sheet}...`);
      const sheetTeams = await fetchSheetData(reg);
      console.log(`    ✓ Loaded ${sheetTeams.length} teams from ${reg.sheet}`);
      allTeams.push(...sheetTeams);
    }

    teams = allTeams;

    console.log(`\n✅ Total: ${teams.length} teams loaded across ${REGULATIONS.length} regulations`);

    // Count by regulation
    const regCounts = {};
    teams.forEach(t => {
      regCounts[t.regulation] = (regCounts[t.regulation] || 0) + 1;
    });
    console.log('Teams by regulation:', regCounts);

    if (teams.length > 0) {
      console.log('Sample Team:', JSON.stringify(teams[0], null, 2));
    }
  } catch (e) {
    console.error('Data fetch error:', e);
  }
}
fetchTeams();

// Refresh data every hour
setInterval(fetchTeams, 60 * 60 * 1000);

const TOOLS = [
  {
    name: 'search_teams',
    description: 'Search VGC teams by Pokemon, player, event, item, or regulation. Use "and" to combine terms (e.g., "Flutter Mane and Incineroar", "Worlds", "Reg G"). Searches across all regulations (J, I, H, G, F, E, D, C).',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query - Pokemon name, player name, event name, item, or regulation. Use "and" for multiple terms.' },
        regulation: { type: 'string', description: 'Filter by regulation (J, I, H, G, F, E, D, C). Leave empty for all regulations.' },
        limit: { type: 'integer', description: 'Number of results (default 50, max 500)', minimum: 1, maximum: 500 },
        sort: { type: 'string', enum: ['recent', 'oldest'], description: 'Sort by date' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_regulations',
    description: 'Get list of available regulations and how many teams are in each.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'search_pokemon_with_item',
    description: 'Find teams where a specific Pokemon holds a specific item (e.g., Incineroar with Assault Vest, Flutter Mane with Choice Specs).',
    inputSchema: {
      type: 'object',
      properties: {
        pokemon: { type: 'string', description: 'Pokemon name (e.g., "Incineroar", "Flutter Mane")' },
        item: { type: 'string', description: 'Item name (e.g., "Assault Vest", "Choice Specs", "Booster Energy")' },
        limit: { type: 'integer', description: 'Number of results (default 20)', minimum: 1, maximum: 100 }
      },
      required: ['pokemon', 'item']
    }
  },
  {
    name: 'get_pokemon_teammates',
    description: 'Find the most common teammates for a specific Pokemon. Shows which Pokemon are most often paired with your query.',
    inputSchema: {
      type: 'object',
      properties: {
        pokemon: { type: 'string', description: 'Pokemon to find teammates for (e.g., "Incineroar")' },
        limit: { type: 'integer', description: 'Number of teammates to show (default 10)', minimum: 1, maximum: 20 }
      },
      required: ['pokemon']
    }
  },
  {
    name: 'get_pokemon_items',
    description: 'Find the most common items used on a specific Pokemon.',
    inputSchema: {
      type: 'object',
      properties: {
        pokemon: { type: 'string', description: 'Pokemon name (e.g., "Incineroar", "Flutter Mane")' }
      },
      required: ['pokemon']
    }
  },
  {
    name: 'random_team',
    description: 'Get a random VGC team for inspiration. Optionally filter by Pokemon to get a random team containing that Pokemon.',
    inputSchema: {
      type: 'object',
      properties: {
        pokemon: { type: 'string', description: 'Optional: Get a random team containing this Pokemon' }
      },
      required: []
    }
  },
  {
    name: 'get_pokemon_usage',
    description: 'Get Pokemon usage statistics showing the most popular Pokemon across all teams in the database.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Number of Pokemon to show (default 20)', minimum: 1, maximum: 100 }
      },
      required: []
    }
  },
  {
    name: 'get_team_by_rental',
    description: 'Look up a specific team by its rental code. Enter the 6-character code to find the team details.',
    inputSchema: {
      type: 'object',
      properties: {
        rental_code: { type: 'string', description: 'The rental code (e.g., "6NDSP1")' }
      },
      required: ['rental_code']
    }
  },
  {
    name: 'get_rental_teams',
    description: 'Get teams that have rental codes available, optionally filtered by Pokemon.',
    inputSchema: {
      type: 'object',
      properties: {
        pokemon: { type: 'string', description: 'Optional: Filter to rental teams with this Pokemon' },
        limit: { type: 'integer', description: 'Number of results (default 20)', minimum: 1, maximum: 100 }
      },
      required: []
    }
  },
  {
    name: 'get_item_usage',
    description: 'Get held item usage statistics showing the most popular items across all teams.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Number of items to show (default 20)', minimum: 1, maximum: 100 }
      },
      required: []
    }
  },
  {
    name: 'get_tournament_teams',
    description: 'Get teams from a specific tournament or event type (e.g., "Worlds", "Regionals", "LAIC").',
    inputSchema: {
      type: 'object',
      properties: {
        event: { type: 'string', description: 'Tournament or event name to search for' },
        limit: { type: 'integer', description: 'Number of results (default 20)', minimum: 1, maximum: 100 }
      },
      required: ['event']
    }
  },
  {
    name: 'get_player_teams',
    description: 'Get all teams from a specific player.',
    inputSchema: {
      type: 'object',
      properties: {
        player: { type: 'string', description: 'Player name to search for' },
        limit: { type: 'integer', description: 'Number of results (default 20)', minimum: 1, maximum: 50 }
      },
      required: ['player']
    }
  },
  {
    name: 'recommend_teams',
    description: 'Get team recommendations based on your playstyle or Pokemon you enjoy. Describe what kind of player you are (e.g., "I like hyper offense", "I prefer trick room", "I enjoy rain teams") or mention Pokemon you had fun with (e.g., "I liked teams with Entei and Ogerpon", "the teams I enjoyed most had Flutter Mane").',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Describe your playstyle preferences or Pokemon you enjoy'
        },
        regulation: {
          type: 'string',
          description: 'Optional: Filter to specific regulation (J, I, H, G, F, E, D, C)'
        },
        limit: {
          type: 'integer',
          description: 'Number of recommendations (default 10)',
          minimum: 1,
          maximum: 50
        }
      },
      required: ['description']
    }
  }
];

function handleMethod(method, params) {
  if (method === 'initialize') {
    return {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {}
      },
      serverInfo: { name: 'vgc-team-finder', version: '2.0.0' }
    };
  }
  if (method === 'tools/list') {
    return { tools: TOOLS };
  }
  // Helper to normalize names for comparison (remove spaces, hyphens, make lowercase)
  const normalize = (str) => str.toLowerCase().replace(/[-\s]/g, '');

  // Tool: random_team
  if (method === 'tools/call' && params?.name === 'random_team') {
    const pokemonRaw = params.arguments?.pokemon;
    const pokemon = pokemonRaw ? expandPokemonName(pokemonRaw) : null;
    let pool = teams;

    if (pokemon) {
      const pokemonNorm = normalize(pokemon);
      pool = teams.filter(team =>
        team.pokemon.some(p => normalize(p.name).includes(pokemonNorm))
      );
    }

    if (pool.length === 0) {
      return {
        content: [{ type: 'text', text: pokemon ? `No teams found with ${pokemon}.` : 'No teams available.' }]
      };
    }

    const team = pool[Math.floor(Math.random() * pool.length)];
    const pokemonList = team.pokemon.map(p => `${p.name} (${p.item})`).join(' / ');

    let responseText = `🎲 **Random Team${pokemon ? ` with ${pokemon}` : ''}**\n\n`;
    responseText += `**${team.teamId}** — ${team.player} — ${team.description}\n`;
    responseText += `📅 ${team.date} — ${team.event}${team.rank && team.rank !== '-' ? ` (${team.rank})` : ''}\n`;
    responseText += `🔢 ${pokemonList}\n`;
    responseText += `🔗 Pokepaste: ${team.pokepaste}`;
    if (team.rentalCode && team.rentalCode !== 'None') {
      responseText += ` | Rental: ${team.rentalCode}`;
    }

    return {
      content: [
        { type: 'text', text: responseText },
        {
          type: 'resource',
          resource: {
            uri: 'ui://vgc-teams/random_team',
            mimeType: 'text/html',
            text: randomTeamHTML(team, pokemon)
          }
        }
      ],
      structuredContent: { team }
    };
  }

  // Tool: get_pokemon_usage
  if (method === 'tools/call' && params?.name === 'get_pokemon_usage') {
    const limit = Math.min(params.arguments?.limit || 20, 100);
    const usage = {};

    teams.forEach(team => {
      team.pokemon.forEach(p => {
        const name = p.name.trim();
        if (name) {
          usage[name] = (usage[name] || 0) + 1;
        }
      });
    });

    const sorted = Object.entries(usage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    let responseText = `📊 **Pokemon Usage Statistics** (Top ${limit})\n\n`;
    sorted.forEach(([name, count], i) => {
      const percentage = ((count / teams.length) * 100).toFixed(1);
      responseText += `${i + 1}. **${name}** — ${count} teams (${percentage}%)\n`;
    });

    const usageData = sorted.map(([name, count]) => ({ name, count, percentage: ((count / teams.length) * 100).toFixed(1) }));

    return {
      content: [
        { type: 'text', text: responseText },
        {
          type: 'resource',
          resource: {
            uri: 'ui://vgc-teams/get_pokemon_usage',
            mimeType: 'text/html',
            text: pokemonUsageHTML(usageData, teams.length)
          }
        }
      ],
      structuredContent: { totalTeams: teams.length, usage: usageData }
    };
  }

  // Tool: get_item_usage
  if (method === 'tools/call' && params?.name === 'get_item_usage') {
    const limit = Math.min(params.arguments?.limit || 20, 100);
    const usage = {};

    teams.forEach(team => {
      team.pokemon.forEach(p => {
        const item = p.item.trim();
        if (item && item !== 'None') {
          usage[item] = (usage[item] || 0) + 1;
        }
      });
    });

    const sorted = Object.entries(usage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const totalItems = Object.values(usage).reduce((a, b) => a + b, 0);

    let responseText = `🎒 **Item Usage Statistics** (Top ${limit})\n\n`;
    sorted.forEach(([name, count], i) => {
      const percentage = ((count / totalItems) * 100).toFixed(1);
      responseText += `${i + 1}. **${name}** — ${count} uses (${percentage}%)\n`;
    });

    const itemUsageData = sorted.map(([name, count]) => ({ name, count, percentage: ((count / totalItems) * 100).toFixed(1) }));

    return {
      content: [
        { type: 'text', text: responseText },
        {
          type: 'resource',
          resource: {
            uri: 'ui://vgc-teams/get_item_usage',
            mimeType: 'text/html',
            text: itemUsageHTML(itemUsageData, totalItems)
          }
        }
      ],
      structuredContent: { totalItems, usage: itemUsageData }
    };
  }

  // Tool: get_team_by_rental
  if (method === 'tools/call' && params?.name === 'get_team_by_rental') {
    const rentalCode = (params.arguments?.rental_code || '').toUpperCase().trim();

    if (!rentalCode) {
      return { content: [{ type: 'text', text: 'Please provide a rental code.' }] };
    }

    const team = teams.find(t => t.rentalCode.toUpperCase() === rentalCode);

    if (!team) {
      return { content: [{ type: 'text', text: `No team found with rental code: ${rentalCode}` }] };
    }

    const pokemonList = team.pokemon.map(p => `${p.name} (${p.item})`).join(' / ');

    let responseText = `🎫 **Team with Rental Code: ${rentalCode}**\n\n`;
    responseText += `**${team.teamId}** — ${team.player} — ${team.description}\n`;
    responseText += `📅 ${team.date} — ${team.event}${team.rank && team.rank !== '-' ? ` (${team.rank})` : ''}\n`;
    responseText += `🔢 ${pokemonList}\n`;
    responseText += `🔗 Pokepaste: ${team.pokepaste}`;

    return {
      content: [
        { type: 'text', text: responseText },
        {
          type: 'resource',
          resource: {
            uri: 'ui://vgc-teams/get_team_by_rental',
            mimeType: 'text/html',
            text: rentalCodeTeamHTML(team, rentalCode)
          }
        }
      ],
      structuredContent: { team }
    };
  }

  // Tool: search_pokemon_with_item
  if (method === 'tools/call' && params?.name === 'search_pokemon_with_item') {
    // Expand abbreviations (e.g., "Incin" -> "Incineroar", "AV" -> "Assault Vest")
    const pokemonRaw = params.arguments?.pokemon || '';
    const itemRaw = params.arguments?.item || '';
    const pokemon = expandPokemonName(pokemonRaw);
    const item = expandItemName(itemRaw);
    const limit = Math.min(params.arguments?.limit || 20, 100);

    console.log(`[search_pokemon_with_item] Input: "${pokemonRaw}" + "${itemRaw}" -> Expanded: "${pokemon}" + "${item}"`);

    if (!pokemon || !item) {
      return { content: [{ type: 'text', text: 'Please provide both a Pokemon and an item.' }] };
    }

    const pokemonNorm = normalize(pokemon);
    const itemNorm = normalize(item);

    const results = teams.filter(team =>
      team.pokemon.some(p =>
        normalize(p.name).includes(pokemonNorm) &&
        normalize(p.item).includes(itemNorm)
      )
    ).slice(0, limit);

    if (results.length === 0) {
      return { content: [{ type: 'text', text: `No teams found with ${pokemon} holding ${item}.` }] };
    }

    let responseText = `🔍 **Teams with ${pokemon} + ${item}** (${results.length} found)\n\n`;
    results.forEach(team => {
      const pokemonList = team.pokemon.map(p => `${p.name} (${p.item})`).join(' / ');
      responseText += `**${team.teamId}** — ${team.player}\n`;
      responseText += `📅 ${team.date} — ${team.event}\n`;
      responseText += `🔢 ${pokemonList}\n`;
      responseText += `🔗 ${team.pokepaste}${team.rentalCode && team.rentalCode !== 'None' ? ` | Rental: ${team.rentalCode}` : ''}\n\n`;
    });

    return {
      content: [
        { type: 'text', text: responseText },
        {
          type: 'resource',
          resource: {
            uri: 'ui://vgc-teams/search_pokemon_with_item',
            mimeType: 'text/html',
            text: searchTeamsHTML(results, `${pokemon} + ${item}`, results.length)
          }
        }
      ],
      structuredContent: { total: results.length, teams: results }
    };
  }

  // Tool: get_pokemon_teammates
  if (method === 'tools/call' && params?.name === 'get_pokemon_teammates') {
    const pokemonRaw = params.arguments?.pokemon || '';
    const pokemon = expandPokemonName(pokemonRaw);
    const limit = Math.min(params.arguments?.limit || 10, 20);

    if (!pokemon) {
      return { content: [{ type: 'text', text: 'Please provide a Pokemon name.' }] };
    }

    const pokemonNorm = normalize(pokemon);
    const teamsWithPokemon = teams.filter(team =>
      team.pokemon.some(p => normalize(p.name).includes(pokemonNorm))
    );

    if (teamsWithPokemon.length === 0) {
      return { content: [{ type: 'text', text: `No teams found with ${pokemon}.` }] };
    }

    const teammates = {};
    teamsWithPokemon.forEach(team => {
      team.pokemon.forEach(p => {
        const name = p.name.trim();
        if (name && !normalize(name).includes(pokemonNorm)) {
          teammates[name] = (teammates[name] || 0) + 1;
        }
      });
    });

    const sorted = Object.entries(teammates)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    let responseText = `🤝 **Most Common Teammates for ${pokemon}** (from ${teamsWithPokemon.length} teams)\n\n`;
    sorted.forEach(([name, count], i) => {
      const percentage = ((count / teamsWithPokemon.length) * 100).toFixed(1);
      responseText += `${i + 1}. **${name}** — ${count} teams (${percentage}%)\n`;
    });

    const teammatesData = sorted.map(([name, count]) => ({ name, count, percentage: ((count / teamsWithPokemon.length) * 100).toFixed(1) }));

    return {
      content: [
        { type: 'text', text: responseText },
        {
          type: 'resource',
          resource: {
            uri: 'ui://vgc-teams/get_pokemon_teammates',
            mimeType: 'text/html',
            text: pokemonTeammatesHTML(pokemon, teammatesData, teamsWithPokemon.length)
          }
        }
      ],
      structuredContent: { pokemon, totalTeams: teamsWithPokemon.length, teammates: teammatesData }
    };
  }

  // Tool: get_pokemon_items
  if (method === 'tools/call' && params?.name === 'get_pokemon_items') {
    const pokemonRaw = params.arguments?.pokemon || '';
    const pokemon = expandPokemonName(pokemonRaw);

    if (!pokemon) {
      return { content: [{ type: 'text', text: 'Please provide a Pokemon name.' }] };
    }

    const pokemonNorm = normalize(pokemon);
    const items = {};
    let totalCount = 0;

    teams.forEach(team => {
      team.pokemon.forEach(p => {
        if (normalize(p.name).includes(pokemonNorm)) {
          const item = p.item.trim();
          if (item && item !== 'None') {
            items[item] = (items[item] || 0) + 1;
            totalCount++;
          }
        }
      });
    });

    if (totalCount === 0) {
      return { content: [{ type: 'text', text: `No data found for ${pokemon}.` }] };
    }

    const sorted = Object.entries(items)
      .sort((a, b) => b[1] - a[1]);

    let responseText = `🎒 **Items Used on ${pokemon}** (${totalCount} total)\n\n`;
    sorted.forEach(([name, count], i) => {
      const percentage = ((count / totalCount) * 100).toFixed(1);
      responseText += `${i + 1}. **${name}** — ${count} (${percentage}%)\n`;
    });

    const itemsData = sorted.map(([name, count]) => ({ name, count, percentage: ((count / totalCount) * 100).toFixed(1) }));

    return {
      content: [
        { type: 'text', text: responseText },
        {
          type: 'resource',
          resource: {
            uri: 'ui://vgc-teams/get_pokemon_items',
            mimeType: 'text/html',
            text: pokemonItemsHTML(pokemon, itemsData, totalCount)
          }
        }
      ],
      structuredContent: { pokemon, totalCount, items: itemsData }
    };
  }

  // Tool: get_rental_teams
  if (method === 'tools/call' && params?.name === 'get_rental_teams') {
    const pokemonRaw = params.arguments?.pokemon;
    const pokemon = pokemonRaw ? expandPokemonName(pokemonRaw) : null;
    const limit = Math.min(params.arguments?.limit || 20, 100);

    let results = teams.filter(t => t.rentalCode && t.rentalCode !== 'None' && t.rentalCode.length > 0);

    if (pokemon) {
      const pokemonNorm = normalize(pokemon);
      results = results.filter(team =>
        team.pokemon.some(p => normalize(p.name).includes(pokemonNorm))
      );
    }

    results = results.sort((a, b) => b.dateValue - a.dateValue).slice(0, limit);

    if (results.length === 0) {
      return { content: [{ type: 'text', text: pokemon ? `No rental teams found with ${pokemon}.` : 'No rental teams found.' }] };
    }

    let responseText = `🎮 **Rental Teams Available**${pokemon ? ` with ${pokemon}` : ''} (${results.length} shown)\n\n`;
    results.forEach(team => {
      const pokemonList = team.pokemon.map(p => p.name).join(' / ');
      responseText += `**${team.rentalCode}** — ${team.player}\n`;
      responseText += `📅 ${team.date} — ${team.event}\n`;
      responseText += `🔢 ${pokemonList}\n`;
      responseText += `🔗 ${team.pokepaste}\n\n`;
    });

    return {
      content: [
        { type: 'text', text: responseText },
        {
          type: 'resource',
          resource: {
            uri: 'ui://vgc-teams/get_rental_teams',
            mimeType: 'text/html',
            text: rentalTeamsHTML(results, pokemon)
          }
        }
      ],
      structuredContent: { total: results.length, teams: results }
    };
  }

  // Tool: get_tournament_teams
  if (method === 'tools/call' && params?.name === 'get_tournament_teams') {
    const event = params.arguments?.event || '';
    const limit = Math.min(params.arguments?.limit || 20, 100);

    if (!event) {
      return { content: [{ type: 'text', text: 'Please provide a tournament or event name.' }] };
    }

    const eventNorm = normalize(event);
    const results = teams.filter(team =>
      normalize(team.event).includes(eventNorm) ||
      normalize(team.description).includes(eventNorm)
    ).sort((a, b) => b.dateValue - a.dateValue).slice(0, limit);

    if (results.length === 0) {
      return { content: [{ type: 'text', text: `No teams found from "${event}".` }] };
    }

    let responseText = `🏆 **Teams from "${event}"** (${results.length} shown)\n\n`;
    results.forEach(team => {
      const pokemonList = team.pokemon.map(p => p.name).join(' / ');
      responseText += `**${team.teamId}** — ${team.player}${team.rank && team.rank !== '-' ? ` (${team.rank})` : ''}\n`;
      responseText += `📅 ${team.date} — ${team.event}\n`;
      responseText += `🔢 ${pokemonList}\n`;
      responseText += `🔗 ${team.pokepaste}${team.rentalCode && team.rentalCode !== 'None' ? ` | Rental: ${team.rentalCode}` : ''}\n\n`;
    });

    return {
      content: [
        { type: 'text', text: responseText },
        {
          type: 'resource',
          resource: {
            uri: 'ui://vgc-teams/get_tournament_teams',
            mimeType: 'text/html',
            text: tournamentTeamsHTML(event, results)
          }
        }
      ],
      structuredContent: { total: results.length, teams: results }
    };
  }

  // Tool: get_player_teams
  if (method === 'tools/call' && params?.name === 'get_player_teams') {
    const player = params.arguments?.player || '';
    const limit = Math.min(params.arguments?.limit || 20, 50);

    if (!player) {
      return { content: [{ type: 'text', text: 'Please provide a player name.' }] };
    }

    const playerNorm = normalize(player);
    const results = teams.filter(team =>
      normalize(team.player).includes(playerNorm) ||
      normalize(team.owner).includes(playerNorm)
    ).sort((a, b) => b.dateValue - a.dateValue).slice(0, limit);

    if (results.length === 0) {
      return { content: [{ type: 'text', text: `No teams found for player "${player}".` }] };
    }

    let responseText = `👤 **Teams by ${player}** (${results.length} shown)\n\n`;
    results.forEach(team => {
      const pokemonList = team.pokemon.map(p => p.name).join(' / ');
      responseText += `**${team.teamId}** — ${team.description}\n`;
      responseText += `📅 ${team.date} — ${team.event}${team.rank && team.rank !== '-' ? ` (${team.rank})` : ''}\n`;
      responseText += `🔢 ${pokemonList}\n`;
      responseText += `🔗 ${team.pokepaste}${team.rentalCode && team.rentalCode !== 'None' ? ` | Rental: ${team.rentalCode}` : ''}\n\n`;
    });

    return {
      content: [
        { type: 'text', text: responseText },
        {
          type: 'resource',
          resource: {
            uri: 'ui://vgc-teams/get_player_teams',
            mimeType: 'text/html',
            text: playerTeamsHTML(player, results)
          }
        }
      ],
      structuredContent: { total: results.length, teams: results }
    };
  }

  // Tool: get_regulations
  if (method === 'tools/call' && params?.name === 'get_regulations') {
    const regCounts = {};
    teams.forEach(t => {
      regCounts[t.regulation] = (regCounts[t.regulation] || 0) + 1;
    });

    const sorted = Object.entries(regCounts)
      .sort((a, b) => {
        // Sort by regulation letter (J is most recent)
        return a[0].localeCompare(b[0]);
      });

    let responseText = `📋 **Available Regulations** (${teams.length} total teams)\n\n`;
    sorted.forEach(([reg, count]) => {
      responseText += `**Regulation ${reg}** — ${count} teams\n`;
    });

    const regulationsData = sorted.map(([name, count]) => ({ name, count }));

    return {
      content: [
        { type: 'text', text: responseText },
        {
          type: 'resource',
          resource: {
            uri: 'ui://vgc-teams/get_regulations',
            mimeType: 'text/html',
            text: regulationsHTML(regulationsData, teams.length)
          }
        }
      ],
      structuredContent: { totalTeams: teams.length, regulations: regulationsData }
    };
  }

  // Tool: search_teams
  if (method === 'tools/call' && params?.name === 'search_teams') {
    let q = (params.arguments?.query || '').toLowerCase();
    const regulation = (params.arguments?.regulation || '').toUpperCase();
    const limit = Math.min(params.arguments?.limit || 50, 500);
    const sort = params.arguments?.sort || 'recent';

    // Strip common filler words/phrases from natural language queries
    const fillerPatterns = [
      /^(find|search|show|get|give|list|display)\s+(me\s+)?(all\s+)?(the\s+)?/i,
      /^(pokemon\s+)?(vgc\s+)?(teams?\s+)?(with|containing|using|that\s+have|that\s+use|featuring)\s+/i,
      /^(what|which)\s+(are\s+)?(the\s+)?(pokemon\s+)?(vgc\s+)?(teams?\s+)?(with|containing|using)\s+/i,
      /\s+(teams?|pokemon)$/i
    ];

    for (const pattern of fillerPatterns) {
      q = q.replace(pattern, '');
    }
    q = q.trim();

    console.log('Total teams in database:', teams.length);
    console.log('Search query:', q);
    console.log('Regulation filter:', regulation || 'all');

    // Split by "and" first to get separate Pokemon/terms, then trim
    // Also expand abbreviations (e.g., "KG" -> "Kingambit", "Incin" -> "Incineroar")
    const searchTerms = q.split(/\s+and\s+/)
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => {
        // Try to expand as Pokemon abbreviation first
        const expanded = expandPokemonName(t);
        // If it expanded, use that; otherwise keep original
        return expanded !== t ? expanded : t;
      });

    console.log('Search terms (after abbreviation expansion):', searchTerms);

    // Start with regulation filter if specified
    let pool = teams;
    if (regulation) {
      pool = teams.filter(t => t.regulation === regulation);
      console.log(`Filtered to ${pool.length} teams in Regulation ${regulation}`);
    }

    let results = pool.filter(team => {
      const pokemonNames = team.pokemon.map(p => p.name.toLowerCase());
      const pokemonNamesNormalized = team.pokemon.map(p => normalize(p.name));
      const itemNames = team.pokemon.map(p => p.item.toLowerCase());
      const player = team.player.toLowerCase();
      const event = team.event.toLowerCase();
      const desc = team.description.toLowerCase();
      const format = team.format.toLowerCase();

      // Create searchable blob with spaces preserved
      const searchBlob = [player, event, desc, format, ...pokemonNames, ...itemNames].join(' ');
      const searchBlobNormalized = normalize(searchBlob);

      return searchTerms.every(term => {
        const termNormalized = normalize(term);

        // Check exact match in blob
        if (searchBlob.includes(term)) return true;

        // Check normalized match (fluttermane matches Flutter Mane, Flutter-Mane, etc.)
        if (searchBlobNormalized.includes(termNormalized)) return true;

        // Check each Pokemon name individually
        if (pokemonNamesNormalized.some(name => name.includes(termNormalized))) return true;

        // Check regulation match (e.g., "reg j" or just "j")
        if (term.includes('reg') || term.length === 1) {
          const regLetter = term.replace(/reg\s*/i, '').toUpperCase();
          if (team.regulation === regLetter) return true;
        }

        return false;
      });
    });

    console.log('Matching teams found:', results.length);

    if (sort === 'oldest') {
      results.sort((a, b) => a.dateValue - b.dateValue);
    } else {
      results.sort((a, b) => b.dateValue - a.dateValue);
    }

    const finalTeams = results.slice(0, limit);

    let responseText = `Found ${results.length} teams matching your search${regulation ? ` (Regulation ${regulation})` : ''}\n\n`;
    finalTeams.forEach(team => {
      const pokemonList = team.pokemon.map(p => `${p.name} (${p.item})`).join(' / ');
      responseText += `**${team.teamId}** [Reg ${team.regulation}] — ${team.player} — ${team.description}\n`;
      responseText += `📅 ${team.date} — ${team.event}${team.rank && team.rank !== '-' ? ` (${team.rank})` : ''}\n`;
      responseText += `🎮 Pokemon: ${pokemonList}\n`;
      if (team.rentalCode && team.rentalCode !== 'None' && team.rentalCode.length > 0) {
        responseText += `🎯 **RENTAL CODE: ${team.rentalCode}**\n`;
      }
      if (team.pokepaste) {
        responseText += `📋 **Pokepaste:** ${team.pokepaste}\n`;
      }
      responseText += '\n';
    });

    return {
      content: [
        { type: 'text', text: responseText },
        {
          type: 'resource',
          resource: {
            uri: 'ui://vgc-teams/search_teams',
            mimeType: 'text/html',
            text: searchTeamsHTML(finalTeams, q, results.length)
          }
        }
      ],
      structuredContent: { total: results.length, teams: finalTeams }
    };
  }

  // Tool: recommend_teams
  if (method === 'tools/call' && params?.name === 'recommend_teams') {
    const userDesc = (params.arguments?.description || '').toLowerCase();
    const regulation = (params.arguments?.regulation || '').toUpperCase();
    const limit = Math.min(params.arguments?.limit || 10, 50);

    console.log(`[recommend_teams] User description: "${userDesc}"`);

    // Extract Pokemon mentions from user description
    const mentionedPokemon = new Set();

    // Check against Pokemon abbreviations
    for (const [abbrev, fullName] of Object.entries(POKEMON_ABBREVIATIONS)) {
      // Only match if it's a word boundary match (not partial matches)
      const regex = new RegExp(`\\b${abbrev.replace(/[-\s]/g, '[-\\s]?')}\\b`, 'i');
      if (regex.test(userDesc)) {
        mentionedPokemon.add(fullName);
      }
    }

    // Also check for full Pokemon names from ARCHETYPE_POKEMON
    for (const pokemonList of Object.values(ARCHETYPE_POKEMON)) {
      for (const pokemon of pokemonList) {
        if (userDesc.includes(pokemon.toLowerCase())) {
          mentionedPokemon.add(pokemon);
        }
      }
    }

    // Detect playstyle keywords
    const detectedArchetypes = new Set();
    for (const [archetype, keywords] of Object.entries(PLAYSTYLE_KEYWORDS)) {
      if (keywords.some(kw => userDesc.includes(kw.toLowerCase()))) {
        detectedArchetypes.add(archetype);
      }
    }

    // Also detect archetype from mentioned Pokemon
    for (const pokemon of mentionedPokemon) {
      for (const [archetype, pokemonList] of Object.entries(ARCHETYPE_POKEMON)) {
        if (pokemonList.includes(pokemon)) {
          detectedArchetypes.add(archetype);
        }
      }
    }

    const mentionedArray = [...mentionedPokemon];
    const archetypeArray = [...detectedArchetypes];

    console.log(`[recommend_teams] Detected Pokemon: ${mentionedArray.join(', ')}`);
    console.log(`[recommend_teams] Detected archetypes: ${archetypeArray.join(', ')}`);

    // Start with all teams, optionally filter by regulation
    let pool = teams;
    if (regulation) {
      pool = pool.filter(t => t.regulation === regulation);
    }

    // Score each team based on matches
    const scoredTeams = pool.map(team => {
      let score = 0;
      const matchReasons = [];

      const teamPokemonNames = team.pokemon.map(p => p.name);
      const teamDescLower = team.description.toLowerCase();

      // Score for mentioned Pokemon (highest weight)
      for (const pokemon of mentionedArray) {
        const pokemonNorm = normalize(pokemon);
        if (teamPokemonNames.some(p => normalize(p).includes(pokemonNorm))) {
          score += 10;
          matchReasons.push(`Has ${pokemon}`);
        }
      }

      // Score for archetype keywords in team description
      for (const archetype of archetypeArray) {
        if (teamDescLower.includes(archetype)) {
          score += 5;
          matchReasons.push(`${archetype} team`);
        }
      }

      // Score for archetype-indicating Pokemon on team
      for (const archetype of archetypeArray) {
        const archetypePokemon = ARCHETYPE_POKEMON[archetype] || [];
        for (const pokemon of archetypePokemon) {
          if (teamPokemonNames.some(p => normalize(p).includes(normalize(pokemon)))) {
            score += 3;
            if (!matchReasons.some(r => r.includes(pokemon))) {
              matchReasons.push(`Has ${pokemon} (${archetype})`);
            }
          }
        }
      }

      // Bonus for having rental code (easier to try)
      if (team.rentalCode && team.rentalCode !== 'None' && team.rentalCode.length > 0) {
        score += 2;
      }

      // Slight recency bonus
      if (team.dateValue) {
        const ageInDays = (Date.now() - team.dateValue) / (1000 * 60 * 60 * 24);
        if (ageInDays < 30) score += 1;
      }

      return { team, score, matchReasons };
    });

    // Filter to teams with score > 0, sort by score descending
    const results = scoredTeams
      .filter(t => t.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (results.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `No teams found matching your preferences. Try describing your playstyle differently (e.g., "rain teams", "hyper offense", "trick room") or mention specific Pokemon you enjoy (e.g., "Entei", "Flutter Mane").`
        }]
      };
    }

    // Build response
    const archetypeText = archetypeArray.length > 0
      ? `Detected playstyle: **${archetypeArray.join(', ')}**\n`
      : '';
    const pokemonText = mentionedArray.length > 0
      ? `Looking for teams with: **${mentionedArray.join(', ')}**\n`
      : '';

    let responseText = `🎯 **Team Recommendations**\n\n${archetypeText}${pokemonText}\n`;

    results.forEach(({ team, matchReasons }) => {
      const pokemonList = team.pokemon.map(p => `${p.name} (${p.item})`).join(' / ');
      responseText += `**${team.teamId}** [Reg ${team.regulation}] — ${team.player}\n`;
      responseText += `📝 ${team.description}\n`;
      responseText += `✨ Match: ${matchReasons.slice(0, 3).join(', ')}\n`;
      responseText += `🎮 ${pokemonList}\n`;
      if (team.rentalCode && team.rentalCode !== 'None') {
        responseText += `🎯 **RENTAL: ${team.rentalCode}**\n`;
      }
      responseText += `📋 ${team.pokepaste}\n\n`;
    });

    return {
      content: [
        { type: 'text', text: responseText },
        {
          type: 'resource',
          resource: {
            uri: 'ui://vgc-teams/recommend_teams',
            mimeType: 'text/html',
            text: recommendTeamsHTML(results.map(r => r.team), archetypeArray, mentionedArray, results.length)
          }
        }
      ],
      structuredContent: {
        total: results.length,
        archetypes: archetypeArray,
        pokemon: mentionedArray,
        teams: results.map(r => ({ ...r.team, matchReasons: r.matchReasons, score: r.score }))
      }
    };
  }

  return { error: { code: -32601, message: 'Method not found' } };
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    teamsLoaded: teams.length,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Validation endpoint - double check Pokemon counts
app.get('/validate', (req, res) => {
  const pokemon = req.query.pokemon || 'Incineroar';
  const normalize = (str) => str.toLowerCase().replace(/[-\s]/g, '');
  const pokemonNorm = normalize(pokemon);

  // Count teams with this Pokemon
  const teamsWithPokemon = teams.filter(team =>
    team.pokemon.some(p => normalize(p.name).includes(pokemonNorm))
  );

  // Get Pokemon usage stats
  const pokemonUsage = {};
  teams.forEach(team => {
    team.pokemon.forEach(p => {
      const name = p.name.trim();
      if (name) {
        pokemonUsage[name] = (pokemonUsage[name] || 0) + 1;
      }
    });
  });

  // Find the exact match in usage
  const exactMatch = Object.entries(pokemonUsage).find(([name]) =>
    normalize(name).includes(pokemonNorm) || pokemonNorm.includes(normalize(name))
  );

  res.json({
    query: pokemon,
    totalTeams: teams.length,
    teamsWithPokemon: teamsWithPokemon.length,
    exactPokemonName: exactMatch ? exactMatch[0] : null,
    exactCount: exactMatch ? exactMatch[1] : 0,
    validation: {
      method1_filter: teamsWithPokemon.length,
      method2_usage: exactMatch ? exactMatch[1] : 0,
      match: teamsWithPokemon.length === (exactMatch ? exactMatch[1] : 0)
    },
    sampleTeamIds: teamsWithPokemon.slice(0, 5).map(t => t.teamId)
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'VGC Team Finder MCP Server',
    version: '2.0.0',
    teamsLoaded: teams.length,
    endpoints: {
      sse: '/sse (Goose/Claude Desktop)',
      mcpInspector: '/mcp-sse (MCP Inspector)',
      health: '/health',
      openapi: '/.well-known/openapi.yaml'
    },
    tools: TOOLS.map(t => t.name)
  });
});

// OpenAPI specification for ChatGPT Actions - served from chatgpt/openapi.yaml
app.get('/.well-known/openapi.yaml', (req, res) => {
  const openapiPath = path.join(__dirname, 'chatgpt', 'openapi.yaml');
  res.setHeader('Content-Type', 'text/yaml');
  res.sendFile(openapiPath);
});

// SSE connections storage for /sse endpoint
const sseConnectionsMain = new Map();

app.get('/sse', (req, res) => {
  const sessionId = req.query.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Store the connection
  sseConnectionsMain.set(sessionId, res);

  // Send the endpoint event that MCP clients expect (Goose, Claude Desktop, etc.)
  // This tells the client where to POST JSON-RPC messages
  const endpoint = `/sse/message?sessionId=${sessionId}`;
  res.write(`event: endpoint\ndata: ${endpoint}\n\n`);

  // Keep-alive ping
  const ping = setInterval(() => res.write(':ping\n\n'), 15000);

  req.on('close', () => {
    clearInterval(ping);
    sseConnectionsMain.delete(sessionId);
  });
});

app.post('/sse/message', (req, res) => {
  const sessionId = req.query.sessionId;
  const { jsonrpc, id, method, params } = req.body;

  const result = handleMethod(method, params);
  const response = { jsonrpc: '2.0', id, result };

  // Send response back via SSE if connection exists
  const sseRes = sseConnectionsMain.get(sessionId);
  if (sseRes) {
    sseRes.write(`event: message\ndata: ${JSON.stringify(response)}\n\n`);
  }

  // Also return as HTTP response for compatibility
  res.json(response);
});

// Legacy POST /sse for backwards compatibility
app.post('/sse', (req, res) => {
  const { jsonrpc, id, method, params } = req.body;
  const result = handleMethod(method, params);
  res.json({ jsonrpc: '2.0', id, result });
});

// MCP Inspector compatible SSE endpoint
// Stores active SSE connections by session ID
const sseConnections = new Map();

app.get('/mcp-sse', (req, res) => {
  const sessionId = req.query.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Store the connection
  sseConnections.set(sessionId, res);

  // Send the endpoint event that MCP Inspector expects
  const endpoint = `/mcp-sse/message?sessionId=${sessionId}`;
  res.write(`event: endpoint\ndata: ${endpoint}\n\n`);

  // Keep-alive ping
  const ping = setInterval(() => {
    res.write(':ping\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(ping);
    sseConnections.delete(sessionId);
  });
});

app.post('/mcp-sse/message', (req, res) => {
  const sessionId = req.query.sessionId;
  const { jsonrpc, id, method, params } = req.body;

  const result = handleMethod(method, params);
  const response = { jsonrpc: '2.0', id, result };

  // Send response back via SSE if connection exists
  const sseRes = sseConnections.get(sessionId);
  if (sseRes) {
    sseRes.write(`event: message\ndata: ${JSON.stringify(response)}\n\n`);
  }

  // Also return as HTTP response
  res.json(response);
});

// MCP endpoint (alias for /sse POST) - for Fractal compatibility
app.post('/mcp', (req, res) => {
  const { jsonrpc, id, method, params } = req.body;
  const result = handleMethod(method, params);
  res.json({ jsonrpc: '2.0', id, result });
});

// REST API endpoints for direct HTTP access
const normalize = (str) => str.toLowerCase().replace(/[-\s]/g, '');

app.get('/api/search', (req, res) => {
  const query = req.query.q || req.query.query || '';
  const regulation = (req.query.regulation || '').toUpperCase();
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);

  // Expand abbreviations in search terms
  const searchTerms = query.toLowerCase().split(/\s+and\s+/)
    .map(t => t.trim())
    .filter(t => t)
    .map(t => {
      const expanded = expandPokemonName(t);
      return expanded !== t ? expanded.toLowerCase() : t;
    });

  let results = teams;

  // Filter by regulation if specified
  if (regulation) {
    results = results.filter(t => t.regulation === regulation);
  }

  results = results.filter(team => {
    const pokemonNamesNormalized = team.pokemon.map(p => normalize(p.name));
    const searchBlob = [team.player, team.event, team.description, ...team.pokemon.map(p => p.name)].join(' ').toLowerCase();

    return searchTerms.every(term => {
      const termNorm = normalize(term);
      if (searchBlob.includes(term)) return true;
      if (pokemonNamesNormalized.some(name => name.includes(termNorm))) return true;
      return false;
    });
  });

  results = results.sort((a, b) => b.dateValue - a.dateValue).slice(0, limit);
  res.json({ total: results.length, teams: results });
});

app.get('/api/random', (req, res) => {
  const pokemonRaw = req.query.pokemon;
  const pokemon = pokemonRaw ? expandPokemonName(pokemonRaw) : null;
  const regulation = (req.query.regulation || '').toUpperCase();
  let pool = teams;

  if (regulation) {
    pool = pool.filter(t => t.regulation === regulation);
  }

  if (pokemon) {
    const pokemonNorm = normalize(pokemon);
    pool = pool.filter(team => team.pokemon.some(p => normalize(p.name).includes(pokemonNorm)));
  }

  if (pool.length === 0) {
    return res.status(404).json({ error: 'No teams found' });
  }

  const team = pool[Math.floor(Math.random() * pool.length)];
  res.json({ team });
});

app.get('/api/rental/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const team = teams.find(t => t.rentalCode.toUpperCase() === code);

  if (!team) {
    return res.json({ error: 'Rental code not found' });
  }
  res.json({ team });
});

app.get('/api/usage', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const regulation = (req.query.regulation || '').toUpperCase();
  const usage = {};

  let pool = teams;
  if (regulation) {
    pool = pool.filter(t => t.regulation === regulation);
  }

  pool.forEach(team => {
    team.pokemon.forEach(p => {
      if (p.name) usage[p.name] = (usage[p.name] || 0) + 1;
    });
  });

  const sorted = Object.entries(usage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count, percentage: ((count / pool.length) * 100).toFixed(1) }));

  res.json({ totalTeams: pool.length, usage: sorted });
});

app.get('/api/rentals', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const pokemonRaw = req.query.pokemon;
  const pokemon = pokemonRaw ? expandPokemonName(pokemonRaw) : null;
  const regulation = (req.query.regulation || '').toUpperCase();

  let results = teams.filter(t => t.rentalCode && t.rentalCode !== 'None' && t.rentalCode.length > 0);

  if (regulation) {
    results = results.filter(t => t.regulation === regulation);
  }

  if (pokemon) {
    const pokemonNorm = normalize(pokemon);
    results = results.filter(team => team.pokemon.some(p => normalize(p.name).includes(pokemonNorm)));
  }

  results = results.sort((a, b) => b.dateValue - a.dateValue).slice(0, limit);
  res.json({ total: results.length, teams: results });
});

// Additional REST API endpoints
app.get('/api/regulations', (req, res) => {
  const regCounts = {};
  teams.forEach(t => {
    regCounts[t.regulation] = (regCounts[t.regulation] || 0) + 1;
  });

  const regulations = Object.entries(regCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));

  res.json({ totalTeams: teams.length, regulations });
});

app.get('/api/teammates/:pokemon', (req, res) => {
  const pokemonRaw = req.params.pokemon;
  const pokemon = expandPokemonName(pokemonRaw);
  const limit = Math.min(parseInt(req.query.limit) || 10, 20);

  const pokemonNorm = normalize(pokemon);
  const teamsWithPokemon = teams.filter(team =>
    team.pokemon.some(p => normalize(p.name).includes(pokemonNorm))
  );

  if (teamsWithPokemon.length === 0) {
    return res.status(404).json({ error: `No teams found with ${pokemon}` });
  }

  const teammates = {};
  teamsWithPokemon.forEach(team => {
    team.pokemon.forEach(p => {
      const name = p.name.trim();
      if (name && !normalize(name).includes(pokemonNorm)) {
        teammates[name] = (teammates[name] || 0) + 1;
      }
    });
  });

  const sorted = Object.entries(teammates)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count, percentage: ((count / teamsWithPokemon.length) * 100).toFixed(1) }));

  res.json({ pokemon, totalTeams: teamsWithPokemon.length, teammates: sorted });
});

app.get('/api/items/:pokemon', (req, res) => {
  const pokemonRaw = req.params.pokemon;
  const pokemon = expandPokemonName(pokemonRaw);

  const pokemonNorm = normalize(pokemon);
  const items = {};
  let totalCount = 0;

  teams.forEach(team => {
    team.pokemon.forEach(p => {
      if (normalize(p.name).includes(pokemonNorm)) {
        const item = p.item.trim();
        if (item && item !== 'None' && item !== 'Unknown') {
          items[item] = (items[item] || 0) + 1;
          totalCount++;
        }
      }
    });
  });

  if (totalCount === 0) {
    return res.status(404).json({ error: `No data found for ${pokemon}` });
  }

  const sorted = Object.entries(items)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, percentage: ((count / totalCount) * 100).toFixed(1) }));

  res.json({ pokemon, totalCount, items: sorted });
});

app.get('/api/player/:name', (req, res) => {
  const player = req.params.name;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);

  const playerNorm = normalize(player);
  const results = teams.filter(team =>
    normalize(team.player).includes(playerNorm)
  ).sort((a, b) => b.dateValue - a.dateValue).slice(0, limit);

  if (results.length === 0) {
    return res.status(404).json({ error: `No teams found for player "${player}"` });
  }

  res.json({ total: results.length, teams: results });
});

// Recommend teams based on playstyle/preferences
app.get('/api/recommend', (req, res) => {
  const userDesc = (req.query.description || req.query.q || '').toLowerCase();
  const regulation = (req.query.regulation || '').toUpperCase();
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  if (!userDesc) {
    return res.status(400).json({ error: 'Please provide a description of your playstyle or Pokemon preferences' });
  }

  // Extract Pokemon mentions from user description
  const mentionedPokemon = new Set();
  for (const [abbrev, fullName] of Object.entries(POKEMON_ABBREVIATIONS)) {
    const regex = new RegExp(`\\b${abbrev.replace(/[-\s]/g, '[-\\s]?')}\\b`, 'i');
    if (regex.test(userDesc)) {
      mentionedPokemon.add(fullName);
    }
  }
  for (const pokemonList of Object.values(ARCHETYPE_POKEMON)) {
    for (const pokemon of pokemonList) {
      if (userDesc.includes(pokemon.toLowerCase())) {
        mentionedPokemon.add(pokemon);
      }
    }
  }

  // Detect playstyle keywords
  const detectedArchetypes = new Set();
  for (const [archetype, keywords] of Object.entries(PLAYSTYLE_KEYWORDS)) {
    if (keywords.some(kw => userDesc.includes(kw.toLowerCase()))) {
      detectedArchetypes.add(archetype);
    }
  }
  for (const pokemon of mentionedPokemon) {
    for (const [archetype, pokemonList] of Object.entries(ARCHETYPE_POKEMON)) {
      if (pokemonList.includes(pokemon)) {
        detectedArchetypes.add(archetype);
      }
    }
  }

  const mentionedArray = [...mentionedPokemon];
  const archetypeArray = [...detectedArchetypes];

  let pool = teams;
  if (regulation) {
    pool = pool.filter(t => t.regulation === regulation);
  }

  // Score teams
  const scoredTeams = pool.map(team => {
    let score = 0;
    const matchReasons = [];
    const teamPokemonNames = team.pokemon.map(p => p.name);
    const teamDescLower = team.description.toLowerCase();

    for (const pokemon of mentionedArray) {
      const pokemonNorm = normalize(pokemon);
      if (teamPokemonNames.some(p => normalize(p).includes(pokemonNorm))) {
        score += 10;
        matchReasons.push(`Has ${pokemon}`);
      }
    }
    for (const archetype of archetypeArray) {
      if (teamDescLower.includes(archetype)) {
        score += 5;
        matchReasons.push(`${archetype} team`);
      }
      const archetypePokemon = ARCHETYPE_POKEMON[archetype] || [];
      for (const pokemon of archetypePokemon) {
        if (teamPokemonNames.some(p => normalize(p).includes(normalize(pokemon)))) {
          score += 3;
          if (!matchReasons.some(r => r.includes(pokemon))) {
            matchReasons.push(`Has ${pokemon}`);
          }
        }
      }
    }
    if (team.rentalCode && team.rentalCode !== 'None' && team.rentalCode.length > 0) {
      score += 2;
    }

    return { ...team, score, matchReasons };
  });

  const results = scoredTeams
    .filter(t => t.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  res.json({
    total: results.length,
    archetypes: archetypeArray,
    pokemon: mentionedArray,
    teams: results
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port', process.env.PORT || 3000);
  console.log('Tools available:', TOOLS.map(t => t.name).join(', '));
});
