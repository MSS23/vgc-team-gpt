/**
 * VGC Team Finder - Production MCP Server
 * Main entry point
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const config = require('./config');
const logger = require('./logger');
const dataService = require('./dataService');
const { TOOLS } = require('./tools');
const toolHandlers = require('./toolHandlers');
const { getOpenAPISpec } = require('./openapi');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false
}));

// Compression
app.use(compression());

// CORS
app.use(cors({ origin: '*' }));

// JSON body parser
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.path === '/health' // Don't rate limit health checks
});
app.use(limiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/health') {
      logger.info(`${req.method} ${req.path}`, {
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
    }
  });
  next();
});

// Handle MCP method calls
function handleMethod(method, params) {
  const teams = dataService.getTeams();

  if (method === 'initialize') {
    return {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {
          list: [{ uri: 'ui://widgets/team-finder', name: 'VGC Team Finder UI', mimeType: 'text/html+skybridge' }]
        }
      },
      serverInfo: { name: 'vgc-team-finder', version: config.version }
    };
  }

  if (method === 'resources/get' && params?.uri === 'ui://widgets/team-finder') {
    try {
      const widgetPath = path.join(__dirname, '..', 'widget.html');
      const widgetHtml = fs.readFileSync(widgetPath, 'utf8');
      return { contents: [{ uri: 'ui://widgets/team-finder', mimeType: 'text/html+skybridge', text: widgetHtml }] };
    } catch (err) {
      logger.error('Failed to read widget.html', err);
      return { error: { code: -32000, message: 'Widget not found' } };
    }
  }

  if (method === 'tools/list') {
    return { tools: TOOLS };
  }

  if (method === 'tools/call' && params?.name) {
    const handler = toolHandlers[params.name];
    if (handler) {
      try {
        return handler(params.arguments || {}, teams);
      } catch (err) {
        logger.error(`Tool error: ${params.name}`, err);
        return { content: [{ type: 'text', text: `Error: ${err.message}` }] };
      }
    }
  }

  return { error: { code: -32601, message: 'Method not found' } };
}

// Health check endpoint
app.get('/health', (req, res) => {
  const status = dataService.getStatus();
  res.json({
    status: status.teamsLoaded > 0 ? 'healthy' : 'degraded',
    version: config.version,
    environment: config.nodeEnv,
    ...status,
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    timestamp: new Date().toISOString()
  });
});

// Readiness probe
app.get('/ready', (req, res) => {
  const status = dataService.getStatus();
  if (status.teamsLoaded > 0) {
    res.json({ ready: true });
  } else {
    res.status(503).json({ ready: false, reason: 'Data not loaded' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  const status = dataService.getStatus();
  res.json({
    name: 'VGC Team Finder MCP Server',
    version: config.version,
    environment: config.nodeEnv,
    teamsLoaded: status.teamsLoaded,
    regulations: config.regulations.map(r => r.name),
    endpoints: {
      sse: '/sse',
      mcp: '/mcp',
      health: '/health',
      ready: '/ready',
      openapi: '/.well-known/openapi.yaml',
      api: {
        search: '/api/search',
        random: '/api/random',
        rental: '/api/rental/:code',
        usage: '/api/usage',
        rentals: '/api/rentals',
        regulations: '/api/regulations',
        teammates: '/api/teammates/:pokemon',
        items: '/api/items/:pokemon',
        player: '/api/player/:name'
      }
    },
    tools: TOOLS.map(t => t.name)
  });
});

// OpenAPI specification
app.get('/.well-known/openapi.yaml', (req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.send(getOpenAPISpec());
});

// SSE endpoint for MCP
app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();
  res.write(':ok\n\n');

  const ping = setInterval(() => {
    res.write(':ping\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(ping);
    logger.debug('SSE connection closed');
  });
});

app.post('/sse', (req, res) => {
  const { jsonrpc, id, method, params } = req.body;
  const result = handleMethod(method, params);
  res.json({ jsonrpc: '2.0', id, result });
});

// MCP endpoint (alias for Fractal compatibility)
app.post('/mcp', (req, res) => {
  const { jsonrpc, id, method, params } = req.body;
  const result = handleMethod(method, params);
  res.json({ jsonrpc: '2.0', id, result });
});

// REST API endpoints
const normalize = (str) => str.toLowerCase().replace(/[-\s]/g, '');

app.get('/api/search', (req, res) => {
  const query = req.query.q || req.query.query || '';
  const regulation = (req.query.regulation || '').toUpperCase();
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const teams = dataService.getTeams();

  const searchTerms = query.toLowerCase().split(/\s+and\s+/).map(t => t.trim()).filter(t => t);

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
  const pokemon = req.query.pokemon;
  const regulation = (req.query.regulation || '').toUpperCase();
  const teams = dataService.getTeams();
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
  const teams = dataService.getTeams();
  const team = teams.find(t => t.rentalCode && t.rentalCode.toUpperCase() === code);

  if (!team) {
    return res.status(404).json({ error: 'Rental code not found' });
  }
  res.json({ team });
});

app.get('/api/usage', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const regulation = (req.query.regulation || '').toUpperCase();
  const teams = dataService.getTeams();

  let pool = teams;
  if (regulation) {
    pool = pool.filter(t => t.regulation === regulation);
  }

  const usage = {};
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
  const pokemon = req.query.pokemon;
  const regulation = (req.query.regulation || '').toUpperCase();
  const teams = dataService.getTeams();

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

app.get('/api/regulations', (req, res) => {
  const teams = dataService.getTeams();
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
  const pokemon = req.params.pokemon;
  const limit = Math.min(parseInt(req.query.limit) || 10, 20);
  const teams = dataService.getTeams();

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
  const pokemon = req.params.pokemon;
  const teams = dataService.getTeams();

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
  const teams = dataService.getTeams();

  const playerNorm = normalize(player);
  const results = teams.filter(team =>
    normalize(team.player).includes(playerNorm)
  ).sort((a, b) => b.dateValue - a.dateValue).slice(0, limit);

  if (results.length === 0) {
    return res.status(404).json({ error: `No teams found for player "${player}"` });
  }

  res.json({ total: results.length, teams: results });
});

// Validation endpoint (development only)
if (!config.isProduction) {
  app.get('/validate', (req, res) => {
    const pokemon = req.query.pokemon || 'Incineroar';
    const teams = dataService.getTeams();
    const pokemonNorm = normalize(pokemon);

    const teamsWithPokemon = teams.filter(team =>
      team.pokemon.some(p => normalize(p.name).includes(pokemonNorm))
    );

    const pokemonUsage = {};
    teams.forEach(team => {
      team.pokemon.forEach(p => {
        const name = p.name.trim();
        if (name) pokemonUsage[name] = (pokemonUsage[name] || 0) + 1;
      });
    });

    const exactMatch = Object.entries(pokemonUsage).find(([name]) =>
      normalize(name).includes(pokemonNorm) || pokemonNorm.includes(normalize(name))
    );

    res.json({
      query: pokemon,
      totalTeams: teams.length,
      teamsWithPokemon: teamsWithPokemon.length,
      exactPokemonName: exactMatch ? exactMatch[0] : null,
      exactCount: exactMatch ? exactMatch[1] : 0
    });
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err);
  res.status(500).json({ error: config.isProduction ? 'Internal server error' : err.message });
});

// Graceful shutdown
let server;
const shutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
});

// Start server
async function start() {
  try {
    logger.info('Starting VGC Team Finder server...');
    logger.info(`Environment: ${config.nodeEnv}`);

    // Initialize data
    await dataService.initialize();

    // Start HTTP server
    server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);

      const status = dataService.getStatus();
      logger.info(`Loaded ${status.teamsLoaded} teams across ${status.regulationCounts ? Object.keys(status.regulationCounts).length : 0} regulations`);

      if (!config.isProduction) {
        logger.info(`OpenAPI spec: http://localhost:${config.port}/.well-known/openapi.yaml`);
      }
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
