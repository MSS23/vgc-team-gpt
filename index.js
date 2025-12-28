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

// SSE Endpoint
app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const pingInterval = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);

  req.on('close', () => {
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
              query: {
                type: 'string',
                description: 'The search query'
              }
            },
            required: ['query']
          }
        }
      ]
    });
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    if (name === 'search_teams') {
      const query = args.query.toLowerCase();
      const results = teams.filter(team => {
        return Object.values(team).some(value => 
          String(value).toLowerCase().includes(query)
        );
      });
      return res.json({
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2)
          }
        ]
      });
    }
  }

  res.status(404).json({ error: 'Method not found' });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', async () => {
  await fetchTeams();
  console.log(`MCP server running on port ${PORT}`);
});
