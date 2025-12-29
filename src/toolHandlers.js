/**
 * Tool Handlers
 * Implementation of all MCP tool functions
 */

/**
 * Normalize string for search comparison
 */
function normalize(str) {
  return str.toLowerCase().replace(/[-\s]/g, '');
}

/**
 * Tool: get_regulations
 */
function get_regulations(args, teams) {
  const regCounts = {};
  teams.forEach((t) => {
    regCounts[t.regulation] = (regCounts[t.regulation] || 0) + 1;
  });

  const sorted = Object.entries(regCounts).sort((a, b) => a[0].localeCompare(b[0]));

  let responseText = `**Available Regulations** (${teams.length} total teams)\n\n`;
  sorted.forEach(([reg, count]) => {
    responseText += `**Regulation ${reg}** - ${count} teams\n`;
  });

  return {
    content: [{ type: 'text', text: responseText }],
    structuredContent: { totalTeams: teams.length, regulations: sorted.map(([name, count]) => ({ name, count })) },
  };
}

/**
 * Tool: random_team
 */
function random_team(args, teams) {
  const pokemon = args.pokemon;
  const regulation = (args.regulation || '').toUpperCase();
  let pool = teams;

  if (regulation) {
    pool = pool.filter((t) => t.regulation === regulation);
  }

  if (pokemon) {
    const pokemonNorm = normalize(pokemon);
    pool = pool.filter((team) => team.pokemon.some((p) => normalize(p.name).includes(pokemonNorm)));
  }

  if (pool.length === 0) {
    return {
      content: [{ type: 'text', text: pokemon ? `No teams found with ${pokemon}.` : 'No teams available.' }],
    };
  }

  const team = pool[Math.floor(Math.random() * pool.length)];
  const pokemonList = team.pokemon.map((p) => `${p.name} (${p.item})`).join(' / ');

  let responseText = `**Random Team${pokemon ? ` with ${pokemon}` : ''}${regulation ? ` (Reg ${regulation})` : ''}**\n\n`;
  responseText += `**${team.teamId}** [Reg ${team.regulation}] - ${team.player} - ${team.description}\n`;
  responseText += `Date: ${team.date} - ${team.event}${team.rank && team.rank !== '-' ? ` (${team.rank})` : ''}\n`;
  responseText += `Pokemon: ${pokemonList}\n`;
  responseText += `Pokepaste: ${team.pokepaste}`;
  if (team.rentalCode) {
    responseText += ` | Rental: ${team.rentalCode}`;
  }

  return {
    content: [{ type: 'text', text: responseText }],
    structuredContent: { team },
  };
}

/**
 * Tool: get_pokemon_usage
 */
function get_pokemon_usage(args, teams) {
  const limit = Math.min(args.limit || 20, 100);
  const regulation = (args.regulation || '').toUpperCase();

  let pool = teams;
  if (regulation) {
    pool = pool.filter((t) => t.regulation === regulation);
  }

  const usage = {};
  pool.forEach((team) => {
    team.pokemon.forEach((p) => {
      const name = p.name.trim();
      if (name) {
        usage[name] = (usage[name] || 0) + 1;
      }
    });
  });

  const sorted = Object.entries(usage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  let responseText = `**Pokemon Usage Statistics**${regulation ? ` (Regulation ${regulation})` : ''} - Top ${limit}\n\n`;
  sorted.forEach(([name, count], i) => {
    const percentage = ((count / pool.length) * 100).toFixed(1);
    responseText += `${i + 1}. **${name}** - ${count} teams (${percentage}%)\n`;
  });

  return {
    content: [{ type: 'text', text: responseText }],
    structuredContent: {
      totalTeams: pool.length,
      usage: sorted.map(([name, count]) => ({
        name,
        count,
        percentage: ((count / pool.length) * 100).toFixed(1),
      })),
    },
  };
}

/**
 * Tool: get_item_usage
 */
function get_item_usage(args, teams) {
  const limit = Math.min(args.limit || 20, 100);
  const usage = {};

  teams.forEach((team) => {
    team.pokemon.forEach((p) => {
      const item = p.item.trim();
      if (item && item !== 'None' && item !== 'Unknown') {
        usage[item] = (usage[item] || 0) + 1;
      }
    });
  });

  const sorted = Object.entries(usage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const totalItems = Object.values(usage).reduce((a, b) => a + b, 0);

  let responseText = `**Item Usage Statistics** - Top ${limit}\n\n`;
  sorted.forEach(([name, count], i) => {
    const percentage = ((count / totalItems) * 100).toFixed(1);
    responseText += `${i + 1}. **${name}** - ${count} uses (${percentage}%)\n`;
  });

  return {
    content: [{ type: 'text', text: responseText }],
    structuredContent: {
      totalItems,
      usage: sorted.map(([name, count]) => ({
        name,
        count,
        percentage: ((count / totalItems) * 100).toFixed(1),
      })),
    },
  };
}

/**
 * Tool: get_team_by_rental
 */
function get_team_by_rental(args, teams) {
  const rentalCode = (args.rental_code || '').toUpperCase().trim();

  if (!rentalCode) {
    return { content: [{ type: 'text', text: 'Please provide a rental code.' }] };
  }

  const team = teams.find((t) => t.rentalCode && t.rentalCode.toUpperCase() === rentalCode);

  if (!team) {
    return { content: [{ type: 'text', text: `No team found with rental code: ${rentalCode}` }] };
  }

  const pokemonList = team.pokemon.map((p) => `${p.name} (${p.item})`).join(' / ');

  let responseText = `**Team with Rental Code: ${rentalCode}**\n\n`;
  responseText += `**${team.teamId}** [Reg ${team.regulation}] - ${team.player} - ${team.description}\n`;
  responseText += `Date: ${team.date} - ${team.event}${team.rank && team.rank !== '-' ? ` (${team.rank})` : ''}\n`;
  responseText += `Pokemon: ${pokemonList}\n`;
  responseText += `Pokepaste: ${team.pokepaste}`;

  return {
    content: [{ type: 'text', text: responseText }],
    structuredContent: { team },
  };
}

/**
 * Tool: search_pokemon_with_item
 */
function search_pokemon_with_item(args, teams) {
  const pokemon = args.pokemon || '';
  const item = args.item || '';
  const limit = Math.min(args.limit || 20, 100);

  if (!pokemon || !item) {
    return { content: [{ type: 'text', text: 'Please provide both a Pokemon and an item.' }] };
  }

  const pokemonNorm = normalize(pokemon);
  const itemNorm = normalize(item);

  const results = teams
    .filter((team) => team.pokemon.some((p) => normalize(p.name).includes(pokemonNorm) && normalize(p.item).includes(itemNorm)))
    .slice(0, limit);

  if (results.length === 0) {
    return { content: [{ type: 'text', text: `No teams found with ${pokemon} holding ${item}.` }] };
  }

  let responseText = `**Teams with ${pokemon} + ${item}** (${results.length} found)\n\n`;
  results.forEach((team) => {
    const pokemonList = team.pokemon.map((p) => `${p.name} (${p.item})`).join(' / ');
    responseText += `**${team.teamId}** [Reg ${team.regulation}] - ${team.player}\n`;
    responseText += `${team.date} - ${team.event}\n`;
    responseText += `${pokemonList}\n`;
    responseText += `${team.pokepaste}${team.rentalCode ? ` | Rental: ${team.rentalCode}` : ''}\n\n`;
  });

  return {
    content: [{ type: 'text', text: responseText }],
    structuredContent: { total: results.length, teams: results },
  };
}

/**
 * Tool: get_pokemon_teammates
 */
function get_pokemon_teammates(args, teams) {
  const pokemon = args.pokemon || '';
  const limit = Math.min(args.limit || 10, 20);

  if (!pokemon) {
    return { content: [{ type: 'text', text: 'Please provide a Pokemon name.' }] };
  }

  const pokemonNorm = normalize(pokemon);
  const teamsWithPokemon = teams.filter((team) => team.pokemon.some((p) => normalize(p.name).includes(pokemonNorm)));

  if (teamsWithPokemon.length === 0) {
    return { content: [{ type: 'text', text: `No teams found with ${pokemon}.` }] };
  }

  const teammates = {};
  teamsWithPokemon.forEach((team) => {
    team.pokemon.forEach((p) => {
      const name = p.name.trim();
      if (name && !normalize(name).includes(pokemonNorm)) {
        teammates[name] = (teammates[name] || 0) + 1;
      }
    });
  });

  const sorted = Object.entries(teammates)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  let responseText = `**Most Common Teammates for ${pokemon}** (from ${teamsWithPokemon.length} teams)\n\n`;
  sorted.forEach(([name, count], i) => {
    const percentage = ((count / teamsWithPokemon.length) * 100).toFixed(1);
    responseText += `${i + 1}. **${name}** - ${count} teams (${percentage}%)\n`;
  });

  return {
    content: [{ type: 'text', text: responseText }],
    structuredContent: {
      pokemon,
      totalTeams: teamsWithPokemon.length,
      teammates: sorted.map(([name, count]) => ({
        name,
        count,
        percentage: ((count / teamsWithPokemon.length) * 100).toFixed(1),
      })),
    },
  };
}

/**
 * Tool: get_pokemon_items
 */
function get_pokemon_items(args, teams) {
  const pokemon = args.pokemon || '';

  if (!pokemon) {
    return { content: [{ type: 'text', text: 'Please provide a Pokemon name.' }] };
  }

  const pokemonNorm = normalize(pokemon);
  const items = {};
  let totalCount = 0;

  teams.forEach((team) => {
    team.pokemon.forEach((p) => {
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
    return { content: [{ type: 'text', text: `No data found for ${pokemon}.` }] };
  }

  const sorted = Object.entries(items).sort((a, b) => b[1] - a[1]);

  let responseText = `**Items Used on ${pokemon}** (${totalCount} total)\n\n`;
  sorted.forEach(([name, count], i) => {
    const percentage = ((count / totalCount) * 100).toFixed(1);
    responseText += `${i + 1}. **${name}** - ${count} (${percentage}%)\n`;
  });

  return {
    content: [{ type: 'text', text: responseText }],
    structuredContent: {
      pokemon,
      totalCount,
      items: sorted.map(([name, count]) => ({
        name,
        count,
        percentage: ((count / totalCount) * 100).toFixed(1),
      })),
    },
  };
}

/**
 * Tool: get_rental_teams
 */
function get_rental_teams(args, teams) {
  const pokemon = args.pokemon;
  const regulation = (args.regulation || '').toUpperCase();
  const limit = Math.min(args.limit || 20, 100);

  let results = teams.filter((t) => t.rentalCode && t.rentalCode.length > 0);

  if (regulation) {
    results = results.filter((t) => t.regulation === regulation);
  }

  if (pokemon) {
    const pokemonNorm = normalize(pokemon);
    results = results.filter((team) => team.pokemon.some((p) => normalize(p.name).includes(pokemonNorm)));
  }

  results = results.sort((a, b) => b.dateValue - a.dateValue).slice(0, limit);

  if (results.length === 0) {
    return { content: [{ type: 'text', text: pokemon ? `No rental teams found with ${pokemon}.` : 'No rental teams found.' }] };
  }

  let responseText = `**Rental Teams Available**${pokemon ? ` with ${pokemon}` : ''}${regulation ? ` (Reg ${regulation})` : ''} (${results.length} shown)\n\n`;
  results.forEach((team) => {
    const pokemonList = team.pokemon.map((p) => p.name).join(' / ');
    responseText += `**${team.rentalCode}** [Reg ${team.regulation}] - ${team.player}\n`;
    responseText += `${team.date} - ${team.event}\n`;
    responseText += `${pokemonList}\n`;
    responseText += `${team.pokepaste}\n\n`;
  });

  return {
    content: [{ type: 'text', text: responseText }],
    structuredContent: { total: results.length, teams: results },
  };
}

/**
 * Tool: get_tournament_teams
 */
function get_tournament_teams(args, teams) {
  const event = args.event || '';
  const limit = Math.min(args.limit || 20, 100);

  if (!event) {
    return { content: [{ type: 'text', text: 'Please provide a tournament or event name.' }] };
  }

  const eventNorm = normalize(event);
  const results = teams
    .filter((team) => normalize(team.event).includes(eventNorm) || normalize(team.description).includes(eventNorm))
    .sort((a, b) => b.dateValue - a.dateValue)
    .slice(0, limit);

  if (results.length === 0) {
    return { content: [{ type: 'text', text: `No teams found from "${event}".` }] };
  }

  let responseText = `**Teams from "${event}"** (${results.length} shown)\n\n`;
  results.forEach((team) => {
    const pokemonList = team.pokemon.map((p) => p.name).join(' / ');
    responseText += `**${team.teamId}** [Reg ${team.regulation}] - ${team.player}${team.rank && team.rank !== '-' ? ` (${team.rank})` : ''}\n`;
    responseText += `${team.date} - ${team.event}\n`;
    responseText += `${pokemonList}\n`;
    responseText += `${team.pokepaste}${team.rentalCode ? ` | Rental: ${team.rentalCode}` : ''}\n\n`;
  });

  return {
    content: [{ type: 'text', text: responseText }],
    structuredContent: { total: results.length, teams: results },
  };
}

/**
 * Tool: get_player_teams
 */
function get_player_teams(args, teams) {
  const player = args.player || '';
  const limit = Math.min(args.limit || 20, 50);

  if (!player) {
    return { content: [{ type: 'text', text: 'Please provide a player name.' }] };
  }

  const playerNorm = normalize(player);
  const results = teams
    .filter((team) => normalize(team.player).includes(playerNorm))
    .sort((a, b) => b.dateValue - a.dateValue)
    .slice(0, limit);

  if (results.length === 0) {
    return { content: [{ type: 'text', text: `No teams found for player "${player}".` }] };
  }

  let responseText = `**Teams by ${player}** (${results.length} shown)\n\n`;
  results.forEach((team) => {
    const pokemonList = team.pokemon.map((p) => p.name).join(' / ');
    responseText += `**${team.teamId}** [Reg ${team.regulation}] - ${team.description}\n`;
    responseText += `${team.date} - ${team.event}${team.rank && team.rank !== '-' ? ` (${team.rank})` : ''}\n`;
    responseText += `${pokemonList}\n`;
    responseText += `${team.pokepaste}${team.rentalCode ? ` | Rental: ${team.rentalCode}` : ''}\n\n`;
  });

  return {
    content: [{ type: 'text', text: responseText }],
    structuredContent: { total: results.length, teams: results },
  };
}

/**
 * Tool: search_teams
 */
function search_teams(args, teams) {
  const q = (args.query || '').toLowerCase();
  const regulation = (args.regulation || '').toUpperCase();
  const limit = Math.min(args.limit || 50, 500);
  const sort = args.sort || 'recent';

  // Split by "and"
  const searchTerms = q
    .split(/\s+and\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  // Filter by regulation first
  let pool = teams;
  if (regulation) {
    pool = pool.filter((t) => t.regulation === regulation);
  }

  let results = pool.filter((team) => {
    const pokemonNames = team.pokemon.map((p) => p.name.toLowerCase());
    const pokemonNamesNormalized = team.pokemon.map((p) => normalize(p.name));
    const itemNames = team.pokemon.map((p) => p.item.toLowerCase());
    const player = team.player.toLowerCase();
    const event = team.event.toLowerCase();
    const desc = team.description.toLowerCase();
    const format = team.format.toLowerCase();

    const searchBlob = [player, event, desc, format, ...pokemonNames, ...itemNames].join(' ');
    const searchBlobNormalized = normalize(searchBlob);

    return searchTerms.every((term) => {
      const termNormalized = normalize(term);

      if (searchBlob.includes(term)) return true;
      if (searchBlobNormalized.includes(termNormalized)) return true;
      if (pokemonNamesNormalized.some((name) => name.includes(termNormalized))) return true;

      // Regulation match
      if (term.includes('reg') || term.length === 1) {
        const regLetter = term.replace(/reg\s*/i, '').toUpperCase();
        if (team.regulation === regLetter) return true;
      }

      return false;
    });
  });

  if (sort === 'oldest') {
    results.sort((a, b) => a.dateValue - b.dateValue);
  } else {
    results.sort((a, b) => b.dateValue - a.dateValue);
  }

  const finalTeams = results.slice(0, limit);

  let responseText = `Found ${results.length} teams matching your search${regulation ? ` (Regulation ${regulation})` : ''}\n\n`;
  finalTeams.forEach((team) => {
    const pokemonList = team.pokemon.map((p) => `${p.name} (${p.item})`).join(' / ');
    responseText += `**${team.teamId}** [Reg ${team.regulation}] - ${team.player} - ${team.description}\n`;
    responseText += `${team.date} - ${team.event}${team.rank && team.rank !== '-' ? ` (${team.rank})` : ''}\n`;
    responseText += `${pokemonList}\n`;
    responseText += `Pokepaste: ${team.pokepaste}`;
    if (team.rentalCode) {
      responseText += ` | Rental: ${team.rentalCode}`;
    }
    responseText += '\n\n';
  });

  return {
    content: [{ type: 'text', text: responseText }],
    structuredContent: { total: results.length, teams: finalTeams },
  };
}

// Export all handlers as an object keyed by tool name
module.exports = {
  search_teams,
  get_regulations,
  search_pokemon_with_item,
  get_pokemon_teammates,
  get_pokemon_items,
  random_team,
  get_pokemon_usage,
  get_team_by_rental,
  get_rental_teams,
  get_item_usage,
  get_tournament_teams,
  get_player_teams,
};
