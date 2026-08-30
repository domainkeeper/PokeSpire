/**
 * Status, volatiles and stat stages. PURE.
 *
 * FIXES B21 - `statusConditions` and `volatileFlags` existed on the legacy Combatant
 * but were never read, written or resolved. No status effect actually existed.
 *
 * Timing rule: can-act gates fire at action start, BEFORE accuracy. Residual damage
 * (burn/poison) fires only in END_OF_TURN, in fixed side order. Never inside an attack.
 */

import type {
  BattleCombatant,
  NonVolatileStatus,
  VolatileStatus,
} from './battleTypes';
import type { RngCursor } from './rng';
import { isStatusImmune } from './typeChart';

// ─── Tuning ─────────────────────────────────────────────────────────────────
export const STATUS_TUNING = {
  burnFraction: 1 / 16,
  poisonFraction: 1 / 8,
  toxicBaseFraction: 1 / 16,
  paralysisSpeedMultiplier: 0.5,
  paralysisFailChance: 25,
  confusionSelfHitChance: 33,
  confusionMinTurns: 2,
  confusionMaxTurns: 4,
  sleepMinTurns: 1,
  sleepMaxTurns: 3,
  freezeThawChance: 20,
  leechSeedFraction: 1 / 8,
} as const;

// ─── Apply ──────────────────────────────────────────────────────────────────
export type StatusApplyResult =
  | { ok: true }
  | { ok: false; reason: 'already' | 'immune' };

export function canApplyStatus(
  target: BattleCombatant,
  status: NonVolatileStatus,
): StatusApplyResult {
  if (target.fainted) return { ok: false, reason: 'immune' };
  if (target.status) return { ok: false, reason: 'already' };
  if (isStatusImmune(status, target.types)) return { ok: false, reason: 'immune' };
  return { ok: true };
}

export function applyStatus(
  target: BattleCombatant,
  status: NonVolatileStatus,
  rng: RngCursor,
): void {
  if (status === 'slp') {
    target.status = {
      id: 'slp',
      turns: rng.range(STATUS_TUNING.sleepMinTurns, STATUS_TUNING.sleepMaxTurns),
    };
  } else if (status === 'tox') {
    target.status = { id: 'tox', stage: 1 };
  } else {
    target.status = { id: status };
  }
}

export function hasVolatile(target: BattleCombatant, id: VolatileStatus): boolean {
  return target.volatiles.some((v) => v.id === id);
}

export function applyVolatile(
  target: BattleCombatant,
  id: VolatileStatus,
  rng: RngCursor,
): boolean {
  if (target.fainted) return false;
  if (hasVolatile(target, id)) return false;

  let turns = 1;
  if (id === 'confusion') {
    turns = rng.range(STATUS_TUNING.confusionMinTurns, STATUS_TUNING.confusionMaxTurns);
  } else if (id === 'leechseed') {
    turns = Infinity;
  }

  target.volatiles = [...target.volatiles, { id, turns }];
  return true;
}

export function removeVolatile(target: BattleCombatant, id: VolatileStatus): boolean {
  const before = target.volatiles.length;
  target.volatiles = target.volatiles.filter((v) => v.id !== id);
  return target.volatiles.length !== before;
}

/** Cleared on switch-out. Non-volatile status and HP persist. */
export function clearVolatiles(target: BattleCombatant): void {
  target.volatiles = [];
}

// ─── Can-act gate ───────────────────────────────────────────────────────────
export type CannotActReason = 'slp' | 'frz' | 'par' | 'flinch' | 'confusion';

export interface CanActResult {
  canAct: boolean;
  reason?: CannotActReason;
  /** Set when confusion causes a self-hit. */
  confusionSelfHit?: boolean;
  /** Emitted when sleep or freeze ended this turn. */
  cured?: NonVolatileStatus;
}

/**
 * Resolved at action start. Order matters and is fixed:
 * freeze -> sleep -> flinch -> paralysis -> confusion.
 */
export function resolveCanAct(actor: BattleCombatant, rng: RngCursor): CanActResult {
  // Freeze: chance to thaw, otherwise cannot act.
  if (actor.status?.id === 'frz') {
    if (rng.chance(STATUS_TUNING.freezeThawChance)) {
      actor.status = null;
      return { canAct: true, cured: 'frz' };
    }
    return { canAct: false, reason: 'frz' };
  }

  // Sleep: decrement, wake at 0.
  if (actor.status?.id === 'slp') {
    const turns = (actor.status.turns ?? 1) - 1;
    if (turns <= 0) {
      actor.status = null;
      return { canAct: true, cured: 'slp' };
    }
    actor.status = { ...actor.status, turns };
    return { canAct: false, reason: 'slp' };
  }

  // Flinch: consumed immediately, single turn.
  if (hasVolatile(actor, 'flinch')) {
    removeVolatile(actor, 'flinch');
    return { canAct: false, reason: 'flinch' };
  }

  // Paralysis: chance to fail.
  if (actor.status?.id === 'par' && rng.chance(STATUS_TUNING.paralysisFailChance)) {
    return { canAct: false, reason: 'par' };
  }

  // Confusion: tick, then chance to hit self.
  const confusion = actor.volatiles.find((v) => v.id === 'confusion');
  if (confusion) {
    const turns = confusion.turns - 1;
    if (turns <= 0) {
      removeVolatile(actor, 'confusion');
    } else {
      actor.volatiles = actor.volatiles.map((v) =>
        v.id === 'confusion' ? { ...v, turns } : v,
      );
      if (rng.chance(STATUS_TUNING.confusionSelfHitChance)) {
        return { canAct: false, reason: 'confusion', confusionSelfHit: true };
      }
    }
  }

  return { canAct: true };
}

// ─── Speed ──────────────────────────────────────────────────────────────────
export function paralysisSpeedFactor(actor: BattleCombatant): number {
  return actor.status?.id === 'par' ? STATUS_TUNING.paralysisSpeedMultiplier : 1;
}

// ─── End-of-turn residual ───────────────────────────────────────────────────
export interface ResidualTick {
  status: NonVolatileStatus;
  amount: number;
}

/** Damage from burn/poison/toxic. Returns null when there is nothing to tick. */
export function residualDamage(actor: BattleCombatant): ResidualTick | null {
  const status = actor.status;
  if (!status || actor.fainted) return null;

  switch (status.id) {
    case 'brn':
      return { status: 'brn', amount: Math.max(1, Math.floor(actor.stats.hp * STATUS_TUNING.burnFraction)) };
    case 'psn':
      return { status: 'psn', amount: Math.max(1, Math.floor(actor.stats.hp * STATUS_TUNING.poisonFraction)) };
    case 'tox': {
      const stage = status.stage ?? 1;
      return {
        status: 'tox',
        amount: Math.max(1, Math.floor(actor.stats.hp * STATUS_TUNING.toxicBaseFraction * stage)),
      };
    }
    default:
      return null;
  }
}

/** Toxic ramps each turn. */
export function advanceToxic(actor: BattleCombatant): void {
  if (actor.status?.id === 'tox') {
    actor.status = { ...actor.status, stage: Math.min(15, (actor.status.stage ?? 1) + 1) };
  }
}

export function leechSeedAmount(actor: BattleCombatant): number {
  if (!hasVolatile(actor, 'leechseed') || actor.fainted) return 0;
  return Math.max(1, Math.floor(actor.stats.hp * STATUS_TUNING.leechSeedFraction));
}

// ─── Labels ─────────────────────────────────────────────────────────────────
export const STATUS_LABELS: Record<NonVolatileStatus, string> = {
  brn: 'Burned',
  psn: 'Poisoned',
  tox: 'Badly Poisoned',
  par: 'Paralysed',
  slp: 'Asleep',
  frz: 'Frozen',
};

export const STATUS_SHORT: Record<NonVolatileStatus, string> = {
  brn: 'BRN',
  psn: 'PSN',
  tox: 'TOX',
  par: 'PAR',
  slp: 'SLP',
  frz: 'FRZ',
};

export const VOLATILE_LABELS: Record<VolatileStatus, string> = {
  confusion: 'Confused',
  flinch: 'Flinched',
  leechseed: 'Seeded',
};
