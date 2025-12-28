const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

let teams = [];

// Fetch CSV data
async function fetchTeams() {
  try {
    const res = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRHJPShab7BlRDTQU_HIf0mQnGGqtuRh1YKsV9Emtp3qYMB-it3uuKCWijtsy7t0tT6TjHGtN_FBkr9/pub?gid=0&single=true&output=csv');
    const text = await res.text();
    const rows = text.split('\n').slice(1);
    teams = rows.map(row => {
      const cols = row.split(',');
      return { player: cols[0], event: cols[1], pokemon: cols.slice(2, 8), pokepaste: cols[8], format: cols[9] };
    }).filter(t => t.player);
    console.log(`Loaded ${teams.length} teams`);
  } catch (e) { console.error('CSV fetch error:', e); }
}
fetchTeams();

const TOOLS = [{
  name: 'search_teams',
  description: 'Search VGC teams by Pokemon, player, event, or format (Reg A-J)',
  inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }
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
    const results = teams.filter(t => 
      [t.player, t.event, t.format, ...t.pokemon].join(' ').toLowerCase().includes(q)
    ).slice(0, 10);
    return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
  }
  return { error: { code: -32601, message: 'Method not found' } };
}

// GET /sse - Initial SSE connection
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

// POST /sse - Handle MCP messages
app.post('/sse', (req, res) => {
  const { jsonrpc, id, method, params } = req.body;
  const result = handleMethod(method, params);
  res.json({ jsonrpc: '2.0', id, result });
});

// Health check
app.get('/', (req, res) => res.send('VGC Team Finder MCP Server'));

app.listen(process.env.PORT || 3000, () => console.log('Server running'));
