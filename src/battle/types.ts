import type { Species, Move as DexMove, Ability } from '@pkmn/dex';

export type BattlePhase =
  | 'INTRO'
  | 'GAUGE_TICK'
  | 'MOVE_SELECT'
  | 'AIMING'
  | 'AI_DECIDE'
  | 'DEFENDER_BRACE'
  | 'RESOLVE'
  | 'IMPACT'
  | 'FAINT_SEQUENCE'
  | 'SWITCH_PROMPT'
  | 'BATTLE_END';

export interface BattleMoveExtension {
  aimed: boolean;
  shape: 'single' | 'line' | 'cone' | 'circle';
  shapeSize: number; // 0-100 scale
  precisionBonusMultiplier: number;
}

export type BattleMove = DexMove & BattleMoveExtension;

export interface Combatant {
  id: string;
  species: Species;
  level: number;
  currentHp: number;
  maxHp: number;
  ability: Ability;
  moves: BattleMove[];
  gauge: number; // 0-100
  arenaPosition: number; // 0-100 horizontal within brace strip
  statusConditions: string[]; // status id strings (e.g. "brn", "par")
  volatileFlags: Record<string, boolean>;
  isPlayerControlled: boolean;
}

export interface BattleState {
  phase: BattlePhase;
  playerTeam: Combatant[];
  enemyTeam: Combatant[];
  activeCombatantId: string | null;
  pendingMove: BattleMove | null;
  aimPosition: number | null;
  braceInput: number | null;
  combatLog: string[];
  turnCount: number;
}
