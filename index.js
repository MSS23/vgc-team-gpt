const express = require('express');
const cors = require('cors');
const { parse } = require('csv-parse/sync');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

let teams = [];

// Fetch CSV data
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
      const pokemon = [
        cols[35], cols[36], cols[37], cols[38], cols[39], cols[40]
      ].filter(p => p && p.trim() && p.toLowerCase() !== 'unironicpanda');

      const dateStr = cols[29] || '';
      let dateObj = new Date(0);
      if (dateStr) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          dateObj = parsed;
        }
      }

      return {
        id: cols[0],
        description: cols[1],
        player: cols[3],
        pokemon: pokemon,
        pokepaste: cols[24],
        date: dateStr,
        dateValue: dateObj.getTime(),
        event: cols[30],
        rank: cols[31],
        format: 'VGC'
      };
    }).filter(t => t.player || t.pokemon.length > 0);

    console.log(`Loaded ${teams.length} teams`);
  } catch (e) { 
    console.error('CSV fetch error:', e); 
  }
}
fetchTeams();

const TOOLS = [{
  name: 'search_teams',
  description: 'Search VGC teams by Pokemon, player, event, or format (Reg A-J). Results are sorted by date.',
  inputSchema: { 
    type: 'object', 
    properties: { 
      query: { type: 'string', description: 'Search query - Pokemon name, player, event, or regulation' },
      limit: { type: 'integer', description: 'Number of results to return (default 25, max 100)', minimum: 1, maximum: 100 },
      sort: { type: 'string', description: 'Sort order: "recent" (default) or "oldest"', enum: ['recent', 'oldest'] }
    }, 
    required: ['query']
  },
  annotations: {
    requiresUserData: false
  }
}];

function handleMethod(method, params) {
  if (method === 'initialize') {
    return { 
      protocolVersion: '2024-11-05', 
      capabilities: { tools: {} }, 
      serverInfo: { name: 'vgc-team-finder', version: '1.0.0' } 
    };
  }
  if (method === 'tools/list') {
    return { tools: TOOLS };
  }
  if (method === 'tools/call' && params?.name === 'search_teams') {
    const q = (params.arguments?.query || '').toLowerCase();
    const limit = Math.min(params.arguments?.limit || 25, 100);
    const sort = params.arguments?.sort || 'recent';

    let results = teams.filter(t => 
      [t.player, t.event, t.description, ...t.pokemon].join(' ').toLowerCase().includes(q)
    );

    if (sort === 'oldest') {
      results.sort((a, b) => a.dateValue - b.dateValue);
    } else {
      results.sort((a, b) => b.dateValue - a.dateValue);
    }

    const total = results.length;
    const finalTeams = results.slice(0, limit);

    return { 
      content: [{ 
        type: 'text', 
        text: JSON.stringify({
          total,
          showing: finalTeams.length,
          sortedBy: sort,
          teams: finalTeams
        }, null, 2) 
      }] 
    };
  }
  return { error: { code: -32601, message: 'Method not found' } };
}

app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
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
