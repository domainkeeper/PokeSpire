/**
 * Stat computation and stat-stage multipliers. PURE.
 *
 * FIXES B22 — the legacy engine read `attacker.species.baseStats.atk` directly, so a
 * Lv100 and a Lv10 Charmander had near-identical Attack contribution and `maxHp` was
 * hardcoded to 100. Levels and team building were strategically inert.
 */

import type { BoostKey, BoostSpread, StatSpread } from './battleTypes';

/** Standard IV/EV assumptions. Neutral nature, max IVs, no EVs. */
const DEFAULT_IV = 31;
const DEFAULT_EV = 0;

export function computeHp(baseHp: number, level: number, iv = DEFAULT_IV, ev = DEFAULT_EV): number {
  return Math.floor(((2 * baseHp + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
}

export function computeStat(base: number, level: number, iv = DEFAULT_IV, ev = DEFAULT_EV): number {
  return Math.floor(Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5);
}

export function computeStats(base: StatSpread, level: number): StatSpread {
  return {
    hp: computeHp(base.hp, level),
    atk: computeStat(base.atk, level),
    def: computeStat(base.def, level),
    spa: computeStat(base.spa, level),
    spd: computeStat(base.spd, level),
    spe: computeStat(base.spe, level),
  };
}

export const MAX_BOOST_STAGE = 6;
export const MIN_BOOST_STAGE = -6;

/** Multiplier for atk/def/spa/spd/spe stages. */
export function boostMultiplier(stage: number): number {
  const s = clampStage(stage);
  return s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
}

/** Multiplier for accuracy/evasion stages, which use a 3/3 base instead of 2/2. */
export function accuracyStageMultiplier(stage: number): number {
  const s = clampStage(stage);
  return s >= 0 ? (3 + s) / 3 : 3 / (3 - s);
}

export function clampStage(stage: number): number {
  return Math.max(MIN_BOOST_STAGE, Math.min(MAX_BOOST_STAGE, stage));
}

/**
 * Apply boost deltas, returning the new spread plus which keys actually moved.
 * A boost at the cap does not "move", which the caller reports as a failure.
 */
export function applyBoosts(
  current: BoostSpread,
  deltas: Partial<BoostSpread>,
): { next: BoostSpread; applied: Partial<BoostSpread>; anyApplied: boolean } {
  const next: BoostSpread = { ...current };
  const applied: Partial<BoostSpread> = {};
  let anyApplied = false;

  for (const [key, delta] of Object.entries(deltas) as [BoostKey, number][]) {
    if (!delta) continue;
    const before = next[key];
    const after = clampStage(before + delta);
    if (after !== before) {
      next[key] = after;
      applied[key] = after - before;
      anyApplied = true;
    }
  }

  return { next, applied, anyApplied };
}

/**
 * Offensive stat used by a move category. Narrowed to the boostable stats so it can
 * index BoostSpread (which has no `hp`).
 */
export function offensiveStat(category: 'physical' | 'special'): 'atk' | 'spa' {
  return category === 'physical' ? 'atk' : 'spa';
}

/** Defensive stat used against a move category. */
export function defensiveStat(category: 'physical' | 'special'): 'def' | 'spd' {
  return category === 'physical' ? 'def' : 'spd';
}
