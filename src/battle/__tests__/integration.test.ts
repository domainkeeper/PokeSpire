import { describe, expect, it } from 'vitest';
import { createBattle } from '../engine/battleFactory';
import { intentOf, resolveForcedSwitch, resolveTurn } from '../engine/resolveTurn';
import { chooseAction, updateAiMemory, EMPTY_AI_MEMORY, type AiMemory } from '../engine/ai';
import { getMove } from '../engine/moveRegistry';
import type { BattleEvent, BattleSnapshot } from '../engine/battleTypes';
import { applyEventToDisplay, cloneSnapshot, planBeats, type Beat } from '../presentation/useEventPlayer';
import { resolveProfile, guardProfile } from '../presentation/fx/profileResolver';
import { buildFxTimeline } from '../presentation/fx/profileCatalog';
import { getTypePalette } from '../../game/effects/presets/typePalettes';
import { createEffectContext } from '../../game/effects/types';

/**
 * End-to-end integration: engine -> events -> beats -> animation timeline.
 *
 * The critical hang risk in this architecture is an `action` or `guard` beat with no
 * resolvable animation profile. Those two beat kinds have no dwell timer - they advance
 * only when MoveFxDirector reports completion - so if the director never mounts, the
 * battle stalls forever. These tests walk full AI-vs-AI battles and assert that every
 * such beat is animatable, that the display converges every turn, and that no beat kind
 * escapes the runtime's handler set.
 */

/** Every beat kind the BattleRuntime driver explicitly handles. */
const HANDLED_BEAT_KINDS: ReadonlySet<Beat['kind']> = new Set([
  'intro',
  'turnStart',
  'intent',
  'action',
  'guard',
  'switch',
  'cannotAct',
  'charge',
  'notice',
  'endOfTurn',
  'faint',
  'forcedSwitch',
  'battleEnd',
]);

/** Beat kinds that advance ONLY via onFxComplete and therefore MUST be animatable. */
const FX_DRIVEN: ReadonlySet<Beat['kind']> = new Set(['action', 'guard']);

const CTX = createEffectContext([-2.35, 0, 0.75], [2.35, 0, -0.55]);

interface RunStats {
  beats: Beat[];
  turns: number;
  outcome: BattleSnapshot['outcome'];
  converged: boolean;
  maxTimelineMs: number;
}

const ROSTER = [
  ['Pikachu', 'Squirtle'],
  ['Charizard', 'Gengar'],
  ['Snorlax', 'Jolteon'],
  ['Machamp', 'Lapras'],
  ['Gyarados', 'Clefairy'],
  ['Magnemite', 'Scyther'],
  ['Bulbasaur', 'Geodude'],
  ['Abra', 'Dratini'],
];

function playFullBattle(seed: string, level: number, rosterIndex: number): RunStats {
  const a = ROSTER[rosterIndex % ROSTER.length];
  const b = ROSTER[(rosterIndex + 3) % ROSTER.length];

  let s = createBattle({
    playerTeam: a.map((species) => ({ species, level })),
    enemyTeam: b.map((species) => ({ species, level })),
    seed,
  });

  let display = cloneSnapshot(s);
  const allBeats: Beat[] = [];
  let memory: AiMemory = EMPTY_AI_MEMORY;
  let turns = 0;
  let converged = true;
  let maxTimelineMs = 0;

  const replay = (events: BattleEvent[], authoritative: BattleSnapshot) => {
    allBeats.push(...planBeats(events, {}));
    for (const e of events) display = applyEventToDisplay(display, e);
    // Queue drain snaps to truth, so verify the incremental path agreed first.
    for (const id of Object.keys(authoritative.combatants)) {
      if (
        display.combatants[id].hp !== authoritative.combatants[id].hp ||
        display.combatants[id].poise !== authoritative.combatants[id].poise
      ) {
        converged = false;
      }
    }
    display = cloneSnapshot(authoritative);
  };

  while (s.outcome === 'ongoing' && turns < 120) {
    if (s.phase === 'FORCED_SWITCH') {
      let progressed = false;
      for (const side of [...s.pendingForcedSwitch]) {
        const party = side === 'player' ? s.playerParty : s.enemyParty;
        const activeId = side === 'player' ? s.activePlayerId : s.activeEnemyId;
        const replacement = party.find((id) => id !== activeId && !s.combatants[id].fainted);
        if (!replacement) continue;
        const r = resolveForcedSwitch(s, side, s.combatants[replacement].slot);
        s = r.snapshot;
        replay(r.events, s);
        progressed = true;
      }
      if (!progressed) break;
      continue;
    }

    const playerAction = chooseAction(s, 'player', memory, s.rngState ^ 0x9e3779b9);
    const enemyAction = chooseAction(s, 'enemy', memory);
    memory = updateAiMemory(memory, intentOf(playerAction));

    const r = resolveTurn(s, playerAction, enemyAction);
    s = r.snapshot;
    replay(
      [{ type: 'INTENT_REVEALED', side: 'enemy', category: intentOf(enemyAction) }, ...r.events],
      s,
    );
    turns++;
  }

  // Verify every FX-driven beat can actually mount a director.
  for (const beat of allBeats) {
    if (beat.kind === 'action') {
      const move = getMove(beat.moveId);
      expect(move, `unanimatable move "${beat.moveId}" would hang the battle`).toBeTruthy();
      const profile = resolveProfile(move!);
      const timeline = buildFxTimeline(profile, getTypePalette(move!.type), CTX, {
        hitCount: beat.hitCount,
        whiffed: beat.whiffed,
        distance: 4.7,
      });
      expect(timeline.totalMs).toBeGreaterThan(0);
      expect(timeline.impactTimesMs.length).toBe(beat.hitCount);
      maxTimelineMs = Math.max(maxTimelineMs, timeline.totalMs);
    }
    if (beat.kind === 'guard') {
      const timeline = buildFxTimeline(guardProfile(), getTypePalette('normal'), CTX, {
        hitCount: 1,
        whiffed: true,
        distance: 4.7,
      });
      expect(timeline.totalMs).toBeGreaterThan(0);
      maxTimelineMs = Math.max(maxTimelineMs, timeline.totalMs);
    }
  }

  return { beats: allBeats, turns, outcome: s.outcome, converged, maxTimelineMs };
}

describe('full battle integration (engine -> beats -> animation)', () => {
  const runs: RunStats[] = [];

  it('plays many complete battles across levels and rosters', () => {
    for (let i = 0; i < 24; i++) {
      for (const level of [12, 32, 58]) {
        const stats = playFullBattle(`e2e-${i}-${level}`, level, i);
        runs.push(stats);
        expect(['victory', 'defeat'], `seed e2e-${i}-${level}`).toContain(stats.outcome);
        expect(stats.turns).toBeGreaterThan(0);
        expect(stats.turns).toBeLessThan(120);
      }
    }
    expect(runs.length).toBe(72);
  });

  it('every action and guard beat is animatable (no possible hang)', () => {
    // Assertions live inside playFullBattle; this documents the guarantee and makes the
    // count visible.
    const fxBeats = runs.flatMap((r) => r.beats).filter((b) => FX_DRIVEN.has(b.kind));
    expect(fxBeats.length).toBeGreaterThan(200);
  });

  it('produces only beat kinds the runtime driver handles', () => {
    const kinds = new Set<Beat['kind']>();
    for (const r of runs) for (const b of r.beats) kinds.add(b.kind);
    for (const kind of kinds) {
      expect(HANDLED_BEAT_KINDS.has(kind), `beat kind "${kind}" has no driver case`).toBe(true);
    }
    // And the driver's important cases are actually exercised.
    for (const required of ['action', 'guard', 'turnStart', 'intent', 'endOfTurn', 'faint', 'battleEnd']) {
      expect(kinds.has(required as Beat['kind']), `beat kind ${required} never occurred`).toBe(true);
    }
  });

  it('the display snapshot converges every single turn', () => {
    for (const r of runs) expect(r.converged).toBe(true);
  });

  it('keeps every action animation inside the pacing budget', () => {
    for (const r of runs) {
      expect(r.maxTimelineMs).toBeLessThanOrEqual(2000);
    }
  });

  it('exercises switching, KOs and forced replacements in real play', () => {
    const kinds = runs.flatMap((r) => r.beats).map((b) => b.kind);
    expect(kinds).toContain('faint');
    expect(kinds).toContain('forcedSwitch');
    expect(kinds).toContain('switch');
  });

  it('emits exactly one battleEnd beat per battle', () => {
    for (const r of runs) {
      expect(r.beats.filter((b) => b.kind === 'battleEnd').length).toBe(1);
    }
  });

  it('never emits an action beat whose hit count disagrees with its damage events', () => {
    for (const r of runs) {
      for (const b of r.beats) {
        if (b.kind !== 'action') continue;
        const damage = b.events.filter((e) => e.type === 'DAMAGE').length;
        if (damage === 0) expect(b.whiffed).toBe(true);
        else expect(b.hitCount).toBe(damage);
      }
    }
  });
});
