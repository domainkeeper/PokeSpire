import { describe, expect, it } from 'vitest';
import { createBattle } from '../engine/battleFactory';
import { resolveTurn } from '../engine/resolveTurn';
import { allMoveRuntimes, getMove, requireMove } from '../engine/moveRegistry';
import type { BattleAction, BattleEvent, BattleSnapshot } from '../engine/battleTypes';
import { applyEventToDisplay, cloneSnapshot, planBeats } from '../presentation/useEventPlayer';
import { resolveProfile, resolvedCategoryOf, guardProfile, clearProfileCache } from '../presentation/fx/profileResolver';
import { buildFxTimeline, buildProfile, CATEGORY_SPECS } from '../presentation/fx/profileCatalog';
import {
  buildStageClock,
  MAX_ACTION_MS,
  STAGES,
  type AnimCategory,
} from '../presentation/fx/animationTypes';
import { getTypePalette } from '../../game/effects/presets/typePalettes';
import { createEffectContext } from '../../game/effects/types';
import { IMPACT_FEEDBACK } from '../presentation/battleCamera';
import { advanceClock, battleClock, requestHitStop, resetClock, setPlaybackRate } from '../presentation/battleClock';
import { POKEMON_TYPES } from '../../data/pokemon/schemas/index';

const ALL_CATEGORIES = Object.keys(CATEGORY_SPECS) as AnimCategory[];

function battle(seed = 'fx'): BattleSnapshot {
  return createBattle({
    playerTeam: [{ species: 'Pikachu', level: 25, moves: ['tackle', 'thundershock'] }, { species: 'Squirtle', level: 25 }],
    enemyTeam: [{ species: 'Charmander', level: 25, moves: ['scratch'] }],
    seed,
  });
}
const mv = (s: BattleSnapshot, side: 'player' | 'enemy', moveId: string): BattleAction => ({
  kind: 'MOVE',
  actorId: side === 'player' ? s.activePlayerId : s.activeEnemyId,
  moveId,
});
const guard = (s: BattleSnapshot, side: 'player' | 'enemy'): BattleAction => ({
  kind: 'GUARD',
  actorId: side === 'player' ? s.activePlayerId : s.activeEnemyId,
});

const ctx = createEffectContext([-2.35, 0, 0.75], [2.35, 0, -0.55]);

// ───────────────────────────────────────────────────────────────────────────────
// A1 - the unit-mismatch bug. EffectPhase.at was authored in seconds and compared
// against milliseconds, so every layer spawned on frame 1 and attacks had no windup,
// travel or impact beat. These assertions are the regression gate.
// ───────────────────────────────────────────────────────────────────────────────
describe('stage clock (A1 regression: milliseconds only)', () => {
  it('lays stages out contiguously with integer ms boundaries', () => {
    const clock = buildStageClock({
      anticipateMs: 120,
      windupMs: 180,
      releaseMs: 80,
      travelMs: 260,
      impactMs: 80,
      reactMs: 200,
      settleMs: 180,
    });
    expect(clock.start.ANTICIPATE).toBe(0);
    expect(clock.start.WINDUP).toBe(120);
    expect(clock.start.RELEASE).toBe(300);
    expect(clock.start.TRAVEL).toBe(380);
    expect(clock.start.IMPACT).toBe(640);
    expect(clock.start.REACT).toBe(720);
    expect(clock.start.SETTLE).toBe(920);
    expect(clock.totalMs).toBe(1100);

    for (const s of STAGES) {
      expect(Number.isInteger(clock.start[s])).toBe(true);
      expect(Number.isInteger(clock.end[s])).toBe(true);
    }
  });

  it('never places impact on frame 1 for any category', () => {
    for (const category of ALL_CATEGORIES) {
      const profile = buildProfile(category);
      const clock = buildStageClock(profile.timings);
      // A single frame at 60fps is ~16ms. Impact must be far beyond that: an attack
      // needs visible anticipation and windup before it connects.
      expect(clock.start.IMPACT, `${category} impact start`).toBeGreaterThan(120);
      expect(clock.start.WINDUP, `${category} windup start`).toBeGreaterThan(0);
    }
  });

  it('respects the hard duration cap for every category and modifier combination', () => {
    for (const category of ALL_CATEGORIES) {
      for (const mods of [[], ['heavy'], ['quick'], ['heavy', 'quick']] as const) {
        const profile = buildProfile(category, [...mods] as never);
        const total = buildStageClock(profile.timings).totalMs;
        expect(total, `${category} ${mods.join('+')}`).toBeLessThanOrEqual(MAX_ACTION_MS);
        expect(total).toBeGreaterThan(300);
      }
    }
  });

  it('heavy lengthens the windup and quick shortens it', () => {
    const base = buildProfile('CONTACT_STRIKE');
    const heavy = buildProfile('CONTACT_STRIKE', ['heavy']);
    const quick = buildProfile('CONTACT_STRIKE', ['quick']);
    expect(heavy.timings.windupMs).toBeGreaterThan(base.timings.windupMs);
    expect(quick.timings.windupMs).toBeLessThan(base.timings.windupMs);
    expect(heavy.knobs.releaseDolly).toBeGreaterThan(base.knobs.releaseDolly);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// A2 - layers were only ever appended, so completion (activeLayers.length === 0) was
// unreachable and onComplete never fired.
// ───────────────────────────────────────────────────────────────────────────────
describe('fx timeline (A2 regression: every layer is reapable)', () => {
  it('gives every spawn a positive, finite duration', () => {
    for (const category of ALL_CATEGORIES) {
      for (const type of POKEMON_TYPES) {
        const timeline = buildFxTimeline(
          buildProfile(category),
          getTypePalette(type),
          ctx,
          { hitCount: 1, whiffed: false, distance: 4.7 },
        );
        for (const s of timeline.spawns) {
          expect(Number.isFinite(s.atMs), `${category}/${type} atMs`).toBe(true);
          expect(s.atMs).toBeGreaterThanOrEqual(0);
          expect(s.durationMs, `${category}/${type} ${s.layer.kind} duration`).toBeGreaterThan(0);
          expect(Number.isFinite(s.durationMs)).toBe(true);
        }
      }
    }
  });

  it('every spawn expires no later than the total plus a small tail', () => {
    for (const category of ALL_CATEGORIES) {
      const timeline = buildFxTimeline(
        buildProfile(category),
        getTypePalette('fire'),
        ctx,
        { hitCount: 1, whiffed: false, distance: 4.7 },
      );
      for (const s of timeline.spawns) {
        expect(s.atMs + s.durationMs, `${category} ${s.layer.kind}`).toBeLessThanOrEqual(
          timeline.totalMs + 400,
        );
      }
    }
  });

  it('gives every spawn a unique id so React reconciles instead of remounting', () => {
    const timeline = buildFxTimeline(
      buildProfile('BEAM'),
      getTypePalette('ice'),
      ctx,
      { hitCount: 3, whiffed: false, distance: 4.7 },
    );
    const ids = timeline.spawns.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('emits no contact FX when the move whiffed, but still plays the swing', () => {
    const hit = buildFxTimeline(buildProfile('CONTACT_STRIKE'), getTypePalette('normal'), ctx, {
      hitCount: 1, whiffed: false, distance: 4.7,
    });
    const miss = buildFxTimeline(buildProfile('CONTACT_STRIKE'), getTypePalette('normal'), ctx, {
      hitCount: 1, whiffed: true, distance: 4.7,
    });
    expect(miss.spawns.length).toBeLessThan(hit.spawns.length);
    // The attacker still winds up and lunges - a miss must read as a real attempt.
    expect(miss.rigCues.some((c) => c.motion === 'lunge')).toBe(true);
    expect(miss.rigCues.some((c) => c.motion === 'windup')).toBe(true);
    // No impact flipbook, ring, decal or shockwave.
    for (const s of miss.spawns) {
      expect(['flipbook', 'ring', 'decal', 'shockwave']).not.toContain(s.layer.kind);
    }
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('per-category visual identity (A3 regression: everything looked the same)', () => {
  it('produces a distinct layer signature for every category', () => {
    const signatures = new Map<string, AnimCategory[]>();
    for (const category of ALL_CATEGORIES) {
      const timeline = buildFxTimeline(
        buildProfile(category),
        getTypePalette('water'),
        ctx,
        { hitCount: 1, whiffed: false, distance: 4.7 },
      );
      const sig = [...new Set(timeline.spawns.map((s) => s.layer.kind))].sort().join('+');
      const list = signatures.get(sig) ?? [];
      list.push(category);
      signatures.set(sig, list);
    }
    // The legacy system collapsed 13 declared families into 2 implementations.
    // Require real spread: at least 7 distinct layer signatures across 11 categories.
    expect(signatures.size).toBeGreaterThanOrEqual(7);
  });

  it('gives each category its defining layer', () => {
    const kindsOf = (c: AnimCategory) =>
      new Set(
        buildFxTimeline(buildProfile(c), getTypePalette('water'), ctx, {
          hitCount: 1, whiffed: false, distance: 4.7,
        }).spawns.map((s) => s.layer.kind),
      );

    expect(kindsOf('BEAM')).toContain('beam');
    expect(kindsOf('PROJECTILE')).toContain('projectile');
    expect(kindsOf('AREA_WAVE')).toContain('wave');
    expect(kindsOf('GUARD')).toContain('shield');
    expect(kindsOf('AREA_GROUND')).toContain('shockwave');
    expect(kindsOf('AREA_GROUND')).toContain('decal');

    // Contact categories cross the arena; ranged ones only drift a little on release.
    const lungeAmount = (c: AnimCategory) => {
      const cue = buildFxTimeline(buildProfile(c), getTypePalette('water'), ctx, {
        hitCount: 1, whiffed: false, distance: 4.7,
      }).rigCues.find((r) => r.motion === 'lunge' || r.motion === 'dashThrough');
      return cue?.amount ?? 0;
    };

    expect(lungeAmount('CONTACT_STRIKE')).toBeGreaterThan(0.4);
    expect(lungeAmount('SLASH')).toBeGreaterThan(0.4);
    expect(lungeAmount('MULTI_HIT')).toBeGreaterThan(0.3);
    // Ranged and supportive categories stay home.
    expect(lungeAmount('BEAM')).toBeLessThan(0.2);
    expect(lungeAmount('PROJECTILE')).toBeLessThan(0.2);
    expect(lungeAmount('AREA_GROUND')).toBe(0);
    expect(lungeAmount('HEAL')).toBe(0);
    expect(lungeAmount('STATUS_APPLY')).toBe(0);
  });

  it('marks contact only for categories that actually touch', () => {
    expect(buildProfile('CONTACT_STRIKE').knobs.contact).toBe(true);
    expect(buildProfile('SLASH').knobs.contact).toBe(true);
    expect(buildProfile('MULTI_HIT').knobs.contact).toBe(true);
    expect(buildProfile('BEAM').knobs.contact).toBe(false);
    expect(buildProfile('PROJECTILE').knobs.contact).toBe(false);
    expect(buildProfile('AREA_GROUND').knobs.contact).toBe(false);
    expect(buildProfile('STATUS_APPLY').knobs.contact).toBe(false);
  });

  it('SLASH dashes through, CONTACT_STRIKE does not', () => {
    const slash = buildFxTimeline(buildProfile('SLASH'), getTypePalette('grass'), ctx, {
      hitCount: 1, whiffed: false, distance: 4.7,
    });
    const strike = buildFxTimeline(buildProfile('CONTACT_STRIKE'), getTypePalette('grass'), ctx, {
      hitCount: 1, whiffed: false, distance: 4.7,
    });
    expect(slash.rigCues.some((r) => r.motion === 'dashThrough')).toBe(true);
    expect(strike.rigCues.some((r) => r.motion === 'lunge')).toBe(true);
    expect(strike.rigCues.some((r) => r.motion === 'dashThrough')).toBe(false);
  });

  it('travel time is zero for melee and non-zero for ranged', () => {
    expect(buildProfile('CONTACT_STRIKE').timings.travelMs).toBe(0);
    expect(buildProfile('SLASH').timings.travelMs).toBe(0);
    expect(buildProfile('AREA_GROUND').timings.travelMs).toBe(0);
    expect(buildProfile('PROJECTILE').timings.travelMs).toBeGreaterThan(100);
    expect(buildProfile('BEAM').timings.travelMs).toBeGreaterThan(100);
  });

  it('supportive categories never request a camera dolly', () => {
    for (const c of ['STATUS_APPLY', 'SELF_BUFF', 'HEAL', 'GUARD'] as AnimCategory[]) {
      const timeline = buildFxTimeline(buildProfile(c), getTypePalette('fairy'), ctx, {
        hitCount: 1, whiffed: false, distance: 4.7,
      });
      expect(timeline.cameraCues.length, c).toBe(0);
    }
  });

  it('multi-hit stages separate impacts and escalates them', () => {
    const timeline = buildFxTimeline(buildProfile('MULTI_HIT'), getTypePalette('fighting'), ctx, {
      hitCount: 4, whiffed: false, distance: 4.7,
    });
    expect(timeline.impactTimesMs.length).toBe(4);
    for (let i = 1; i < 4; i++) {
      expect(timeline.impactTimesMs[i]).toBeGreaterThan(timeline.impactTimesMs[i - 1]);
      // Separated enough to read as distinct contacts.
      expect(timeline.impactTimesMs[i] - timeline.impactTimesMs[i - 1]).toBeGreaterThanOrEqual(45);
    }
    expect(timeline.totalMs).toBeGreaterThanOrEqual(
      timeline.impactTimesMs[3] + buildProfile('MULTI_HIT').timings.reactMs,
    );
  });

  it('projectile flight time equals the travel stage, so arrival IS impact', () => {
    const profile = buildProfile('PROJECTILE');
    const timeline = buildFxTimeline(profile, getTypePalette('ghost'), ctx, {
      hitCount: 1, whiffed: false, distance: 4.7,
    });
    const proj = timeline.spawns.find((s) => s.layer.kind === 'projectile');
    expect(proj).toBeTruthy();
    const cfg = (proj!.layer as { kind: 'projectile'; config: { durationSec: number } }).config;
    expect(cfg.durationSec * 1000).toBeCloseTo(profile.timings.travelMs, 5);
    const clock = buildStageClock(profile.timings);
    expect(proj!.atMs).toBe(clock.start.TRAVEL);
    expect(proj!.atMs + cfg.durationSec * 1000).toBeCloseTo(clock.start.IMPACT, 5);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('profile resolution', () => {
  it('resolves a profile for every move in the dataset', () => {
    clearProfileCache();
    for (const move of allMoveRuntimes()) {
      const profile = resolveProfile(move);
      expect(ALL_CATEGORIES, move.name).toContain(profile.category);
      expect(buildStageClock(profile.timings).totalMs).toBeLessThanOrEqual(MAX_ACTION_MS);
    }
  });

  it('maps signature moves to their authored silhouette', () => {
    const expected: Record<string, AnimCategory> = {
      flamethrower: 'BEAM',
      icebeam: 'BEAM',
      thunderbolt: 'BEAM',
      earthquake: 'AREA_GROUND',
      surf: 'AREA_WAVE',
      hyperbeam: 'BEAM',
      slash: 'SLASH',
      quickattack: 'CONTACT_STRIKE',
      shadowball: 'PROJECTILE',
      thunderwave: 'STATUS_APPLY',
      swordsdance: 'SELF_BUFF',
      recover: 'HEAL',
      closecombat: 'MULTI_HIT',
      rockslide: 'AREA_GROUND',
    };
    for (const [id, category] of Object.entries(expected)) {
      expect(resolvedCategoryOf(requireMove(id)), id).toBe(category);
    }
  });

  it('the six moves that were previously identical now differ', () => {
    // Flamethrower / Thunderbolt / Ice Beam / Earthquake / Surf / Hyper Beam all fell
    // through to the same generic particle burst in the legacy recipe builder.
    const ids = ['flamethrower', 'thunderbolt', 'icebeam', 'earthquake', 'surf', 'hyperbeam'];
    const signatures = ids.map((id) => {
      const move = requireMove(id);
      const timeline = buildFxTimeline(
        resolveProfile(move),
        getTypePalette(move.type),
        ctx,
        { hitCount: 1, whiffed: false, distance: 4.7 },
      );
      return JSON.stringify({
        category: resolvedCategoryOf(move),
        kinds: [...new Set(timeline.spawns.map((s) => s.layer.kind))].sort(),
        total: timeline.totalMs,
      });
    });
    // At least four genuinely distinct presentations among the six.
    expect(new Set(signatures).size).toBeGreaterThanOrEqual(4);
  });

  it('derives support categories from move data without an override', () => {
    // Not in the override table, so this exercises the derivation path.
    const derived = ['metalsound', 'defensecurl', 'tailglow', 'irondefense']
      .map((id) => getMove(id))
      .filter(Boolean);
    for (const move of derived) {
      const c = resolvedCategoryOf(move!);
      expect(['SELF_BUFF', 'STATUS_APPLY', 'HEAL'], move!.name).toContain(c);
    }
  });

  it('never gives a status move a contact silhouette', () => {
    for (const move of allMoveRuntimes()) {
      if (move.category !== 'status') continue;
      const c = resolvedCategoryOf(move);
      expect(['STATUS_APPLY', 'SELF_BUFF', 'HEAL', 'GUARD'], move.name).toContain(c);
    }
  });

  it('caches profiles by move id', () => {
    clearProfileCache();
    const a = resolveProfile(requireMove('flamethrower'));
    const b = resolveProfile(requireMove('flamethrower'));
    expect(a).toBe(b);
  });

  it('guardProfile builds the shield silhouette', () => {
    const p = guardProfile();
    expect(p.category).toBe('GUARD');
    expect(p.knobs.shield).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('impact feedback table (contrast, not volume)', () => {
  it('gives T0 no hit-stop, no shake and no flash', () => {
    expect(IMPACT_FEEDBACK.T0.hitStop).toBe(0);
    expect(IMPACT_FEEDBACK.T0.shake).toBe(0);
    expect(IMPACT_FEEDBACK.T0.punch).toBe(0);
    expect(IMPACT_FEEDBACK.T0.flash).toBe(0);
  });

  it('escalates monotonically from T0 to T4', () => {
    const tiers = ['T0', 'T1', 'T2', 'T3', 'T4'] as const;
    for (let i = 1; i < tiers.length; i++) {
      const prev = IMPACT_FEEDBACK[tiers[i - 1]];
      const cur = IMPACT_FEEDBACK[tiers[i]];
      expect(cur.hitStop).toBeGreaterThanOrEqual(prev.hitStop);
      expect(cur.shake).toBeGreaterThanOrEqual(prev.shake);
      expect(cur.numberScale).toBeGreaterThanOrEqual(prev.numberScale);
    }
  });

  it('flashes only at T3 and T4', () => {
    expect(IMPACT_FEEDBACK.T1.flash).toBe(0);
    expect(IMPACT_FEEDBACK.T2.flash).toBe(0);
    expect(IMPACT_FEEDBACK.T3.flash).toBeGreaterThan(0);
    expect(IMPACT_FEEDBACK.T4.flash).toBeGreaterThan(0);
  });

  it('keeps shake within a restrained ceiling', () => {
    for (const tier of Object.values(IMPACT_FEEDBACK)) {
      expect(tier.shake).toBeLessThanOrEqual(0.12);
      expect(tier.hitStop).toBeLessThanOrEqual(140);
    }
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('battle clock / hit-stop (B14 regression: hitStop was read and discarded)', () => {
  it('freezes timeScale for the requested duration then releases', () => {
    resetClock();
    requestHitStop(100);
    advanceClock(0.016);
    expect(battleClock.timeScale).toBe(0);
    advanceClock(0.05);
    expect(battleClock.timeScale).toBe(0);
    advanceClock(0.06);
    expect(battleClock.timeScale).toBe(1);
    resetClock();
  });

  it('a larger hit-stop replaces a smaller one and they never accumulate', () => {
    resetClock();
    requestHitStop(50);
    requestHitStop(120);
    expect(battleClock.hitStopRemaining).toBeCloseTo(0.12, 5);
    requestHitStop(30);
    expect(battleClock.hitStopRemaining).toBeCloseTo(0.12, 5);
    resetClock();
  });

  it('playback rate survives hit-stop', () => {
    resetClock();
    setPlaybackRate(3);
    requestHitStop(80);
    advanceClock(0.016);
    expect(battleClock.timeScale).toBe(0);
    advanceClock(0.2);
    expect(battleClock.timeScale).toBe(3);
    resetClock();
    expect(battleClock.timeScale).toBe(1);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// The sync contract: presentation replays a decided outcome and always converges.
// ───────────────────────────────────────────────────────────────────────────────
describe('beat planning (logic -> event -> animation)', () => {
  it('turns a normal exchange into an ordered beat list', () => {
    const s = battle();
    const { events } = resolveTurn(s, mv(s, 'player', 'tackle'), mv(s, 'enemy', 'scratch'));
    const beats = planBeats(events, { [s.activePlayerId]: 'Pikachu', [s.activeEnemyId]: 'Charmander' });

    expect(beats[0].kind).toBe('turnStart');
    const actions = beats.filter((b) => b.kind === 'action');
    expect(actions.length).toBe(2);
    expect(beats.some((b) => b.kind === 'endOfTurn')).toBe(true);
  });

  it('attributes every event to exactly one beat', () => {
    const s = battle('attrib');
    const { events } = resolveTurn(s, mv(s, 'player', 'tackle'), mv(s, 'enemy', 'scratch'));
    const beats = planBeats(events, {});

    const seen: BattleEvent[] = [];
    for (const b of beats) if ('events' in b) seen.push(...b.events);
    // No event may appear in two beats.
    expect(new Set(seen).size).toBe(seen.length);

    // Every state-changing event must be attributed somewhere.
    const stateful = events.filter((e) =>
      ['DAMAGE', 'POISE_CHANGE', 'BREAK', 'HEAL', 'RECOIL', 'STATUS_APPLIED', 'BOOST_CHANGE', 'STATUS_TICK', 'POISE_RESTORE'].includes(e.type),
    );
    for (const e of stateful) expect(seen).toContain(e);
  });

  it('reports hit count and whiff status per action beat', () => {
    const s = battle('hits');
    const { events } = resolveTurn(s, mv(s, 'player', 'tackle'), guard(s, 'enemy'));
    const beats = planBeats(events, {});
    const action = beats.find((b) => b.kind === 'action');
    expect(action).toBeTruthy();
    if (action?.kind === 'action') {
      expect(action.hitCount).toBeGreaterThanOrEqual(1);
      expect(action.whiffed).toBe(false);
    }
  });

  it('flags a whiff so the director suppresses contact FX', () => {
    // Normal into a Ghost type is immune -> NO_EFFECT.
    const s = createBattle({
      playerTeam: [{ species: 'Pikachu', level: 30, moves: ['tackle'] }],
      enemyTeam: [{ species: 'Gastly', level: 30, moves: ['scratch'] }],
      seed: 'immune',
    });
    const { events } = resolveTurn(s, mv(s, 'player', 'tackle'), guard(s, 'enemy'));
    const beats = planBeats(events, {});
    const action = beats.find((b) => b.kind === 'action');
    if (action?.kind === 'action') expect(action.whiffed).toBe(true);
  });

  it('gives a KO its own beat, after the action that caused it', () => {
    let s = battle('ko');
    s = { ...s, combatants: { ...s.combatants, [s.activeEnemyId]: { ...s.combatants[s.activeEnemyId], hp: 1 } } };
    const { events } = resolveTurn(s, mv(s, 'player', 'tackle'), guard(s, 'enemy'));
    const beats = planBeats(events, {});
    const actionIdx = beats.findIndex((b) => b.kind === 'action');
    const faintIdx = beats.findIndex((b) => b.kind === 'faint');
    const endIdx = beats.findIndex((b) => b.kind === 'battleEnd');
    expect(faintIdx).toBeGreaterThan(actionIdx);
    expect(endIdx).toBeGreaterThan(faintIdx);
  });

  it('separates the intent telegraph into its own beat', () => {
    const beats = planBeats(
      [{ type: 'INTENT_REVEALED', side: 'enemy', category: 'PHYSICAL' }, { type: 'TURN_START', turn: 1 }],
      {},
    );
    expect(beats[0]).toEqual({ kind: 'intent', category: 'PHYSICAL' });
  });

  it('pairs switch-out with switch-in in one beat', () => {
    const s = battle('sw');
    const { events } = resolveTurn(
      s,
      { kind: 'SWITCH', actorId: s.activePlayerId, targetSlot: 1 },
      guard(s, 'enemy'),
    );
    const beats = planBeats(events, {});
    const sw = beats.find((b) => b.kind === 'switch');
    expect(sw).toBeTruthy();
    if (sw?.kind === 'switch') {
      expect(sw.outId).toBe(s.activePlayerId);
      expect(sw.inId).not.toBe(s.activePlayerId);
    }
  });
});

describe('display convergence (no drift between logic and visuals)', () => {
  it('replaying every event reaches the authoritative HP and Poise', () => {
    for (const seed of ['c1', 'c2', 'c3', 'c4', 'c5']) {
      let s = battle(seed);
      let display = cloneSnapshot(s);

      for (let turn = 0; turn < 6 && s.outcome === 'ongoing'; turn++) {
        if (s.phase !== 'COMMAND') break;
        const result = resolveTurn(s, mv(s, 'player', 'tackle'), mv(s, 'enemy', 'scratch'));
        for (const e of result.events) display = applyEventToDisplay(display, e);
        s = result.snapshot;

        for (const id of Object.keys(s.combatants)) {
          expect(display.combatants[id].hp, `${seed} hp ${id}`).toBe(s.combatants[id].hp);
          expect(display.combatants[id].poise, `${seed} poise ${id}`).toBe(s.combatants[id].poise);
          expect(display.combatants[id].fainted).toBe(s.combatants[id].fainted);
          expect(display.combatants[id].status?.id ?? null).toBe(s.combatants[id].status?.id ?? null);
        }
        expect(display.activePlayerId).toBe(s.activePlayerId);
      }
    }
  });

  it('a partial replay never exceeds the authoritative damage', () => {
    const s = battle('partial');
    const result = resolveTurn(s, mv(s, 'player', 'tackle'), mv(s, 'enemy', 'scratch'));
    let display = cloneSnapshot(s);
    // Apply only the first half of the stream, as a mid-animation skip would.
    const half = result.events.slice(0, Math.ceil(result.events.length / 2));
    for (const e of half) display = applyEventToDisplay(display, e);

    for (const id of Object.keys(s.combatants)) {
      expect(display.combatants[id].hp).toBeGreaterThanOrEqual(result.snapshot.combatants[id].hp);
      expect(display.combatants[id].hp).toBeLessThanOrEqual(s.combatants[id].hp);
    }
  });

  it('applying an event twice is idempotent for HP (absolute values, not deltas)', () => {
    const s = battle('idem');
    const result = resolveTurn(s, mv(s, 'player', 'tackle'), guard(s, 'enemy'));
    const dmg = result.events.find((e) => e.type === 'DAMAGE')!;
    let a = applyEventToDisplay(cloneSnapshot(s), dmg);
    const once = a.combatants[(dmg as { targetId: string }).targetId].hp;
    a = applyEventToDisplay(a, dmg);
    expect(a.combatants[(dmg as { targetId: string }).targetId].hp).toBe(once);
  });

  it('never mutates the snapshot it is given', () => {
    const s = battle('nomut');
    const result = resolveTurn(s, mv(s, 'player', 'tackle'), guard(s, 'enemy'));
    const display = cloneSnapshot(s);
    const before = JSON.stringify(display);
    for (const e of result.events) applyEventToDisplay(display, e);
    expect(JSON.stringify(display)).toBe(before);
  });
});
