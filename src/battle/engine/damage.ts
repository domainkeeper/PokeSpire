/**
 * Damage, accuracy and crit rolls. PURE.
 *
 * FIXES B8 - the legacy engine discarded resolveAim's `hit` result and never
 * consulted move.accuracy for non-aimed moves, so nothing could ever miss.
 */

import type { BattleCombatant, Effectiveness, ImpactTier, MoveRuntime } from './battleTypes';
import type { RngCursor } from './rng';
import { accuracyStageMultiplier, boostMultiplier, defensiveStat, offensiveStat } from './stats';
import { classifyEffectiveness, effectiveness, stabMultiplier } from './typeChart';
import { staggerDamageMultiplier } from './poise';

// ─── Accuracy ───────────────────────────────────────────────────────────────
export function rollAccuracy(
  move: MoveRuntime,
  attacker: BattleCombatant,
  defender: BattleCombatant,
  rng: RngCursor,
): boolean {
  // null accuracy means the move never misses (source data encodes this as -1).
  if (move.accuracy === null) return true;

  const accStage = accuracyStageMultiplier(attacker.boosts.acc);
  const evaStage = accuracyStageMultiplier(defender.boosts.eva);
  const effective = move.accuracy * (accStage / evaStage);

  return rng.float() * 100 < effective;
}

// ─── Crit ───────────────────────────────────────────────────────────────────
/** Standard crit stage odds. */
const CRIT_ODDS = [1 / 24, 1 / 8, 1 / 2, 1];

export function rollCrit(move: MoveRuntime, rng: RngCursor): boolean {
  const stage = Math.max(0, Math.min(CRIT_ODDS.length - 1, move.critStage));
  return rng.float() < CRIT_ODDS[stage];
}

export const CRIT_MULTIPLIER = 1.5;

// ─── Guard ──────────────────────────────────────────────────────────────────
export const GUARD_DAMAGE_REDUCTION = 0.5;

// ─── Impact tier ────────────────────────────────────────────────────────────
/**
 * Tier drives hit-stop, shake, flash and damage-number scale. Deriving it from the
 * damage fraction is what produces impact through CONTRAST rather than volume -
 * resisted chip gets nothing, big hits get a hard freeze.
 */
export function impactTier(
  damage: number,
  maxHp: number,
  opts: { lethal: boolean; effectiveness: Effectiveness; broke: boolean },
): ImpactTier {
  if (opts.lethal || opts.broke) return 'T4';
  if (opts.effectiveness === 'immune') return 'T0';
  if (opts.effectiveness === 'resisted') return 'T0';

  const fraction = maxHp > 0 ? damage / maxHp : 0;
  if (fraction < 0.06) return 'T0';
  if (fraction < 0.18) return 'T1';
  if (fraction < 0.3) return 'T2';
  return 'T3';
}

// ─── Damage ─────────────────────────────────────────────────────────────────
export interface DamageResult {
  damage: number;
  effectiveness: Effectiveness;
  multiplier: number;
  critical: boolean;
}

/**
 * Ability hook seam. AbilityData in this project carries prose only (no mechanical
 * fields), so abilities are out of scope; this exists so they can be added later
 * without touching resolveTurn.
 */
export interface DamageModifiers {
  powerMultiplier: number;
  atkMultiplier: number;
  defMultiplier: number;
  finalMultiplier: number;
}

export const NEUTRAL_MODIFIERS: DamageModifiers = Object.freeze({
  powerMultiplier: 1,
  atkMultiplier: 1,
  defMultiplier: 1,
  finalMultiplier: 1,
});

export function computeDamage(
  move: MoveRuntime,
  attacker: BattleCombatant,
  defender: BattleCombatant,
  rng: RngCursor,
  opts: {
    critical: boolean;
    guarded: boolean;
    modifiers?: DamageModifiers;
  },
): DamageResult {
  const typeMultiplier = effectiveness(move.type, defender.types);
  const eff = classifyEffectiveness(typeMultiplier);

  if (move.category === 'status' || move.basePower <= 0 || typeMultiplier === 0) {
    return { damage: 0, effectiveness: eff, multiplier: typeMultiplier, critical: false };
  }

  const mods = opts.modifiers ?? NEUTRAL_MODIFIERS;
  const atkKey = offensiveStat(move.category);
  const defKey = defensiveStat(move.category);

  // Crits ignore the defender's positive defensive stages and the attacker's
  // negative offensive stages.
  const atkStage = opts.critical ? Math.max(0, attacker.boosts[atkKey]) : attacker.boosts[atkKey];
  const defStage = opts.critical ? Math.min(0, defender.boosts[defKey]) : defender.boosts[defKey];

  const atk = attacker.stats[atkKey] * boostMultiplier(atkStage) * mods.atkMultiplier;
  const def = Math.max(1, defender.stats[defKey] * boostMultiplier(defStage) * mods.defMultiplier);

  const power = move.basePower * mods.powerMultiplier;
  const base = Math.floor(((2 * attacker.level) / 5 + 2) * power * (atk / def)) / 50 + 2;

  let total = base;
  total *= typeMultiplier;
  total *= stabMultiplier(move.type, attacker.types);
  if (opts.critical) total *= CRIT_MULTIPLIER;

  // Burn halves physical output.
  if (attacker.status?.id === 'brn' && move.category === 'physical') total *= 0.5;

  // Staggered targets take amplified damage - the payoff for spending Impact.
  total *= staggerDamageMultiplier(defender);

  if (opts.guarded) total *= GUARD_DAMAGE_REDUCTION;

  // Spread roll last, so it never changes the sign of anything above.
  total *= 0.85 + rng.float() * 0.15;
  total *= mods.finalMultiplier;

  return {
    damage: Math.max(1, Math.floor(total)),
    effectiveness: eff,
    multiplier: typeMultiplier,
    critical: opts.critical,
  };
}

/** Number of hits for a multi-hit move, using the standard 35/35/15/15 weighting. */
export function rollHitCount(move: MoveRuntime, rng: RngCursor): number {
  if (!move.hits) return 1;
  const [min, max] = move.hits;
  if (min === max) return min;
  if (min === 2 && max === 5) {
    const roll = rng.int(100);
    if (roll < 35) return 2;
    if (roll < 70) return 3;
    if (roll < 85) return 4;
    return 5;
  }
  return rng.range(min, max);
}
