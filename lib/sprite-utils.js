/**
 * Sprite Utilities
 * Pokemon name formatting and sprite URL generation for Pokemon Showdown
 */

// Special name mappings for Pokemon Showdown sprites
const SHOWDOWN_MAPPINGS = {
  // Paradox Pokemon
  'gouging fire': 'gougingfire',
  'raging bolt': 'ragingbolt',
  'iron hands': 'ironhands',
  'iron bundle': 'ironbundle',
  'iron boulder': 'ironboulder',
  'iron crown': 'ironcrown',
  'iron moth': 'ironmoth',
  'iron thorns': 'ironthorns',
  'iron treads': 'irontreads',
  'iron valiant': 'ironvaliant',
  'iron jugulis': 'ironjugulis',
  'flutter mane': 'fluttermane',
  'slither wing': 'slitherwing',
  'sandy shocks': 'sandyshocks',
  'roaring moon': 'roaringmoon',
  'great tusk': 'greattusk',
  'scream tail': 'screamtail',
  'brute bonnet': 'brutebonnet',
  'walking wake': 'walkingwake',

  // Treasures of Ruin
  'chien-pao': 'chienpao',
  'chi-yu': 'chiyu',
  'ting-lu': 'tinglu',
  'wo-chien': 'wochien',

  // Forms
  'urshifu-rapid-strike': 'urshifu-rapidstrike',
  'urshifu-single-strike': 'urshifu',
  'urshifu rapid strike': 'urshifu-rapidstrike',
  'urshifu single strike': 'urshifu',
  'calyrex-shadow': 'calyrex-shadow',
  'calyrex-ice': 'calyrex-ice',
  'ogerpon-hearthflame': 'ogerpon-hearthflame',
  'ogerpon-wellspring': 'ogerpon-wellspring',
  'ogerpon-cornerstone': 'ogerpon-cornerstone',
  'bloodmoon ursaluna': 'ursaluna-bloodmoon',
  'ursaluna-bloodmoon': 'ursaluna-bloodmoon',
  'ursaluna bloodmoon': 'ursaluna-bloodmoon',

  // Therian Forms
  'landorus-therian': 'landorus-therian',
  'tornadus-therian': 'tornadus-therian',
  'thundurus-therian': 'thundurus-therian',
  'landorus-incarnate': 'landorus',
  'tornadus-incarnate': 'tornadus',
  'thundurus-incarnate': 'thundurus',

  // Regional Forms
  'zapdos-galar': 'zapdos-galar',
  'articuno-galar': 'articuno-galar',
  'moltres-galar': 'moltres-galar',
  'ninetales-alola': 'ninetales-alola',
  'raichu-alola': 'raichu-alola',
  'marowak-alola': 'marowak-alola',
  'muk-alola': 'muk-alola',
  'persian-alola': 'persian-alola',
  'exeggutor-alola': 'exeggutor-alola',

  // Gender Forms
  'indeedee-f': 'indeedee-f',
  'indeedee-m': 'indeedee',
  'indeedee-female': 'indeedee-f',
  'indeedee-male': 'indeedee',
  'meowstic-f': 'meowstic-f',
  'meowstic-m': 'meowstic',
  'basculegion-f': 'basculegion-f',
  'basculegion-m': 'basculegion',

  // Legendaries
  'terapagos': 'terapagos',
  'miraidon': 'miraidon',
  'koraidon': 'koraidon',
  'pecharunt': 'pecharunt',

  // Special Cases
  'mr. mime': 'mrmime',
  'mr. rime': 'mrrime',
  'mime jr.': 'mimejr',
  'type: null': 'typenull',
  'ho-oh': 'hooh',
  'porygon-z': 'porygonz',
  'porygon2': 'porygon2',
  'nidoran-f': 'nidoranf',
  'nidoran-m': 'nidoranm',
  "farfetch'd": 'farfetchd',
  "sirfetch'd": 'sirfetchd',
  'flabebe': 'flabebe',
  'comfey': 'comfey',

  // Common VGC Pokemon (ensure correct)
  'incineroar': 'incineroar',
  'rillaboom': 'rillaboom',
  'amoonguss': 'amoonguss',
  'farigiraf': 'farigiraf',
  'gholdengo': 'gholdengo',
  'annihilape': 'annihilape',
  'arcanine': 'arcanine',
  'arcanine-hisui': 'arcanine-hisui',
  'kingambit': 'kingambit',
  'dragonite': 'dragonite',
  'dondozo': 'dondozo',
  'tatsugiri': 'tatsugiri',
  'palafin': 'palafin',
  'pelipper': 'pelipper',
  'torkoal': 'torkoal',
  'grimmsnarl': 'grimmsnarl',
  'whimsicott': 'whimsicott',
};

/**
 * Convert Pokemon name to Showdown sprite format
 */
function toShowdownName(name) {
  if (!name) return 'substitute';

  const lower = name.toLowerCase().trim();

  // Check direct mapping first
  if (SHOWDOWN_MAPPINGS[lower]) {
    return SHOWDOWN_MAPPINGS[lower];
  }

  // Handle common patterns
  let formatted = lower
    .replace(/[''.]/g, '')       // Remove apostrophes and dots
    .replace(/:/g, '')           // Remove colons
    .replace(/\s+/g, '')         // Remove spaces
    .replace(/♀/g, '-f')         // Female symbol
    .replace(/♂/g, '-m');        // Male symbol

  return formatted;
}

/**
 * Get animated sprite URL with fallback chain
 */
function getAnimatedSpriteUrl(name) {
  const showdownName = toShowdownName(name);
  return `https://play.pokemonshowdown.com/sprites/ani/${showdownName}.gif`;
}

/**
 * Get gen5 animated sprite URL (fallback)
 */
function getGen5SpriteUrl(name) {
  const showdownName = toShowdownName(name);
  return `https://play.pokemonshowdown.com/sprites/gen5ani/${showdownName}.gif`;
}

/**
 * Get static sprite URL (final fallback)
 */
function getStaticSpriteUrl(name) {
  const showdownName = toShowdownName(name);
  return `https://img.pokemondb.net/sprites/home/normal/${showdownName}.png`;
}

/**
 * Get item sprite URL from PokeAPI
 */
function getItemSpriteUrl(itemName) {
  if (!itemName || itemName === 'Unknown' || itemName === 'None') {
    return null;
  }

  const formatted = itemName.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[''.]/g, '');

  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${formatted}.png`;
}

/**
 * Generate img tag with fallback chain
 */
function spriteImg(name, size = 64) {
  const showdownName = toShowdownName(name);
  const primary = `https://play.pokemonshowdown.com/sprites/ani/${showdownName}.gif`;
  const fallback1 = `https://play.pokemonshowdown.com/sprites/gen5ani/${showdownName}.gif`;
  const fallback2 = `https://img.pokemondb.net/sprites/home/normal/${showdownName}.png`;
  const pokeball = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';

  return `<img
    src="${primary}"
    onerror="if(!this.dataset.retry){this.dataset.retry=1;this.src='${fallback1}'}else if(this.dataset.retry==1){this.dataset.retry=2;this.src='${fallback2}'}else{this.src='${pokeball}'}"
    alt="${name}"
    width="${size}"
    height="${size}"
    loading="lazy"
    class="pokemon-sprite"
  >`;
}

/**
 * Generate item img tag with fallback
 */
function itemImg(itemName, size = 24) {
  if (!itemName || itemName === 'Unknown' || itemName === 'None') {
    return '';
  }

  const url = getItemSpriteUrl(itemName);
  const pokeball = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';

  return `<img
    src="${url}"
    onerror="this.style.display='none'"
    alt="${itemName}"
    width="${size}"
    height="${size}"
    loading="lazy"
    class="item-sprite"
  >`;
}

module.exports = {
  toShowdownName,
  getAnimatedSpriteUrl,
  getGen5SpriteUrl,
  getStaticSpriteUrl,
  getItemSpriteUrl,
  spriteImg,
  itemImg,
  SHOWDOWN_MAPPINGS
};
