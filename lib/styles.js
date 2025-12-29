/**
 * CSS Design System
 * Dark esports-themed styling for VGC Team Finder
 */

const CSS = `
/* Reset & Base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* CSS Variables - Design Tokens */
:root {
  /* Backgrounds */
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-card: rgba(255, 255, 255, 0.03);
  --bg-card-hover: rgba(255, 255, 255, 0.06);
  --bg-gradient: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);

  /* Accents */
  --accent-red: #ff4757;
  --accent-blue: #00d4ff;
  --accent-gold: #ffd700;
  --accent-silver: #c0c0c0;
  --accent-bronze: #cd7f32;
  --accent-green: #26de81;
  --accent-purple: #a855f7;
  --accent-orange: #ff6b35;

  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --text-muted: #606060;

  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-accent: rgba(255, 71, 87, 0.5);

  /* Effects */
  --glow-red: 0 0 20px rgba(255, 71, 87, 0.3);
  --glow-blue: 0 0 20px rgba(0, 212, 255, 0.3);
  --glow-gold: 0 0 20px rgba(255, 215, 0, 0.3);
  --glow-purple: 0 0 20px rgba(168, 85, 247, 0.3);

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 0.15s ease-out;
  --transition-normal: 0.2s ease-out;
  --transition-slow: 0.3s ease-out;
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-md);
}

/* Header */
.header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  backdrop-filter: blur(10px);
}

.header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  text-shadow: 0 0 30px rgba(255, 71, 87, 0.3);
}

.header .subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.header .count {
  color: var(--accent-blue);
  font-weight: 600;
}

/* Team Grid */
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--spacing-lg);
}

/* Team Card */
.team-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  backdrop-filter: blur(10px);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.team-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent-red), var(--accent-purple));
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.team-card:hover {
  background: var(--bg-card-hover);
  transform: translateY(-4px);
  box-shadow: var(--glow-red);
  border-color: var(--border-accent);
}

.team-card:hover::before {
  opacity: 1;
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.player-info {
  flex: 1;
}

.player-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.event-info {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.event-name {
  color: var(--text-secondary);
}

.event-date {
  color: var(--text-muted);
}

/* Badges */
.badges {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-reg {
  background: rgba(255, 71, 87, 0.15);
  color: var(--accent-red);
  border: 1px solid rgba(255, 71, 87, 0.3);
}

.badge-rental {
  background: rgba(0, 212, 255, 0.15);
  color: var(--accent-blue);
  border: 1px solid rgba(0, 212, 255, 0.3);
}

.badge-placement {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-weight: 700;
}

.badge-1st {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #000;
  box-shadow: var(--glow-gold);
}

.badge-2nd {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
  color: #000;
}

.badge-3rd {
  background: linear-gradient(135deg, #cd7f32, #a86523);
  color: #000;
}

.badge-top4, .badge-top8, .badge-top16 {
  background: rgba(168, 85, 247, 0.15);
  color: var(--accent-purple);
  border: 1px solid rgba(168, 85, 247, 0.3);
}

/* Pokemon Row */
.pokemon-row {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin: var(--spacing-md) 0;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.pokemon-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
  min-width: 0;
}

.pokemon-sprite {
  width: 64px;
  height: 64px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
  transition: transform var(--transition-fast);
  image-rendering: pixelated;
}

.pokemon-slot:hover .pokemon-sprite {
  transform: scale(1.15);
}

.pokemon-name {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: var(--spacing-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.pokemon-item {
  font-size: 0.55rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Links Row */
.links-row {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.link-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  transition: all var(--transition-fast);
  flex: 1;
  justify-content: center;
}

.link-btn-pokepaste {
  background: rgba(255, 71, 87, 0.15);
  color: var(--accent-red);
  border: 1px solid rgba(255, 71, 87, 0.3);
}

.link-btn-pokepaste:hover {
  background: var(--accent-red);
  color: white;
  box-shadow: var(--glow-red);
}

.link-btn-rental {
  background: rgba(0, 212, 255, 0.15);
  color: var(--accent-blue);
  border: 1px solid rgba(0, 212, 255, 0.3);
}

.link-btn-rental:hover {
  background: var(--accent-blue);
  color: #000;
  box-shadow: var(--glow-blue);
}

/* Usage Stats */
.usage-container {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  backdrop-filter: blur(10px);
}

.usage-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.usage-header .pokemon-sprite {
  width: 100px;
  height: 100px;
}

.usage-title {
  font-size: 1.5rem;
  font-weight: 700;
}

.usage-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.usage-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.usage-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.usage-rank {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
  width: 24px;
}

.usage-sprite {
  width: 40px;
  height: 40px;
}

.usage-name {
  flex: 1;
  font-weight: 600;
}

.usage-bar-container {
  flex: 2;
  height: 8px;
  background: var(--bg-primary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.usage-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-red), var(--accent-purple));
  border-radius: var(--radius-full);
  transition: width var(--transition-slow);
}

.usage-percent {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-blue);
  min-width: 50px;
  text-align: right;
}

/* Teammates Grid */
.teammates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.teammate-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  text-align: center;
  transition: all var(--transition-fast);
}

.teammate-card:hover {
  background: var(--bg-card-hover);
  transform: translateY(-2px);
}

.teammate-card .pokemon-sprite {
  width: 56px;
  height: 56px;
}

.teammate-name {
  font-size: 0.7rem;
  font-weight: 600;
  margin-top: var(--spacing-xs);
}

.teammate-percent {
  font-size: 0.65rem;
  color: var(--accent-green);
  font-weight: 600;
}

/* Items List */
.items-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.item-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.item-sprite {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.item-name {
  flex: 1;
  font-weight: 600;
}

.item-bar-container {
  flex: 2;
  height: 6px;
  background: var(--bg-primary);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.item-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-gold), var(--accent-orange));
  border-radius: var(--radius-full);
}

.item-percent {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-gold);
  min-width: 50px;
  text-align: right;
}

/* Featured Card (for random_team) */
.featured-card {
  max-width: 500px;
  margin: 0 auto;
}

.featured-card .pokemon-sprite {
  width: 80px;
  height: 80px;
}

.featured-card .pokemon-row {
  padding: var(--spacing-lg);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-xl) * 2;
  color: var(--text-secondary);
}

.empty-state .emoji {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
}

.empty-state h2 {
  font-size: 1.25rem;
  margin-bottom: var(--spacing-sm);
}

.empty-state p {
  color: var(--text-muted);
}

/* Footer */
.footer {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--text-muted);
  font-size: 0.75rem;
  margin-top: var(--spacing-xl);
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-primary);
}

::-webkit-scrollbar-thumb {
  background: var(--border-subtle);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* Responsive */
@media (max-width: 768px) {
  .team-grid {
    grid-template-columns: 1fr;
  }

  .pokemon-row {
    flex-wrap: wrap;
    justify-content: center;
  }

  .pokemon-slot {
    width: 30%;
  }

  .pokemon-sprite {
    width: 48px;
    height: 48px;
  }

  .header h1 {
    font-size: 1.25rem;
  }
}

/* Animations */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.team-card {
  animation: fadeIn 0.3s ease-out;
}

.team-card:nth-child(2) { animation-delay: 0.05s; }
.team-card:nth-child(3) { animation-delay: 0.1s; }
.team-card:nth-child(4) { animation-delay: 0.15s; }
.team-card:nth-child(5) { animation-delay: 0.2s; }
.team-card:nth-child(6) { animation-delay: 0.25s; }

/* Skeleton Loading */
.skeleton {
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-card) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
`;

/**
 * Goose iframe sizing script - CRITICAL for proper height
 */
const RESIZE_SCRIPT = `
<script>
(function() {
  function sendHeight() {
    const height = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.scrollHeight
    );
    window.parent.postMessage({ type: 'resize', height: height + 20 }, '*');
  }

  if (document.readyState === 'complete') {
    sendHeight();
  } else {
    window.addEventListener('load', sendHeight);
  }

  new ResizeObserver(sendHeight).observe(document.body);

  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('load', sendHeight);
    img.addEventListener('error', function() {
      this.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
      sendHeight();
    });
  });
})();
</script>
`;

module.exports = {
  CSS,
  RESIZE_SCRIPT
};
