/**
 * Battle beat planner + event player.
 *
 * The engine has already decided everything; this walks its BattleEvent[] and turns it
 * into a queue of timed presentation beats. Because the outcome is fixed before any
 * pixel moves, the queue can be played at 1x, 3x or drained instantly with identical
 * results - which is what makes fast-forward, skip and "battle ended mid-animation"
 * safe rather than a race.
 *
 * State ownership:
 *   engine snapshot  = authoritative truth
 *   display snapshot = what the player can currently see (lags, converges)
 * The display snapshot is advanced event-by-event as beats play, then snapped to the
 * authoritative snapshot when the queue drains, so drift is impossible.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type {
  BattleCombatant,
  BattleEvent,
  BattleSnapshot,
  CombatantId,
  IntentCategory,
} from '../engine/battleTypes';
import { clampStage } from '../engine/stats';

// ─── Beats ──────────────────────────────────────────────────────────────────
export type Beat =
  | { kind: 'intro'; playerId: CombatantId; enemyId: CombatantId }
  | { kind: 'turnStart'; turn: number }
  | { kind: 'intent'; category: IntentCategory }
  | {
      kind: 'action';
      actorId: CombatantId;
      targetId: CombatantId;
      moveId: string;
      moveName: string;
      /** All events belonging to this action, in engine order. */
      events: BattleEvent[];
      hitCount: number;
      whiffed: boolean;
    }
  | { kind: 'guard'; actorId: CombatantId; events: BattleEvent[] }
  | { kind: 'switch'; outId: CombatantId | null; inId: CombatantId; events: BattleEvent[] }
  | { kind: 'cannotAct'; actorId: CombatantId; reason: string; events: BattleEvent[] }
  | { kind: 'charge'; actorId: CombatantId; moveName: string; events: BattleEvent[] }
  | { kind: 'notice'; text: string; events: BattleEvent[] }
  | { kind: 'endOfTurn'; events: BattleEvent[] }
  | { kind: 'faint'; targetId: CombatantId }
  | { kind: 'forcedSwitch'; side: 'player' | 'enemy' }
  | { kind: 'battleEnd'; outcome: 'victory' | 'defeat' };

/** Events that carry no presentation of their own and ride along with their beat. */
const PASSIVE: ReadonlySet<BattleEvent['type']> = new Set([
  'ACTION_START',
  'GUARD_ABSORB',
]);

export function planBeats(events: BattleEvent[], names: Record<CombatantId, string>): Beat[] {
  const beats: Beat[] = [];
  type OpenBeat = Extract<Beat, { events: BattleEvent[] }>;
  // Held in a single-slot box: assigning through a closure defeats TS control-flow
  // narrowing and makes `current` collapse to `never` at later reads.
  const cursor: { beat: OpenBeat | null } = { beat: null };
  let inEndOfTurn = false;

  const attach = (e: BattleEvent) => {
    if (cursor.beat) cursor.beat.events.push(e);
  };

  const open = <T extends OpenBeat>(beat: T): T => {
    beats.push(beat);
    cursor.beat = beat;
    return beat;
  };

  for (const e of events) {
    switch (e.type) {
      case 'BATTLE_INTRO':
        beats.push({ kind: 'intro', playerId: e.playerId, enemyId: e.enemyId });
        cursor.beat = null;
        break;

      case 'TURN_START':
        beats.push({ kind: 'turnStart', turn: e.turn });
        cursor.beat = null;
        inEndOfTurn = false;
        break;

      case 'INTENT_REVEALED':
        beats.push({ kind: 'intent', category: e.category });
        cursor.beat = null;
        break;

      case 'MOVE_USED':
        open({
          kind: 'action',
          actorId: e.actorId,
          targetId: e.targetId,
          moveId: e.moveId,
          moveName: e.moveName,
          events: [e],
          hitCount: 1,
          whiffed: false,
        });
        break;

      case 'GUARD_START':
        open({ kind: 'guard', actorId: e.actorId, events: [e] });
        break;

      case 'SWITCH_OUT':
        open({ kind: 'switch', outId: e.actorId, inId: e.actorId, events: [e] });
        break;

      case 'SWITCH_IN': {
        const open$ = cursor.beat;
        if (open$ && open$.kind === 'switch') {
          open$.inId = e.actorId;
          open$.events.push(e);
        } else {
          open({ kind: 'switch', outId: null, inId: e.actorId, events: [e] });
        }
        break;
      }

      case 'CANNOT_ACT':
        open({ kind: 'cannotAct', actorId: e.actorId, reason: e.reason, events: [e] });
        break;

      case 'CHARGE_START':
        open({ kind: 'charge', actorId: e.actorId, moveName: e.moveName, events: [e] });
        break;

      case 'MOVE_FAILED':
        open({
          kind: 'notice',
          text:
            e.reason === 'no_pp'
              ? `${names[e.actorId] ?? 'It'} has no PP left!`
              : `But it failed!`,
          events: [e],
        });
        break;

      case 'NO_EFFECT':
        attach(e);
        break;

      case 'END_OF_TURN_START':
        inEndOfTurn = true;
        open({ kind: 'endOfTurn', events: [] });
        break;

      case 'FAINT':
        // Its own beat so the KO sequence plays after the action that caused it.
        attach(e);
        beats.push({ kind: 'faint', targetId: e.targetId });
        cursor.beat = null;
        break;

      case 'FORCED_SWITCH_REQUIRED':
        beats.push({ kind: 'forcedSwitch', side: e.side });
        cursor.beat = null;
        break;

      case 'BATTLE_END':
        beats.push({ kind: 'battleEnd', outcome: e.outcome });
        cursor.beat = null;
        break;

      case 'TURN_END':
        cursor.beat = null;
        inEndOfTurn = false;
        break;

      default:
        if (PASSIVE.has(e.type)) break;
        if (cursor.beat) attach(e);
        else if (inEndOfTurn) open({ kind: 'endOfTurn', events: [e] });
        else open({ kind: 'notice', text: '', events: [e] });
        break;
    }
  }

  // Derive per-action hit metadata.
  for (const beat of beats) {
    if (beat.kind !== 'action') continue;
    const damage = beat.events.filter((e) => e.type === 'DAMAGE');
    const missed = beat.events.some((e) => e.type === 'MOVE_MISSED' || e.type === 'NO_EFFECT');
    beat.hitCount = Math.max(1, damage.length);
    beat.whiffed = missed || damage.length === 0;
  }

  return beats.filter((b) => !(b.kind === 'notice' && !b.text && b.events.length === 0));
}

// ─── Display snapshot ───────────────────────────────────────────────────────
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

export function cloneSnapshot(s: BattleSnapshot): BattleSnapshot {
  const combatants: Record<CombatantId, BattleCombatant> = {};
  for (const [id, c] of Object.entries(s.combatants)) combatants[id] = cloneCombatant(c);
  return { ...s, combatants, playerParty: [...s.playerParty], enemyParty: [...s.enemyParty] };
}

/**
 * Advance the DISPLAY snapshot by one event. Mirrors the engine's own mutations, but
 * only for state the player can see. Never used to compute an outcome.
 */
export function applyEventToDisplay(display: BattleSnapshot, e: BattleEvent): BattleSnapshot {
  const next = cloneSnapshot(display);
  const at = (id: CombatantId) => next.combatants[id];

  switch (e.type) {
    case 'DAMAGE':
    case 'RECOIL':
    case 'STATUS_TICK': {
      const c = at(e.type === 'DAMAGE' ? e.targetId : e.targetId);
      if (c) {
        c.hp = e.hpAfter;
        if (c.hp <= 0) c.fainted = true;
      }
      break;
    }
    case 'HEAL': {
      const c = at(e.targetId);
      if (c) c.hp = e.hpAfter;
      break;
    }
    case 'POISE_CHANGE': {
      const c = at(e.targetId);
      if (c) c.poise = e.poiseAfter;
      break;
    }
    case 'POISE_RESTORE': {
      const c = at(e.targetId);
      if (c) c.poise = e.poiseAfter;
      break;
    }
    case 'BREAK': {
      const c = at(e.targetId);
      if (c) {
        c.poise = 0;
        c.staggeredTurns = 1;
      }
      break;
    }
    case 'STAGGER_EXPIRED': {
      const c = at(e.targetId);
      if (c) {
        c.staggeredTurns = 0;
        c.poise = c.maxPoise;
      }
      break;
    }
    case 'STATUS_APPLIED': {
      const c = at(e.targetId);
      if (c) c.status = { id: e.status };
      break;
    }
    case 'STATUS_CURED': {
      const c = at(e.targetId);
      if (c) c.status = null;
      break;
    }
    case 'VOLATILE_APPLIED': {
      const c = at(e.targetId);
      if (c && !c.volatiles.some((v) => v.id === e.volatile)) {
        c.volatiles = [...c.volatiles, { id: e.volatile, turns: 1 }];
      }
      break;
    }
    case 'VOLATILE_ENDED': {
      const c = at(e.targetId);
      if (c) c.volatiles = c.volatiles.filter((v) => v.id !== e.volatile);
      break;
    }
    case 'BOOST_CHANGE': {
      const c = at(e.targetId);
      if (c && !e.failed) {
        for (const [k, v] of Object.entries(e.boosts)) {
          const key = k as keyof typeof c.boosts;
          c.boosts[key] = clampStage(c.boosts[key] + (v ?? 0));
        }
      }
      break;
    }
    case 'GUARD_START': {
      const c = at(e.actorId);
      if (c) c.guarding = true;
      break;
    }
    case 'SWITCH_IN': {
      const c = at(e.actorId);
      if (c) {
        if (c.side === 'player') next.activePlayerId = c.id;
        else next.activeEnemyId = c.id;
      }
      break;
    }
    case 'FAINT': {
      const c = at(e.targetId);
      if (c) {
        c.hp = 0;
        c.fainted = true;
      }
      break;
    }
    case 'MOVE_USED': {
      const c = at(e.actorId);
      const slot = c?.moves.find((m) => m.moveId === e.moveId);
      if (slot && slot.pp > 0) slot.pp -= 1;
      break;
    }
    default:
      break;
  }

  return next;
}

// ─── Player hook ────────────────────────────────────────────────────────────
export interface EventPlayerApi {
  /** Beat currently being presented, or null when idle. */
  beat: Beat | null;
  /** How many beats remain (including the current one). */
  remaining: number;
  busy: boolean;
  /** Queue a new event list for playback. */
  enqueue: (events: BattleEvent[], authoritative: BattleSnapshot) => void;
  /** Advance past the current beat. */
  advance: () => void;
  /** Apply a single event to the display snapshot right now (used at impact beats). */
  commit: (event: BattleEvent) => void;
  /** Apply every remaining event of the current beat. */
  commitRest: () => void;
  /** Drain everything instantly and snap to the authoritative snapshot. */
  skipAll: () => void;
  display: BattleSnapshot;
  setDisplay: (s: BattleSnapshot) => void;
}

export function useEventPlayer(initial: BattleSnapshot): EventPlayerApi {
  const [display, setDisplayState] = useState<BattleSnapshot>(() => cloneSnapshot(initial));
  const [queue, setQueue] = useState<Beat[]>([]);
  const authoritativeRef = useRef<BattleSnapshot>(initial);
  const committedRef = useRef<Set<BattleEvent>>(new Set());

  // Mirror of the queue for imperative reads. State updaters must stay pure, so the
  // current beat is read from here rather than from inside a setQueue callback.
  const queueRef = useRef<Beat[]>([]);
  queueRef.current = queue;

  const names = useMemo(() => {
    const map: Record<CombatantId, string> = {};
    for (const [id, c] of Object.entries(display.combatants)) map[id] = c.name;
    return map;
  }, [display.combatants]);

  const enqueue = useCallback(
    (events: BattleEvent[], authoritative: BattleSnapshot) => {
      authoritativeRef.current = authoritative;
      committedRef.current = new Set();
      const beats = planBeats(events, names);
      setQueue((q) => [...q, ...beats]);
    },
    [names],
  );

  /** Apply the events of a beat that have not already been committed. */
  const applyPending = useCallback((events: BattleEvent[]) => {
    const pending = events.filter((e) => !committedRef.current.has(e));
    if (pending.length === 0) return;
    for (const e of pending) committedRef.current.add(e);
    setDisplayState((d) => {
      let next = d;
      for (const e of pending) next = applyEventToDisplay(next, e);
      return next;
    });
  }, []);

  const commit = useCallback((event: BattleEvent) => {
    if (committedRef.current.has(event)) return;
    committedRef.current.add(event);
    setDisplayState((d) => applyEventToDisplay(d, event));
  }, []);

  const commitRest = useCallback(() => {
    const beat = queueRef.current[0];
    if (beat && 'events' in beat) applyPending(beat.events);
  }, [applyPending]);

  const advance = useCallback(() => {
    const beat = queueRef.current[0];
    // Anything the animation did not explicitly commit is applied on the way out, so a
    // skipped or truncated beat can never lose a state change.
    if (beat && 'events' in beat) applyPending(beat.events);

    const willBeEmpty = queueRef.current.length <= 1;
    setQueue((q) => q.slice(1));

    if (willBeEmpty) {
      // Queue drained: snap to truth. Guarantees convergence.
      setDisplayState(cloneSnapshot(authoritativeRef.current));
    }
  }, [applyPending]);

  const skipAll = useCallback(() => {
    setQueue([]);
    setDisplayState(cloneSnapshot(authoritativeRef.current));
  }, []);

  const setDisplay = useCallback((s: BattleSnapshot) => {
    authoritativeRef.current = s;
    setDisplayState(cloneSnapshot(s));
  }, []);

  return {
    beat: queue[0] ?? null,
    remaining: queue.length,
    busy: queue.length > 0,
    enqueue,
    advance,
    commit,
    commitRest,
    skipAll,
    display,
    setDisplay,
  };
}
