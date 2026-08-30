/**
 * Turn resolution. PURE - no React, no Three.js, no timers, no Date.now().
 *
 * This is the whole sync contract: resolveTurn() decides EVERYTHING synchronously and
 * returns an ordered BattleEvent[]. Presentation replays that list over time and can
 * play it at 1x, 3x or instantly with identical results. There is nothing to desync,
 * because there is only one decision point and it happens before any pixel moves.
 *
 * Fixes B6/B9/B10 by construction: no in-place mutation of shared state, damage is an
 * event the presentation commits at its IMPACT beat, and no timeout is on the logic path.
 */

import type {
  BattleAction,
  BattleCombatant,
  BattleEvent,
  BattleSnapshot,
  BoostEffect,
  CombatantId,
  IntentCategory,
  MoveRuntime,
  Side,
  StatusEffect,
  TurnResult,
} from './battleTypes';
import { computeDamage, impactTier, rollAccuracy, rollCrit, rollHitCount } from './damage';
import { getMove } from './moveRegistry';
import {
  applyImpact,
  beginStagger,
  clearStagger,
  guardRestoreAmount,
  poiseRegenAmount,
} from './poise';
import { RngCursor } from './rng';
import { applyBoosts } from './stats';
import {
  advanceToxic,
  applyStatus,
  applyVolatile,
  canApplyStatus,
  clearVolatiles,
  leechSeedAmount,
  removeVolatile,
  residualDamage,
  resolveCanAct,
} from './statusEngine';
import { effectiveness } from './typeChart';
import { orderActions, type OrderedAction } from './actionOrder';

// ─── Working context ────────────────────────────────────────────────────────
interface Ctx {
  combatants: Record<CombatantId, BattleCombatant>;
  activePlayerId: CombatantId;
  activeEnemyId: CombatantId;
  playerParty: CombatantId[];
  enemyParty: CombatantId[];
  events: BattleEvent[];
  rng: RngCursor;
  turn: number;
}

function cloneCombatant(c: BattleCombatant): BattleCombatant {
  return {
    ...c,
    types: [...c.types],
    stats: { ...c.stats },
    moves: c.moves.map((m) => ({ ...m })),
    status: c.status ? { ...c.status } : null,
    volatiles: c.volatiles.map((v) => ({ ...v })),
    boosts: { ...c.boosts },
  };
}

function makeCtx(snapshot: BattleSnapshot): Ctx {
  const combatants: Record<CombatantId, BattleCombatant> = {};
  for (const [id, c] of Object.entries(snapshot.combatants)) combatants[id] = cloneCombatant(c);
  return {
    combatants,
    activePlayerId: snapshot.activePlayerId,
    activeEnemyId: snapshot.activeEnemyId,
    playerParty: [...snapshot.playerParty],
    enemyParty: [...snapshot.enemyParty],
    events: [],
    rng: new RngCursor(snapshot.rngState),
    turn: snapshot.turn,
  };
}

function activeFor(ctx: Ctx, side: Side): BattleCombatant {
  return ctx.combatants[side === 'player' ? ctx.activePlayerId : ctx.activeEnemyId];
}

function opponentOf(ctx: Ctx, actor: BattleCombatant): BattleCombatant {
  return activeFor(ctx, actor.side === 'player' ? 'enemy' : 'player');
}

function partyOf(ctx: Ctx, side: Side): CombatantId[] {
  return side === 'player' ? ctx.playerParty : ctx.enemyParty;
}

function hasLivingReserve(ctx: Ctx, side: Side): boolean {
  const activeId = side === 'player' ? ctx.activePlayerId : ctx.activeEnemyId;
  return partyOf(ctx, side).some((id) => id !== activeId && !ctx.combatants[id].fainted);
}

function sideWiped(ctx: Ctx, side: Side): boolean {
  return partyOf(ctx, side).every((id) => ctx.combatants[id].fainted);
}

// ─── HP mutation helpers ────────────────────────────────────────────────────
function dealDamage(target: BattleCombatant, amount: number): { before: number; after: number } {
  const before = target.hp;
  const after = Math.max(0, before - amount);
  target.hp = after;
  if (after === 0 && !target.fainted) target.fainted = true;
  return { before, after };
}

function healHp(target: BattleCombatant, amount: number): { before: number; after: number } {
  const before = target.hp;
  const after = Math.min(target.stats.hp, before + amount);
  target.hp = after;
  return { before, after };
}

function emitFaintIfDead(ctx: Ctx, target: BattleCombatant): boolean {
  if (target.hp <= 0 && target.fainted) {
    const already = ctx.events.some((e) => e.type === 'FAINT' && e.targetId === target.id);
    if (!already) ctx.events.push({ type: 'FAINT', targetId: target.id });
    return true;
  }
  return false;
}

// ─── Effect application ─────────────────────────────────────────────────────
function applyBoostEffect(
  ctx: Ctx,
  effect: BoostEffect,
  actor: BattleCombatant,
  foe: BattleCombatant,
  forceApply: boolean,
): void {
  if (!forceApply && !ctx.rng.chance(effect.chance)) return;
  const target = effect.target === 'self' ? actor : foe;
  if (target.fainted) return;

  const { next, applied, anyApplied } = applyBoosts(target.boosts, effect.boosts);
  target.boosts = next;
  ctx.events.push({
    type: 'BOOST_CHANGE',
    targetId: target.id,
    boosts: anyApplied ? applied : effect.boosts,
    failed: !anyApplied,
  });
}

function applyStatusEffect(
  ctx: Ctx,
  effect: StatusEffect,
  actor: BattleCombatant,
  foe: BattleCombatant,
  forceApply: boolean,
): void {
  if (!forceApply && !ctx.rng.chance(effect.chance)) return;
  const target = effect.target === 'self' ? actor : foe;
  if (target.fainted) return;

  if (effect.status) {
    const check = canApplyStatus(target, effect.status);
    if (!check.ok) {
      ctx.events.push({
        type: 'STATUS_FAILED',
        targetId: target.id,
        status: effect.status,
        reason: check.reason,
      });
      return;
    }
    applyStatus(target, effect.status, ctx.rng);
    ctx.events.push({ type: 'STATUS_APPLIED', targetId: target.id, status: effect.status });
    return;
  }

  if (effect.volatile) {
    if (applyVolatile(target, effect.volatile, ctx.rng)) {
      ctx.events.push({ type: 'VOLATILE_APPLIED', targetId: target.id, volatile: effect.volatile });
    }
  }
}

/** A status move with no power that only affects its user. */
function isSelfTargeted(move: MoveRuntime): boolean {
  if (move.basePower > 0) return false;
  if (move.heal) return true;
  if (move.primary.boosts?.target === 'self') return true;
  if (move.primary.status?.target === 'self') return true;
  return false;
}

// ─── Actions ────────────────────────────────────────────────────────────────
function resolveGuard(ctx: Ctx, actor: BattleCombatant): void {
  actor.guarding = true;
  ctx.events.push({ type: 'GUARD_START', actorId: actor.id });

  // Guard clears your own Stagger and tops up Poise: the resource is contested,
  // not a one-way ratchet.
  if (actor.staggeredTurns > 0) {
    clearStagger(actor);
    ctx.events.push({ type: 'STAGGER_EXPIRED', targetId: actor.id });
    ctx.events.push({ type: 'POISE_RESTORE', targetId: actor.id, amount: actor.maxPoise, poiseAfter: actor.poise });
    return;
  }

  const restore = guardRestoreAmount(actor);
  if (restore > 0) {
    actor.poise = Math.min(actor.maxPoise, actor.poise + restore);
    ctx.events.push({ type: 'POISE_RESTORE', targetId: actor.id, amount: restore, poiseAfter: actor.poise });
  }
}

function resolveSwitch(ctx: Ctx, actor: BattleCombatant, targetSlot: number): void {
  const party = partyOf(ctx, actor.side);
  const incomingId = party.find((id) => ctx.combatants[id].slot === targetSlot);
  if (!incomingId || incomingId === actor.id || ctx.combatants[incomingId].fainted) {
    ctx.events.push({ type: 'MOVE_FAILED', actorId: actor.id, reason: 'no_target' });
    return;
  }

  ctx.events.push({ type: 'SWITCH_OUT', actorId: actor.id });

  // Switching resets your own matchup state but keeps HP, PP and status.
  clearVolatiles(actor);
  actor.boosts = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
  actor.pendingMoveId = null;
  if (actor.staggeredTurns > 0) clearStagger(actor);
  actor.guarding = false;

  if (actor.side === 'player') ctx.activePlayerId = incomingId;
  else ctx.activeEnemyId = incomingId;

  ctx.events.push({ type: 'SWITCH_IN', actorId: incomingId });
}

function resolveMove(ctx: Ctx, actor: BattleCombatant, requestedMoveId: string): void {
  // A charge move in flight overrides the request and auto-releases.
  const forcedId = actor.pendingMoveId;
  const moveId = forcedId ?? requestedMoveId;
  const move = getMove(moveId);

  if (!move) {
    ctx.events.push({ type: 'MOVE_FAILED', actorId: actor.id, reason: 'no_target' });
    return;
  }

  // PP is only spent on the commit turn, not on the release turn of a charge move.
  if (!forcedId) {
    const slot = actor.moves.find((m) => m.moveId === move.id);
    if (!slot || slot.pp <= 0) {
      ctx.events.push({ type: 'MOVE_FAILED', actorId: actor.id, reason: 'no_pp' });
      return;
    }
    slot.pp -= 1;
  } else {
    actor.pendingMoveId = null;
  }

  const target = opponentOf(ctx, actor);

  // Two-turn charge: telegraph now, release next turn.
  if (move.primary && (move as MoveRuntime).id && !forcedId && isChargeMove(move)) {
    actor.pendingMoveId = move.id;
    ctx.events.push({ type: 'CHARGE_START', actorId: actor.id, moveId: move.id, moveName: move.name });
    return;
  }

  ctx.events.push({
    type: 'MOVE_USED',
    actorId: actor.id,
    targetId: target.id,
    moveId: move.id,
    moveName: move.name,
  });

  // ── Self-targeted support moves: no accuracy roll, no target needed ──
  if (isSelfTargeted(move)) {
    if (move.heal) {
      const amount = Math.max(1, Math.floor(actor.stats.hp * move.heal));
      const { before, after } = healHp(actor, amount);
      ctx.events.push({ type: 'HEAL', targetId: actor.id, amount: after - before, hpBefore: before, hpAfter: after, source: 'move' });
    }
    if (move.primary.boosts) applyBoostEffect(ctx, move.primary.boosts, actor, target, true);
    if (move.primary.status) applyStatusEffect(ctx, move.primary.status, actor, target, true);
    return;
  }

  if (target.fainted) {
    ctx.events.push({ type: 'MOVE_FAILED', actorId: actor.id, reason: 'no_target' });
    return;
  }

  // ── Immunity ──
  const typeMultiplier = effectiveness(move.type, target.types);
  if (move.basePower > 0 && typeMultiplier === 0) {
    ctx.events.push({ type: 'NO_EFFECT', targetId: target.id });
    return;
  }

  // ── Accuracy ──
  if (!rollAccuracy(move, actor, target, ctx.rng)) {
    ctx.events.push({ type: 'MOVE_MISSED', actorId: actor.id, targetId: target.id });
    return;
  }

  const guarded = target.guarding;
  if (guarded) ctx.events.push({ type: 'GUARD_ABSORB', actorId: target.id });

  let totalDamage = 0;

  // ── Damage (possibly multi-hit) ──
  if (move.basePower > 0 && move.category !== 'status') {
    const hitCount = rollHitCount(move, ctx.rng);

    for (let hit = 1; hit <= hitCount; hit++) {
      if (target.fainted) break;

      const critical = rollCrit(move, ctx.rng);
      const staggerAmplified = target.staggeredTurns > 0;
      const result = computeDamage(move, actor, target, ctx.rng, { critical, guarded });

      const { before, after } = dealDamage(target, result.damage);
      totalDamage += before - after;

      const poiseHit = applyImpact(target, move.impact, { guarded });
      if (poiseHit.amount > 0) target.poise = poiseHit.poiseAfter;

      const tier = impactTier(result.damage, target.stats.hp, {
        lethal: after === 0,
        effectiveness: result.effectiveness,
        broke: poiseHit.broke,
      });

      ctx.events.push({
        type: 'DAMAGE',
        actorId: actor.id,
        targetId: target.id,
        moveId: move.id,
        amount: before - after,
        hpBefore: before,
        hpAfter: after,
        effectiveness: result.effectiveness,
        critical: result.critical,
        tier,
        hitIndex: hit,
        hitCount,
        guarded,
        staggerAmplified,
      });

      if (poiseHit.amount > 0) {
        ctx.events.push({
          type: 'POISE_CHANGE',
          targetId: target.id,
          amount: poiseHit.amount,
          poiseBefore: poiseHit.poiseBefore,
          poiseAfter: poiseHit.poiseAfter,
        });
      }

      if (poiseHit.broke) {
        beginStagger(target);
        ctx.events.push({ type: 'BREAK', targetId: target.id });
      }

      if (emitFaintIfDead(ctx, target)) break;
    }
  }

  // ── Drain / recoil ──
  if (totalDamage > 0 && move.drain) {
    const amount = Math.max(1, Math.floor(totalDamage * move.drain));
    const { before, after } = healHp(actor, amount);
    if (after !== before) {
      ctx.events.push({ type: 'HEAL', targetId: actor.id, amount: after - before, hpBefore: before, hpAfter: after, source: 'drain' });
    }
  }

  if (totalDamage > 0 && move.recoil) {
    const amount = Math.max(1, Math.floor(totalDamage * move.recoil));
    const { before, after } = dealDamage(actor, amount);
    ctx.events.push({ type: 'RECOIL', targetId: actor.id, amount: before - after, hpBefore: before, hpAfter: after });
    emitFaintIfDead(ctx, actor);
  }

  // ── Effects ──
  // Guaranteed primary effects on a foe-targeting move (status moves, self-debuff
  // drawbacks like Close Combat), then chance-gated secondary riders.
  const landed = move.basePower === 0 || totalDamage > 0;

  if (landed) {
    if (move.primary.boosts) applyBoostEffect(ctx, move.primary.boosts, actor, target, true);
    if (move.primary.status) applyStatusEffect(ctx, move.primary.status, actor, target, true);
  }

  if (!target.fainted && !actor.fainted) {
    if (move.secondary.boosts) applyBoostEffect(ctx, move.secondary.boosts, actor, target, false);
    if (move.secondary.status) applyStatusEffect(ctx, move.secondary.status, actor, target, false);
  }
}

function isChargeMove(move: MoveRuntime): boolean {
  return /charges? turn 1|charges,? then/i.test(move.shortDesc);
}

function resolveAction(ctx: Ctx, entry: OrderedAction): void {
  // Re-read the actor: an earlier action may have switched or KO'd it.
  const actor = ctx.combatants[entry.actor.id];
  if (!actor || actor.fainted) return;

  // A switch changed who is active; a stale move action is dropped.
  const stillActive = actor.id === ctx.activePlayerId || actor.id === ctx.activeEnemyId;
  if (!stillActive) return;

  ctx.events.push({ type: 'ACTION_START', actorId: actor.id, action: entry.action });

  if (entry.action.kind === 'SWITCH') {
    resolveSwitch(ctx, actor, entry.action.targetSlot);
    return;
  }

  if (entry.action.kind === 'GUARD') {
    resolveGuard(ctx, actor);
    return;
  }

  // ── Can-act gate: fires BEFORE accuracy, per the timing rule ──
  const gate = resolveCanAct(actor, ctx.rng);
  if (gate.cured) {
    ctx.events.push({ type: 'STATUS_CURED', targetId: actor.id, status: gate.cured });
  }

  if (!gate.canAct) {
    ctx.events.push({ type: 'CANNOT_ACT', actorId: actor.id, reason: gate.reason! });

    if (gate.confusionSelfHit) {
      // Fixed 40-power typeless physical self-hit.
      const self = Math.max(1, Math.floor(((2 * actor.level) / 5 + 2) * 40 * (actor.stats.atk / Math.max(1, actor.stats.def)) / 50 + 2));
      const { before, after } = dealDamage(actor, self);
      ctx.events.push({ type: 'RECOIL', targetId: actor.id, amount: before - after, hpBefore: before, hpAfter: after });
      emitFaintIfDead(ctx, actor);
    }
    return;
  }

  resolveMove(ctx, actor, entry.action.moveId);
}

// ─── End of turn ────────────────────────────────────────────────────────────
function resolveEndOfTurn(ctx: Ctx): void {
  ctx.events.push({ type: 'END_OF_TURN_START' });

  // Fixed side order so simultaneous residuals are never ambiguous.
  const order: BattleCombatant[] = [activeFor(ctx, 'player'), activeFor(ctx, 'enemy')];

  for (const actor of order) {
    if (actor.fainted) continue;

    // Burn / poison / toxic
    const residual = residualDamage(actor);
    if (residual) {
      const { before, after } = dealDamage(actor, residual.amount);
      ctx.events.push({
        type: 'STATUS_TICK',
        targetId: actor.id,
        status: residual.status,
        amount: before - after,
        hpBefore: before,
        hpAfter: after,
      });
      advanceToxic(actor);
      if (emitFaintIfDead(ctx, actor)) continue;
    }

    // Leech Seed drains to the opposing active.
    const seed = leechSeedAmount(actor);
    if (seed > 0) {
      const drained = dealDamage(actor, seed);
      ctx.events.push({
        type: 'STATUS_TICK',
        targetId: actor.id,
        status: 'psn',
        amount: drained.before - drained.after,
        hpBefore: drained.before,
        hpAfter: drained.after,
      });
      const sapper = opponentOf(ctx, actor);
      if (!sapper.fainted) {
        const healed = healHp(sapper, drained.before - drained.after);
        if (healed.after !== healed.before) {
          ctx.events.push({
            type: 'HEAL',
            targetId: sapper.id,
            amount: healed.after - healed.before,
            hpBefore: healed.before,
            hpAfter: healed.after,
            source: 'drain',
          });
        }
      }
      if (emitFaintIfDead(ctx, actor)) continue;
    }
  }

  // Stagger expiry, Poise regen, Guard lock bookkeeping - for every combatant so
  // benched members recover too.
  for (const id of [...ctx.playerParty, ...ctx.enemyParty]) {
    const c = ctx.combatants[id];
    if (c.fainted) continue;

    if (c.staggeredTurns > 0) {
      c.staggeredTurns -= 1;
      if (c.staggeredTurns <= 0) {
        clearStagger(c);
        ctx.events.push({ type: 'STAGGER_EXPIRED', targetId: c.id });
        ctx.events.push({ type: 'POISE_RESTORE', targetId: c.id, amount: c.maxPoise, poiseAfter: c.poise });
      }
    } else {
      const regen = poiseRegenAmount(c);
      if (regen > 0) {
        c.poise = Math.min(c.maxPoise, c.poise + regen);
        ctx.events.push({ type: 'POISE_RESTORE', targetId: c.id, amount: regen, poiseAfter: c.poise });
      }
    }

    // Guard cannot be used on consecutive turns.
    c.guardLocked = c.guarding;
    c.guarding = false;

    // Flinch never survives the turn that applied it.
    if (removeVolatile(c, 'flinch')) {
      ctx.events.push({ type: 'VOLATILE_ENDED', targetId: c.id, volatile: 'flinch' });
    }
  }
}

// ─── Snapshot assembly ──────────────────────────────────────────────────────
function finalise(ctx: Ctx, snapshot: BattleSnapshot): BattleSnapshot {
  const playerWiped = sideWiped(ctx, 'player');
  const enemyWiped = sideWiped(ctx, 'enemy');

  let outcome: BattleSnapshot['outcome'] = 'ongoing';
  if (playerWiped) outcome = 'defeat';
  else if (enemyWiped) outcome = 'victory';

  const pendingForcedSwitch: Side[] = [];
  if (outcome === 'ongoing') {
    if (activeFor(ctx, 'player').fainted && hasLivingReserve(ctx, 'player')) pendingForcedSwitch.push('player');
    if (activeFor(ctx, 'enemy').fainted && hasLivingReserve(ctx, 'enemy')) pendingForcedSwitch.push('enemy');
  }

  let phase: BattleSnapshot['phase'];
  if (outcome === 'victory') phase = 'VICTORY';
  else if (outcome === 'defeat') phase = 'DEFEAT';
  else if (pendingForcedSwitch.length > 0) phase = 'FORCED_SWITCH';
  else phase = 'COMMAND';

  if (outcome !== 'ongoing') {
    ctx.events.push({ type: 'BATTLE_END', outcome });
  } else {
    for (const side of pendingForcedSwitch) {
      ctx.events.push({ type: 'FORCED_SWITCH_REQUIRED', side });
    }
  }

  return {
    ...snapshot,
    phase,
    turn: outcome === 'ongoing' && pendingForcedSwitch.length === 0 ? ctx.turn + 1 : ctx.turn,
    rngState: ctx.rng.state,
    combatants: ctx.combatants,
    playerParty: ctx.playerParty,
    enemyParty: ctx.enemyParty,
    activePlayerId: ctx.activePlayerId,
    activeEnemyId: ctx.activeEnemyId,
    enemyIntent: null,
    pendingForcedSwitch,
    outcome,
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────
export function intentOf(action: BattleAction): IntentCategory {
  switch (action.kind) {
    case 'GUARD':
      return 'GUARD';
    case 'SWITCH':
      return 'SWITCH';
    case 'MOVE': {
      const move = getMove(action.moveId);
      if (!move) return 'STATUS';
      if (move.category === 'physical') return 'PHYSICAL';
      if (move.category === 'special') return 'SPECIAL';
      return 'STATUS';
    }
  }
}

/**
 * Resolve one full turn. Both actions are committed simultaneously; ordering is
 * deterministic (priority -> Stagger -> Speed -> seeded tiebreak).
 */
export function resolveTurn(
  snapshot: BattleSnapshot,
  playerAction: BattleAction,
  enemyAction: BattleAction,
): TurnResult {
  const ctx = makeCtx(snapshot);

  ctx.events.push({ type: 'TURN_START', turn: ctx.turn });

  const entries: OrderedAction[] = [
    { action: playerAction, actor: activeFor(ctx, 'player') },
    { action: enemyAction, actor: activeFor(ctx, 'enemy') },
  ];

  const ordered = orderActions(entries, ctx.rng);

  for (const entry of ordered) {
    resolveAction(ctx, entry);
    // A wipe mid-turn stops further actions.
    if (sideWiped(ctx, 'player') || sideWiped(ctx, 'enemy')) break;
  }

  if (!sideWiped(ctx, 'player') && !sideWiped(ctx, 'enemy')) {
    resolveEndOfTurn(ctx);
  }

  ctx.events.push({ type: 'TURN_END', turn: ctx.turn });

  return { snapshot: finalise(ctx, snapshot), events: ctx.events };
}

/** Resolve a forced replacement after a KO. Does not consume a turn. */
export function resolveForcedSwitch(
  snapshot: BattleSnapshot,
  side: Side,
  targetSlot: number,
): TurnResult {
  const ctx = makeCtx(snapshot);
  const party = partyOf(ctx, side);
  const incomingId = party.find((id) => ctx.combatants[id].slot === targetSlot);

  if (!incomingId || ctx.combatants[incomingId].fainted) {
    return { snapshot, events: [] };
  }

  const outgoingId = side === 'player' ? ctx.activePlayerId : ctx.activeEnemyId;
  const outgoing = ctx.combatants[outgoingId];
  clearVolatiles(outgoing);
  outgoing.boosts = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };

  if (side === 'player') ctx.activePlayerId = incomingId;
  else ctx.activeEnemyId = incomingId;

  ctx.events.push({ type: 'SWITCH_IN', actorId: incomingId });

  const next = finalise(ctx, snapshot);
  return {
    snapshot: { ...next, turn: ctx.turn + (next.pendingForcedSwitch.length === 0 ? 1 : 0) },
    events: ctx.events,
  };
}
