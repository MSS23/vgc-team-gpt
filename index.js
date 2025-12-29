const express = require('express');
const cors = require('cors');
const { parse } = require('csv-parse/sync');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

let teams = [];

async function fetchTeams() {
  try {
    const res = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRHJPShab7BlRDTQU_HIf0mQnGGqtuRh1YKsV9Emtp3qYMB-it3uuKCWijtsy7t0tT6TjHGtN_FBkr9/pub?gid=0&single=true&output=csv');
    const csvData = await res.text();

    const records = parse(csvData, {
      columns: false,
      skip_empty_lines: true,
      relax_column_count: true
    });

    // Skip 2 header rows (row 0 and row 1 are both headers)
    const dataRows = records.slice(2);

    // Double validation: Track Pokemon from both column sets
    const itemIndices = [7, 10, 13, 16, 19, 22];
    const pokemonIndices = [37, 38, 39, 40, 41, 42];
    let validationIssues = [];

    teams = dataRows.map((cols, rowIdx) => {
      // Get Pokemon from dedicated Pokemon columns (37-42)
      const pokemonFromCols = pokemonIndices.map(i => (cols[i] || '').trim()).filter(p => p && p.toLowerCase() !== 'unironicpanda');

      // Get items from item columns (7, 10, 13, 16, 19, 22)
      const itemsFromCols = itemIndices.map(i => (cols[i] || '').trim()).filter(it => it);

      // Double validation: Pokemon count should match item count (6 Pokemon = 6 items)
      if (pokemonFromCols.length > 0 && pokemonFromCols.length !== itemsFromCols.length) {
        validationIssues.push({
          row: rowIdx + 3,
          teamId: (cols[0] || '').trim(),
          pokemonCount: pokemonFromCols.length,
          itemCount: itemsFromCols.length
        });
      }

      // Helper to generate sprite URL from Pokemon name using Serebii
      const getSpriteUrl = (name) => {
        if (!name) return null;
        // Convert name to slug format for img.pokemondb.net (most reliable for all forms)
        let slug = name.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[''.]/g, '')
          .replace(/♀/g, '-f')
          .replace(/♂/g, '-m')
          .replace(/:/g, '');

        // Use PokemonDB which has reliable sprites for all forms
        return `https://img.pokemondb.net/sprites/home/normal/${slug}.png`;
      };

      // Build team Pokemon with items matched by slot order
      const teamPokemon = pokemonIndices.map((pIdx, i) => {
        const name = (cols[pIdx] || '').trim();
        const item = (cols[itemIndices[i]] || 'None').trim();
        return {
          name,
          item,
          sprite: getSpriteUrl(name)
        };
      }).filter(p => p.name && p.name.toLowerCase() !== 'unironicpanda');

      const dateStr = cols[29] || '';
      let dateValue = 0;
      if (dateStr) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          dateValue = parsed.getTime();
        }
      }

      return {
        teamId: (cols[0] || '').trim(),
        description: (cols[1] || '').trim(),
        player: (cols[3] || '').trim(),
        pokemon: teamPokemon,
        pokepaste: (cols[24] || '').trim(),
        rentalCode: (cols[28] || '').trim(),
        date: dateStr,
        dateValue,
        event: (cols[30] || '').trim(),
        rank: (cols[31] || '').trim(),
        sourceLink: (cols[32] || '').trim(),
        videoLink: (cols[33] || '').trim(),
        owner: (cols[35] || '').trim(),
        format: 'VGC'
      };
    }).filter(t => t && (t.player || t.pokemon.length > 0));

    console.log(`Loaded ${teams.length} teams`);

    // Report validation issues
    if (validationIssues.length > 0) {
      console.log(`⚠️  Found ${validationIssues.length} teams with Pokemon/Item count mismatch:`);
      validationIssues.forEach(issue => {
        console.log(`   Row ${issue.row} (${issue.teamId}): ${issue.pokemonCount} Pokemon, ${issue.itemCount} items`);
      });
    } else {
      console.log('✓ All teams passed Pokemon/Item validation');
    }

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
    description: 'Search VGC teams by Pokemon, player, event, item, or regulation. Use "and" to combine terms (e.g., "Flutter Mane and Incineroar", "Worlds", "Reg G"). Searches across all team data.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query - Pokemon name, player name, event name, item, or regulation. Use "and" for multiple terms.' },
        limit: { type: 'integer', description: 'Number of results (default 50, max 500)', minimum: 1, maximum: 500 },
        sort: { type: 'string', enum: ['recent', 'oldest'], description: 'Sort by date' }
      },
      required: ['query']
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
  }
];

function handleMethod(method, params) {
  if (method === 'initialize') {
    return { 
      protocolVersion: '2024-11-05', 
      capabilities: { 
        tools: {},
        resources: {
          list: [{ uri: 'ui://widgets/team-finder', name: 'VGC Team Finder UI', mimeType: 'text/html+skybridge' }]
        }
      }, 
      serverInfo: { name: 'vgc-team-finder', version: '1.0.0' } 
    };
  }
  if (method === 'resources/get' && params?.uri === 'ui://widgets/team-finder') {
    const fs = require('fs');
    const path = require('path');
    const widgetHtml = fs.readFileSync(path.join(__dirname, 'widget.html'), 'utf8');
    return { contents: [{ uri: 'ui://widgets/team-finder', mimeType: 'text/html+skybridge', text: widgetHtml }] };
  }
  if (method === 'tools/list') {
    return { tools: TOOLS };
  }
  // Helper to normalize names for comparison (remove spaces, hyphens, make lowercase)
  const normalize = (str) => str.toLowerCase().replace(/[-\s]/g, '');

  // Tool: random_team
  if (method === 'tools/call' && params?.name === 'random_team') {
    const pokemon = params.arguments?.pokemon;
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
      content: [{ type: 'text', text: responseText }],
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

    return {
      content: [{ type: 'text', text: responseText }],
      structuredContent: { totalTeams: teams.length, usage: sorted.map(([name, count]) => ({ name, count, percentage: ((count / teams.length) * 100).toFixed(1) })) }
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

    return {
      content: [{ type: 'text', text: responseText }],
      structuredContent: { totalItems, usage: sorted.map(([name, count]) => ({ name, count, percentage: ((count / totalItems) * 100).toFixed(1) })) }
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
      content: [{ type: 'text', text: responseText }],
      structuredContent: { team }
    };
  }

  // Tool: search_pokemon_with_item
  if (method === 'tools/call' && params?.name === 'search_pokemon_with_item') {
    const pokemon = params.arguments?.pokemon || '';
    const item = params.arguments?.item || '';
    const limit = Math.min(params.arguments?.limit || 20, 100);

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
      content: [{ type: 'text', text: responseText }],
      structuredContent: { total: results.length, teams: results }
    };
  }

  // Tool: get_pokemon_teammates
  if (method === 'tools/call' && params?.name === 'get_pokemon_teammates') {
    const pokemon = params.arguments?.pokemon || '';
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

    return {
      content: [{ type: 'text', text: responseText }],
      structuredContent: { pokemon, totalTeams: teamsWithPokemon.length, teammates: sorted.map(([name, count]) => ({ name, count, percentage: ((count / teamsWithPokemon.length) * 100).toFixed(1) })) }
    };
  }

  // Tool: get_pokemon_items
  if (method === 'tools/call' && params?.name === 'get_pokemon_items') {
    const pokemon = params.arguments?.pokemon || '';

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

    return {
      content: [{ type: 'text', text: responseText }],
      structuredContent: { pokemon, totalCount, items: sorted.map(([name, count]) => ({ name, count, percentage: ((count / totalCount) * 100).toFixed(1) })) }
    };
  }

  // Tool: get_rental_teams
  if (method === 'tools/call' && params?.name === 'get_rental_teams') {
    const pokemon = params.arguments?.pokemon;
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
      content: [{ type: 'text', text: responseText }],
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
      content: [{ type: 'text', text: responseText }],
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
      content: [{ type: 'text', text: responseText }],
      structuredContent: { total: results.length, teams: results }
    };
  }

  // Tool: search_teams
  if (method === 'tools/call' && params?.name === 'search_teams') {
    const q = (params.arguments?.query || '').toLowerCase();
    const limit = Math.min(params.arguments?.limit || 50, 500);
    const sort = params.arguments?.sort || 'recent';

    console.log('Total teams in database:', teams.length);
    console.log('Search query:', q);

    // Split by "and" first to get separate Pokemon/terms, then trim
    const searchTerms = q.split(/\s+and\s+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    console.log('Search terms:', searchTerms);

    let results = teams.filter(team => {
      const pokemonNames = team.pokemon.map(p => p.name.toLowerCase());
      const pokemonNamesNormalized = team.pokemon.map(p => normalize(p.name));
      const itemNames = team.pokemon.map(p => p.item.toLowerCase());
      const player = team.player.toLowerCase();
      const event = team.event.toLowerCase();
      const desc = team.description.toLowerCase();

      // Create searchable blob with spaces preserved
      const searchBlob = [player, event, desc, ...pokemonNames, ...itemNames].join(' ');
      const searchBlobNormalized = normalize(searchBlob);

      return searchTerms.every(term => {
        const termNormalized = normalize(term);

        // Check exact match in blob
        if (searchBlob.includes(term)) return true;

        // Check normalized match (fluttermane matches Flutter Mane, Flutter-Mane, etc.)
        if (searchBlobNormalized.includes(termNormalized)) return true;

        // Check each Pokemon name individually
        if (pokemonNamesNormalized.some(name => name.includes(termNormalized))) return true;

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
    
    let responseText = `Found ${results.length} teams matching your search\n\n`;
    finalTeams.forEach(team => {
      const pokemonList = team.pokemon.map(p => `${p.name} (${p.item})`).join(' / ');
      responseText += `**${team.teamId}** — ${team.player} — ${team.description}\n`;
      responseText += `📅 ${team.date} — ${team.event}${team.rank && team.rank !== '-' ? ` (${team.rank})` : ''}\n`;
      responseText += `🔢 ${pokemonList}\n`;
      responseText += `🔗 Pokepaste: ${team.pokepaste}`;
      if (team.rentalCode && team.rentalCode !== 'None') {
        responseText += ` | Rental: ${team.rentalCode}`;
      }
      responseText += '\n\n';
    });

    return { 
      content: [{ type: 'text', text: responseText }],
      structuredContent: { total: results.length, teams: finalTeams },
      _meta: { 'openai/outputTemplate': 'ui://widgets/team-finder' }
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
    version: '1.0.0',
    teamsLoaded: teams.length,
    endpoints: {
      sse: '/sse',
      health: '/health',
      openapi: '/.well-known/openapi.yaml'
    },
    tools: TOOLS.map(t => t.name)
  });
});

// OpenAPI specification for ChatGPT Actions
app.get('/.well-known/openapi.yaml', (req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.send(`openapi: 3.1.0
info:
  title: VGC Team Finder API
  description: Search VGC Pokemon teams, find rental codes, check usage statistics, and get team building inspiration.
  version: 1.0.0
servers:
  - url: https://vgc-team-gpt.onrender.com
paths:
  /api/search:
    get:
      operationId: searchTeams
      summary: Search VGC teams by Pokemon, player, event, or item
      description: Search for teams containing specific Pokemon, by player name, event, or items. Use "and" to combine multiple Pokemon (e.g., "Incineroar and Flutter Mane").
      parameters:
        - name: query
          in: query
          required: true
          schema:
            type: string
          description: Search query - Pokemon names (use "and" for multiple), player name, event, or item
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
          description: Number of results to return
      responses:
        '200':
          description: List of matching teams
          content:
            application/json:
              schema:
                type: object
                properties:
                  total:
                    type: integer
                  teams:
                    type: array
                    items:
                      $ref: '#/components/schemas/Team'
  /api/random:
    get:
      operationId: getRandomTeam
      summary: Get a random VGC team
      description: Get a random team for inspiration. Optionally filter by Pokemon.
      parameters:
        - name: pokemon
          in: query
          schema:
            type: string
          description: Optional Pokemon to filter by
      responses:
        '200':
          description: A random team
          content:
            application/json:
              schema:
                type: object
                properties:
                  team:
                    $ref: '#/components/schemas/Team'
  /api/rental/{code}:
    get:
      operationId: getRentalTeam
      summary: Look up a team by rental code
      description: Find a specific team using its rental code.
      parameters:
        - name: code
          in: path
          required: true
          schema:
            type: string
          description: The rental code (e.g., "6NDSP1")
      responses:
        '200':
          description: The team with that rental code
          content:
            application/json:
              schema:
                type: object
                properties:
                  team:
                    $ref: '#/components/schemas/Team'
  /api/usage:
    get:
      operationId: getPokemonUsage
      summary: Get Pokemon usage statistics
      description: Shows the most popular Pokemon across all teams in the database.
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
          description: Number of Pokemon to show
      responses:
        '200':
          description: Usage statistics
          content:
            application/json:
              schema:
                type: object
                properties:
                  totalTeams:
                    type: integer
                  usage:
                    type: array
                    items:
                      type: object
                      properties:
                        name:
                          type: string
                        count:
                          type: integer
                        percentage:
                          type: string
  /api/rentals:
    get:
      operationId: getRentalTeams
      summary: Get teams with rental codes
      description: Find teams that have rental codes available.
      parameters:
        - name: pokemon
          in: query
          schema:
            type: string
          description: Optional Pokemon to filter by
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
          description: Number of results
      responses:
        '200':
          description: List of rental teams
          content:
            application/json:
              schema:
                type: object
                properties:
                  total:
                    type: integer
                  teams:
                    type: array
                    items:
                      $ref: '#/components/schemas/Team'
components:
  schemas:
    Team:
      type: object
      properties:
        teamId:
          type: string
        description:
          type: string
        player:
          type: string
        pokemon:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
              item:
                type: string
              sprite:
                type: string
        pokepaste:
          type: string
        rentalCode:
          type: string
        date:
          type: string
        event:
          type: string
        rank:
          type: string
`);
});

app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(':ok\n\n');
  const ping = setInterval(() => res.write(':ping\n\n'), 15000);
  req.on('close', () => clearInterval(ping));
});

app.post('/sse', (req, res) => {
  const { jsonrpc, id, method, params } = req.body;
  const result = handleMethod(method, params);
  res.json({ jsonrpc: '2.0', id, result });
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
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);

  const searchTerms = query.toLowerCase().split(/\s+and\s+/).map(t => t.trim()).filter(t => t);

  let results = teams.filter(team => {
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
  const pokemon = req.query.pokemon;
  let pool = teams;

  if (pokemon) {
    const pokemonNorm = normalize(pokemon);
    pool = teams.filter(team => team.pokemon.some(p => normalize(p.name).includes(pokemonNorm)));
  }

  if (pool.length === 0) {
    return res.json({ error: 'No teams found' });
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
  const usage = {};

  teams.forEach(team => {
    team.pokemon.forEach(p => {
      if (p.name) usage[p.name] = (usage[p.name] || 0) + 1;
    });
  });

  const sorted = Object.entries(usage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count, percentage: ((count / teams.length) * 100).toFixed(1) }));

  res.json({ totalTeams: teams.length, usage: sorted });
});

app.get('/api/rentals', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const pokemon = req.query.pokemon;

  let results = teams.filter(t => t.rentalCode && t.rentalCode !== 'None');

  if (pokemon) {
    const pokemonNorm = normalize(pokemon);
    results = results.filter(team => team.pokemon.some(p => normalize(p.name).includes(pokemonNorm)));
  }

  results = results.sort((a, b) => b.dateValue - a.dateValue).slice(0, limit);
  res.json({ total: results.length, teams: results });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port', process.env.PORT || 3000);
  console.log('Tools available:', TOOLS.map(t => t.name).join(', '));
});
