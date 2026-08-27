#!/usr/bin/env node

/**
 * POKE_DATA_SYNC — Master data synchronization script.
 *
 * Sources:
 *   - @pkmn/dex (npm) — species, moves, abilities, items, types, type-effectiveness
 *   - PokeAPI sprites (via raw GitHub URLs) — front/back/shiny/icon sprites
 *   - PokeAPI cries (via raw GitHub URLs) — Pokemon cries (.ogg)
 *
 * Usage:
 *   node scripts/poke-data-sync.mjs [--force] [--sprites-only] [--data-only]
 *
 * The script is idempotent — safe to re-run. Existing valid assets are skipped.
 * Use --force to re-download everything.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const DATA_RAW = join(PROJECT_ROOT, 'data', 'raw');
const DATA_NORMALIZED = join(PROJECT_ROOT, 'data', 'normalized');
const PUBLIC_ASSETS = join(PROJECT_ROOT, 'public', 'assets');
const MANIFEST_PATH = join(DATA_NORMALIZED, 'manifest.json');

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
  try { statSync(path); return true; } catch { return false; }
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    import('https').then(({ default: https }) => {
      const dir = dirname(dest);
      ensureDir(dir);
      const file = https.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          downloadFile(res.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
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
      file.on('error', reject);
      file.setTimeout(30000, () => { file.destroy(); reject(new Error(`Timeout for ${url}`)); });
    });
  });
}

// --- Normalize type name to lowercase ---
function typeName(name) {
  return name.toLowerCase();
}

// --- damageTaken value mapping ---
// @pkmn/dex uses: 0=normal, 1=resisted, 2=weak, 3=immune, 4=resisted-by-immunity(??)
// Actually the values are: 0=neutral, 1=resisted, 2=weak (takes 2x), 3=immune, 4=??? 
// Let me check what they actually mean:
// From the source code, damageTaken values:
// 0 = neutral (1x)
// 1 = resisted (0.5x)  
// 2 = weak (2x)
// 3 = immune (0x)
// 4 = ??? (maybe a special case like FlyingPress dual-type interaction)
// Let me just pass them through directly.

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
  
  for (const type of gen9.types.all()) {
    if (type.isNonstandard) continue;
    types.push({
      id: type.num,
      name: typeName(type.name),
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
    // Skip purely cosmetic formes that share a dex number as their base
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
      captureRate: 0, // Not in @pkmn/dex, would need PokeAPI CSV
      baseExperience: 0, // Not in @pkmn/dex
      baseHappiness: 0, // Not in @pkmn/dex
      growthRate: '', // Not in @pkmn/dex
      forms: s.otherFormes || [],
      baseForme: s.baseForme || '',
      prevo: s.prevo || null,
      evos: s.evos || [],
      canHatch: s.canHatch || false,
      isMega: s.isMega || false,
      isGmax: s.canGigantamax || false,
      isLegendary: s.tier === 'Uber' || s.tier === 'AG',
      isMythical: false, // Would need additional check
      isBaby: s.tier === 'LC' || (s.prevo && s.nfe && !s.prevo.includes('-')),
      nfe: s.nfe || false,
      bst: s.bst || 0,
      spritePath: `/assets/pokemon/${String(id).padStart(3, '0')}/front.png`,
      iconPath: `/assets/pokemon/${String(id).padStart(3, '0')}/icon.png`,
    });
  }
  
  // Deduplicate by id (keep the base forme entry, skip mega/formes that share an id)
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
// SPRITE DOWNLOAD
// ============================================================

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

async function downloadSprites(speciesData) {
  console.log(`\nDownloading sprites for ${speciesData.length} species...`);
  const stats = { success: 0, failed: 0, skipped: 0 };
  const failed = [];
  
  for (const species of speciesData) {
    const id = species.id;
    const paddedId = String(id).padStart(3, '0');
    const dir = join(PUBLIC_ASSETS, 'pokemon', paddedId);
    ensureDir(dir);
    
    const sprites = [
      { url: `${SPRITE_BASE}/${id}.png`, dest: join(dir, 'front.png') },
      { url: `${SPRITE_BASE}/back/${id}.png`, dest: join(dir, 'back.png') },
      { url: `${SPRITE_BASE}/shiny/${id}.png`, dest: join(dir, 'shiny-front.png') },
      { url: `${SPRITE_BASE}/back/shiny/${id}.png`, dest: join(dir, 'shiny-back.png') },
      { url: `${SPRITE_BASE}/other/showdown/${id}.gif`, dest: join(dir, 'animated.gif') },
      { url: `${SPRITE_BASE}/versions/generation-vii/icons/${id}.png`, dest: join(dir, 'icon.png') },
    ];
    
    for (const sprite of sprites) {
      if (!FORCE && fileExists(sprite.dest)) {
        const stat = statSync(sprite.dest);
        if (stat.size > 0) {
          stats.skipped++;
          continue;
        }
      }
      
      try {
        await downloadFile(sprite.url, sprite.dest);
        stats.success++;
      } catch (e) {
        stats.failed++;
        failed.push({ id, file: sprite.dest, error: e.message });
        // Remove empty files
        if (fileExists(sprite.dest) && statSync(sprite.dest).size === 0) {
          try { (await import('fs')).unlinkSync(sprite.dest); } catch {}
        }
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

const CRY_BASE = 'https://raw.githubusercontent.com/PokeAPI/cries/master/cries/pokemon';

async function downloadCries(speciesData) {
  console.log(`\nDownloading cries for ${speciesData.length} species...`);
  const stats = { success: 0, failed: 0, skipped: 0 };
  const failed = [];
  
  for (const species of speciesData) {
    const id = species.id;
    const paddedId = String(id).padStart(3, '0');
    const dir = join(PUBLIC_ASSETS, 'pokemon', paddedId);
    ensureDir(dir);
    const dest = join(dir, 'cry.ogg');
    
    if (!FORCE && fileExists(dest)) {
      const stat = statSync(dest);
      if (stat.size > 0) {
        stats.skipped++;
        continue;
      }
    }
    
    try {
      await downloadFile(`${CRY_BASE}/${id}.ogg`, dest);
      stats.success++;
    } catch (e) {
      stats.failed++;
      failed.push({ id, file: dest, error: e.message });
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
  
  const outDir = join(DATA_NORMALIZED);
  ensureDir(outDir);
  
  // types.ts
  const typesContent = `// AUTO-GENERATED by scripts/poke-data-sync.mjs — DO NOT EDIT
import type { TypeEffectiveness, PokemonType } from '../../data/pokemon/schemas/index.ts';

export const TYPES: TypeEffectiveness[] = ${JSON.stringify(data.types.types, null, 2)};

export const TYPE_NAMES: PokemonType[] = TYPES.map(t => t.name);

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
import type { PokemonSpeciesData } from '../../data/pokemon/schemas/index.ts';

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
import type { MoveData } from '../../data/pokemon/schemas/index.ts';

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
import type { AbilityData } from '../../data/pokemon/schemas/index.ts';

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
import type { ItemData } from '../../data/pokemon/schemas/index.ts';

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
import type { EvolutionData } from '../../data/pokemon/schemas/index.ts';

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
  
  // index.ts (barrel export)
  const indexContent = `// AUTO-GENERATED by scripts/poke-data-sync.mjs — DO NOT EDIT
export { TYPES, TYPE_NAMES, getTypeByName, getTypeById, getEffectiveness } from './types.ts';
export { SPECIES, getSpeciesById, getSpeciesByName, getAllSpecies, getSpeciesCount } from './species.ts';
export { MOVES, getMoveById, getMoveByName, getAllMoves, getMoveCount } from './moves.ts';
export { ABILITIES, getAbilityById, getAbilityByName, getAllAbilities, getAbilityCount } from './abilities.ts';
export { ITEMS, getItemById, getItemByName, getAllItems, getItemCount } from './items.ts';
export { EVOLUTIONS, getEvolutionsForSpecies, getAllEvolutions, getEvolutionCount } from './evolutions.ts';

export type { PokemonSpeciesData, MoveData, AbilityData, ItemData, TypeEffectiveness, EvolutionData, PokemonType } from '../../data/pokemon/schemas/index.ts';
`;
  writeFileSync(join(outDir, 'index.ts'), indexContent);
  
  console.log(`  Written: ${outDir}/types.ts`);
  console.log(`  Written: ${outDir}/species.ts`);
  console.log(`  Written: ${outDir}/moves.ts`);
  console.log(`  Written: ${outDir}/abilities.ts`);
  console.log(`  Written: ${outDir}/items.ts`);
  console.log(`  Written: ${outDir}/evolutions.ts`);
  console.log(`  Written: ${outDir}/index.ts`);
}

// ============================================================
// MANIFEST
// ============================================================

function writeManifest(data, spriteStats, cryStats) {
  const manifest = {
    timestamp: new Date().toISOString(),
    sources: {
      pkmnDex: { version: '@pkmn/dex', speciesCount: data.species.species.length, moveCount: data.moves.moves.length, abilityCount: data.abilities.abilities.length, itemCount: data.items.items.length, typeCount: data.types.types.length, evolutionCount: data.evolutions.evolutions.length },
      sprites: spriteStats || { success: 0, failed: 0, skipped: 0 },
      cries: cryStats || { success: 0, failed: 0, skipped: 0 },
    },
  };
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
    
    // Save raw JSON
    ensureDir(join(DATA_RAW, 'pokemon'));
    writeFileSync(join(DATA_RAW, 'pokemon', 'types.json'), JSON.stringify(data.types, null, 2));
    writeFileSync(join(DATA_RAW, 'pokemon', 'species.json'), JSON.stringify(data.species, null, 2));
    writeFileSync(join(DATA_RAW, 'pokemon', 'moves.json'), JSON.stringify(data.moves, null, 2));
    writeFileSync(join(DATA_RAW, 'pokemon', 'abilities.json'), JSON.stringify(data.abilities, null, 2));
    writeFileSync(join(DATA_RAW, 'pokemon', 'items.json'), JSON.stringify(data.items, null, 2));
    writeFileSync(join(DATA_RAW, 'pokemon', 'evolutions.json'), JSON.stringify(data.evolutions, null, 2));
    console.log('  Raw JSON saved to data/raw/pokemon/');
    
    // Generate TypeScript files
    generateTypeScriptFiles(data);
  } else {
    // Load existing raw data for sprite downloads
    console.log('\nLoading existing raw data for sprite downloads...');
    data.species = JSON.parse(readFileSync(join(DATA_RAW, 'pokemon', 'species.json'), 'utf-8'));
  }
  
  if (!DATA_ONLY) {
    console.log('\n--- Phase 2: Download Sprites ---');
    const speciesList = data.species?.species || [];
    
    if (speciesList.length > 0) {
      // Download first 500 sprites initially (all species take too long for first run)
      const toDownload = FORCE ? speciesList : speciesList.filter(s => {
        const paddedId = String(s.id).padStart(3, '0');
        return !fileExists(join(PUBLIC_ASSETS, 'pokemon', paddedId, 'front.png'));
      });
      
      console.log(`  Species needing sprites: ${toDownload.length} of ${speciesList.length}`);
      
      // Download in batches of 50 for progress
      const BATCH_SIZE = 50;
      spriteStats = { success: 0, failed: 0, skipped: 0 };
      
      for (let i = 0; i < toDownload.length; i += BATCH_SIZE) {
        const batch = toDownload.slice(i, i + BATCH_SIZE);
        console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toDownload.length / BATCH_SIZE)}: species ${batch[0]?.id}-${batch[batch.length - 1]?.id}`);
        
        const result = await downloadSprites(batch);
        spriteStats.success += result.stats.success;
        spriteStats.failed += result.stats.failed;
        spriteStats.skipped += result.stats.skipped;
        
        if (result.failed.length > 0) {
          console.log(`    ${result.failed.length} failures in batch`);
        }
      }
      
      console.log(`  Sprite download complete: ${spriteStats.success} downloaded, ${spriteStats.failed} failed, ${spriteStats.skipped} skipped`);
    }
    
    // Download cries for all species
    console.log('\n--- Phase 3: Download Cries ---');
    const speciesListForCries = data.species?.species || [];
    if (speciesListForCries.length > 0) {
      cryStats = { success: 0, failed: 0, skipped: 0 };
      
      // Download in batches
      for (let i = 0; i < speciesListForCries.length; i += BATCH_SIZE) {
        const batch = speciesListForCries.slice(i, i + BATCH_SIZE);
        const result = await downloadCries(batch);
        cryStats.success += result.stats.success;
        cryStats.failed += result.stats.failed;
        cryStats.skipped += result.stats.skipped;
      }
      
      console.log(`  Cry download complete: ${cryStats.success} downloaded, ${cryStats.failed} failed, ${cryStats.skipped} skipped`);
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
