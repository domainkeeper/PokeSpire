/**
 * Battle module public surface.
 *
 * Exactly two things are exported: a way to build a battle, and the component that
 * runs one. Everything else is internal, so there is one authoritative entry point and
 * no route into the engine that bypasses it.
 */

export { BattleRuntime, type BattleRuntimeProps } from './BattleRuntime';
export { createBattle, createCombatant, type BattleSetup, type CombatantSpec } from './engine/battleFactory';
export type { BattleSnapshot } from './engine/battleTypes';
