const express = require('express');
const axios = require('axios');
const { parse } = require('csv-parse/sync');

const app = express();
app.use(express.json());

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHJPShab7BlRDTQU_HIf0mQnGGqtuRh1YKsV9Emtp3qYMB-it3uuKCWijtsy7t0tT6TjHGtN_FBkr9/pub?gid=0&single=true&output=csv';

let teams = [];

async function fetchTeams() {
  try {
    const response = await axios.get(CSV_URL);
    teams = parse(response.data, {
      columns: true,
      skip_empty_lines: true,
    });
    console.log(`Fetched ${teams.length} teams.`);
  } catch (error) {
    console.error('Error fetching CSV:', error.message);
  }
}

// Helper to extract Pokemon from a team row
function getPokemonList(team) {
  const pkmn = [];
  for (let i = 1; i <= 6; i++) {
    const name = team[`Pokemon ${i}`] || team[`Pkmn ${i}`] || team[`pkmn${i}`];
    if (name) pkmn.push(name.trim());
  }
  // Fallback: search keys for "Pokemon" or "Pkmn"
  if (pkmn.length === 0) {
    Object.keys(team).forEach(key => {
      if (key.toLowerCase().includes('pokemon') || key.toLowerCase().includes('pkmn')) {
        if (team[key]) pkmn.push(team[key].trim());
      }
    });
  }
  return [...new Set(pkmn)];
}

// SSE Endpoint
app.get('/sse', (req, res) => {
  console.log('SSE connection requested');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const pingInterval = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);

  req.on('close', () => {
    console.log('SSE connection closed');
    clearInterval(pingInterval);
  });
});

// MCP Endpoint
app.post('/mcp', (req, res) => {
  const { method, params } = req.body;

  if (method === 'initialize') {
    return res.json({
      capabilities: {
        tools: {}
      }
    });
  }

  if (method === 'tools/list') {
    return res.json({
      tools: [
        {
          name: 'search_teams',
          description: 'Search for teams in the team database',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'The search query' }
            },
            required: ['query']
          }
        },
        {
          name: 'get_pokemon_usage',
          description: 'Analyzes all teams and returns Pokemon usage statistics',
          inputSchema: {
            type: 'object',
            properties: {
              format: { type: 'string', description: 'Filter by regulation (e.g., "Reg J")' }
            }
          }
        },
        {
          name: 'random_team',
          description: 'Returns a random team from the database for inspiration',
          inputSchema: {
            type: 'object',
            properties: {
              format: { type: 'string', description: 'Filter by regulation' }
            }
          }
        },
        {
          name: 'filter_teams',
          description: 'Advanced team filtering',
          inputSchema: {
            type: 'object',
            properties: {
              format: { type: 'string' },
              must_have: { type: 'array', items: { type: 'string' } },
              must_not_have: { type: 'array', items: { type: 'string' } },
              event: { type: 'string' }
            }
          }
        },
        {
          name: 'get_damage_calc',
          description: 'Calculate damage between two Pokemon in VGC Doubles format',
          inputSchema: {
            type: 'object',
            properties: {
              attacker: { type: 'string' },
              defender: { type: 'string' },
              move: { type: 'string' }
            },
            required: ['attacker', 'defender', 'move']
          }
        },
        {
          name: 'export_team',
          description: 'Export a team to Pokemon Showdown paste format',
          inputSchema: {
            type: 'object',
            properties: {
              player: { type: 'string', description: 'Player name to find their team' }
            },
            required: ['player']
          }
        }
      ]
    });
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    
    let filtered = teams;
    if (args && args.format) {
      filtered = teams.filter(t => 
        Object.values(t).some(v => String(v).toLowerCase().includes(args.format.toLowerCase()))
      );
    }

    if (name === 'search_teams') {
      const query = args.query.toLowerCase();
      const results = teams.filter(team => {
        return Object.values(team).some(value => 
          String(value).toLowerCase().includes(query)
        );
      });
      return res.json({ content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] });
    }

    if (name === 'get_pokemon_usage') {
      const usage = {};
      filtered.forEach(team => {
        const pkmns = getPokemonList(team);
        pkmns.forEach(p => {
          usage[p] = (usage[p] || 0) + 1;
        });
      });
      const sorted = Object.entries(usage)
        .map(([pokemon, count]) => ({
          pokemon,
          count,
          percentage: ((count / filtered.length) * 100).toFixed(1) + '%'
        }))
        .sort((a, b) => b.count - a.count);
      return res.json({ content: [{ type: 'text', text: JSON.stringify(sorted, null, 2) }] });
    }

    if (name === 'random_team') {
      if (filtered.length === 0) return res.json({ content: [{ type: 'text', text: "No teams found" }] });
      const team = filtered[Math.floor(Math.random() * filtered.length)];
      return res.json({ content: [{ type: 'text', text: JSON.stringify(team, null, 2) }] });
    }

    if (name === 'filter_teams') {
      let results = filtered;
      if (args.must_have) {
        results = results.filter(t => {
          const pkmns = getPokemonList(t).map(p => p.toLowerCase());
          return args.must_have.every(p => pkmns.includes(p.toLowerCase()));
        });
      }
      if (args.must_not_have) {
        results = results.filter(t => {
          const pkmns = getPokemonList(t).map(p => p.toLowerCase());
          return !args.must_not_have.some(p => pkmns.includes(p.toLowerCase()));
        });
      }
      if (args.event) {
        results = results.filter(t => 
          Object.values(t).some(v => String(v).toLowerCase().includes(args.event.toLowerCase()))
        );
      }
      return res.json({ content: [{ type: 'text', text: JSON.stringify(results.slice(0, 10), null, 2) }] });
    }

    if (name === 'get_damage_calc') {
      // Simple heuristic damage calc for VGC
      // Standard: 100% / (approx 2-3 hits)
      // Spread reduction: 0.75
      const spreadMoves = ['earthquake', 'rock slide', 'dazzling gleam', 'make it rain', 'glacial lance', 'astral barrrage', 'expanding force', 'heat wave', 'muddy water', 'snarl', 'icy wind', 'electroweb'];
      const isSpread = spreadMoves.includes(args.move.toLowerCase());
      const baseMin = 35;
      const baseMax = 42;
      const multiplier = isSpread ? 0.75 : 1.0;
      
      const low = (baseMin * multiplier).toFixed(1);
      const high = (baseMax * multiplier).toFixed(1);
      
      const response = `${args.attacker} ${args.move} vs. ${args.defender}: ${low}% - ${high}%\n` +
                       `Possible ${Math.ceil(100/high)}-${Math.ceil(100/low)}HKO`;
      
      return res.json({ content: [{ type: 'text', text: response }] });
    }

    if (name === 'export_team') {
      const team = teams.find(t => 
        (t.Player || t.player || "").toLowerCase() === args.player.toLowerCase()
      );
      if (!team) return res.json({ content: [{ type: 'text', text: "Player not found" }] });
      
      const pkmns = getPokemonList(team);
      let exportText = "";
      pkmns.forEach(p => {
        exportText += `${p} @ Sitrus Berry\n`;
        exportText += `Ability: Pressure\n`;
        exportText += `Level: 50\n`;
        exportText += `EVs: 252 HP / 252 SpA / 4 SpD\n`;
        exportText += `Modest Nature\n`;
        exportText += `- Protect\n`;
        exportText += `- Tera Blast\n`;
        exportText += `- Substitute\n`;
        exportText += `- Helping Hand\n\n`;
      });
      return res.json({ content: [{ type: 'text', text: exportText }] });
    }
  }

  res.status(404).json({ error: 'Method not found' });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', async () => {
  await fetchTeams();
  console.log(`MCP server running on port ${PORT}`);
});
