/**
 * UI Templates
 * HTML generation for MCP-UI responses
 */

const { spriteImg, itemImg, toShowdownName } = require('./sprite-utils');
const { CSS, RESIZE_SCRIPT } = require('./styles');

/**
 * Base HTML wrapper with styles and resize script
 */
function wrapHTML(content, title = 'VGC Team Finder') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
  ${RESIZE_SCRIPT}
</body>
</html>`;
}

/**
 * Get placement badge HTML
 */
function getPlacementBadge(rank) {
  if (!rank || rank === '-' || rank === 'None') return '';

  const rankLower = rank.toLowerCase();

  if (rankLower.includes('1st') || rankLower.includes('winner') || rankLower.includes('champion')) {
    return '<span class="badge badge-placement badge-1st">🥇 1st</span>';
  }
  if (rankLower.includes('2nd') || rankLower.includes('finalist')) {
    return '<span class="badge badge-placement badge-2nd">🥈 2nd</span>';
  }
  if (rankLower.includes('3rd')) {
    return '<span class="badge badge-placement badge-3rd">🥉 3rd</span>';
  }
  if (rankLower.includes('top 4') || rankLower.includes('top4')) {
    return '<span class="badge badge-placement badge-top4">Top 4</span>';
  }
  if (rankLower.includes('top 8') || rankLower.includes('top8')) {
    return '<span class="badge badge-placement badge-top8">Top 8</span>';
  }
  if (rankLower.includes('top 16') || rankLower.includes('top16')) {
    return '<span class="badge badge-placement badge-top16">Top 16</span>';
  }

  return `<span class="badge badge-placement badge-top16">${rank}</span>`;
}

/**
 * Generate a single team card
 */
function teamCard(team, featured = false) {
  const pokemonSlots = team.pokemon.map(p => `
    <div class="pokemon-slot">
      ${spriteImg(p.name, featured ? 64 : 48)}
      <div class="pokemon-name">${p.name}</div>
      <div class="pokemon-item">${p.item || ''}</div>
    </div>
  `).join('');

  const placementBadge = getPlacementBadge(team.rank);
  const rentalBadge = team.rentalCode && team.rentalCode !== 'None' && team.rentalCode.length > 0
    ? `<span class="badge badge-rental">📋 ${team.rentalCode}</span>`
    : '';

  const pokepasteLink = team.pokepaste
    ? `<a href="${team.pokepaste}" target="_blank" rel="noopener" class="link-btn link-btn-pokepaste">📄 Pokepaste</a>`
    : '';

  const rentalLink = team.rentalCode && team.rentalCode !== 'None' && team.rentalCode.length > 0
    ? `<span class="link-btn link-btn-rental">🎮 ${team.rentalCode}</span>`
    : '';

  return `
    <div class="team-card ${featured ? 'featured-card' : ''}" data-regulation="${team.regulation || ''}">
      <div class="card-header">
        <div class="player-info">
          <div class="player-name">${team.player || 'Unknown Player'}</div>
          <div class="event-info">
            <span class="event-name">${team.event || team.description || ''}</span>
            ${team.date ? `<span class="event-date"> • ${team.date}</span>` : ''}
          </div>
        </div>
        <div class="badges">
          <span class="badge badge-reg">Reg ${team.regulation}</span>
          ${placementBadge}
          ${rentalBadge}
        </div>
      </div>
      <div class="pokemon-row">
        ${pokemonSlots}
      </div>
      <div class="links-row">
        ${pokepasteLink}
        ${rentalLink}
      </div>
    </div>
  `;
}

/**
 * Empty state component
 */
function emptyState(message, suggestion = '') {
  return `
    <div class="empty-state">
      <div class="emoji">🔍</div>
      <h2>${message}</h2>
      ${suggestion ? `<p>${suggestion}</p>` : ''}
    </div>
  `;
}

/**
 * Generate filter bar with regulation dropdown
 */
function filterBar(teams, showCount = true) {
  // Get unique regulations from the teams
  const regulations = [...new Set(teams.map(t => t.regulation).filter(Boolean))].sort();

  const regOptions = regulations.map(r =>
    `<option value="${r}">Reg ${r}</option>`
  ).join('');

  return `
    <div class="filter-bar">
      <label for="reg-filter">Regulation:</label>
      <select id="reg-filter" class="filter-select" onchange="filterByReg(this.value)">
        <option value="">All Regulations</option>
        ${regOptions}
      </select>
      ${showCount ? `<span class="result-count">Showing <span class="count" id="visible-count">${teams.length}</span> teams</span>` : ''}
    </div>
    <script>
      function filterByReg(reg) {
        const cards = document.querySelectorAll('.team-card');
        let count = 0;
        cards.forEach(card => {
          if (!reg || card.dataset.regulation === reg) {
            card.style.display = '';
            count++;
          } else {
            card.style.display = 'none';
          }
        });
        const countEl = document.getElementById('visible-count');
        if (countEl) countEl.textContent = count;

        // Trigger resize for parent iframe
        if (window.parent) {
          const height = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.scrollHeight
          );
          window.parent.postMessage({ type: 'resize', height: height + 20 }, '*');
        }
      }
    </script>
  `;
}

/**
 * Template: search_teams
 */
function searchTeamsHTML(teams, query, total) {
  if (!teams || teams.length === 0) {
    return wrapHTML(
      emptyState(`No teams found for "${query}"`, 'Try different Pokemon names or check the spelling.'),
      'Search Results'
    );
  }

  const displayTeams = teams.slice(0, 20);

  const header = `
    <div class="header">
      <h1>🔍 Search Results</h1>
      <p class="subtitle">
        Found <span class="count">${total}</span> teams for "<strong>${query}</strong>"
      </p>
    </div>
  `;

  const filter = filterBar(displayTeams);
  const cards = displayTeams.map(t => teamCard(t)).join('');

  return wrapHTML(header + filter + `<div class="team-grid">${cards}</div>`, 'Search Results');
}

/**
 * Template: random_team
 */
function randomTeamHTML(team, pokemon = null) {
  if (!team) {
    return wrapHTML(
      emptyState('No team found', pokemon ? `No teams with ${pokemon} available.` : 'Try again!'),
      'Random Team'
    );
  }

  const header = `
    <div class="header">
      <h1>🎲 Random Team${pokemon ? ` with ${pokemon}` : ''}</h1>
      <p class="subtitle">Here's a team for inspiration!</p>
    </div>
  `;

  return wrapHTML(header + teamCard(team, true), 'Random Team');
}

/**
 * Template: get_pokemon_usage
 */
function pokemonUsageHTML(usage, totalTeams, regulation = null) {
  if (!usage || usage.length === 0) {
    return wrapHTML(emptyState('No usage data available'), 'Pokemon Usage');
  }

  const header = `
    <div class="header">
      <h1>📊 Pokemon Usage Statistics</h1>
      <p class="subtitle">
        ${regulation ? `Regulation ${regulation} • ` : ''}Based on <span class="count">${totalTeams}</span> teams
      </p>
    </div>
  `;

  const maxCount = usage[0]?.count || 1;

  const usageItems = usage.map((item, i) => {
    const percentage = ((item.count / totalTeams) * 100).toFixed(1);
    const barWidth = (item.count / maxCount) * 100;

    return `
      <div class="usage-item">
        <span class="usage-rank">#${i + 1}</span>
        ${spriteImg(item.name, 40)}
        <span class="usage-name">${item.name}</span>
        <div class="usage-bar-container">
          <div class="usage-bar" style="width: ${barWidth}%"></div>
        </div>
        <span class="usage-percent">${percentage}%</span>
      </div>
    `;
  }).join('');

  return wrapHTML(
    header + `<div class="usage-container"><div class="usage-list">${usageItems}</div></div>`,
    'Pokemon Usage'
  );
}

/**
 * Template: get_rental_teams
 */
function rentalTeamsHTML(teams, pokemon = null, regulation = null) {
  if (!teams || teams.length === 0) {
    return wrapHTML(
      emptyState('No rental teams found', 'Try searching for different Pokemon.'),
      'Rental Teams'
    );
  }

  const filterText = [
    pokemon ? `with ${pokemon}` : '',
    regulation ? `in Reg ${regulation}` : ''
  ].filter(Boolean).join(' ');

  const displayTeams = teams.slice(0, 20);

  const header = `
    <div class="header">
      <h1>🎮 Rental Teams${filterText ? ` ${filterText}` : ''}</h1>
      <p class="subtitle">
        <span class="count">${teams.length}</span> teams with rental codes ready to use!
      </p>
    </div>
  `;

  const filter = filterBar(displayTeams);
  const cards = displayTeams.map(t => teamCard(t)).join('');

  return wrapHTML(header + filter + `<div class="team-grid">${cards}</div>`, 'Rental Teams');
}

/**
 * Template: get_pokemon_teammates
 */
function pokemonTeammatesHTML(pokemon, teammates, totalTeams) {
  if (!teammates || teammates.length === 0) {
    return wrapHTML(
      emptyState(`No teammate data for ${pokemon}`),
      'Pokemon Teammates'
    );
  }

  const header = `
    <div class="header">
      <div class="usage-header" style="justify-content: center;">
        ${spriteImg(pokemon, 100)}
        <div>
          <h1 class="usage-title">${pokemon}</h1>
          <p class="usage-subtitle">Common teammates from ${totalTeams} teams</p>
        </div>
      </div>
    </div>
  `;

  const teammateCards = teammates.map(t => `
    <div class="teammate-card">
      ${spriteImg(t.name, 56)}
      <div class="teammate-name">${t.name}</div>
      <div class="teammate-percent">${t.percentage}%</div>
    </div>
  `).join('');

  return wrapHTML(
    header + `<div class="teammates-grid">${teammateCards}</div>`,
    `${pokemon} Teammates`
  );
}

/**
 * Template: get_pokemon_items
 */
function pokemonItemsHTML(pokemon, items, totalCount) {
  if (!items || items.length === 0) {
    return wrapHTML(
      emptyState(`No item data for ${pokemon}`),
      'Pokemon Items'
    );
  }

  const header = `
    <div class="header">
      <div class="usage-header" style="justify-content: center;">
        ${spriteImg(pokemon, 100)}
        <div>
          <h1 class="usage-title">Items on ${pokemon}</h1>
          <p class="usage-subtitle">From ${totalCount} appearances</p>
        </div>
      </div>
    </div>
  `;

  const maxCount = items[0]?.count || 1;

  const itemRows = items.map(item => {
    const barWidth = (item.count / maxCount) * 100;
    return `
      <div class="item-row">
        ${itemImg(item.name, 32)}
        <span class="item-name">${item.name}</span>
        <div class="item-bar-container">
          <div class="item-bar" style="width: ${barWidth}%"></div>
        </div>
        <span class="item-percent">${item.percentage}%</span>
      </div>
    `;
  }).join('');

  return wrapHTML(
    header + `<div class="usage-container"><div class="items-list">${itemRows}</div></div>`,
    `${pokemon} Items`
  );
}

/**
 * Template: get_player_teams
 */
function playerTeamsHTML(player, teams) {
  if (!teams || teams.length === 0) {
    return wrapHTML(
      emptyState(`No teams found for ${player}`),
      'Player Teams'
    );
  }

  const displayTeams = teams.slice(0, 20);

  const header = `
    <div class="header">
      <h1>👤 ${player}</h1>
      <p class="subtitle">
        <span class="count">${teams.length}</span> teams in database
      </p>
    </div>
  `;

  const filter = filterBar(displayTeams);
  const cards = displayTeams.map(t => teamCard(t)).join('');

  return wrapHTML(header + filter + `<div class="team-grid">${cards}</div>`, `${player} Teams`);
}

/**
 * Template: get_tournament_teams
 */
function tournamentTeamsHTML(event, teams) {
  if (!teams || teams.length === 0) {
    return wrapHTML(
      emptyState(`No teams found from ${event}`),
      'Tournament Teams'
    );
  }

  const displayTeams = teams.slice(0, 20);

  const header = `
    <div class="header">
      <h1>🏆 ${event}</h1>
      <p class="subtitle">
        <span class="count">${teams.length}</span> teams from this event
      </p>
    </div>
  `;

  const filter = filterBar(displayTeams);
  const cards = displayTeams.map(t => teamCard(t)).join('');

  return wrapHTML(header + filter + `<div class="team-grid">${cards}</div>`, `${event} Teams`);
}

/**
 * Template: get_team_by_rental
 */
function rentalCodeTeamHTML(team, rentalCode) {
  if (!team) {
    return wrapHTML(
      emptyState(`No team found with rental code ${rentalCode}`, 'Double-check the code and try again.'),
      'Rental Code Lookup'
    );
  }

  const header = `
    <div class="header">
      <h1>🎮 Rental Code: ${rentalCode}</h1>
      <p class="subtitle">Team details below</p>
    </div>
  `;

  return wrapHTML(header + teamCard(team, true), `Rental: ${rentalCode}`);
}

/**
 * Template: get_item_usage
 */
function itemUsageHTML(items, totalItems) {
  if (!items || items.length === 0) {
    return wrapHTML(emptyState('No item usage data available'), 'Item Usage');
  }

  const header = `
    <div class="header">
      <h1>🎒 Item Usage Statistics</h1>
      <p class="subtitle">
        Based on <span class="count">${totalItems}</span> item slots
      </p>
    </div>
  `;

  const maxCount = items[0]?.count || 1;

  const itemRows = items.map((item, i) => {
    const barWidth = (item.count / maxCount) * 100;
    return `
      <div class="item-row">
        <span class="usage-rank">#${i + 1}</span>
        ${itemImg(item.name, 32)}
        <span class="item-name">${item.name}</span>
        <div class="item-bar-container">
          <div class="item-bar" style="width: ${barWidth}%"></div>
        </div>
        <span class="item-percent">${item.percentage}%</span>
      </div>
    `;
  }).join('');

  return wrapHTML(
    header + `<div class="usage-container"><div class="items-list">${itemRows}</div></div>`,
    'Item Usage'
  );
}

/**
 * Template: get_regulations
 */
function regulationsHTML(regulations, totalTeams) {
  const header = `
    <div class="header">
      <h1>📋 Available Regulations</h1>
      <p class="subtitle">
        <span class="count">${totalTeams}</span> total teams across ${regulations.length} regulations
      </p>
    </div>
  `;

  const maxCount = Math.max(...regulations.map(r => r.count));

  const regItems = regulations.map(reg => {
    const barWidth = (reg.count / maxCount) * 100;
    return `
      <div class="usage-item">
        <span class="badge badge-reg" style="width: 60px; justify-content: center;">Reg ${reg.name}</span>
        <div class="usage-bar-container" style="flex: 3;">
          <div class="usage-bar" style="width: ${barWidth}%"></div>
        </div>
        <span class="usage-percent" style="min-width: 80px;">${reg.count} teams</span>
      </div>
    `;
  }).join('');

  return wrapHTML(
    header + `<div class="usage-container"><div class="usage-list">${regItems}</div></div>`,
    'Regulations'
  );
}

/**
 * Template: recommend_teams
 */
function recommendTeamsHTML(teams, archetypes, pokemon, total) {
  if (!teams || teams.length === 0) {
    return wrapHTML(
      emptyState('No matching teams found', 'Try different playstyle keywords or Pokemon names.'),
      'Recommendations'
    );
  }

  const displayTeams = teams.slice(0, 20);

  // Build context badges showing detected playstyles and Pokemon
  const archetypeBadges = archetypes.map(a =>
    `<span class="badge badge-archetype">${a}</span>`
  ).join('');
  const pokemonBadges = pokemon.map(p =>
    `<span class="badge badge-pokemon">${p}</span>`
  ).join('');
  const contextBadges = archetypeBadges + pokemonBadges;

  const header = `
    <div class="header">
      <h1>🎯 Team Recommendations</h1>
      <p class="subtitle">
        Found <span class="count">${total}</span> teams matching your style
      </p>
      ${contextBadges ? `<div class="context-badges">${contextBadges}</div>` : ''}
    </div>
  `;

  const filter = filterBar(displayTeams);
  const cards = displayTeams.map(t => teamCard(t)).join('');

  return wrapHTML(header + filter + `<div class="team-grid">${cards}</div>`, 'Recommendations');
}

module.exports = {
  wrapHTML,
  teamCard,
  emptyState,
  searchTeamsHTML,
  randomTeamHTML,
  pokemonUsageHTML,
  rentalTeamsHTML,
  pokemonTeammatesHTML,
  pokemonItemsHTML,
  playerTeamsHTML,
  tournamentTeamsHTML,
  rentalCodeTeamHTML,
  itemUsageHTML,
  regulationsHTML,
  recommendTeamsHTML
};
