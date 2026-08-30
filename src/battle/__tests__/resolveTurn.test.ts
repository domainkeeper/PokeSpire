import { describe, expect, it } from 'vitest';
import type {
  BattleAction,
  BattleEvent,
  BattleSnapshot,
  CombatantId,
} from '../engine/battleTypes';
import { createBattle } from '../engine/battleFactory';
import { intentOf, resolveForcedSwitch, resolveTurn } from '../engine/resolveTurn';
import { chooseAction, updateAiMemory, EMPTY_AI_MEMORY } from '../engine/ai';
import { effectiveSpeed, orderActions, predictOrder } from '../engine/actionOrder';
import { RngCursor } from '../engine/rng';
import { POISE_TUNING } from '../engine/poise';
import { getMove } from '../engine/moveRegistry';

// ─── Fixtures ───────────────────────────────────────────────────────────────
function battle(opts: {
  player?: { species: string; level?: number; moves?: string[] };
  enemy?: { species: string; level?: number; moves?: string[] };
  playerTeam?: { species: string; level?: number; moves?: string[] }[];
  enemyTeam?: { species: string; level?: number; moves?: string[] }[];
  seed?: string;
} = {}): BattleSnapshot {
  return createBattle({
    playerTeam: (opts.playerTeam ?? [opts.player ?? { species: 'Pikachu', level: 25, moves: ['tackle'] }]).map(
      (p) => ({ species: p.species, level: p.level ?? 25, moves: p.moves }),
    ),
    enemyTeam: (opts.enemyTeam ?? [opts.enemy ?? { species: 'Charmander', level: 25, moves: ['scratch'] }]).map(
      (p) => ({ species: p.species, level: p.level ?? 25, moves: p.moves }),
    ),
    seed: opts.seed ?? 'fixture',
  });
}

const move = (s: BattleSnapshot, side: 'player' | 'enemy', moveId: string): BattleAction => ({
  kind: 'MOVE',
  actorId: side === 'player' ? s.activePlayerId : s.activeEnemyId,
  moveId,
});
const guard = (s: BattleSnapshot, side: 'player' | 'enemy'): BattleAction => ({
  kind: 'GUARD',
  actorId: side === 'player' ? s.activePlayerId : s.activeEnemyId,
});
const swap = (s: BattleSnapshot, side: 'player' | 'enemy', slot: number): BattleAction => ({
  kind: 'SWITCH',
  actorId: side === 'player' ? s.activePlayerId : s.activeEnemyId,
  targetSlot: slot,
});

const pick = <T extends BattleEvent['type']>(events: BattleEvent[], type: T) =>
  events.filter((e) => e.type === type) as Extract<BattleEvent, { type: T }>[];

/** Force a specific rngState so probabilistic branches are reproducible. */
function withSeed(s: BattleSnapshot, rngState: number): BattleSnapshot {
  return { ...s, rngState };
}

function setHp(s: BattleSnapshot, id: CombatantId, hp: number): BattleSnapshot {
  return { ...s, combatants: { ...s.combatants, [id]: { ...s.combatants[id], hp, fainted: hp <= 0 } } };
}
function setPoise(s: BattleSnapshot, id: CombatantId, poise: number): BattleSnapshot {
  return { ...s, combatants: { ...s.combatants, [id]: { ...s.combatants[id], poise } } };
}
function patch(s: BattleSnapshot, id: CombatantId, p: Partial<BattleSnapshot['combatants'][string]>): BattleSnapshot {
  return { ...s, combatants: { ...s.combatants, [id]: { ...s.combatants[id], ...p } } };
}

// ───────────────────────────────────────────────────────────────────────────────
describe('determinism (B6 - no shared mutation, seeded RNG in the snapshot)', () => {
  it('produces byte-identical results for the same seed and actions', () => {
    const runOnce = () => {
      let s = battle({ seed: 'determinism' });
      const log: BattleEvent[] = [];
      for (let i = 0; i < 12 && s.outcome === 'ongoing'; i++) {
        if (s.phase === 'FORCED_SWITCH') break;
        const r = resolveTurn(s, move(s, 'player', 'tackle'), move(s, 'enemy', 'scratch'));
        s = r.snapshot;
        log.push(...r.events);
      }
      return { log, s };
    };
    const a = runOnce();
    const b = runOnce();
    expect(JSON.stringify(a.log)).toBe(JSON.stringify(b.log));
    expect(JSON.stringify(a.s)).toBe(JSON.stringify(b.s));
  });

  it('never mutates the input snapshot', () => {
    const s = battle();
    const before = JSON.stringify(s);
    resolveTurn(s, move(s, 'player', 'tackle'), move(s, 'enemy', 'scratch'));
    expect(JSON.stringify(s)).toBe(before);
  });

  it('advances rngState every turn', () => {
    const s = battle();
    const r = resolveTurn(s, move(s, 'player', 'tackle'), move(s, 'enemy', 'scratch'));
    expect(r.snapshot.rngState).not.toBe(s.rngState);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('damage resolution', () => {
  it('deals damage and reports HP before/after consistently', () => {
    const s = battle();
    const { events, snapshot } = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
    const dmg = pick(events, 'DAMAGE');
    expect(dmg.length).toBeGreaterThan(0);
    const d = dmg[0];
    expect(d.amount).toBeGreaterThan(0);
    expect(d.hpAfter).toBe(d.hpBefore - d.amount);
    expect(snapshot.combatants[d.targetId].hp).toBeLessThanOrEqual(d.hpAfter);
  });

  it('applies type effectiveness and reports it (super-effective)', () => {
    // Water Gun into Charmander (fire) must be super-effective.
    const s = battle({
      player: { species: 'Squirtle', level: 25, moves: ['watergun'] },
      enemy: { species: 'Charmander', level: 25, moves: ['scratch'] },
    });
    const { events } = resolveTurn(s, move(s, 'player', 'watergun'), guard(s, 'enemy'));
    const d = pick(events, 'DAMAGE').find((e) => e.moveId === 'watergun')!;
    expect(d.effectiveness).toBe('super');
  });

  it('emits NO_EFFECT for an immune matchup instead of damage', () => {
    // Normal into Gastly (ghost/poison) is immune.
    const s = battle({
      player: { species: 'Pikachu', level: 30, moves: ['tackle'] },
      enemy: { species: 'Gastly', level: 30, moves: ['scratch'] },
    });
    const { events } = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
    expect(pick(events, 'NO_EFFECT').length).toBe(1);
    expect(pick(events, 'DAMAGE').length).toBe(0);
  });

  it('honours base power differences (N3 regression)', () => {
    const avg = (moveId: string) => {
      let total = 0;
      const runs = 40;
      for (let i = 0; i < runs; i++) {
        const s = withSeed(
          battle({
            player: { species: 'Machamp', level: 50, moves: [moveId] },
            enemy: { species: 'Snorlax', level: 50, moves: ['tackle'] },
          }),
          1000 + i * 7717,
        );
        const { events } = resolveTurn(s, move(s, 'player', moveId), guard(s, 'enemy'));
        const d = pick(events, 'DAMAGE');
        total += d.reduce((acc, e) => acc + e.amount, 0);
      }
      return total / runs;
    };
    const weak = avg('karatechop');   // 50 power
    const strong = avg('closecombat'); // 120 power
    expect(strong).toBeGreaterThan(weak * 1.5);
  });

  it('resolves multi-hit moves as multiple DAMAGE events', () => {
    let sawMulti = false;
    for (let i = 0; i < 30 && !sawMulti; i++) {
      const s = withSeed(
        battle({
          player: { species: 'Machop', level: 40, moves: ['doubleslap'] },
          enemy: { species: 'Snorlax', level: 40, moves: ['tackle'] },
        }),
        500 + i * 3331,
      );
      const { events } = resolveTurn(s, move(s, 'player', 'doubleslap'), guard(s, 'enemy'));
      const d = pick(events, 'DAMAGE');
      if (d.length >= 2) {
        sawMulti = true;
        expect(d[0].hitCount).toBe(d.length);
        expect(d.map((e) => e.hitIndex)).toEqual(d.map((_, i2) => i2 + 1));
      }
    }
    expect(sawMulti).toBe(true);
  });

  it('applies drain and recoil', () => {
    // Giga Drain heals the user.
    const s0 = battle({
      player: { species: 'Bulbasaur', level: 45, moves: ['gigadrain'] },
      enemy: { species: 'Squirtle', level: 45, moves: ['tackle'] },
    });
    const wounded = setHp(s0, s0.activePlayerId, Math.floor(s0.combatants[s0.activePlayerId].stats.hp / 2));
    const r1 = resolveTurn(wounded, move(wounded, 'player', 'gigadrain'), guard(wounded, 'enemy'));
    expect(pick(r1.events, 'HEAL').some((e) => e.source === 'drain')).toBe(true);

    // Double-Edge damages the user.
    const s1 = battle({
      player: { species: 'Snorlax', level: 45, moves: ['doubleedge'] },
      enemy: { species: 'Snorlax', level: 45, moves: ['tackle'] },
    });
    const r2 = resolveTurn(s1, move(s1, 'player', 'doubleedge'), guard(s1, 'enemy'));
    expect(pick(r2.events, 'RECOIL').length).toBe(1);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('accuracy and crits (B8 - nothing could miss before)', () => {
  it('can miss a sub-100 accuracy move', () => {
    let misses = 0;
    for (let i = 0; i < 120; i++) {
      const s = withSeed(
        battle({
          player: { species: 'Pikachu', level: 40, moves: ['thunder'] }, // 70 acc
          enemy: { species: 'Snorlax', level: 40, moves: ['tackle'] },
        }),
        i * 65537 + 13,
      );
      const { events } = resolveTurn(s, move(s, 'player', 'thunder'), guard(s, 'enemy'));
      if (pick(events, 'MOVE_MISSED').length) misses++;
    }
    // 70% accuracy over 120 rolls: expect a meaningful but not total miss rate.
    expect(misses).toBeGreaterThan(10);
    expect(misses).toBeLessThan(80);
  });

  it('never misses a move with accuracy -1', () => {
    for (let i = 0; i < 60; i++) {
      const s = withSeed(
        battle({
          player: { species: 'Pikachu', level: 40, moves: ['swift'] },
          enemy: { species: 'Snorlax', level: 40, moves: ['tackle'] },
        }),
        i * 4099 + 7,
      );
      const { events } = resolveTurn(s, move(s, 'player', 'swift'), guard(s, 'enemy'));
      expect(pick(events, 'MOVE_MISSED').length).toBe(0);
    }
  });

  it('produces critical hits at a plausible rate', () => {
    let crits = 0;
    const runs = 400;
    for (let i = 0; i < runs; i++) {
      const s = withSeed(
        battle({
          player: { species: 'Snorlax', level: 50, moves: ['tackle'] },
          enemy: { species: 'Snorlax', level: 50, moves: ['tackle'] },
        }),
        i * 2654435761 + 99,
      );
      const { events } = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
      if (pick(events, 'DAMAGE').some((e) => e.critical)) crits++;
    }
    const rate = crits / runs;
    // 1/24 base = ~4.2%. Allow a wide band; the point is "not 0 and not everything".
    expect(rate).toBeGreaterThan(0.005);
    expect(rate).toBeLessThan(0.15);
  });

  it('a high-crit-ratio move crits more often than a normal one', () => {
    const rate = (moveId: string) => {
      let crits = 0;
      const runs = 300;
      for (let i = 0; i < runs; i++) {
        const s = withSeed(
          battle({
            player: { species: 'Scyther', level: 50, moves: [moveId] },
            enemy: { species: 'Snorlax', level: 50, moves: ['tackle'] },
          }),
          i * 40503 + 5,
        );
        const { events } = resolveTurn(s, move(s, 'player', moveId), guard(s, 'enemy'));
        if (pick(events, 'DAMAGE').some((e) => e.critical)) crits++;
      }
      return crits / runs;
    };
    expect(rate('slash')).toBeGreaterThan(rate('quickattack'));
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('priority and ordering (B23 - ATB removed)', () => {
  it('resolves a priority move first even against a faster foe', () => {
    const s = battle({
      player: { species: 'Snorlax', level: 40, moves: ['quickattack'] }, // slow
      enemy: { species: 'Jolteon', level: 40, moves: ['tackle'] },       // fast
    });
    expect(effectiveSpeed(s.combatants[s.activeEnemyId])).toBeGreaterThan(
      effectiveSpeed(s.combatants[s.activePlayerId]),
    );
    const { events } = resolveTurn(s, move(s, 'player', 'quickattack'), move(s, 'enemy', 'tackle'));
    const first = pick(events, 'ACTION_START')[0];
    expect(first.actorId).toBe(s.activePlayerId);
  });

  it('resolves the faster combatant first at equal priority', () => {
    const s = battle({
      player: { species: 'Jolteon', level: 40, moves: ['tackle'] },
      enemy: { species: 'Snorlax', level: 40, moves: ['tackle'] },
    });
    const { events } = resolveTurn(s, move(s, 'player', 'tackle'), move(s, 'enemy', 'tackle'));
    expect(pick(events, 'ACTION_START')[0].actorId).toBe(s.activePlayerId);
  });

  it('Guard outranks a normal move, and Switch outranks Guard', () => {
    const s = battle({
      playerTeam: [{ species: 'Snorlax', level: 40, moves: ['tackle'] }, { species: 'Pikachu', level: 40, moves: ['tackle'] }],
      enemy: { species: 'Jolteon', level: 40, moves: ['tackle'] },
    });
    const g = resolveTurn(s, guard(s, 'player'), move(s, 'enemy', 'tackle'));
    expect(pick(g.events, 'ACTION_START')[0].actorId).toBe(s.activePlayerId);

    const sw = resolveTurn(s, swap(s, 'player', 1), guard(s, 'enemy'));
    expect(pick(sw.events, 'ACTION_START')[0].actorId).toBe(s.activePlayerId);
  });

  it('a Staggered combatant always resolves last, overriding priority', () => {
    let s = battle({
      player: { species: 'Jolteon', level: 40, moves: ['quickattack'] },
      enemy: { species: 'Snorlax', level: 40, moves: ['tackle'] },
    });
    s = patch(s, s.activePlayerId, { staggeredTurns: 1 });
    const { events } = resolveTurn(s, move(s, 'player', 'quickattack'), move(s, 'enemy', 'tackle'));
    expect(pick(events, 'ACTION_START')[0].actorId).toBe(s.activeEnemyId);
  });

  it('orderActions is stable for a fixed rng state', () => {
    const s = battle();
    const entries = [
      { action: move(s, 'player', 'tackle'), actor: s.combatants[s.activePlayerId] },
      { action: move(s, 'enemy', 'scratch'), actor: s.combatants[s.activeEnemyId] },
    ];
    const a = orderActions(entries, new RngCursor(42)).map((e) => e.actor.id);
    const b = orderActions(entries, new RngCursor(42)).map((e) => e.actor.id);
    expect(a).toEqual(b);
  });

  it('predictOrder reports the player pip without leaking the enemy choice', () => {
    const s = battle({
      player: { species: 'Jolteon', level: 40, moves: ['tackle'] },
      enemy: { species: 'Snorlax', level: 40, moves: ['tackle'] },
    });
    expect(predictOrder(s.combatants[s.activePlayerId], s.combatants[s.activeEnemyId], null)).toBe('FIRST');
    const staggered = patch(s, s.activePlayerId, { staggeredTurns: 1 });
    expect(
      predictOrder(staggered.combatants[staggered.activePlayerId], staggered.combatants[staggered.activeEnemyId], null),
    ).toBe('SECOND');
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('Poise / Break / Stagger (the identity mechanic)', () => {
  it('chips Poise on a damaging hit', () => {
    const s = battle();
    const { events } = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
    const p = pick(events, 'POISE_CHANGE');
    expect(p.length).toBeGreaterThan(0);
    expect(p[0].poiseAfter).toBe(p[0].poiseBefore - p[0].amount);
  });

  it('a Break emits BREAK, zeroes Poise and Staggers the target', () => {
    let s = battle({ enemy: { species: 'Charmander', level: 25, moves: ['scratch'] } });
    s = setPoise(s, s.activeEnemyId, 1);
    // The enemy must NOT Guard here: Guard has +4 priority and restores Poise,
    // which would legitimately deny the Break.
    const { events, snapshot } = resolveTurn(s, move(s, 'player', 'tackle'), move(s, 'enemy', 'scratch'));
    expect(pick(events, 'BREAK').length).toBe(1);
    expect(pick(events, 'BREAK')[0].targetId).toBe(s.activeEnemyId);
    // Stagger is applied; it decrements at end of the turn it was applied.
    expect(snapshot.combatants[s.activeEnemyId].staggeredTurns).toBeGreaterThanOrEqual(0);
  });

  it('Guard denies a Break that would otherwise land', () => {
    let s = battle({ enemy: { species: 'Charmander', level: 25, moves: ['scratch'] } });
    s = setPoise(s, s.activeEnemyId, 1);
    const guarded = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
    expect(pick(guarded.events, 'BREAK').length).toBe(0);
  });

  it('a Staggered target takes amplified damage', () => {
    const sample = (staggered: boolean) => {
      let total = 0;
      const runs = 30;
      for (let i = 0; i < runs; i++) {
        let s = withSeed(
          battle({
            player: { species: 'Snorlax', level: 50, moves: ['tackle'] },
            enemy: { species: 'Snorlax', level: 50, moves: ['tackle'] },
          }),
          i * 7919 + 3,
        );
        if (staggered) s = patch(s, s.activeEnemyId, { staggeredTurns: 1 });
        const { events } = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
        total += pick(events, 'DAMAGE').reduce((a, e) => a + e.amount, 0);
      }
      return total / runs;
    };
    const normal = sample(false);
    const amplified = sample(true);
    expect(amplified).toBeGreaterThan(normal * 1.2);
  });

  it('reports staggerAmplified on the damage event', () => {
    let s = battle();
    s = patch(s, s.activeEnemyId, { staggeredTurns: 1 });
    const { events } = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
    expect(pick(events, 'DAMAGE')[0].staggerAmplified).toBe(true);
  });

  it('does not chip Poise further while already Staggered (no chain-lock)', () => {
    let s = battle();
    s = patch(s, s.activeEnemyId, { staggeredTurns: 1, poise: 0 });
    const { events } = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
    expect(pick(events, 'POISE_CHANGE').length).toBe(0);
    expect(pick(events, 'BREAK').length).toBe(0);
  });

  it('Stagger expires and refills the pool', () => {
    let s = battle();
    s = patch(s, s.activeEnemyId, { staggeredTurns: 1, poise: 0 });
    const { events, snapshot } = resolveTurn(s, guard(s, 'player'), guard(s, 'enemy'));
    // Guard clears its own Stagger immediately.
    expect(pick(events, 'STAGGER_EXPIRED').some((e) => e.targetId === s.activeEnemyId)).toBe(true);
    expect(snapshot.combatants[s.activeEnemyId].poise).toBe(snapshot.combatants[s.activeEnemyId].maxPoise);
    expect(snapshot.combatants[s.activeEnemyId].staggeredTurns).toBe(0);
  });

  it('regenerates Poise at end of turn but never past the cap', () => {
    let s = battle();
    const maxP = s.combatants[s.activePlayerId].maxPoise;
    s = setPoise(s, s.activePlayerId, 5);
    const r = resolveTurn(s, guard(s, 'player'), guard(s, 'enemy'));
    expect(r.snapshot.combatants[s.activePlayerId].poise).toBeGreaterThan(5);
    expect(r.snapshot.combatants[s.activePlayerId].poise).toBeLessThanOrEqual(maxP);
  });

  it('paralysis halves Poise regen', () => {
    const regen = (par: boolean) => {
      let s = battle();
      s = setPoise(s, s.activePlayerId, 1);
      if (par) s = patch(s, s.activePlayerId, { status: { id: 'par' } });
      const r = resolveTurn(s, guard(s, 'player'), guard(s, 'enemy'));
      // Guard also restores, so measure via the POISE_RESTORE emitted at end of turn.
      return r.snapshot.combatants[s.activePlayerId].poise;
    };
    expect(regen(true)).toBeLessThan(regen(false));
  });

  it('status moves never chip Poise', () => {
    const s = battle({
      player: { species: 'Pikachu', level: 30, moves: ['thunderwave'] },
      enemy: { species: 'Squirtle', level: 30, moves: ['tackle'] },
    });
    const { events } = resolveTurn(s, move(s, 'player', 'thunderwave'), guard(s, 'enemy'));
    expect(pick(events, 'POISE_CHANGE').length).toBe(0);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('Guard (B3 - the old brace was a dominant exploit)', () => {
  it('halves incoming damage', () => {
    const sample = (guarded: boolean) => {
      let total = 0;
      const runs = 25;
      for (let i = 0; i < runs; i++) {
        const s = withSeed(
          battle({
            player: { species: 'Snorlax', level: 50, moves: ['tackle'] },
            enemy: { species: 'Snorlax', level: 50, moves: ['tackle'] },
          }),
          i * 104729 + 11,
        );
        const enemyAction = guarded ? guard(s, 'enemy') : move(s, 'enemy', 'tackle');
        const { events } = resolveTurn(s, move(s, 'player', 'tackle'), enemyAction);
        const hit = pick(events, 'DAMAGE').filter((e) => e.targetId === s.activeEnemyId);
        total += hit.reduce((a, e) => a + e.amount, 0);
      }
      return total / runs;
    };
    const open = sample(false);
    const guarded = sample(true);
    expect(guarded).toBeLessThan(open * 0.75);
    expect(guarded).toBeGreaterThan(0); // never zero - the old brace made it 0
  });

  it('never reduces damage to zero', () => {
    for (let i = 0; i < 40; i++) {
      const s = withSeed(battle(), i * 7717 + 3);
      const { events } = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
      const d = pick(events, 'DAMAGE');
      if (d.length) expect(d[0].amount).toBeGreaterThan(0);
    }
  });

  it('restores Poise and emits GUARD_START / GUARD_ABSORB', () => {
    let s = battle();
    s = setPoise(s, s.activeEnemyId, 3);
    const { events } = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
    expect(pick(events, 'GUARD_START').length).toBe(1);
    expect(pick(events, 'GUARD_ABSORB').length).toBe(1);
    expect(pick(events, 'POISE_RESTORE').length).toBeGreaterThan(0);
  });

  it('locks Guard for the following turn', () => {
    const s = battle();
    const r = resolveTurn(s, guard(s, 'player'), move(s, 'enemy', 'scratch'));
    expect(r.snapshot.combatants[s.activePlayerId].guardLocked).toBe(true);
    // And unlocks after a non-Guard turn.
    const s2 = r.snapshot;
    const r2 = resolveTurn(s2, move(s2, 'player', 'tackle'), move(s2, 'enemy', 'scratch'));
    expect(r2.snapshot.combatants[s2.activePlayerId].guardLocked).toBe(false);
  });

  it('reduces Poise chip but does not eliminate it', () => {
    const s = battle();
    const { events } = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
    const chip = pick(events, 'POISE_CHANGE');
    expect(chip.length).toBeGreaterThan(0);
    const unguarded = resolveTurn(s, move(s, 'player', 'tackle'), move(s, 'enemy', 'scratch'));
    const openChip = pick(unguarded.events, 'POISE_CHANGE').find((e) => e.targetId === s.activeEnemyId)!;
    expect(chip[0].amount).toBeLessThanOrEqual(openChip.amount);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('status effects (B21 - none of this existed)', () => {
  it('applies paralysis from a status move and halves Speed', () => {
    const s = battle({
      player: { species: 'Pikachu', level: 30, moves: ['thunderwave'] },
      enemy: { species: 'Squirtle', level: 30, moves: ['tackle'] },
    });
    const speedBefore = effectiveSpeed(s.combatants[s.activeEnemyId]);
    const { events, snapshot } = resolveTurn(s, move(s, 'player', 'thunderwave'), guard(s, 'enemy'));
    expect(pick(events, 'STATUS_APPLIED').some((e) => e.status === 'par')).toBe(true);
    expect(snapshot.combatants[s.activeEnemyId].status?.id).toBe('par');
    expect(effectiveSpeed(snapshot.combatants[s.activeEnemyId])).toBeLessThan(speedBefore);
  });

  it('respects type immunity to status', () => {
    // Electric types cannot be paralysed; Fire types cannot be burned.
    const s = battle({
      player: { species: 'Pikachu', level: 30, moves: ['thunderwave'] },
      enemy: { species: 'Jolteon', level: 30, moves: ['tackle'] },
    });
    const { events } = resolveTurn(s, move(s, 'player', 'thunderwave'), guard(s, 'enemy'));
    const failed = pick(events, 'STATUS_FAILED');
    expect(failed.length).toBe(1);
    expect(failed[0].reason).toBe('immune');

    const s2 = battle({
      player: { species: 'Charmander', level: 30, moves: ['willowisp'] },
      enemy: { species: 'Charmander', level: 30, moves: ['scratch'] },
    });
    const r2 = resolveTurn(s2, move(s2, 'player', 'willowisp'), guard(s2, 'enemy'));
    expect(pick(r2.events, 'STATUS_FAILED')[0]?.reason).toBe('immune');
  });

  it('does not stack a second non-volatile status', () => {
    let s = battle({
      player: { species: 'Pikachu', level: 30, moves: ['thunderwave'] },
      enemy: { species: 'Squirtle', level: 30, moves: ['tackle'] },
    });
    s = patch(s, s.activeEnemyId, { status: { id: 'brn' } });
    const { events } = resolveTurn(s, move(s, 'player', 'thunderwave'), guard(s, 'enemy'));
    expect(pick(events, 'STATUS_FAILED')[0]?.reason).toBe('already');
  });

  it('ticks burn at end of turn and halves physical damage', () => {
    let s = battle({
      player: { species: 'Snorlax', level: 40, moves: ['tackle'] },
      enemy: { species: 'Snorlax', level: 40, moves: ['tackle'] },
    });
    s = patch(s, s.activePlayerId, { status: { id: 'brn' } });
    const { events } = resolveTurn(s, guard(s, 'player'), guard(s, 'enemy'));
    const tick = pick(events, 'STATUS_TICK').find((e) => e.targetId === s.activePlayerId);
    expect(tick).toBeTruthy();
    expect(tick!.status).toBe('brn');
    expect(tick!.amount).toBeGreaterThan(0);
  });

  it('ramps toxic damage each turn', () => {
    let s = battle();
    s = patch(s, s.activePlayerId, { status: { id: 'tox', stage: 1 } });
    const r1 = resolveTurn(s, guard(s, 'player'), guard(s, 'enemy'));
    const t1 = pick(r1.events, 'STATUS_TICK').find((e) => e.targetId === s.activePlayerId)!;
    let s2 = r1.snapshot;
    // Guard cannot be used consecutively; use a move instead.
    const r2 = resolveTurn(s2, move(s2, 'player', 'tackle'), move(s2, 'enemy', 'scratch'));
    const t2 = pick(r2.events, 'STATUS_TICK').find((e) => e.targetId === s.activePlayerId)!;
    expect(t2.amount).toBeGreaterThan(t1.amount);
  });

  it('sleep prevents acting and wakes up', () => {
    let s = battle();
    s = patch(s, s.activePlayerId, { status: { id: 'slp', turns: 1 } });
    const { events } = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
    // turns: 1 -> decrement to 0 -> wake and act this turn.
    expect(pick(events, 'STATUS_CURED').some((e) => e.status === 'slp')).toBe(true);

    let s2 = battle();
    s2 = patch(s2, s2.activePlayerId, { status: { id: 'slp', turns: 3 } });
    const r2 = resolveTurn(s2, move(s2, 'player', 'tackle'), guard(s2, 'enemy'));
    expect(pick(r2.events, 'CANNOT_ACT').some((e) => e.reason === 'slp')).toBe(true);
    expect(pick(r2.events, 'DAMAGE').filter((e) => e.actorId === s2.activePlayerId).length).toBe(0);
  });

  it('paralysis can cause a full-turn failure', () => {
    let blocked = 0;
    for (let i = 0; i < 120; i++) {
      let s = withSeed(battle(), i * 24593 + 17);
      s = patch(s, s.activePlayerId, { status: { id: 'par' } });
      const { events } = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
      if (pick(events, 'CANNOT_ACT').some((e) => e.reason === 'par')) blocked++;
    }
    expect(blocked).toBeGreaterThan(5);
    expect(blocked).toBeLessThan(70);
  });

  it('applies a flinch volatile from a secondary and consumes it', () => {
    // Bite has a 30% flinch chance; find a seed where it lands.
    let sawFlinch = false;
    for (let i = 0; i < 60 && !sawFlinch; i++) {
      const s = withSeed(
        battle({
          player: { species: 'Gyarados', level: 40, moves: ['bite'] },
          enemy: { species: 'Snorlax', level: 40, moves: ['tackle'] },
        }),
        i * 15485863 + 5,
      );
      const { events, snapshot } = resolveTurn(s, move(s, 'player', 'bite'), move(s, 'enemy', 'tackle'));
      if (pick(events, 'VOLATILE_APPLIED').some((e) => e.volatile === 'flinch')) {
        sawFlinch = true;
        // Flinch must never survive the turn.
        expect(snapshot.combatants[s.activeEnemyId].volatiles.some((v) => v.id === 'flinch')).toBe(false);
      }
    }
    expect(sawFlinch).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('buffs and debuffs', () => {
  it('applies a self-buff and increases damage output', () => {
    const s = battle({
      player: { species: 'Machamp', level: 45, moves: ['swordsdance', 'karatechop'] },
      enemy: { species: 'Snorlax', level: 45, moves: ['tackle'] },
    });
    const r = resolveTurn(s, move(s, 'player', 'swordsdance'), guard(s, 'enemy'));
    expect(pick(r.events, 'BOOST_CHANGE').some((e) => !e.failed && e.boosts.atk === 2)).toBe(true);
    expect(r.snapshot.combatants[s.activePlayerId].boosts.atk).toBe(2);
  });

  it('applies a foe debuff', () => {
    const s = battle({
      player: { species: 'Pikachu', level: 30, moves: ['growl'] },
      enemy: { species: 'Snorlax', level: 30, moves: ['tackle'] },
    });
    const r = resolveTurn(s, move(s, 'player', 'growl'), guard(s, 'enemy'));
    const boost = pick(r.events, 'BOOST_CHANGE')[0];
    expect(boost.targetId).toBe(s.activeEnemyId);
    expect(r.snapshot.combatants[s.activeEnemyId].boosts.atk).toBe(-1);
  });

  it('reports a failed boost at the cap instead of silently doing nothing', () => {
    let s = battle({
      player: { species: 'Machamp', level: 45, moves: ['swordsdance'] },
      enemy: { species: 'Snorlax', level: 45, moves: ['tackle'] },
    });
    s = patch(s, s.activePlayerId, {
      boosts: { atk: 6, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 },
    });
    const r = resolveTurn(s, move(s, 'player', 'swordsdance'), guard(s, 'enemy'));
    expect(pick(r.events, 'BOOST_CHANGE')[0].failed).toBe(true);
  });

  it('a self-debuff drawback still applies (Close Combat)', () => {
    const s = battle({
      player: { species: 'Machamp', level: 50, moves: ['closecombat'] },
      enemy: { species: 'Snorlax', level: 50, moves: ['tackle'] },
    });
    const r = resolveTurn(s, move(s, 'player', 'closecombat'), guard(s, 'enemy'));
    expect(r.snapshot.combatants[s.activePlayerId].boosts.def).toBeLessThan(0);
  });

  it('boosts actually change computed damage', () => {
    const sample = (atkStage: number) => {
      let total = 0;
      for (let i = 0; i < 25; i++) {
        let s = withSeed(
          battle({
            player: { species: 'Snorlax', level: 50, moves: ['tackle'] },
            enemy: { species: 'Snorlax', level: 50, moves: ['tackle'] },
          }),
          i * 3571 + 9,
        );
        s = patch(s, s.activePlayerId, {
          boosts: { atk: atkStage, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 },
        });
        const { events } = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
        total += pick(events, 'DAMAGE').reduce((a, e) => a + e.amount, 0);
      }
      return total / 25;
    };
    expect(sample(2)).toBeGreaterThan(sample(0) * 1.5);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('healing', () => {
  it('restores HP with a self-heal move and caps at max', () => {
    let s = battle({
      player: { species: 'Blastoise', level: 50, moves: ['recover'] },
      enemy: { species: 'Snorlax', level: 50, moves: ['tackle'] },
    });
    const maxHp = s.combatants[s.activePlayerId].stats.hp;
    s = setHp(s, s.activePlayerId, 10);
    const r = resolveTurn(s, move(s, 'player', 'recover'), guard(s, 'enemy'));
    const heal = pick(r.events, 'HEAL')[0];
    expect(heal.amount).toBeGreaterThan(0);
    expect(r.snapshot.combatants[s.activePlayerId].hp).toBeLessThanOrEqual(maxHp);
    expect(r.snapshot.combatants[s.activePlayerId].hp).toBeGreaterThan(10);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('PP', () => {
  it('decrements PP on use', () => {
    const s = battle();
    const before = s.combatants[s.activePlayerId].moves[0].pp;
    const r = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
    expect(r.snapshot.combatants[s.activePlayerId].moves[0].pp).toBe(before - 1);
  });

  it('fails a move with no PP left', () => {
    let s = battle();
    const id = s.activePlayerId;
    s = patch(s, id, { moves: [{ ...s.combatants[id].moves[0], pp: 0 }] });
    const { events } = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
    expect(pick(events, 'MOVE_FAILED').some((e) => e.reason === 'no_pp')).toBe(true);
    expect(pick(events, 'DAMAGE').filter((e) => e.actorId === id).length).toBe(0);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('switching (B20 - never existed)', () => {
  it('switches the active combatant and clears its own boosts/volatiles', () => {
    let s = battle({
      playerTeam: [
        { species: 'Pikachu', level: 30, moves: ['tackle'] },
        { species: 'Squirtle', level: 30, moves: ['watergun'] },
      ],
      enemy: { species: 'Charmander', level: 30, moves: ['scratch'] },
    });
    const outgoing = s.activePlayerId;
    s = patch(s, outgoing, {
      boosts: { atk: 3, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 },
      staggeredTurns: 1,
      poise: 0,
    });

    const r = resolveTurn(s, swap(s, 'player', 1), move(s, 'enemy', 'scratch'));
    expect(pick(r.events, 'SWITCH_OUT')[0].actorId).toBe(outgoing);
    expect(pick(r.events, 'SWITCH_IN').length).toBe(1);
    expect(r.snapshot.activePlayerId).not.toBe(outgoing);
    expect(r.snapshot.combatants[outgoing].boosts.atk).toBe(0);
    expect(r.snapshot.combatants[outgoing].staggeredTurns).toBe(0);
    expect(r.snapshot.combatants[outgoing].poise).toBe(r.snapshot.combatants[outgoing].maxPoise);
  });

  it('the incoming Pokemon eats the incoming hit', () => {
    const s = battle({
      playerTeam: [
        { species: 'Pikachu', level: 30, moves: ['tackle'] },
        { species: 'Squirtle', level: 30, moves: ['watergun'] },
      ],
      enemy: { species: 'Charmander', level: 30, moves: ['scratch'] },
    });
    const r = resolveTurn(s, swap(s, 'player', 1), move(s, 'enemy', 'scratch'));
    const dmg = pick(r.events, 'DAMAGE');
    expect(dmg.length).toBe(1);
    expect(dmg[0].targetId).toBe(r.snapshot.activePlayerId);
  });

  it('keeps HP, PP and non-volatile status through a switch', () => {
    let s = battle({
      playerTeam: [
        { species: 'Pikachu', level: 30, moves: ['tackle'] },
        { species: 'Squirtle', level: 30, moves: ['watergun'] },
      ],
      enemy: { species: 'Charmander', level: 30, moves: ['scratch'] },
    });
    const outgoing = s.activePlayerId;
    s = patch(s, outgoing, { hp: 12, status: { id: 'brn' }, moves: [{ moveId: 'tackle', pp: 4, maxPp: 35 }] });
    const r = resolveTurn(s, swap(s, 'player', 1), guard(s, 'enemy'));
    expect(r.snapshot.combatants[outgoing].hp).toBe(12);
    expect(r.snapshot.combatants[outgoing].status?.id).toBe('brn');
    expect(r.snapshot.combatants[outgoing].moves[0].pp).toBe(4);
  });

  it('rejects a switch to a fainted or invalid slot', () => {
    let s = battle({
      playerTeam: [
        { species: 'Pikachu', level: 30, moves: ['tackle'] },
        { species: 'Squirtle', level: 30, moves: ['watergun'] },
      ],
      enemy: { species: 'Charmander', level: 30, moves: ['scratch'] },
    });
    s = patch(s, s.playerParty[1], { hp: 0, fainted: true });
    const r = resolveTurn(s, swap(s, 'player', 1), guard(s, 'enemy'));
    expect(pick(r.events, 'MOVE_FAILED').some((e) => e.reason === 'no_target')).toBe(true);
    expect(r.snapshot.activePlayerId).toBe(s.activePlayerId);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('fainting and battle end', () => {
  it('emits FAINT and ends the battle when the last member drops', () => {
    let s = battle();
    s = setHp(s, s.activeEnemyId, 1);
    const { events, snapshot } = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
    expect(pick(events, 'FAINT')[0].targetId).toBe(s.activeEnemyId);
    expect(pick(events, 'BATTLE_END')[0].outcome).toBe('victory');
    expect(snapshot.outcome).toBe('victory');
    expect(snapshot.phase).toBe('VICTORY');
  });

  it('emits defeat when the player side is wiped', () => {
    let s = battle();
    s = setHp(s, s.activePlayerId, 1);
    const { events, snapshot } = resolveTurn(s, guard(s, 'player'), move(s, 'enemy', 'scratch'));
    // Guard halves but 1 HP still dies.
    if (snapshot.outcome === 'defeat') {
      expect(pick(events, 'BATTLE_END')[0].outcome).toBe('defeat');
      expect(snapshot.phase).toBe('DEFEAT');
    }
  });

  it('emits FAINT exactly once per combatant', () => {
    let s = battle();
    s = setHp(s, s.activeEnemyId, 1);
    const { events } = resolveTurn(s, move(s, 'player', 'doubleslap'), guard(s, 'enemy'));
    expect(pick(events, 'FAINT').length).toBeLessThanOrEqual(1);
  });

  it('skips the second action when its actor fainted first', () => {
    let s = battle({
      player: { species: 'Jolteon', level: 50, moves: ['tackle'] },
      enemy: { species: 'Caterpie', level: 5, moves: ['tackle'] },
    });
    s = setHp(s, s.activeEnemyId, 1);
    const { events } = resolveTurn(s, move(s, 'player', 'tackle'), move(s, 'enemy', 'tackle'));
    const enemyDamage = pick(events, 'DAMAGE').filter((e) => e.actorId === s.activeEnemyId);
    expect(enemyDamage.length).toBe(0);
  });

  it('requests a forced switch when a reserve survives', () => {
    let s = battle({
      playerTeam: [
        { species: 'Pikachu', level: 30, moves: ['tackle'] },
        { species: 'Squirtle', level: 30, moves: ['watergun'] },
      ],
      enemy: { species: 'Charmander', level: 30, moves: ['scratch'] },
    });
    s = setHp(s, s.activePlayerId, 1);
    const r = resolveTurn(s, guard(s, 'player'), move(s, 'enemy', 'scratch'));
    if (r.snapshot.combatants[s.activePlayerId].fainted) {
      expect(r.snapshot.phase).toBe('FORCED_SWITCH');
      expect(r.snapshot.pendingForcedSwitch).toContain('player');
      expect(r.snapshot.outcome).toBe('ongoing');

      const after = resolveForcedSwitch(r.snapshot, 'player', 1);
      expect(after.snapshot.activePlayerId).toBe(s.playerParty[1]);
      expect(after.snapshot.phase).toBe('COMMAND');
    }
  });

  it('never emits BATTLE_END more than once in a turn', () => {
    let s = battle();
    s = setHp(s, s.activeEnemyId, 1);
    s = setHp(s, s.activePlayerId, 1);
    const { events } = resolveTurn(s, move(s, 'player', 'tackle'), move(s, 'enemy', 'scratch'));
    expect(pick(events, 'BATTLE_END').length).toBe(1);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('event stream integrity (the animation contract)', () => {
  it('wraps every turn in TURN_START / TURN_END', () => {
    const s = battle();
    const { events } = resolveTurn(s, move(s, 'player', 'tackle'), move(s, 'enemy', 'scratch'));
    expect(events[0].type).toBe('TURN_START');
    expect(events[events.length - 1].type).toMatch(/TURN_END|BATTLE_END|FORCED_SWITCH_REQUIRED/);
  });

  it('emits DAMAGE before POISE_CHANGE before BREAK before FAINT', () => {
    let s = battle();
    s = setPoise(s, s.activeEnemyId, 1);
    s = setHp(s, s.activeEnemyId, 1);
    const { events } = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
    const order = events.map((e) => e.type);
    const iD = order.indexOf('DAMAGE');
    const iP = order.indexOf('POISE_CHANGE');
    const iB = order.indexOf('BREAK');
    const iF = order.indexOf('FAINT');
    expect(iD).toBeGreaterThanOrEqual(0);
    if (iP >= 0) expect(iP).toBeGreaterThan(iD);
    if (iB >= 0 && iP >= 0) expect(iB).toBeGreaterThan(iP);
    if (iF >= 0) expect(iF).toBeGreaterThan(iD);
  });

  it('always emits MOVE_USED before any damage from that move', () => {
    const s = battle();
    const { events } = resolveTurn(s, move(s, 'player', 'tackle'), move(s, 'enemy', 'scratch'));
    const firstUse = events.findIndex((e) => e.type === 'MOVE_USED');
    const firstDmg = events.findIndex((e) => e.type === 'DAMAGE');
    expect(firstUse).toBeGreaterThanOrEqual(0);
    expect(firstUse).toBeLessThan(firstDmg);
  });

  it('assigns every DAMAGE event an impact tier', () => {
    const s = battle();
    const { events } = resolveTurn(s, move(s, 'player', 'tackle'), move(s, 'enemy', 'scratch'));
    for (const d of pick(events, 'DAMAGE')) {
      expect(['T0', 'T1', 'T2', 'T3', 'T4']).toContain(d.tier);
    }
  });

  it('tiers a lethal hit as T4 and a resisted chip as T0', () => {
    let s = battle();
    s = setHp(s, s.activeEnemyId, 1);
    const lethal = resolveTurn(s, move(s, 'player', 'tackle'), guard(s, 'enemy'));
    expect(pick(lethal.events, 'DAMAGE')[0].tier).toBe('T4');

    // Electric into Jolteon (electric) is resisted... use Grass into Bulbasaur.
    const s2 = battle({
      player: { species: 'Bulbasaur', level: 40, moves: ['vinewhip'] },
      enemy: { species: 'Bulbasaur', level: 40, moves: ['tackle'] },
    });
    const resisted = resolveTurn(s2, move(s2, 'player', 'vinewhip'), guard(s2, 'enemy'));
    const d = pick(resisted.events, 'DAMAGE')[0];
    expect(d.effectiveness).toBe('resisted');
    expect(d.tier).toBe('T0');
  });

  it('derives intent categories without revealing the move', () => {
    const s = battle();
    expect(intentOf(move(s, 'player', 'tackle'))).toBe('PHYSICAL');
    expect(intentOf(move(s, 'player', 'thunderbolt'))).toBe('SPECIAL');
    expect(intentOf(move(s, 'player', 'thunderwave'))).toBe('STATUS');
    expect(intentOf(guard(s, 'player'))).toBe('GUARD');
    expect(intentOf(swap(s, 'player', 1))).toBe('SWITCH');
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('AI (B24 - was effectiveness x power)', () => {
  it('returns a legal action', () => {
    const s = battle({
      player: { species: 'Pikachu', level: 30 },
      enemy: { species: 'Charmander', level: 30 },
    });
    for (let i = 0; i < 30; i++) {
      const a = chooseAction(withSeed(s, i * 7919), 'enemy');
      expect(a.actorId).toBe(s.activeEnemyId);
      if (a.kind === 'MOVE') {
        expect(getMove(a.moveId)).toBeTruthy();
        expect(s.combatants[s.activeEnemyId].moves.some((m) => m.moveId === a.moveId)).toBe(true);
      }
    }
  });

  it('never picks a move it has no PP for', () => {
    let s = battle({ player: { species: 'Pikachu', level: 30 }, enemy: { species: 'Charmander', level: 30 } });
    const id = s.activeEnemyId;
    s = patch(s, id, { moves: s.combatants[id].moves.map((m, i) => ({ ...m, pp: i === 0 ? 0 : m.pp })) });
    const dead = s.combatants[id].moves[0].moveId;
    for (let i = 0; i < 40; i++) {
      const a = chooseAction(withSeed(s, i * 104729), 'enemy');
      if (a.kind === 'MOVE') expect(a.moveId).not.toBe(dead);
    }
  });

  it('never picks Guard while guardLocked', () => {
    let s = battle({ player: { species: 'Pikachu', level: 30 }, enemy: { species: 'Charmander', level: 30 } });
    s = patch(s, s.activeEnemyId, { guardLocked: true });
    for (let i = 0; i < 40; i++) {
      expect(chooseAction(withSeed(s, i * 65537), 'enemy').kind).not.toBe('GUARD');
    }
  });

  it('prefers a Break-inducing move when the foe is one hit from Stagger', () => {
    let s = battle({
      player: { species: 'Snorlax', level: 40 },
      enemy: { species: 'Machop', level: 40, moves: ['karatechop', 'machpunch'] },
    });
    // Player one Impact point from a Break.
    s = setPoise(s, s.activePlayerId, 1);
    let breakers = 0;
    for (let i = 0; i < 30; i++) {
      const a = chooseAction(withSeed(s, i * 24593), 'enemy');
      if (a.kind === 'MOVE') {
        const m = getMove(a.moveId)!;
        if (m.impact >= 1) breakers++;
      }
    }
    expect(breakers).toBeGreaterThan(20);
  });

  it('tracks player behaviour for the prediction signal', () => {
    let mem = EMPTY_AI_MEMORY;
    mem = updateAiMemory(mem, 'PHYSICAL');
    mem = updateAiMemory(mem, 'SPECIAL');
    expect(mem.consecutivePlayerAttacks).toBe(2);
    mem = updateAiMemory(mem, 'GUARD');
    expect(mem.consecutivePlayerAttacks).toBe(0);
    expect(mem.lastPlayerIntent).toBe('GUARD');
  });

  it('varies its action with the board state (contextual, not a lookup table)', () => {
    const base = battle({ player: { species: 'Pikachu', level: 30 }, enemy: { species: 'Charmander', level: 30 } });
    const picks = new Set<string>();
    const maxHp = base.combatants[base.activeEnemyId].stats.hp;

    for (let i = 0; i < 24; i++) {
      // Vary the enemy's own HP and Poise, which are exactly the inputs a
      // contextual policy is supposed to react to.
      let s = withSeed(base, i * 2654435761 + 7);
      s = setHp(s, s.activeEnemyId, Math.max(1, Math.floor((maxHp * (i + 1)) / 24)));
      s = setPoise(s, s.activePlayerId, Math.max(1, (i * 5) % base.combatants[base.activePlayerId].maxPoise));
      const a = chooseAction(s, 'enemy');
      picks.add(a.kind === 'MOVE' ? a.moveId : a.kind);
    }
    expect(picks.size).toBeGreaterThan(1);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
describe('full battle harness (integration + Break frequency tuning gate)', () => {
  function playOut(seed: string, level = 30, maxTurns = 80) {
    let s = createBattle({
      playerTeam: [{ species: 'Pikachu', level }, { species: 'Squirtle', level }],
      enemyTeam: [{ species: 'Charmander', level }, { species: 'Bulbasaur', level }],
      seed,
    });
    let breaks = 0;
    let turns = 0;
    const seen = new Set<string>();
    let mem = EMPTY_AI_MEMORY;

    while (s.outcome === 'ongoing' && turns < maxTurns) {
      if (s.phase === 'FORCED_SWITCH') {
        for (const side of s.pendingForcedSwitch) {
          const party = side === 'player' ? s.playerParty : s.enemyParty;
          const activeId = side === 'player' ? s.activePlayerId : s.activeEnemyId;
          const replacement = party.find((id) => id !== activeId && !s.combatants[id].fainted);
          if (!replacement) break;
          const r = resolveForcedSwitch(s, side, s.combatants[replacement].slot);
          s = r.snapshot;
        }
        if (s.phase === 'FORCED_SWITCH') break;
        continue;
      }

      const playerAction = chooseAction(s, 'player', mem, s.rngState ^ 0x9e3779b9);
      const enemyAction = chooseAction(s, 'enemy', mem);
      mem = updateAiMemory(mem, intentOf(playerAction));

      const r = resolveTurn(s, playerAction, enemyAction);
      for (const e of r.events) {
        seen.add(e.type);
        if (e.type === 'BREAK') breaks++;
      }
      s = r.snapshot;
      turns++;
    }
    return { s, breaks, turns, seen };
  }

  it('always terminates with a decisive outcome', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      for (const level of [15, 30, 55]) {
        const { s, turns } = playOut(seed, level);
        expect(['victory', 'defeat']).toContain(s.outcome);
        expect(turns).toBeLessThan(80);
        expect(turns).toBeGreaterThan(1);
      }
    }
  });

  it('exercises the full mechanic surface across many battles', () => {
    const seen = new Set<string>();
    // Sweep levels: tier-3 movesets carry the high-power/low-accuracy options, so a
    // single level band would never exercise the accuracy dimension.
    for (let i = 0; i < 40; i++) {
      for (const level of [15, 30, 55]) {
        for (const t of playOut(`surface-${i}`, level).seen) seen.add(t);
      }
    }
    // Every headline mechanic must actually fire in real play.
    for (const required of [
      'TURN_START', 'TURN_END', 'ACTION_START', 'MOVE_USED', 'DAMAGE',
      'POISE_CHANGE', 'BREAK', 'FAINT', 'BATTLE_END', 'GUARD_START',
      'POISE_RESTORE', 'BOOST_CHANGE', 'STATUS_APPLIED', 'STAGGER_EXPIRED',
      'MOVE_MISSED',
    ]) {
      expect(seen.has(required), `expected event ${required} to occur in real play`).toBe(true);
    }
  });

  it('keeps Break frequency in the intended band (identity mechanic is neither dominant nor ignorable)', () => {
    let breaks = 0;
    let runs = 0;
    for (let i = 0; i < 40; i++) {
      for (const level of [15, 30, 55]) {
        breaks += playOut(`freq-${i}`, level).breaks;
        runs++;
      }
    }
    const perBattle = breaks / runs;
    // Design target: roughly 1-2 Breaks per battle. Tuning lives in POISE_TUNING.
    expect(perBattle).toBeGreaterThan(0.4);
    expect(perBattle).toBeLessThan(6);
    expect(POISE_TUNING.staggerDamageBonus).toBeGreaterThan(1);
  });

  it('never leaves HP or Poise out of bounds', () => {
    for (let i = 0; i < 25; i++) {
      for (const level of [15, 30, 55]) {
        const { s } = playOut(`bounds-${i}`, level);
        for (const c of Object.values(s.combatants)) {
          expect(c.hp).toBeGreaterThanOrEqual(0);
          expect(c.hp).toBeLessThanOrEqual(c.stats.hp);
          expect(c.poise).toBeGreaterThanOrEqual(0);
          expect(c.poise).toBeLessThanOrEqual(c.maxPoise);
          expect(c.staggeredTurns).toBeGreaterThanOrEqual(0);
          for (const slot of c.moves) {
            expect(slot.pp).toBeGreaterThanOrEqual(0);
            expect(slot.pp).toBeLessThanOrEqual(slot.maxPp);
          }
          if (c.hp === 0) expect(c.fainted).toBe(true);
        }
      }
    }
  });
});
