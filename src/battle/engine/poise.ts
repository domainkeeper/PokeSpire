/**
 * Poise / Break / Stagger. PURE.
 *
 * The identity mechanic. Every combatant has a Poise pool alongside HP. Attacks chip
 * it by their `impact` value, which moveRegistry derives to be anti-correlated with
 * basePower. Emptying it Staggers the target for one turn: it takes more damage and
 * resolves last regardless of priority or Speed.
 *
 * The point is to make "deal damage now" compete with "buy a guaranteed opening",
 * and to keep that resource contested - Guard restores Poise, switching resets it,
 * so it is never a one-way ratchet.
 *
 * All tuning lives here so rebalancing is a single-file change.
 */

import type { BattleCombatant } from './battleTypes';

// ─── Tuning ─────────────────────────────────────────────────────────────────
export const POISE_TUNING = {
  /**
   * Base pool before bulk scaling. Sized against real battle length: at typical
   * levels a fight lasts 3-6 turns, so the pool must be shallow enough that a
   * committed breaker can empty it in ~3 hits. At base 50 / divisor 3 the pool was
   * 60+ and BREAK never fired in a real battle.
   */
  base: 30,
  /** (def + spd) / divisor is added to the pool, so bulk resists Breaks. */
  bulkDivisor: 5,
  /**
   * Fraction of max Poise regained at end of turn. Must stay well below the Impact
   * of a dedicated breaker, or Breaks become unreachable.
   */
  regenPerTurn: 0.06,
  /** Fraction of max Poise restored by Guard. */
  guardRestore: 0.3,
  /** Paralysis multiplier on regen - makes a paralysed target easier to Break. */
  paralysisRegenMultiplier: 0.5,
  /** Damage multiplier applied to a Staggered target. */
  staggerDamageBonus: 1.4,
  /** Turns a Break lasts. */
  staggerTurns: 1,
  /** Guard reduces incoming Poise damage by this factor. */
  guardImpactReduction: 0.35,
} as const;

// ─── Pool ───────────────────────────────────────────────────────────────────
export function computeMaxPoise(def: number, spd: number): number {
  return POISE_TUNING.base + Math.floor((def + spd) / POISE_TUNING.bulkDivisor);
}

// ─── Chip ───────────────────────────────────────────────────────────────────
export interface PoiseHit {
  /** Poise actually removed. */
  amount: number;
  poiseBefore: number;
  poiseAfter: number;
  /** True when this hit emptied the pool. */
  broke: boolean;
}

/**
 * Apply Impact to a combatant. Returns the delta only; the caller mutates the
 * working copy so all state changes stay in resolveTurn.
 */
export function applyImpact(
  target: BattleCombatant,
  impact: number,
  opts: { guarded: boolean },
): PoiseHit {
  const poiseBefore = target.poise;

  // Already Staggered: no further chip, the opening is already open.
  if (target.staggeredTurns > 0 || impact <= 0) {
    return { amount: 0, poiseBefore, poiseAfter: poiseBefore, broke: false };
  }

  const scaled = opts.guarded
    ? Math.max(1, Math.round(impact * (1 - POISE_TUNING.guardImpactReduction)))
    : impact;

  const poiseAfter = Math.max(0, poiseBefore - scaled);
  return {
    amount: poiseBefore - poiseAfter,
    poiseBefore,
    poiseAfter,
    broke: poiseAfter <= 0 && poiseBefore > 0,
  };
}

// ─── Regen ──────────────────────────────────────────────────────────────────
export function poiseRegenAmount(target: BattleCombatant): number {
  if (target.staggeredTurns > 0) return 0;
  if (target.poise >= target.maxPoise) return 0;

  let rate = POISE_TUNING.regenPerTurn;
  if (target.status?.id === 'par') rate *= POISE_TUNING.paralysisRegenMultiplier;

  const amount = Math.ceil(target.maxPoise * rate);
  return Math.min(amount, target.maxPoise - target.poise);
}

export function guardRestoreAmount(target: BattleCombatant): number {
  const amount = Math.ceil(target.maxPoise * POISE_TUNING.guardRestore);
  return Math.min(amount, target.maxPoise - target.poise);
}

// ─── Stagger ────────────────────────────────────────────────────────────────
export function isStaggered(c: BattleCombatant): boolean {
  return c.staggeredTurns > 0;
}

/** Applied on Break. */
export function beginStagger(c: BattleCombatant): void {
  c.staggeredTurns = POISE_TUNING.staggerTurns;
  c.poise = 0;
}

/** Clearing a Stagger refills the pool, so a Break cannot be chain-locked. */
export function clearStagger(c: BattleCombatant): void {
  c.staggeredTurns = 0;
  c.poise = c.maxPoise;
}

export function staggerDamageMultiplier(target: BattleCombatant): number {
  return target.staggeredTurns > 0 ? POISE_TUNING.staggerDamageBonus : 1;
}
