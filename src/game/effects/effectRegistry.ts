import type { PokemonType } from '../../data/pokemon/schemas/index';
import type { EffectPreset, EffectContext } from './types';
import { TYPE_EFFECT_PRESETS } from './presets';

/**
 * Move-specific overrides. Keyed by lowercase move name.
 * Only define overrides for moves that need non-default behavior.
 */
const MOVE_OVERRIDES: Record<string, Partial<EffectPreset>> = {
  // Fire: beam instead of burst
  flamethrower:    { family: 'beam' },
  fireblast:       { family: 'beam' },
  overheat:        { family: 'beam' },
  heatwave:        { family: 'cloud' },
  eruption:        { family: 'burst' },
  // Water: beam/projectile
  surf:            { family: 'impact' },
  hydrocannon:     { family: 'beam' },
  hydropump:       { family: 'beam' },
  scald:           { family: 'cloud' },
  // Electric: beam
  thunder:         { family: 'beam' },
  thunderbolt:     { family: 'beam' },
  discharge:       { family: 'pulse' },
  // Grass: projectile
  solarbeam:       { family: 'beam' },
  leafblade:       { family: 'slash' },
  leafstorm:       { family: 'cloud' },
  // Ice: frost
  blizzard:        { family: 'frost' },
  icebeam:         { family: 'beam' },
  // Fighting
  closecombat:     { family: 'impact' },
  crosschop:       { family: 'slash' },
  // Psychic
  psychic:         { family: 'pulse' },
  futuresight:     { family: 'pulse' },
  // Ghost
  shadowball:      { family: 'projectile' },
  shadowclaw:      { family: 'slash' },
  // Dragon
  dracometeor:     { family: 'beam' },
  dragonpulse:     { family: 'beam' },
  // Dark
  darkpulse:       { family: 'beam' },
  nightdaze:       { family: 'pulse' },
  // Fairy
  moonblast:       { family: 'projectile' },
  playrough:       { family: 'impact' },
  // Steel
  flashcannon:     { family: 'beam' },
  ironhead:        { family: 'impact' },
  // Rock
  rockslide:       { family: 'impact' },
  stoneedge:       { family: 'projectile' },
  // Ground
  earthquake:      { family: 'impact' },
  earthpower:      { family: 'beam' },
  mudslap:         { family: 'cloud' },
  // Flying
  hurricane:       { family: 'cloud' },
  bravebird:       { family: 'impact' },
  airslash:        { family: 'slash' },
  // Bug
  bugbuzz:         { family: 'swarm' },
  // Poison
  sludgebomb:      { family: 'projectile' },
  sludgewave:      { family: 'cloud' },
  // Normal
  hyperbeam:       { family: 'beam' },
  gunkshot:        { family: 'projectile' },
};

/**
 * Resolve which effect preset to use for a given move.
 *
 * Priority:
 *   1. Move-specific override (if defined)
 *   2. Category-based selection (physical → impact/slash, special → beam/burst, status → status)
 *   3. Type default
 */
export function resolveEffect(
  type: PokemonType,
  category: 'physical' | 'special' | 'status',
  moveName: string,
): EffectPreset {
  const lowerName = moveName.toLowerCase().replace(/[^a-z]/g, '');

  // 1. Move-specific override
  const override = MOVE_OVERRIDES[lowerName];
  if (override) {
    const base = getBaseByCategory(type, category);
    return { ...base, ...override };
  }

  // 2. Category-based selection
  return getBaseByCategory(type, category);
}

function getBaseByCategory(
  type: PokemonType,
  category: 'physical' | 'special' | 'status',
): EffectPreset {
  const typePresets = TYPE_EFFECT_PRESETS[type];

  switch (category) {
    case 'status':
      return typePresets.status;
    case 'physical':
      // Prefer impact/slash for physical moves
      return typePresets.slash ?? typePresets.impact ?? typePresets.burst;
    case 'special':
      // Prefer beam/pulse/cloud for special moves
      return typePresets.beam ?? typePresets.pulse ?? typePresets.burst;
    default:
      return typePresets.burst;
  }
}

/**
 * Resolve an effect for direct use (no move data), e.g. for demo/testing.
 */
export function resolveEffectByType(
  type: PokemonType,
  family?: string,
): EffectPreset {
  const typePresets = TYPE_EFFECT_PRESETS[type];
  if (family && typePresets[family]) {
    return typePresets[family];
  }
  return typePresets.burst ?? typePresets.impact ?? Object.values(typePresets)[0];
}

/**
 * Create an EffectContext from attacker and target positions.
 */
export function createEffectContext(
  origin: [number, number, number],
  target: [number, number, number],
  scale = 1,
  intensity = 1,
): EffectContext {
  const dx = target[0] - origin[0];
  const dy = target[1] - origin[1];
  const dz = target[2] - origin[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

  return {
    origin,
    target,
    direction: [dx / len, dy / len, dz / len],
    scale,
    intensity,
  };
}
