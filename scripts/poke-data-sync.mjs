#!/usr/bin/env node

/**
 * POKE_DATA_SYNC — Master data synchronization script.
 *
 * Sources:
 *   - @pkmn/dex (npm) — species, moves, abilities, items, types, type-effectiveness
 *   - PokeAPI sprites (via raw GitHub URLs) — front/back/shiny/icon/animated sprites
 *   - PokeAPI cries (via raw GitHub URLs) — Pokemon cries (.ogg)
 *
 * Usage:
 *   node scripts/poke-data-sync.mjs [--force] [--sprites-only] [--data-only]
 *
 * The script is idempotent — safe to re-run. Existing valid assets are skipped.
 * Use --force to re-download everything.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const DATA_RAW = join(PROJECT_ROOT, 'data', 'raw');
const DATA_NORMALIZED = join(PROJECT_ROOT, 'data', 'normalized');
const PUBLIC_ASSETS = join(PROJECT_ROOT, 'public', 'assets');
const SRC_DATA = join(PROJECT_ROOT, 'src', 'data', 'pokemon');
const MANIFEST_PATH = join(DATA_NORMALIZED, 'manifest.json');
const BATCH_SIZE = 50;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const DOWNLOAD_TIMEOUT_MS = 30000;

// --- CLI args ---
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const SPRITES_ONLY = args.includes('--sprites-only');
const DATA_ONLY = args.includes('--data-only');

// --- Helpers ---
function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function fileExists(path) {
  try { const s = statSync(path); return s.size > 0; } catch { return false; }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    import('https').then(({ default: https }) => {
      const dir = dirname(dest);
      ensureDir(dir);
      const req = https.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          downloadFile(res.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          writeFileSync(dest, buffer);
          resolve(buffer);
        });
        res.on('error', reject);
      });
      req.on('error', reject);
      req.setTimeout(DOWNLOAD_TIMEOUT_MS, () => { req.destroy(); reject(new Error(`Timeout for ${url}`)); });
    });
  });
}

async function downloadWithRetry(url, dest) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await downloadFile(url, dest);
      return true;
    } catch (e) {
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      } else {
        // Clean up empty files
        try { if (existsSync(dest) && statSync(dest).size === 0) unlinkSync(dest); } catch {}
        throw e;
      }
    }
  }
  return false;
}

// --- Normalize type name to lowercase ---
function typeName(name) {
  return name.toLowerCase();
}

function mapDamageTaken(damageTaken) {
  const result = {};
  for (const [type, value] of Object.entries(damageTaken)) {
    result[typeName(type)] = value;
  }
  return result;
}

// ============================================================
// DATA GENERATION
// ============================================================

function generateTypesData(Dex) {
  console.log('Generating type data...');
  const gen9 = Dex.forGen(9);
  const types = [];

  const TYPE_IDS = {
    normal: 1, fire: 2, water: 3, electric: 4, grass: 5, ice: 6,
    fighting: 7, poison: 8, ground: 9, flying: 10, psychic: 11,
    rock: 12, bug: 13, ghost: 14, dragon: 15, dark: 16, steel: 17,
    fairy: 18,
  };

  for (const type of gen9.types.all()) {
    if (type.isNonstandard) continue;
    const name = typeName(type.name);
    if (name === 'stellar') continue;
    types.push({
      id: TYPE_IDS[name] || types.length + 1,
      name,
      damageTaken: mapDamageTaken(type.damageTaken),
    });
  }

  return { types };
}

function generateSpeciesData(Dex) {
  console.log('Generating species data...');
  const gen9 = Dex.forGen(9);
  const species = [];

  for (const s of gen9.species.all()) {
    if (s.isNonstandard && s.isNonstandard !== 'Past') continue;
    if (s.isCosmeticForme) continue;

    const id = s.num;
    if (id <= 0) continue;

    const types = s.types.map(t => typeName(t));
    const abilities = { regular: [], hidden: [] };

    for (const [slot, abilityName] of Object.entries(s.abilities)) {
      if (slot === 'H') {
        abilities.hidden.push(abilityName);
      } else {
        abilities.regular.push(abilityName);
      }
    }

    species.push({
      id,
      name: s.name,
      species: s.baseSpecies || s.name,
      generation: s.gen,
      types,
      baseStats: { ...s.baseStats },
      abilities,
      height: s.heightm || 0,
      weight: s.weightkg || 0,
      genderRatio: s.genderRatio || { M: 0.5, F: 0.5 },
      eggGroups: s.eggGroups || [],
      captureRate: 0,
      baseExperience: 0,
      baseHappiness: 0,
      growthRate: '',
      forms: s.otherFormes || [],
      baseForme: s.baseForme || '',
      prevo: s.prevo || null,
      evos: s.evos || [],
      canHatch: !!s.canHatch,
      isMega: !!s.isMega,
      isGmax: !!s.canGigantamax,
      isLegendary: s.tier === 'Uber' || s.tier === 'AG',
      isMythical: false,
      isBaby: !!(s.tier === 'LC' || (s.prevo && s.nfe && !s.prevo.includes('-'))),
      nfe: !!s.nfe,
      bst: s.bst || 0,
      spritePath: `/assets/pokemon/${String(id).padStart(3, '0')}/front.png`,
      iconPath: `/assets/pokemon/${String(id).padStart(3, '0')}/icon.png`,
    });
  }

  // Deduplicate by id (keep the base forme entry)
  const seen = new Set();
  const deduped = [];
  for (const s of species) {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      deduped.push(s);
    }
  }

  return { species: deduped };
}

function generateMovesData(Dex) {
  console.log('Generating moves data...');
  const gen9 = Dex.forGen(9);
  const moves = [];

  for (const m of gen9.moves.all()) {
    if (m.isNonstandard && m.isNonstandard !== 'Past') continue;

    const category = m.category === 'Physical' ? 'physical' :
                     m.category === 'Special' ? 'special' : 'status';

    moves.push({
      id: m.num,
      name: m.name,
      type: typeName(m.type),
      category,
      power: m.basePower,
      accuracy: m.accuracy === true ? -1 : m.accuracy,
      pp: m.pp,
      priority: m.priority,
      target: m.target,
      flags: m.flags || {},
      desc: m.desc || '',
      shortDesc: m.shortDesc || '',
      secondary: m.secondary ? {
        chance: m.secondary.chance || 0,
        status: m.secondary.status,
        boosts: m.secondary.boosts,
        volatileStatus: m.secondary.volatileStatus,
      } : null,
      critRatio: m.critRatio || 1,
      maxMove: m.maxMove ? { basePower: m.maxMove.basePower } : null,
      zMove: m.zMove ? { basePower: m.zMove.basePower } : null,
    });
  }

  return { moves };
}

function generateAbilitiesData(Dex) {
  console.log('Generating abilities data...');
  const gen9 = Dex.forGen(9);
  const abilities = [];

  for (const a of gen9.abilities.all()) {
    if (a.isNonstandard && a.isNonstandard !== 'Past') continue;

    abilities.push({
      id: a.num,
      name: a.name,
      desc: a.desc || '',
      shortDesc: a.shortDesc || '',
      flags: a.flags || {},
    });
  }

  return { abilities };
}

function generateItemsData(Dex) {
  console.log('Generating items data...');
  const gen9 = Dex.forGen(9);
  const items = [];

  for (const i of gen9.items.all()) {
    if (i.isNonstandard && i.isNonstandard !== 'Past') continue;

    items.push({
      id: i.num,
      name: i.name,
      desc: i.desc || '',
      shortDesc: i.shortDesc || '',
      generation: i.gen,
      spritePath: `/assets/items/icons/${i.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`,
    });
  }

  return { items };
}

function generateEvolutionData(Dex) {
  console.log('Generating evolution data...');
  const gen9 = Dex.forGen(9);
  const evolutions = [];

  for (const s of gen9.species.all()) {
    if (s.isNonstandard && s.isNonstandard !== 'Past') continue;
    if (s.isCosmeticForme) continue;
    if (!s.prevo) continue;

    const prevoSpecies = gen9.species.get(s.prevo);
    if (!prevoSpecies || !prevoSpecies.exists) continue;

    const conditions = {};
    if (s.evoLevel) conditions.level = s.evoLevel;
    if (s.evoItem) conditions.item = s.evoItem;
    if (s.evoMove) conditions.move = s.evoMove;
    if (s.evoHappiness !== undefined) conditions.happiness = s.evoHappiness;
    if (s.evoType) {
      // evoType can be: 'levelup', 'trade', 'useItem', 'shed', 'spin'
    }
    if (s.evoCondition) conditions.location = s.evoCondition;

    evolutions.push({
      species: s.prevo,
      targetSpecies: s.name,
      trigger: s.evoType || 'levelup',
      conditions,
    });
  }

  return { evolutions };
}

// ============================================================
// BERRY DATA (from PokeAPI REST)
// ============================================================

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    import('https').then(({ default: https }) => {
      https.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          fetchJSON(res.headers.location).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
        res.on('error', reject);
      }).on('error', reject);
    });
  });
}

async function generateBerryData() {
  console.log('Generating berry data from PokeAPI...');
  const list = await fetchJSON(`${POKEAPI_BASE}/berry?limit=1000`);
  const berries = [];

  for (const item of list.results) {
    try {
      const b = await fetchJSON(item.url);
      const flavors = { spicy: 0, dry: 0, sweet: 0, bitter: 0, sour: 0 };
      for (const f of (b.flavors || [])) {
        const name = f.flavor?.name;
        if (name && name in flavors) flavors[name] = f.potency || 0;
      }

      berries.push({
        id: b.id,
        name: b.name,
        firmness: b.firmness?.name || '',
        growthTime: b.growth_time || 0,
        maxHarvest: b.max_harvest || 0,
        naturalGiftPower: b.natural_gift_power || 0,
        naturalGiftType: b.natural_gift_type?.name || '',
        size: b.size || 0,
        smoothness: b.smoothness || 0,
        soilDryness: b.soil_dryness || 0,
        flavors,
        spritePath: `/assets/items/berries/${b.name}-berry.png`,
      });

      if (berries.length % 10 === 0) {
        console.log(`  Fetched ${berries.length} berries...`);
      }
    } catch (e) {
      console.error(`  Failed to fetch berry ${item.name}: ${e.message}`);
    }
  }

  console.log(`  Total berries: ${berries.length}`);
  return { berries };
}

// ============================================================
// MEGA EVOLUTION DATA (from @pkmn/dex)
// ============================================================

function generateMegaData(Dex) {
  console.log('Generating mega evolution data...');
  const gen9 = Dex.forGen(9);
  const megaEvolutions = [];
  const megaStones = [];

  // Known mega stone name → species mapping
  const MEGA_STONE_MAP = {
    'Venusaurite': 'Venusaur', 'Charizardite X': 'Charizard', 'Charizardite Y': 'Charizard',
    'Blastoisinite': 'Blastoise', 'Beedrillite': 'Beedrill', 'Pidgeotite': 'Pidgeot',
    'Alakazite': 'Alakazam', 'Slowbronite': 'Slowbro', 'Gengarite': 'Gengar',
    'Kangaskhanite': 'Kangaskhan', 'Pinsirite': 'Pinsir', 'Gyaradosite': 'Gyarados',
    'Aerodactylite': 'Aerodactyl', 'Mewtwonite X': 'Mewtwo', 'Mewtwonite Y': 'Mewtwo',
    'Ampharosite': 'Amphaross', 'Steelixite': 'Steelix', 'Scizorite': 'Scizor',
    'Heracronite': 'Heracross', 'Houndoominite': 'Houndoom', 'Tyranitarite': 'Tyranitar',
    'Sceptilite': 'Sceptile', 'Blazikenite': 'Blaziken', 'Swampertite': 'Swampert',
    'Gardevoirite': 'Gardevoir', 'Sablenite': 'Sableye', 'Mawilite': 'Mawile',
    'Aggronite': 'Aggron', 'Medichamite': 'Medicham', 'Manectricite': 'Manectric',
    'Sharpedonite': 'Sharpedo', 'Cameruptite': 'Camerupt', 'Altarianite': 'Altaria',
    'Absolite': 'Absol', 'Latiasite': 'Latias', 'Latiosite': 'Latios',
    'Groudonite': 'Groudon', 'Kyogrite': 'Kyogre', 'Rayquazite': 'Rayquaza',
    'Lopunnite': 'Lopunny', 'Garchompite': 'Garchomp', 'Lucarionite': 'Lucario',
    'Abomasite': 'Abomasone', 'Audinite': 'Audino', 'Diancite': 'Diancie',
    'Sableye-Mega': 'Sableye', 'Banettite': 'Banette',
  };

  // Find all mega species
  for (const s of gen9.species.all()) {
    if (!s.isMega) continue;
    if (s.isNonstandard && s.isNonstandard !== 'Past') continue;

    // Find the base species
    const baseName = s.baseSpecies || s.name.replace(/-Mega.*/, '');
    const baseSpecies = gen9.species.get(baseName);
    if (!baseSpecies || !baseSpecies.exists) continue;

    // Find matching mega stone
    let stoneName = '';
    for (const [stone, species] of Object.entries(MEGA_STONE_MAP)) {
      if (species === baseName) { stoneName = stone; break; }
    }

    const abilities = { regular: [], hidden: [] };
    for (const [slot, abilityName] of Object.entries(s.abilities)) {
      if (slot === 'H') abilities.hidden.push(abilityName);
      else abilities.regular.push(abilityName);
    }

    megaEvolutions.push({
      baseSpecies: baseName,
      megaForme: s.name,
      megaStone: stoneName,
      types: s.types.map(t => typeName(t)),
      abilities,
      baseStats: { ...s.baseStats },
      spritePath: `/assets/pokemon/${String(s.num).padStart(3, '0')}/front.png`,
    });
  }

  // Find mega stone items
  for (const i of gen9.items.all()) {
    if (i.isNonstandard && i.isNonstandard !== 'Past') continue;
    const name = i.name;
    const targetSpecies = MEGA_STONE_MAP[name];
    if (targetSpecies) {
      megaStones.push({
        id: i.num,
        name: i.name,
        desc: i.desc || '',
        shortDesc: i.shortDesc || '',
        generation: i.gen,
        targetSpecies,
        spritePath: `/assets/items/icons/${i.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`,
      });
    }
  }

  console.log(`  Mega evolutions: ${megaEvolutions.length}`);
  console.log(`  Mega stones: ${megaStones.length}`);
  return { megaEvolutions, megaStones };
}

// ============================================================
// SPRITE DOWNLOAD
// ============================================================

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

function getSpriteUrls(id) {
  return [
    { url: `${SPRITE_BASE}/${id}.png`, dest: 'front.png' },
    { url: `${SPRITE_BASE}/back/${id}.png`, dest: 'back.png' },
    { url: `${SPRITE_BASE}/shiny/${id}.png`, dest: 'shiny-front.png' },
    { url: `${SPRITE_BASE}/back/shiny/${id}.png`, dest: 'shiny-back.png' },
    { url: `${SPRITE_BASE}/other/showdown/${id}.gif`, dest: 'animated.gif' },
    { url: id <= 807
      ? `${SPRITE_BASE}/versions/generation-vii/icons/${id}.png`
      : `${SPRITE_BASE}/versions/generation-viii/icons/${id}.png`,
      dest: 'icon.png' },
  ];
}

function speciesNeedsDownload(id, force) {
  if (force) return true;
  const paddedId = String(id).padStart(3, '0');
  const dir = join(PUBLIC_ASSETS, 'pokemon', paddedId);
  const sprites = getSpriteUrls(id);
  return sprites.some(s => !fileExists(join(dir, s.dest)));
}

async function downloadSprites(speciesData, force) {
  console.log(`\nDownloading sprites for ${speciesData.length} species...`);
  const stats = { success: 0, failed: 0, skipped: 0 };
  const failed = [];

  for (const species of speciesData) {
    const id = species.id;
    const paddedId = String(id).padStart(3, '0');
    const dir = join(PUBLIC_ASSETS, 'pokemon', paddedId);
    ensureDir(dir);

    const sprites = getSpriteUrls(id);

    for (const sprite of sprites) {
      const dest = join(dir, sprite.dest);
      if (!force && fileExists(dest)) {
        stats.skipped++;
        continue;
      }

      try {
        await downloadWithRetry(sprite.url, dest);
        stats.success++;
      } catch (e) {
        stats.failed++;
        failed.push({ id, file: sprite.dest, error: e.message });
      }
    }

    if (id % 100 === 0) {
      console.log(`  Progress: ${id} species processed...`);
    }
  }

  return { stats, failed };
}

// ============================================================
// CRY DOWNLOAD
// ============================================================

const CRY_BASE = 'https://raw.githubusercontent.com/PokeAPI/cries/master/cries/pokemon/latest';

async function downloadCries(speciesData, force) {
  console.log(`\nDownloading cries for ${speciesData.length} species...`);
  const stats = { success: 0, failed: 0, skipped: 0 };
  const failed = [];

  for (const species of speciesData) {
    const id = species.id;
    const paddedId = String(id).padStart(3, '0');
    const dir = join(PUBLIC_ASSETS, 'pokemon', paddedId);
    ensureDir(dir);
    const dest = join(dir, 'cry.ogg');

    if (!force && fileExists(dest)) {
      stats.skipped++;
      continue;
    }

    try {
      await downloadWithRetry(`${CRY_BASE}/${id}.ogg`, dest);
      stats.success++;
    } catch (e) {
      stats.failed++;
      failed.push({ id, file: 'cry.ogg', error: e.message });
    }

    if (id % 100 === 0) {
      console.log(`  Cry progress: ${id} species processed...`);
    }
  }

  return { stats, failed };
}

// ============================================================
// GENERATE TYPESCRIPT FILES
// ============================================================

function generateTypeScriptFiles(data) {
  console.log('\nGenerating TypeScript data files...');

  const outDir = join(SRC_DATA);
  ensureDir(outDir);

  // types.ts
  const typesContent = `// AUTO-GENERATED by scripts/poke-data-sync.mjs — DO NOT EDIT
import type { TypeEffectiveness } from './schemas/index.ts';
type PokemonType = import('./schemas/index.ts').PokemonType;

export const TYPES: TypeEffectiveness[] = ${JSON.stringify(data.types.types, null, 2)};

export const TYPE_NAMES: string[] = TYPES.map(t => t.name);

export function getTypeByName(name: string): TypeEffectiveness | undefined {
  return TYPES.find(t => t.name === name.toLowerCase());
}

export function getTypeById(id: number): TypeEffectiveness | undefined {
  return TYPES.find(t => t.id === id);
}

export function getEffectiveness(attackType: string, defenseTypes: string[]): number {
  let multiplier = 1;
  const atkType = attackType.toLowerCase();
  const typeData = getTypeByName(atkType);
  if (!typeData) return multiplier;

  for (const defType of defenseTypes) {
    const value = typeData.damageTaken[defType.toLowerCase() as PokemonType];
    if (value === 2) multiplier *= 2;
    else if (value === 1) multiplier *= 0.5;
    else if (value === 3 || value === 4) multiplier *= 0;
  }

  return multiplier;
}
`;
  writeFileSync(join(outDir, 'types.ts'), typesContent);

  // species.ts
  const speciesContent = `// AUTO-GENERATED by scripts/poke-data-sync.mjs — DO NOT EDIT
import type { PokemonSpeciesData } from './schemas/index.ts';

export const SPECIES: PokemonSpeciesData[] = ${JSON.stringify(data.species.species, null, 2)};

const SPECIES_BY_ID = new Map<number, PokemonSpeciesData>();
const SPECIES_BY_NAME = new Map<string, PokemonSpeciesData>();

for (const s of SPECIES) {
  SPECIES_BY_ID.set(s.id, s);
  SPECIES_BY_NAME.set(s.name.toLowerCase(), s);
}

export function getSpeciesById(id: number): PokemonSpeciesData | undefined {
  return SPECIES_BY_ID.get(id);
}

export function getSpeciesByName(name: string): PokemonSpeciesData | undefined {
  return SPECIES_BY_NAME.get(name.toLowerCase());
}

export function getAllSpecies(): PokemonSpeciesData[] {
  return SPECIES;
}

export function getSpeciesCount(): number {
  return SPECIES.length;
}
`;
  writeFileSync(join(outDir, 'species.ts'), speciesContent);

  // moves.ts
  const movesContent = `// AUTO-GENERATED by scripts/poke-data-sync.mjs — DO NOT EDIT
import type { MoveData } from './schemas/index.ts';

export const MOVES: MoveData[] = ${JSON.stringify(data.moves.moves, null, 2)};

const MOVES_BY_ID = new Map<number, MoveData>();
const MOVES_BY_NAME = new Map<string, MoveData>();

for (const m of MOVES) {
  MOVES_BY_ID.set(m.id, m);
  MOVES_BY_NAME.set(m.name.toLowerCase(), m);
}

export function getMoveById(id: number): MoveData | undefined {
  return MOVES_BY_ID.get(id);
}

export function getMoveByName(name: string): MoveData | undefined {
  return MOVES_BY_NAME.get(name.toLowerCase());
}

export function getAllMoves(): MoveData[] {
  return MOVES;
}

export function getMoveCount(): number {
  return MOVES.length;
}
`;
  writeFileSync(join(outDir, 'moves.ts'), movesContent);

  // abilities.ts
  const abilitiesContent = `// AUTO-GENERATED by scripts/poke-data-sync.mjs — DO NOT EDIT
import type { AbilityData } from './schemas/index.ts';

export const ABILITIES: AbilityData[] = ${JSON.stringify(data.abilities.abilities, null, 2)};

const ABILITIES_BY_ID = new Map<number, AbilityData>();
const ABILITIES_BY_NAME = new Map<string, AbilityData>();

for (const a of ABILITIES) {
  ABILITIES_BY_ID.set(a.id, a);
  ABILITIES_BY_NAME.set(a.name.toLowerCase(), a);
}

export function getAbilityById(id: number): AbilityData | undefined {
  return ABILITIES_BY_ID.get(id);
}

export function getAbilityByName(name: string): AbilityData | undefined {
  return ABILITIES_BY_NAME.get(name.toLowerCase());
}

export function getAllAbilities(): AbilityData[] {
  return ABILITIES;
}

export function getAbilityCount(): number {
  return ABILITIES.length;
}
`;
  writeFileSync(join(outDir, 'abilities.ts'), abilitiesContent);

  // items.ts
  const itemsContent = `// AUTO-GENERATED by scripts/poke-data-sync.mjs — DO NOT EDIT
import type { ItemData } from './schemas/index.ts';

export const ITEMS: ItemData[] = ${JSON.stringify(data.items.items, null, 2)};

const ITEMS_BY_ID = new Map<number, ItemData>();
const ITEMS_BY_NAME = new Map<string, ItemData>();

for (const i of ITEMS) {
  ITEMS_BY_ID.set(i.id, i);
  ITEMS_BY_NAME.set(i.name.toLowerCase(), i);
}

export function getItemById(id: number): ItemData | undefined {
  return ITEMS_BY_ID.get(id);
}

export function getItemByName(name: string): ItemData | undefined {
  return ITEMS_BY_NAME.get(name.toLowerCase());
}

export function getAllItems(): ItemData[] {
  return ITEMS;
}

export function getItemCount(): number {
  return ITEMS.length;
}
`;
  writeFileSync(join(outDir, 'items.ts'), itemsContent);

  // evolutions.ts
  const evoContent = `// AUTO-GENERATED by scripts/poke-data-sync.mjs — DO NOT EDIT
import type { EvolutionData } from './schemas/index.ts';

export const EVOLUTIONS: EvolutionData[] = ${JSON.stringify(data.evolutions.evolutions, null, 2)};

const EVOS_BY_SPECIES = new Map<string, EvolutionData[]>();

for (const e of EVOLUTIONS) {
  const key = e.species.toLowerCase();
  if (!EVOS_BY_SPECIES.has(key)) EVOS_BY_SPECIES.set(key, []);
  EVOS_BY_SPECIES.get(key)!.push(e);
}

export function getEvolutionsForSpecies(species: string): EvolutionData[] {
  return EVOS_BY_SPECIES.get(species.toLowerCase()) || [];
}

export function getAllEvolutions(): EvolutionData[] {
  return EVOLUTIONS;
}

export function getEvolutionCount(): number {
  return EVOLUTIONS.length;
}
`;
  writeFileSync(join(outDir, 'evolutions.ts'), evoContent);

  // berries.ts
  const berriesContent = `// AUTO-GENERATED by scripts/poke-data-sync.mjs — DO NOT EDIT
import type { BerryData } from './schemas/index.ts';

export const BERRIES: BerryData[] = ${JSON.stringify(data.berries?.berries || [], null, 2)};

const BERRIES_BY_ID = new Map<number, BerryData>();
const BERRIES_BY_NAME = new Map<string, BerryData>();

for (const b of BERRIES) {
  BERRIES_BY_ID.set(b.id, b);
  BERRIES_BY_NAME.set(b.name.toLowerCase(), b);
}

export function getBerryById(id: number): BerryData | undefined {
  return BERRIES_BY_ID.get(id);
}

export function getBerryByName(name: string): BerryData | undefined {
  return BERRIES_BY_NAME.get(name.toLowerCase());
}

export function getAllBerries(): BerryData[] {
  return BERRIES;
}

export function getBerryCount(): number {
  return BERRIES.length;
}
`;
  writeFileSync(join(outDir, 'berries.ts'), berriesContent);

  // megaEvolutions.ts
  const megaContent = `// AUTO-GENERATED by scripts/poke-data-sync.mjs — DO NOT EDIT
import type { MegaEvolutionData } from './schemas/index.ts';

export const MEGA_EVOLUTIONS: MegaEvolutionData[] = ${JSON.stringify(data.mega?.megaEvolutions || [], null, 2)};

const MEGA_BY_STONE = new Map<string, MegaEvolutionData>();
const MEGA_BY_BASE = new Map<string, MegaEvolutionData[]>();

for (const m of MEGA_EVOLUTIONS) {
  if (m.megaStone) MEGA_BY_STONE.set(m.megaStone.toLowerCase(), m);
  const key = m.baseSpecies.toLowerCase();
  if (!MEGA_BY_BASE.has(key)) MEGA_BY_BASE.set(key, []);
  MEGA_BY_BASE.get(key)!.push(m);
}

export function getMegaByStone(stoneName: string): MegaEvolutionData | undefined {
  return MEGA_BY_STONE.get(stoneName.toLowerCase());
}

export function getMegasForSpecies(species: string): MegaEvolutionData[] {
  return MEGA_BY_BASE.get(species.toLowerCase()) || [];
}

export function getAllMegaEvolutions(): MegaEvolutionData[] {
  return MEGA_EVOLUTIONS;
}
`;
  writeFileSync(join(outDir, 'megaEvolutions.ts'), megaContent);

  // megaStones.ts
  const megaStonesContent = `// AUTO-GENERATED by scripts/poke-data-sync.mjs — DO NOT EDIT
import type { MegaStoneData } from './schemas/index.ts';

export const MEGA_STONES: MegaStoneData[] = ${JSON.stringify(data.mega?.megaStones || [], null, 2)};

const STONES_BY_ID = new Map<number, MegaStoneData>();
const STONES_BY_NAME = new Map<string, MegaStoneData>();
const STONES_BY_SPECIES = new Map<string, MegaStoneData[]>();

for (const s of MEGA_STONES) {
  STONES_BY_ID.set(s.id, s);
  STONES_BY_NAME.set(s.name.toLowerCase(), s);
  const key = s.targetSpecies.toLowerCase();
  if (!STONES_BY_SPECIES.has(key)) STONES_BY_SPECIES.set(key, []);
  STONES_BY_SPECIES.get(key)!.push(s);
}

export function getMegaStoneById(id: number): MegaStoneData | undefined {
  return STONES_BY_ID.get(id);
}

export function getMegaStoneByName(name: string): MegaStoneData | undefined {
  return STONES_BY_NAME.get(name.toLowerCase());
}

export function getMegaStonesForSpecies(species: string): MegaStoneData[] {
  return STONES_BY_SPECIES.get(species.toLowerCase()) || [];
}

export function getAllMegaStones(): MegaStoneData[] {
  return MEGA_STONES;
}
`;
  writeFileSync(join(outDir, 'megaStones.ts'), megaStonesContent);

  // index.ts (barrel export)
  const indexContent = `// AUTO-GENERATED by scripts/poke-data-sync.mjs — DO NOT EDIT
export { TYPES, TYPE_NAMES, getTypeByName, getTypeById, getEffectiveness } from './types.ts';
export { SPECIES, getSpeciesById, getSpeciesByName, getAllSpecies, getSpeciesCount } from './species.ts';
export { MOVES, getMoveById, getMoveByName, getAllMoves, getMoveCount } from './moves.ts';
export { ABILITIES, getAbilityById, getAbilityByName, getAllAbilities, getAbilityCount } from './abilities.ts';
export { ITEMS, getItemById, getItemByName, getAllItems, getItemCount } from './items.ts';
export { EVOLUTIONS, getEvolutionsForSpecies, getAllEvolutions, getEvolutionCount } from './evolutions.ts';
export { BERRIES, getBerryById, getBerryByName, getAllBerries, getBerryCount } from './berries.ts';
export { MEGA_EVOLUTIONS, getMegaByStone, getMegasForSpecies, getAllMegaEvolutions } from './megaEvolutions.ts';
export { MEGA_STONES, getMegaStoneById, getMegaStoneByName, getMegaStonesForSpecies, getAllMegaStones } from './megaStones.ts';

export type { PokemonSpeciesData, MoveData, AbilityData, ItemData, TypeEffectiveness, EvolutionData, PokemonType, BerryData, MegaEvolutionData, MegaStoneData } from './schemas/index.ts';
`;
  writeFileSync(join(outDir, 'index.ts'), indexContent);

  console.log(`  Written: ${outDir}/types.ts`);
  console.log(`  Written: ${outDir}/species.ts`);
  console.log(`  Written: ${outDir}/moves.ts`);
  console.log(`  Written: ${outDir}/abilities.ts`);
  console.log(`  Written: ${outDir}/items.ts`);
  console.log(`  Written: ${outDir}/evolutions.ts`);
  console.log(`  Written: ${outDir}/index.ts`);
  console.log(`\n  All data written to: ${outDir}`);
}

// ============================================================
// MANIFEST
// ============================================================

function writeManifest(data, spriteStats, cryStats) {
  const manifest = {
    timestamp: new Date().toISOString(),
    sources: {
      pkmnDex: {
        version: '@pkmn/dex',
        speciesCount: data.species?.species?.length || 0,
        moveCount: data.moves?.moves?.length || 0,
        abilityCount: data.abilities?.abilities?.length || 0,
        itemCount: data.items?.items?.length || 0,
        typeCount: data.types?.types?.length || 0,
        evolutionCount: data.evolutions?.evolutions?.length || 0,
      },
      sprites: spriteStats || { success: 0, failed: 0, skipped: 0 },
      cries: cryStats || { success: 0, failed: 0, skipped: 0 },
    },
  };
  ensureDir(DATA_NORMALIZED);
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written: ${MANIFEST_PATH}`);
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('=== PokeSpire Data Sync ===');
  console.log(`Force: ${FORCE}, Sprites-only: ${SPRITES_ONLY}, Data-only: ${DATA_ONLY}`);

  ensureDir(DATA_RAW);
  ensureDir(DATA_NORMALIZED);

  // Dynamic import of @pkmn/dex
  const { Dex } = await import('@pkmn/dex');

  let data = {};
  let spriteStats = null;
  let cryStats = null;

  if (!SPRITES_ONLY) {
    console.log('\n--- Phase 1: Generate Data ---');
    data.types = generateTypesData(Dex);
    data.species = generateSpeciesData(Dex);
    data.moves = generateMovesData(Dex);
    data.abilities = generateAbilitiesData(Dex);
    data.items = generateItemsData(Dex);
    data.evolutions = generateEvolutionData(Dex);

    // Berry data (from PokeAPI REST)
    try {
      data.berries = await generateBerryData();
    } catch (e) {
      console.error(`  Berry fetch failed: ${e.message}`);
      data.berries = { berries: [] };
    }

    // Mega evolution data
    data.mega = generateMegaData(Dex);

    // Save raw JSON
    ensureDir(join(DATA_RAW, 'pokemon'));
    writeFileSync(join(DATA_RAW, 'pokemon', 'types.json'), JSON.stringify(data.types, null, 2));
    writeFileSync(join(DATA_RAW, 'pokemon', 'species.json'), JSON.stringify(data.species, null, 2));
    writeFileSync(join(DATA_RAW, 'pokemon', 'moves.json'), JSON.stringify(data.moves, null, 2));
    writeFileSync(join(DATA_RAW, 'pokemon', 'abilities.json'), JSON.stringify(data.abilities, null, 2));
    writeFileSync(join(DATA_RAW, 'pokemon', 'items.json'), JSON.stringify(data.items, null, 2));
    writeFileSync(join(DATA_RAW, 'pokemon', 'evolutions.json'), JSON.stringify(data.evolutions, null, 2));
    writeFileSync(join(DATA_RAW, 'pokemon', 'berries.json'), JSON.stringify(data.berries, null, 2));
    writeFileSync(join(DATA_RAW, 'pokemon', 'megaEvolutions.json'), JSON.stringify(data.mega.megaEvolutions, null, 2));
    writeFileSync(join(DATA_RAW, 'pokemon', 'megaStones.json'), JSON.stringify(data.mega.megaStones, null, 2));
    console.log('  Raw JSON saved to data/raw/pokemon/');

    // Generate TypeScript files
    generateTypeScriptFiles(data);
  } else {
    // Load existing raw data for sprite downloads
    console.log('\nLoading existing raw data for sprite downloads...');
    data.species = JSON.parse(readFileSync(join(DATA_RAW, 'pokemon', 'species.json'), 'utf-8'));
  }

  if (!DATA_ONLY) {
    // Phase 2: Download Sprites
    console.log('\n--- Phase 2: Download Sprites ---');
    const speciesList = data.species?.species || [];

    if (speciesList.length > 0) {
      const toDownload = FORCE
        ? speciesList
        : speciesList.filter(s => speciesNeedsDownload(s.id, false));

      console.log(`  Species needing sprites: ${toDownload.length} of ${speciesList.length}`);

      spriteStats = { success: 0, failed: 0, skipped: 0 };

      for (let i = 0; i < toDownload.length; i += BATCH_SIZE) {
        const batch = toDownload.slice(i, i + BATCH_SIZE);
        console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toDownload.length / BATCH_SIZE)}: species ${batch[0]?.id}-${batch[batch.length - 1]?.id}`);

        const result = await downloadSprites(batch, FORCE);
        spriteStats.success += result.stats.success;
        spriteStats.failed += result.stats.failed;
        spriteStats.skipped += result.stats.skipped;

        if (result.failed.length > 0) {
          console.log(`    ${result.failed.length} failures in batch`);
        }
      }

      console.log(`  Sprite download complete: ${spriteStats.success} downloaded, ${spriteStats.failed} failed, ${spriteStats.skipped} skipped`);
    }

    // Phase 3: Download Cries
    console.log('\n--- Phase 3: Download Cries ---');
    const speciesListForCries = data.species?.species || [];
    if (speciesListForCries.length > 0) {
      cryStats = { success: 0, failed: 0, skipped: 0 };

      for (let i = 0; i < speciesListForCries.length; i += BATCH_SIZE) {
        const batch = speciesListForCries.slice(i, i + BATCH_SIZE);
        const result = await downloadCries(batch, FORCE);
        cryStats.success += result.stats.success;
        cryStats.failed += result.stats.failed;
        cryStats.skipped += result.stats.skipped;
      }

      console.log(`  Cry download complete: ${cryStats.success} downloaded, ${cryStats.failed} failed, ${cryStats.skipped} skipped`);
    }

    // Phase 4: Download Berry Sprites
    if (data.berries?.berries?.length > 0) {
      console.log('\n--- Phase 4: Download Berry Sprites ---');
      const berryDir = join(PUBLIC_ASSETS, 'items', 'berries');
      ensureDir(berryDir);
      let berryStats = { success: 0, failed: 0, skipped: 0 };

      for (const berry of data.berries.berries) {
        const dest = join(berryDir, `${berry.name}-berry.png`);
        if (!FORCE && fileExists(dest)) {
          berryStats.skipped++;
          continue;
        }
        const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${berry.name}-berry.png`;
        try {
          await downloadWithRetry(url, dest);
          berryStats.success++;
        } catch (e) {
          berryStats.failed++;
        }
      }

      console.log(`  Berry sprites: ${berryStats.success} downloaded, ${berryStats.failed} failed, ${berryStats.skipped} skipped`);
    }
  }

  // Write manifest
  writeManifest(data, spriteStats, cryStats);

  console.log('\n=== Sync Complete ===');
}

main().catch(e => {
  console.error('Sync failed:', e);
  process.exit(1);
});
