/**
 * Battle engine public surface. PURE - importing this must never pull in React or Three.
 */

export * from './battleTypes';
export { RngCursor, seedFromString } from './rng';
export { effectiveness, classifyEffectiveness, stabMultiplier, isStatusImmune, TYPE_CHART } from './typeChart';
export {
  getMove,
  requireMove,
  hasMove,
  allMoveRuntimes,
  isContactMove,
  moveSlug,
  deriveImpact,
  parsePrimaryEffects,
} from './moveRegistry';
export { computeStats, computeHp, computeStat, boostMultiplier, applyBoosts, clampStage } from './stats';
export {
  POISE_TUNING,
  computeMaxPoise,
  isStaggered,
  staggerDamageMultiplier,
  poiseRegenAmount,
  guardRestoreAmount,
} from './poise';
export {
  computeDamage,
  impactTier,
  rollAccuracy,
  rollCrit,
  rollHitCount,
  CRIT_MULTIPLIER,
  GUARD_DAMAGE_REDUCTION,
  NEUTRAL_MODIFIERS,
} from './damage';
export {
  STATUS_TUNING,
  STATUS_LABELS,
  STATUS_SHORT,
  VOLATILE_LABELS,
  hasVolatile,
  residualDamage,
} from './statusEngine';
export {
  orderActions,
  actionPriority,
  effectiveSpeed,
  predictOrder,
  GUARD_PRIORITY,
  SWITCH_PRIORITY,
} from './actionOrder';
export { resolveTurn, resolveForcedSwitch, intentOf } from './resolveTurn';
export { chooseAction, updateAiMemory, EMPTY_AI_MEMORY, type AiMemory } from './ai';
export {
  createBattle,
  createCombatant,
  buildMoveset,
  type BattleSetup,
  type CombatantSpec,
} from './battleFactory';
