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

    const dataRows = records.slice(1);

    teams = dataRows.map(cols => {
      // Column Indices:
      // 0: Team ID
      // 1: Description
      // 3: Player (Full Name)
      // 5, 8, 11, 14, 17, 20: Items
      // 24: Pokepaste
      // 29: Date Shared
      // 30: Tournament / Event
      // 35-40: Pokemon Names
      
      const itemIndices = [5, 8, 11, 14, 17, 20];
      const items = itemIndices.map(idx => cols[idx] || 'None');
      const pokemonNames = cols.slice(35, 41).map(p => p.trim());

      const teamPokemon = pokemonNames.map((name, i) => ({
        name: name,
        item: items[i] || 'None'
      })).filter(p => p.name && p.name.toLowerCase() !== 'unironicpanda');

      const dateStr = cols[29] || '';
      let dateValue = 0;
      if (dateStr) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          dateValue = parsed.getTime();
        }
      }

      return {
        teamId: cols[0],
        description: cols[1],
        player: cols[3],
        pokemon: teamPokemon,
        pokepaste: cols[24],
        date: dateStr,
        dateValue,
        event: cols[30]
      };
    }).filter(t => t && (t.player || t.pokemon.length > 0));

    console.log(`Loaded ${teams.length} teams`);
  } catch (e) { 
    console.error('Data fetch error:', e); 
  }
}
fetchTeams();

const TOOLS = [{
  name: 'search_teams',
  description: 'Search VGC teams by Pokemon, item, player, event, or format (Reg A-J). No personal data required.',
  inputSchema: { 
    type: 'object', 
    properties: { 
      query: { type: 'string', description: 'Search query - Pokemon name, item, player, event, or regulation' },
      limit: { type: 'integer', description: 'Number of results (default 25, max 100)', minimum: 1, maximum: 100 },
      sort: { type: 'string', enum: ['recent', 'oldest'], description: 'Sort by date' }
    }, 
    required: ['query']
  },
  annotations: { requiresUserData: false }
}];

function handleMethod(method, params) {
  if (method === 'initialize') {
    return { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'vgc-team-finder', version: '1.0.0' } };
  }
  if (method === 'tools/list') {
    return { tools: TOOLS };
  }
  if (method === 'tools/call' && params?.name === 'search_teams') {
    const q = (params.arguments?.query || '').toLowerCase();
    const limit = Math.min(params.arguments?.limit || 25, 100);
    const sort = params.arguments?.sort || 'recent';
    const queryParts = q.split(' ').filter(p => p.length > 0);

    const results = teams.filter(t => {
      const searchStr = [
        t.player,
        t.event,
        t.description,
        ...t.pokemon.map(p => p.name),
        ...t.pokemon.map(p => p.item)
      ].join(' ').toLowerCase();
      return queryParts.every(part => searchStr.includes(part));
    });

    if (sort === 'oldest') {
      results.sort((a, b) => a.dateValue - b.dateValue);
    } else {
      results.sort((a, b) => b.dateValue - a.dateValue);
    }

    const finalTeams = results.slice(0, limit);
    return { 
      total: results.length,
      showing: finalTeams.length,
      sortedBy: sort,
      teams: finalTeams
    };
  }
  return { error: { code: -32601, message: 'Method not found' } };
}

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

app.get('/', (req, res) => res.send('VGC Team Finder MCP Server'));

app.listen(process.env.PORT || 3000, () => console.log('Server running'));
