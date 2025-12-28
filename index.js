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
      // Corrected indices based on raw data inspection and user requirements
      // Pokemon names are actually in columns 35, 36, 37, 38, 39, 40 (0-indexed)
      const pokemon = [
        cols[35], cols[36], cols[37], cols[38], cols[39], cols[40]
      ].filter(p => p && p.trim() && p.toLowerCase() !== 'unironicpanda');

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
        pokemon: pokemon.map(name => ({ name })), // Backwards compatibility for handleMethod
        pokepaste: cols[24],
        date: dateStr,
        dateValue,
        event: cols[30],
        rank: cols[31],
        format: 'VGC'
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
  description: 'Search VGC teams by Pokemon, player, event, or format (Reg A-J). No personal data required.',
  inputSchema: { 
    type: 'object', 
    properties: { 
      query: { type: 'string', description: 'Search query - Pokemon name, player, event, or regulation' },
      limit: { type: 'integer', description: 'Number of results (default 50, max 200)', minimum: 1, maximum: 200 },
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
    const limit = Math.min(params.arguments?.limit || 50, 200);
    const sort = params.arguments?.sort || 'recent';

    console.log('Search query:', q);

    // Advanced search logic: split by 'and' or whitespace
    const searchTerms = q.split(/\s+and\s+|\s+/).filter(t => t.length > 0);
    
    let results = teams.filter(team => {
      const pokemonNames = team.pokemon.map(p => p.name.toLowerCase());
      const player = (team.player || '').toLowerCase();
      const event = (team.event || '').toLowerCase();
      const desc = (team.description || '').toLowerCase();
      
      const searchBlob = [player, event, desc, ...pokemonNames].join(' ');

      return searchTerms.every(term => {
        // Handle "chien pao" -> "chien-pao" normalization for partial matches
        const normalizedTerm = term.replace(/\s+/g, '-');
        // Check if any part of the team data includes the term
        // Specifically check pokemon names for hyphenated matches
        return searchBlob.includes(term) || 
               searchBlob.includes(normalizedTerm) ||
               pokemonNames.some(name => name.includes(normalizedTerm));
      });
    });

    console.log('Results found:', results.length);

    if (sort === 'oldest') {
      results.sort((a, b) => a.dateValue - b.dateValue);
    } else {
      results.sort((a, b) => b.dateValue - a.dateValue);
    }

    const finalTeams = results.slice(0, limit);
    
    // Build formatted response string
    let responseText = `Found ${results.length} teams matching your search\n\n`;
    
    finalTeams.forEach(team => {
      const pokemonList = team.pokemon.map(p => p.name).join(' / ');
      responseText += `**${team.teamId}** — ${team.player} — ${team.description}\n`;
      responseText += `📅 ${team.date} — ${team.event}\n`;
      responseText += `🔢 ${pokemonList}\n`;
      responseText += `🔗 ${team.pokepaste}\n\n`;
    });

    return { 
      content: [{ 
        type: 'text', 
        text: responseText
      }]
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
  const response = { jsonrpc: '2.0', id, result };
  console.log('Sending response:', JSON.stringify(response).substring(0, 500) + '...');
  res.json(response);
});

app.get('/', (req, res) => res.send('VGC Team Finder MCP Server'));

app.listen(process.env.PORT || 3000, () => console.log('Server running'));
