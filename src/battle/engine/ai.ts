/**
 * Opponent policy. PURE.
 *
 * FIXES B24 - the legacy AI scored `effectiveness x basePower` and picked randomly
 * from the top two, ignoring its own HP, status, the player's typing, Guard and
 * switching. There was no opponent to read.
 *
 * This scores every legal action against the full board state, including Poise, so
 * the AI will deliberately set up a Break when one is in reach.
 */

import type {
  BattleAction,
  BattleCombatant,
  BattleSnapshot,
  IntentCategory,
  Side,
} from './battleTypes';
import { effectiveSpeed } from './actionOrder';
import { getMove } from './moveRegistry';
import { RngCursor } from './rng';
import { boostMultiplier, defensiveStat, offensiveStat } from './stats';
import { effectiveness } from './typeChart';

export interface AiMemory {
  /** What the player did last turn, used as a weak prediction signal. */
  lastPlayerIntent: IntentCategory | null;
  consecutivePlayerAttacks: number;
}

export const EMPTY_AI_MEMORY: AiMemory = { lastPlayerIntent: null, consecutivePlayerAttacks: 0 };

/** Rough expected damage, without rolling RNG. Used for scoring only. */
function estimateDamage(move: ReturnType<typeof getMove>, actor: BattleCombatant, foe: BattleCombatant): number {
  if (!move || move.category === 'status' || move.basePower <= 0) return 0;

  const typeMul = effectiveness(move.type, foe.types);
  if (typeMul === 0) return 0;

  const atkKey = offensiveStat(move.category);
  const defKey = defensiveStat(move.category);
  const atk = actor.stats[atkKey] * boostMultiplier(actor.boosts[atkKey]);
  const def = Math.max(1, foe.stats[defKey] * boostMultiplier(foe.boosts[defKey]));

  let dmg = (((2 * actor.level) / 5 + 2) * move.basePower * (atk / def)) / 50 + 2;
  dmg *= typeMul;
  if (actor.types.includes(move.type)) dmg *= 1.5;
  if (actor.status?.id === 'brn' && move.category === 'physical') dmg *= 0.5;
  if (foe.staggeredTurns > 0) dmg *= 1.4;

  // Accuracy-weighted, so a 70-acc nuke is not blindly preferred.
  const acc = move.accuracy === null ? 100 : move.accuracy;
  const hits = move.hits ? (move.hits[0] + move.hits[1]) / 2 : 1;

  return dmg * hits * (acc / 100);
}

interface Candidate {
  action: BattleAction;
  score: number;
}

export function chooseAction(
  snapshot: BattleSnapshot,
  side: Side,
  memory: AiMemory = EMPTY_AI_MEMORY,
  rngSeed?: number,
): BattleAction {
  const actorId = side === 'player' ? snapshot.activePlayerId : snapshot.activeEnemyId;
  const actor = snapshot.combatants[actorId];
  const foeId = side === 'player' ? snapshot.activeEnemyId : snapshot.activePlayerId;
  const foe = snapshot.combatants[foeId];
  const rng = new RngCursor(rngSeed ?? snapshot.rngState ^ 0x5f3759df);

  const candidates: Candidate[] = [];

  const hpFrac = actor.hp / actor.stats.hp;
  const foeHpFrac = foe.hp / foe.stats.hp;
  const outspeeds = effectiveSpeed(actor) > effectiveSpeed(foe);
  const foeNearBreak = foe.staggeredTurns === 0 && foe.poise / foe.maxPoise < 0.4;
  const selfNearBreak = actor.staggeredTurns === 0 && actor.poise / actor.maxPoise < 0.3;

  // ── Moves ──
  for (const slot of actor.moves) {
    if (slot.pp <= 0) continue;
    const move = getMove(slot.moveId);
    if (!move) continue;

    let score = 0;
    const dmg = estimateDamage(move, actor, foe);
    const dmgFrac = dmg / Math.max(1, foe.stats.hp);

    // Damage value, with a hard bonus for a guaranteed kill.
    score += dmgFrac * 100;
    if (dmg >= foe.hp) score += 140;

    // Poise investment: worth a lot when a Break is one hit away, because the
    // Stagger turn is a guaranteed opening.
    if (foe.staggeredTurns === 0 && move.impact > 0) {
      const breaksNow = move.impact >= foe.poise;
      if (breaksNow) score += 70;
      else if (foeNearBreak) score += move.impact * 2.2;
      else score += move.impact * 0.8;
    }

    // Cash in an existing Stagger with the biggest hit available.
    if (foe.staggeredTurns > 0) score += dmgFrac * 60;

    // Status: valuable early, useless if the target already has one.
    if (move.primary.status?.status || move.secondary.status?.status) {
      if (!foe.status) score += foeHpFrac > 0.5 ? 34 : 12;
      else score -= 25;
    }

    // Setup: only when healthy and safe.
    const selfBuff = move.primary.boosts?.target === 'self';
    if (selfBuff) {
      score += hpFrac > 0.6 && foeHpFrac > 0.35 ? 30 : -20;
      if (actor.staggeredTurns > 0) score -= 40;
    }

    // Debuff the foe.
    if (move.primary.boosts?.target === 'foe') {
      score += foeHpFrac > 0.5 ? 20 : 6;
    }

    // Healing: only when it actually matters.
    if (move.heal) score += hpFrac < 0.45 ? 60 : -35;

    // Priority is valuable for finishing.
    if (move.priority > 0 && foeHpFrac < 0.3) score += 30;

    // Recoil is bad when low.
    if (move.recoil && hpFrac < 0.35) score -= 30;

    // Never pick a move that cannot do anything.
    if (dmg === 0 && move.category !== 'status') score -= 200;

    candidates.push({ action: { kind: 'MOVE', actorId: actor.id, moveId: move.id }, score });
  }

  // ── Guard ──
  if (!actor.guardLocked) {
    let score = 8;
    // Guard is the answer to a telegraphed attack when we are about to break.
    if (selfNearBreak) score += 45;
    if (actor.staggeredTurns > 0) score += 55;
    if (hpFrac < 0.3) score += 26;
    if (!outspeeds) score += 10;
    if (memory.consecutivePlayerAttacks >= 2) score += 14;
    if (memory.lastPlayerIntent === 'STATUS' || memory.lastPlayerIntent === 'SWITCH') score -= 22;
    candidates.push({ action: { kind: 'GUARD', actorId: actor.id }, score });
  }

  // ── Switch ──
  const party = side === 'player' ? snapshot.playerParty : snapshot.enemyParty;
  for (const id of party) {
    if (id === actor.id) continue;
    const reserve = snapshot.combatants[id];
    if (reserve.fainted) continue;

    // Would the reserve resist what the current foe throws, and threaten back?
    const incomingWorst = Math.max(
      ...foe.moves
        .map((s) => getMove(s.moveId))
        .filter(Boolean)
        .map((m) => effectiveness(m!.type, reserve.types)),
      1,
    );
    const outgoingBest = Math.max(
      ...reserve.moves
        .map((s) => getMove(s.moveId))
        .filter(Boolean)
        .map((m) => effectiveness(m!.type, foe.types)),
      0,
    );

    let score = -18;
    if (incomingWorst <= 0.5) score += 34;
    if (outgoingBest >= 2) score += 26;
    if (hpFrac < 0.22) score += 30;
    if (actor.staggeredTurns > 0) score += 22;
    if (actor.status) score += 12;

    candidates.push({ action: { kind: 'SWITCH', actorId: actor.id, targetSlot: reserve.slot }, score });
  }

  if (candidates.length === 0) {
    // Should be unreachable; fall back to the first move regardless of PP.
    const fallback = actor.moves[0];
    return fallback
      ? { kind: 'MOVE', actorId: actor.id, moveId: fallback.moveId }
      : { kind: 'GUARD', actorId: actor.id };
  }

  // Softmax-ish: pick from the top band so the AI is readable but not a lookup table.
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0].score;
  const band = candidates.filter((c) => c.score >= best - 18);
  return rng.pick(band).action;
}

/** Track the player's behaviour across turns to feed the prediction signal. */
export function updateAiMemory(memory: AiMemory, playerIntent: IntentCategory): AiMemory {
  const isAttack = playerIntent === 'PHYSICAL' || playerIntent === 'SPECIAL';
  return {
    lastPlayerIntent: playerIntent,
    consecutivePlayerAttacks: isAttack ? memory.consecutivePlayerAttacks + 1 : 0,
  };
}
