/**
 * Deterministic action ordering. PURE.
 *
 * FIXES B23 - the legacy system used a continuous real-time ATB gauge, so turns
 * happened because a timer crossed a threshold. That made prediction impossible:
 * the player could not reason "if I do X they answer Y, so I prepare Z".
 *
 * Strict order:
 *   1. action class     - SWITCH, then GUARD (+4), then move priority
 *   2. Stagger          - Staggered actors always resolve LAST
 *   3. effective Speed  - after stat stages and paralysis
 *   4. seeded tiebreak  - deterministic given the snapshot's rngState
 */

import type { BattleAction, BattleCombatant } from './battleTypes';
import { getMove } from './moveRegistry';
import type { RngCursor } from './rng';
import { boostMultiplier } from './stats';
import { paralysisSpeedFactor } from './statusEngine';

export const GUARD_PRIORITY = 4;
export const SWITCH_PRIORITY = 6;

export function actionPriority(action: BattleAction): number {
  switch (action.kind) {
    case 'SWITCH':
      return SWITCH_PRIORITY;
    case 'GUARD':
      return GUARD_PRIORITY;
    case 'MOVE': {
      const move = getMove(action.moveId);
      return move?.priority ?? 0;
    }
  }
}

export function effectiveSpeed(c: BattleCombatant): number {
  return Math.max(1, Math.floor(c.stats.spe * boostMultiplier(c.boosts.spe) * paralysisSpeedFactor(c)));
}

export interface OrderedAction {
  action: BattleAction;
  actor: BattleCombatant;
}

/**
 * Sort the turn's actions. `rng` is advanced only for a genuine tie, so ordering is
 * reproducible from the snapshot state.
 */
export function orderActions(
  entries: OrderedAction[],
  rng: RngCursor,
): OrderedAction[] {
  const decorated = entries.map((entry) => ({
    entry,
    priority: actionPriority(entry.action),
    staggered: entry.actor.staggeredTurns > 0 ? 1 : 0,
    speed: effectiveSpeed(entry.actor),
  }));

  // Pre-roll one tiebreak value per entry so the sort comparator stays pure.
  const tiebreaks = decorated.map(() => rng.float());

  const indexed = decorated.map((d, i) => ({ ...d, tiebreak: tiebreaks[i] }));

  indexed.sort((a, b) => {
    // Staggered actors resolve last, overriding priority entirely.
    if (a.staggered !== b.staggered) return a.staggered - b.staggered;
    if (a.priority !== b.priority) return b.priority - a.priority;
    if (a.speed !== b.speed) return b.speed - a.speed;
    return a.tiebreak - b.tiebreak;
  });

  return indexed.map((d) => d.entry);
}

/**
 * Turn-order prediction for the UI pip. Compares the player's chosen action against
 * the enemy's *possible* speed only - it must not leak the enemy's actual choice.
 */
export function predictOrder(
  player: BattleCombatant,
  enemy: BattleCombatant,
  playerAction: BattleAction | null,
): 'FIRST' | 'SECOND' | 'UNKNOWN' {
  if (player.staggeredTurns > 0 && enemy.staggeredTurns === 0) return 'SECOND';
  if (enemy.staggeredTurns > 0 && player.staggeredTurns === 0) return 'FIRST';

  const playerPriority = playerAction ? actionPriority(playerAction) : 0;
  if (playerPriority > 0) return 'FIRST';

  const ps = effectiveSpeed(player);
  const es = effectiveSpeed(enemy);
  if (ps === es) return 'UNKNOWN';
  return ps > es ? 'FIRST' : 'SECOND';
}
