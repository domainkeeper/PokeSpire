/**
 * Type effectiveness. PURE.
 *
 * FIXES N1 — the live `getEffectiveness` in src/data/pokemon/types.ts:450 has two
 * compounding errors:
 *
 *   1. It indexes the ATTACKING type's `damageTaken` record by the DEFENDING type.
 *      The record means "damage this type takes FROM <key>", so it must be indexed
 *      as defenderType.damageTaken[attackType].
 *   2. It maps `2 -> x2` and `1 -> x0.5`. The generated data uses Showdown encoding,
 *      where 1 = weakness (x2), 2 = resistance (x0.5), 3 = immunity (x0). Verified
 *      against water.damageTaken { electric:1, fire:2, grass:1, ice:2, steel:2,
 *      water:2 } and bug.damageTaken { fighting:2, fire:1, grass:2, ground:2, rock:1 }.
 *
 * The two inversions cancel for reciprocal pairs (Fire<->Water is right by accident)
 * but every immunity and asymmetric matchup is wrong: psychic->dark returned 0.5
 * instead of 0, dark->psychic returned 0 instead of 2, ground->electric returned 0
 * instead of 2.
 *
 * This module is owned by the engine and reads the raw TYPES table directly. It
 * deliberately does NOT patch src/data/pokemon/types.ts, which is auto-generated
 * and would be overwritten by `npm run data:sync`.
 */

import { TYPES } from '../../data/pokemon/types';
import type { PokemonType } from '../../data/pokemon/schemas/index';
import type { Effectiveness } from './battleTypes';

// Showdown damageTaken encoding.
const NORMAL = 0;
const WEAK = 1;
const RESIST = 2;
const IMMUNE_A = 3;
const IMMUNE_B = 4;

/** defenderType -> attackType -> multiplier. Built once. */
const CHART: Record<string, Record<string, number>> = (() => {
  const chart: Record<string, Record<string, number>> = {};
  for (const entry of TYPES) {
    const row: Record<string, number> = {};
    for (const [attackType, code] of Object.entries(entry.damageTaken)) {
      switch (code) {
        case WEAK:
          row[attackType] = 2;
          break;
        case RESIST:
          row[attackType] = 0.5;
          break;
        case IMMUNE_A:
        case IMMUNE_B:
          row[attackType] = 0;
          break;
        case NORMAL:
        default:
          row[attackType] = 1;
          break;
      }
    }
    chart[entry.name] = row;
  }
  return chart;
})();

/**
 * Damage multiplier of `attackType` against a defender with `defenseTypes`.
 * Dual types stack multiplicatively, so x4 and x0.25 arise naturally.
 */
export function effectiveness(attackType: string, defenseTypes: readonly string[]): number {
  const atk = attackType.toLowerCase();
  let multiplier = 1;
  for (const raw of defenseTypes) {
    const row = CHART[raw.toLowerCase()];
    if (!row) continue;
    const m = row[atk];
    multiplier *= m === undefined ? 1 : m;
  }
  return multiplier;
}

/** Bucket a multiplier for feedback (banners, reactions, impact tiers). */
export function classifyEffectiveness(multiplier: number): Effectiveness {
  if (multiplier === 0) return 'immune';
  if (multiplier < 1) return 'resisted';
  if (multiplier > 1) return 'super';
  return 'neutral';
}

/** Same-type attack bonus. */
export function stabMultiplier(moveType: PokemonType, attackerTypes: readonly PokemonType[]): number {
  return attackerTypes.includes(moveType) ? 1.5 : 1;
}

/** Status immunities that are type-based. */
export function isStatusImmune(status: string, defenseTypes: readonly string[]): boolean {
  const types = defenseTypes.map((t) => t.toLowerCase());
  switch (status) {
    case 'brn':
      return types.includes('fire');
    case 'psn':
    case 'tox':
      return types.includes('poison') || types.includes('steel');
    case 'par':
      return types.includes('electric');
    case 'frz':
      return types.includes('ice');
    default:
      return false;
  }
}

/** Exposed for tests and for the move-grid consequence tags. */
export const TYPE_CHART = CHART;
