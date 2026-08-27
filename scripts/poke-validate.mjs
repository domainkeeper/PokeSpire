#!/usr/bin/env node

/**
 * POKE_DATA_VALIDATE — Validates the Pokemon data pipeline output.
 *
 * Usage:
 *   node scripts/poke-validate.mjs
 *
 * Checks:
 *   - All species have required fields
 *   - Type references are valid
 *   - Move type references are valid
 *   - Ability references in species resolve
 *   - Evolution target species exist
 *   - Sprite files exist for all species
 *   - Cries exist for all species
 *   - No duplicate IDs
 *   - No malformed data
 *
 * Output: PASS or list of MISSING/BROKEN items.
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const PUBLIC_ASSETS = join(PROJECT_ROOT, 'public', 'assets');
const DATA_RAW = join(PROJECT_ROOT, 'data', 'raw');

const errors = [];
const warnings = [];
let passCount = 0;
let failCount = 0;

function check(label, condition, detail) {
  if (condition) {
    passCount++;
  } else {
    failCount++;
    errors.push(`MISSING: ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function warn(label, detail) {
  warnings.push(`WARNING: ${label}${detail ? ` — ${detail}` : ''}`);
}

function fileExists(path) {
  try { const s = statSync(path); return s.size > 0; } catch { return false; }
}

try {
  console.log('=== PokeSpire Data Validation ===\n');

  // Load data
  const speciesData = JSON.parse(readFileSync(join(DATA_RAW, 'pokemon', 'species.json'), 'utf-8'));
  const movesData = JSON.parse(readFileSync(join(DATA_RAW, 'pokemon', 'moves.json'), 'utf-8'));
  const abilitiesData = JSON.parse(readFileSync(join(DATA_RAW, 'pokemon', 'abilities.json'), 'utf-8'));
  const itemsData = JSON.parse(readFileSync(join(DATA_RAW, 'pokemon', 'items.json'), 'utf-8'));
  const typesData = JSON.parse(readFileSync(join(DATA_RAW, 'pokemon', 'types.json'), 'utf-8'));
  const evolutionsData = JSON.parse(readFileSync(join(DATA_RAW, 'pokemon', 'evolutions.json'), 'utf-8'));

  const species = speciesData.species;
  const moves = movesData.moves;
  const abilities = abilitiesData.abilities;
  const items = itemsData.items;
  const types = typesData.types;
  const evolutions = evolutionsData.evolutions;

  // Build lookup sets
  const speciesIds = new Set(species.map(s => s.id));
  const speciesNames = new Set(species.map(s => s.name.toLowerCase()));
  const moveNames = new Set(moves.map(m => m.name.toLowerCase()));
  const abilityNames = new Set(abilities.map(a => a.name.toLowerCase()));
  const typeNames = new Set(types.map(t => t.name.toLowerCase()));

  console.log('Data loaded:');
  console.log(`  Species: ${species.length}`);
  console.log(`  Moves: ${moves.length}`);
  console.log(`  Abilities: ${abilities.length}`);
  console.log(`  Items: ${items.length}`);
  console.log(`  Types: ${types.length}`);
  console.log(`  Evolutions: ${evolutions.length}`);
  console.log('');

  // --- Species validation ---
  console.log('--- Species ---');
  const speciesIdsSet = new Set();
  for (const s of species) {
    check(`Species ${s.id} has name`, s.name, `id=${s.id}`);
    check(`Species ${s.id} has types`, s.types?.length > 0, `${s.name}`);
    check(`Species ${s.id} has baseStats`, s.baseStats, `${s.name}`);

    if (s.id in speciesIdsSet) {
      errors.push(`DUPLICATE: Species ID ${s.id} (${s.name})`);
    }
    speciesIdsSet.add(s.id);

    // Check sprite exists
    const paddedId = String(s.id).padStart(3, '0');
    const spritePath = join(PUBLIC_ASSETS, 'pokemon', paddedId, 'front.png');
    check(`Species ${s.name} front sprite`, fileExists(spritePath), spritePath);

    const backPath = join(PUBLIC_ASSETS, 'pokemon', paddedId, 'back.png');
    check(`Species ${s.name} back sprite`, fileExists(backPath), backPath);

    const iconPath = join(PUBLIC_ASSETS, 'pokemon', paddedId, 'icon.png');
    if (!fileExists(iconPath)) {
      warn(`Species ${s.name} missing icon`, iconPath);
    }

    const cryPath = join(PUBLIC_ASSETS, 'pokemon', paddedId, 'cry.ogg');
    check(`Species ${s.name} cry`, fileExists(cryPath), cryPath);

    // Check type references
    for (const t of s.types) {
      check(`Species ${s.name} type "${t}" exists`, typeNames.has(t), `type=${t}`);
    }

    // Check ability references
    for (const a of s.abilities.regular) {
      check(`Species ${s.name} ability "${a}" exists`, abilityNames.has(a.toLowerCase()), `ability=${a}`);
    }
    for (const a of s.abilities.hidden) {
      check(`Species ${s.name} hidden ability "${a}" exists`, abilityNames.has(a.toLowerCase()), `ability=${a}`);
    }
  }
  console.log(`  Species checked: ${species.length}\n`);

  // --- Moves validation ---
  console.log('--- Moves ---');
  for (const m of moves) {
    check(`Move ${m.name} has type`, m.type, `id=${m.id}`);
    check(`Move ${m.name} type "${m.type}" exists`, typeNames.has(m.type), `type=${m.type}`);
    check(`Move ${m.name} has category`, m.category, `id=${m.id}`);
  }
  console.log(`  Moves checked: ${moves.length}\n`);

  // --- Types validation ---
  console.log('--- Types ---');
  for (const t of types) {
    check(`Type ${t.name} has damageTaken`, t.damageTaken, `id=${t.id}`);
    const damageKeys = Object.keys(t.damageTaken);
    check(`Type ${t.name} has ${typeNames.size} damage entries`, damageKeys.length >= 17, `got ${damageKeys.length}`);
  }
  console.log(`  Types checked: ${types.length}\n`);

  // --- Evolutions validation ---
  console.log('--- Evolutions ---');
  for (const e of evolutions) {
    // Strip regional form suffixes for base species lookup
    const baseSource = e.species.replace(/-(Alola|Galar|Hisui|Paldea|Male|Female|Red|Blue|Yellow|Green|Glowing|Antique|Small|Large|Super|Dusk|Midnight|Low-Key|Rapid-Strike|White-Striped|Three-Segment|Masterpiece|Artisan|Fancy|Trash|Sandy)$/i, '');
    const baseTarget = e.targetSpecies.replace(/-(Alola|Galar|Hisui|Paldea|Male|Female|Red|Blue|Yellow|Green|Glowing|Antique|Small|Large|Super|Dusk|Midnight|Low-Key|Rapid-Strike|White-Striped|Three-Segment|Masterpiece|Artisan|Fancy|Trash|Sandy)$/i, '');
    check(`Evolution: source "${e.species}" base "${baseSource}" exists`, speciesNames.has(baseSource.toLowerCase()), `source=${e.species}`);
    check(`Evolution: target "${e.targetSpecies}" base "${baseTarget}" exists`, speciesNames.has(baseTarget.toLowerCase()), `target=${e.targetSpecies}`);
  }
  console.log(`  Evolutions checked: ${evolutions.length}\n`);

  // --- Items validation ---
  console.log('--- Items ---');
  for (const i of items) {
    check(`Item ${i.name} has id`, i.id, `id=${i.id}`);
    check(`Item ${i.name} has name`, i.name, `id=${i.id}`);
  }
  console.log(`  Items checked: ${items.length}\n`);

  // --- Summary ---
  console.log('=== Results ===');
  console.log(`  PASS: ${passCount}`);
  console.log(`  FAIL: ${failCount}`);
  console.log(`  WARN: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n--- Errors ---');
    for (const e of errors) console.log(`  ${e}`);
  }

  if (warnings.length > 0) {
    console.log('\n--- Warnings ---');
    for (const w of warnings) console.log(`  ${w}`);
  }

  if (failCount === 0) {
    console.log('\n*** ALL CHECKS PASSED ***');
  } else {
    console.log('\n*** VALIDATION FAILED ***');
    process.exit(1);
  }

} catch (e) {
  console.error('Validation error:', e.message);
  process.exit(1);
}
