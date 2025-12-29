/**
 * Data Service
 * Handles fetching and caching team data from VGCPastes spreadsheet
 */

const { parse } = require('csv-parse/sync');
const config = require('./config');
const logger = require('./logger');

// In-memory data store
let teams = [];
let lastFetchTime = null;
let fetchInProgress = false;
let fetchError = null;

/**
 * Generate sprite URL for a Pokemon
 * PokemonDB uses specific naming conventions for regional forms and gender variants
 */
function getSpriteUrl(name) {
  if (!name) return null;

  let slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[''.]/g, '')
    .replace(/:/g, '');

  // Handle gender symbols
  slug = slug.replace(/♀/g, '-female').replace(/♂/g, '-male');

  // Handle gender suffixes (e.g., Indeedee-F → indeedee-female)
  slug = slug.replace(/-f$/, '-female').replace(/-m$/, '-male');

  // Handle regional form suffixes (e.g., Zapdos-Galar → zapdos-galarian)
  slug = slug.replace(/-galar$/, '-galarian');
  slug = slug.replace(/-hisui$/, '-hisuian');
  slug = slug.replace(/-alola$/, '-alolan');
  slug = slug.replace(/-paldea(-|$)/, '-paldean$1');

  // Handle specific form edge cases
  // Ogerpon masks don't need -mask suffix on PokemonDB
  slug = slug.replace(/-mask$/, '');

  // Urshifu forms are already correct (single-strike, rapid-strike)

  // Rotom forms
  slug = slug.replace(/^rotom-heat$/, 'rotom-heat');
  slug = slug.replace(/^rotom-wash$/, 'rotom-wash');
  slug = slug.replace(/^rotom-frost$/, 'rotom-frost');
  slug = slug.replace(/^rotom-fan$/, 'rotom-fan');
  slug = slug.replace(/^rotom-mow$/, 'rotom-mow');

  return `https://img.pokemondb.net/sprites/home/normal/${slug}.png`;
}

/**
 * Normalize string for search comparison
 */
function normalize(str) {
  return str.toLowerCase().replace(/[-\s]/g, '');
}

/**
 * Fetch data from a single regulation sheet
 */
async function fetchSheetData(regulation) {
  const url = `https://docs.google.com/spreadsheets/d/${config.spreadsheet.id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(regulation.sheet)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      logger.warn(`Could not fetch ${regulation.sheet}`, { status: res.status });
      return [];
    }

    const csvData = await res.text();
    const records = parse(csvData, {
      columns: false,
      skip_empty_lines: true,
      relax_column_count: true,
      quote: '"',
      escape: '"',
    });

    // Skip header rows
    const dataRows = records.slice(3);

    // Column indices for VGCPastes format
    const itemIndices = [7, 10, 13, 16, 19, 22];
    const pokemonIndices = [37, 38, 39, 40, 41, 42];

    const sheetTeams = dataRows
      .map((cols) => {
        const teamId = (cols[0] || '').trim();
        if (!teamId || teamId.toLowerCase() === 'team id' || !teamId.match(/^[A-Z]\d+$/i)) {
          return null;
        }

        // Get Pokemon names
        const pokemonNames = pokemonIndices
          .map((i) => (cols[i] || '').trim())
          .filter((p) => p && p !== '-');

        // Get items
        const items = itemIndices.map((i) => (cols[i] || '').trim());

        // Build Pokemon array
        const teamPokemon = pokemonNames
          .map((name, i) => ({
            name,
            item: items[i] || 'Unknown',
            sprite: getSpriteUrl(name),
          }))
          .filter((p) => p.name);

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
          pokepaste: pokepaste.startsWith('http') ? pokepaste : pokepaste ? `https://${pokepaste}` : '',
          rentalCode: /^[A-Z0-9]{6}$/i.test(rentalCode) ? rentalCode.toUpperCase() : '',
          date,
          dateValue,
          event,
          rank,
          sourceLink,
          videoLink,
          regulation: regulation.name,
          format: `Regulation ${regulation.name}`,
        };
      })
      .filter((t) => t !== null);

    return sheetTeams;
  } catch (e) {
    if (e.name === 'AbortError') {
      logger.error(`Timeout fetching ${regulation.sheet}`);
    } else {
      logger.error(`Error fetching ${regulation.sheet}`, { error: e.message });
    }
    return [];
  }
}

/**
 * Fetch all team data from all regulation sheets
 */
async function fetchAllTeams() {
  if (fetchInProgress) {
    logger.debug('Fetch already in progress, skipping');
    return;
  }

  fetchInProgress = true;
  fetchError = null;
  const startTime = Date.now();

  logger.info('Starting data fetch from VGCPastes repository');

  try {
    const allTeams = [];

    for (const reg of config.regulations) {
      logger.debug(`Fetching ${reg.sheet}...`);
      const sheetTeams = await fetchSheetData(reg);
      logger.info(`Loaded ${sheetTeams.length} teams from ${reg.sheet}`);
      allTeams.push(...sheetTeams);
    }

    teams = allTeams;
    lastFetchTime = new Date();

    // Count by regulation
    const regCounts = {};
    teams.forEach((t) => {
      regCounts[t.regulation] = (regCounts[t.regulation] || 0) + 1;
    });

    const duration = Date.now() - startTime;
    logger.info('Data fetch completed', {
      totalTeams: teams.length,
      regulations: regCounts,
      durationMs: duration,
    });
  } catch (e) {
    fetchError = e.message;
    logger.error('Data fetch failed', { error: e.message });
  } finally {
    fetchInProgress = false;
  }
}

/**
 * Get current teams data
 */
function getTeams() {
  return teams;
}

/**
 * Get data service status
 */
function getStatus() {
  const regCounts = {};
  teams.forEach((t) => {
    regCounts[t.regulation] = (regCounts[t.regulation] || 0) + 1;
  });

  return {
    teamsLoaded: teams.length,
    regulationCounts: regCounts,
    lastFetchTime: lastFetchTime?.toISOString() || null,
    fetchInProgress,
    fetchError,
  };
}

/**
 * Initialize data service
 */
async function initialize() {
  await fetchAllTeams();

  // Schedule periodic refresh
  setInterval(fetchAllTeams, config.spreadsheet.refreshInterval);

  logger.info('Data service initialized', {
    refreshInterval: `${config.spreadsheet.refreshInterval / 1000}s`,
  });
}

module.exports = {
  initialize,
  getTeams,
  getStatus,
  fetchAllTeams,
  normalize,
  getSpriteUrl,
};
