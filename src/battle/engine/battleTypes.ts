/**
 * Core battle types. PURE — no React, no Three.js, no timers.
 *
 * The engine is a synchronous function over an immutable snapshot. It resolves a
 * whole turn and emits an ordered BattleEvent[]. Presentation replays that list
 * over time; it never computes an outcome. That is the entire sync contract.
 */

import type { PokemonType } from '../../data/pokemon/schemas/index';

// ─── Milliseconds brand ─────────────────────────────────────────────────────
// Animation timings are integer milliseconds, always. The legacy system authored
// EffectPhase.at in seconds and compared it against ms, collapsing every
// animation onto frame 1. Branding the unit makes that bug unwritable.
export type Ms = number & { readonly __ms: unique symbol };
export const ms = (n: number): Ms => Math.round(n) as Ms;

// ─── Sides / ids ────────────────────────────────────────────────────────────
export type Side = 'player' | 'enemy';
export type CombatantId = string;

// ─── Stats ──────────────────────────────────────────────────────────────────
export type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
export type BoostKey = 'atk' | 'def' | 'spa' | 'spd' | 'spe' | 'acc' | 'eva';

export type StatSpread = Record<StatKey, number>;
export type BoostSpread = Record<BoostKey, number>;

export const ZERO_BOOSTS: BoostSpread = Object.freeze({
  atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0,
});

// ─── Status ─────────────────────────────────────────────────────────────────
/** Non-volatile status. At most one per combatant, persists across switches. */
export type NonVolatileStatus = 'brn' | 'psn' | 'tox' | 'par' | 'slp' | 'frz';

/** Volatile status. Cleared on switch. */
export type VolatileStatus = 'confusion' | 'flinch' | 'leechseed';

export interface StatusState {
  id: NonVolatileStatus;
  /** Remaining turns for sleep. Undefined = indefinite. */
  turns?: number;
  /** Accumulating counter for toxic. */
  stage?: number;
}

export interface VolatileState {
  id: VolatileStatus;
  turns: number;
}

// ─── Move runtime ───────────────────────────────────────────────────────────
export type MoveCategory = 'physical' | 'special' | 'status';

/** Which stat table a stat change targets. */
export interface BoostEffect {
  target: 'self' | 'foe';
  boosts: Partial<BoostSpread>;
  /** 0-100. 100 = guaranteed. */
  chance: number;
}

export interface StatusEffect {
  target: 'self' | 'foe';
  status?: NonVolatileStatus;
  volatile?: VolatileStatus;
  chance: number;
}

/**
 * The engine's normalised view of a move. Built once by moveRegistry from
 * MoveData, which fixes two live defects:
 *   N2 - MOVES_BY_NAME is keyed with spaces ("quick attack"), so callers looking
 *        up "quickattack" silently got a generic Normal 40-power fallback.
 *   N3 - MoveData exposes `power`; combatEngine read `move.basePower`, which
 *        never existed, so `undefined || 40` made EVERY move 40 base power.
 */
export interface MoveRuntime {
  id: string;
  name: string;
  type: PokemonType;
  category: MoveCategory;
  basePower: number;
  /** null = never misses (MoveData encodes this as accuracy: -1 or true). */
  accuracy: number | null;
  maxPp: number;
  priority: number;
  critStage: number;
  /** Poise damage. Deliberately anti-correlated with basePower. See moveRegistry. */
  impact: number;
  /** Multi-hit range, inclusive. undefined = single hit. */
  hits?: [number, number];
  /** Fraction of damage dealt recovered by the attacker. */
  drain?: number;
  /** Fraction of damage dealt taken by the attacker. */
  recoil?: number;
  /** Fraction of the attacker's max HP restored. */
  heal?: number;
  /** Guaranteed effects, applied on hit (or on use for self-targeted). */
  primary: { boosts?: BoostEffect; status?: StatusEffect };
  /** Chance-gated rider effects from MoveData.secondary. */
  secondary: { boosts?: BoostEffect; status?: StatusEffect };
  /** Raw Showdown flags — drives animation category derivation and contact rules. */
  flags: Readonly<Record<string, number>>;
  shortDesc: string;
}

export interface MoveSlot {
  moveId: string;
  pp: number;
  maxPp: number;
}

// ─── Combatant ──────────────────────────────────────────────────────────────
export interface BattleCombatant {
  id: CombatantId;
  side: Side;
  /** Party slot index. Stable across the battle. */
  slot: number;
  speciesId: number;
  name: string;
  level: number;
  types: PokemonType[];
  /** Computed from level + base stats. hp here is max HP. */
  stats: StatSpread;
  hp: number;
  /** Poise pool. Break at 0. */
  poise: number;
  maxPoise: number;
  /** >0 means Staggered: +STAGGER_DAMAGE_BONUS taken, resolves last. */
  staggeredTurns: number;
  moves: MoveSlot[];
  status: StatusState | null;
  volatiles: VolatileState[];
  boosts: BoostSpread;
  fainted: boolean;
  /** Guard cannot be used on consecutive turns. */
  guardLocked: boolean;
  /** Set for the turn Guard is active. */
  guarding: boolean;
  /** Two-turn move in flight (e.g. charge moves). */
  pendingMoveId: string | null;
}

// ─── Actions ────────────────────────────────────────────────────────────────
export type BattleAction =
  | { kind: 'MOVE'; actorId: CombatantId; moveId: string }
  | { kind: 'GUARD'; actorId: CombatantId }
  | { kind: 'SWITCH'; actorId: CombatantId; targetSlot: number };

/** What the opponent's intent telegraph reveals. Category only, never the move. */
export type IntentCategory = 'PHYSICAL' | 'SPECIAL' | 'STATUS' | 'GUARD' | 'SWITCH';

// ─── Phases ─────────────────────────────────────────────────────────────────
export type BattlePhase =
  | 'BATTLE_START'
  | 'COMMAND'
  | 'INTENT'
  | 'RESOLVING'
  | 'END_OF_TURN'
  | 'FORCED_SWITCH'
  | 'VICTORY'
  | 'DEFEAT'
  | 'BATTLE_OVER';

// ─── Snapshot ───────────────────────────────────────────────────────────────
export interface BattleSnapshot {
  phase: BattlePhase;
  turn: number;
  /** PRNG state carried in the snapshot: same seed + same actions = identical battle. */
  rngState: number;
  combatants: Readonly<Record<CombatantId, BattleCombatant>>;
  playerParty: CombatantId[];
  enemyParty: CombatantId[];
  activePlayerId: CombatantId;
  activeEnemyId: CombatantId;
  /** Set during INTENT so the UI can telegraph without seeing the move. */
  enemyIntent: IntentCategory | null;
  /** Side(s) that must choose a replacement before the next COMMAND. */
  pendingForcedSwitch: Side[];
  outcome: 'ongoing' | 'victory' | 'defeat';
}

// ─── Events ─────────────────────────────────────────────────────────────────
export type Effectiveness = 'immune' | 'resisted' | 'neutral' | 'super';

/** Impact tier, derived from damage/maxHp. Drives hit-stop, shake, flash. */
export type ImpactTier = 'T0' | 'T1' | 'T2' | 'T3' | 'T4';

export type BattleEvent =
  | { type: 'BATTLE_INTRO'; playerId: CombatantId; enemyId: CombatantId }
  | { type: 'TURN_START'; turn: number }
  | { type: 'INTENT_REVEALED'; side: Side; category: IntentCategory }
  | { type: 'ACTION_START'; actorId: CombatantId; action: BattleAction }
  | { type: 'MOVE_USED'; actorId: CombatantId; targetId: CombatantId; moveId: string; moveName: string }
  | { type: 'MOVE_FAILED'; actorId: CombatantId; reason: 'no_pp' | 'no_target' | 'charging' }
  | { type: 'MOVE_MISSED'; actorId: CombatantId; targetId: CombatantId }
  | { type: 'NO_EFFECT'; targetId: CombatantId }
  | { type: 'CANNOT_ACT'; actorId: CombatantId; reason: 'slp' | 'frz' | 'par' | 'flinch' | 'confusion' }
  | { type: 'CHARGE_START'; actorId: CombatantId; moveId: string; moveName: string }
  | {
      type: 'DAMAGE';
      actorId: CombatantId;
      targetId: CombatantId;
      moveId: string;
      amount: number;
      hpBefore: number;
      hpAfter: number;
      effectiveness: Effectiveness;
      critical: boolean;
      tier: ImpactTier;
      /** 1-based index within a multi-hit sequence. */
      hitIndex: number;
      hitCount: number;
      guarded: boolean;
      staggerAmplified: boolean;
    }
  | {
      type: 'POISE_CHANGE';
      targetId: CombatantId;
      amount: number;
      poiseBefore: number;
      poiseAfter: number;
    }
  | { type: 'BREAK'; targetId: CombatantId }
  | { type: 'STAGGER_EXPIRED'; targetId: CombatantId }
  | { type: 'HEAL'; targetId: CombatantId; amount: number; hpBefore: number; hpAfter: number; source: 'move' | 'drain' }
  | { type: 'RECOIL'; targetId: CombatantId; amount: number; hpBefore: number; hpAfter: number }
  | { type: 'STATUS_APPLIED'; targetId: CombatantId; status: NonVolatileStatus }
  | { type: 'STATUS_FAILED'; targetId: CombatantId; status: NonVolatileStatus; reason: 'already' | 'immune' }
  | { type: 'STATUS_CURED'; targetId: CombatantId; status: NonVolatileStatus }
  | { type: 'STATUS_TICK'; targetId: CombatantId; status: NonVolatileStatus; amount: number; hpBefore: number; hpAfter: number }
  | { type: 'VOLATILE_APPLIED'; targetId: CombatantId; volatile: VolatileStatus }
  | { type: 'VOLATILE_ENDED'; targetId: CombatantId; volatile: VolatileStatus }
  | { type: 'BOOST_CHANGE'; targetId: CombatantId; boosts: Partial<BoostSpread>; failed: boolean }
  | { type: 'GUARD_START'; actorId: CombatantId }
  | { type: 'GUARD_ABSORB'; actorId: CombatantId }
  | { type: 'POISE_RESTORE'; targetId: CombatantId; amount: number; poiseAfter: number }
  | { type: 'SWITCH_OUT'; actorId: CombatantId }
  | { type: 'SWITCH_IN'; actorId: CombatantId }
  | { type: 'FAINT'; targetId: CombatantId }
  /** Explicit marker so presentation can group residual effects unambiguously. */
  | { type: 'END_OF_TURN_START' }
  | { type: 'TURN_END'; turn: number }
  | { type: 'FORCED_SWITCH_REQUIRED'; side: Side }
  | { type: 'BATTLE_END'; outcome: 'victory' | 'defeat' };

export interface TurnResult {
  snapshot: BattleSnapshot;
  events: BattleEvent[];
}
