import { describe, expect, it } from 'vitest';
import {
  TYPES,
} from '../../data/pokemon/types';
import { effectiveness, classifyEffectiveness } from '../engine/typeChart';
import {
  getMove,
  requireMove,
  allMoveRuntimes,
  moveSlug,
  deriveImpact,
} from '../engine/moveRegistry';
import { computeHp, computeStat, boostMultiplier, applyBoosts } from '../engine/stats';
import { buildMoveset, createBattle, createCombatant } from '../engine/battleFactory';
import { getSpeciesByName } from '../../data/pokemon/species';
import { computeMaxPoise } from '../engine/poise';

// ───────────────────────────────────────────────────────────────────────────────
// N1 - the corrected type chart. The live data/pokemon/types.ts implementation is
// doubly-inverted: it indexes the attacker's damageTaken by the defender AND maps
// 2->x2 / 1->x0.5. The two errors cancel for reciprocal pairs but break every
// immunity and asymmetric matchup. These are the exact cases that regressed.
// ───────────────────────────────────────────────────────────────────────────────
describe('typeChart', () => {
  it('has a row for all 18 types', () => {
    expect(TYPES).toHaveLength(18);
  });

  it('resolves immunities to 0 (the cases the old code got wrong)', () => {
    expect(effectiveness('psychic', ['dark'])).toBe(0);
    expect(effectiveness('electric', ['ground'])).toBe(0);
    expect(effectiveness('normal', ['ghost'])).toBe(0);
    expect(effectiveness('ghost', ['normal'])).toBe(0);
    expect(effectiveness('poison', ['steel'])).toBe(0);
    expect(effectiveness('dragon', ['fairy'])).toBe(0);
    expect(effectiveness('ground', ['flying'])).toBe(0);
    expect(effectiveness('fighting', ['ghost'])).toBe(0);
  });

  it('resolves asymmetric super-effective matchups to 2', () => {
    expect(effectiveness('dark', ['psychic'])).toBe(2);
    expect(effectiveness('ground', ['electric'])).toBe(2);
    expect(effectiveness('fighting', ['normal'])).toBe(2);
    expect(effectiveness('fairy', ['dragon'])).toBe(2);
    expect(effectiveness('flying', ['fighting'])).toBe(2);
    expect(effectiveness('steel', ['fairy'])).toBe(2);
  });

  it('resolves the fire/water/grass triangle', () => {
    expect(effectiveness('fire', ['grass'])).toBe(2);
    expect(effectiveness('grass', ['water'])).toBe(2);
    expect(effectiveness('water', ['fire'])).toBe(2);
    expect(effectiveness('fire', ['water'])).toBe(0.5);
    expect(effectiveness('grass', ['fire'])).toBe(0.5);
    expect(effectiveness('water', ['grass'])).toBe(0.5);
  });

  it('stacks dual types multiplicatively', () => {
    // Rock hits Charizard (fire/flying) for x4.
    expect(effectiveness('rock', ['fire', 'flying'])).toBe(4);
    // Grass into Bulbasaur (grass/poison) is x0.25.
    expect(effectiveness('grass', ['grass', 'poison'])).toBe(0.25);
    // Electric into Gyarados (water/flying) is x4.
    expect(effectiveness('electric', ['water', 'flying'])).toBe(4);
    // Ground into Gengar (ghost/poison): ground x0.5 vs poison? poison is weak to
    // ground, ghost is neutral -> x2.
    expect(effectiveness('ground', ['ghost', 'poison'])).toBe(2);
    // An immunity in either slot zeroes the whole thing.
    expect(effectiveness('normal', ['ghost', 'poison'])).toBe(0);
  });

  it('only ever produces canonical multipliers across the full 18x18 matrix', () => {
    const legal = new Set([0, 0.25, 0.5, 1, 2, 4]);
    const names = TYPES.map((t) => t.name);
    let superCount = 0;
    let immuneCount = 0;

    for (const atk of names) {
      for (const def of names) {
        const m = effectiveness(atk, [def]);
        expect(legal.has(m)).toBe(true);
        if (m === 2) superCount++;
        if (m === 0) immuneCount++;
      }
    }

    // Gen 6+ chart has exactly 8 type-level immunities:
    // ghost<-normal, ghost<-fighting, normal<-ghost, ground<-electric,
    // flying<-ground, steel<-poison, dark<-psychic, fairy<-dragon.
    expect(immuneCount).toBe(8);
    expect(superCount).toBeGreaterThan(50);
  });

  it('classifies buckets', () => {
    expect(classifyEffectiveness(0)).toBe('immune');
    expect(classifyEffectiveness(0.25)).toBe('resisted');
    expect(classifyEffectiveness(1)).toBe('neutral');
    expect(classifyEffectiveness(4)).toBe('super');
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// N2 / N3 - move lookup and the basePower field.
// ───────────────────────────────────────────────────────────────────────────────
describe('moveRegistry', () => {
  it('resolves the four moves that silently failed in the legacy system (N2)', () => {
    // App.tsx used these spaceless keys; MOVES_BY_NAME is keyed "quick attack",
    // so all four fell through to a Normal-type 40-power stub.
    const quick = requireMove('quickattack');
    expect(quick.name).toBe('Quick Attack');
    expect(quick.type).toBe('normal');
    expect(quick.priority).toBe(1);

    const shock = requireMove('thundershock');
    expect(shock.name).toBe('Thunder Shock');
    expect(shock.type).toBe('electric');
    expect(shock.category).toBe('special');

    const gun = requireMove('watergun');
    expect(gun.type).toBe('water');

    const whip = requireMove('vinewhip');
    expect(whip.type).toBe('grass');
    expect(whip.category).toBe('physical');
  });

  it('accepts every spelling of a move id', () => {
    const ids = ['quickattack', 'quick attack', 'Quick Attack', 'quick-attack', 'QUICKATTACK'];
    const resolved = ids.map((i) => requireMove(i).id);
    expect(new Set(resolved).size).toBe(1);
  });

  it('reads real base power, not undefined||40 (N3)', () => {
    expect(requireMove('tackle').basePower).toBe(40);
    expect(requireMove('flamethrower').basePower).toBe(90);
    expect(requireMove('hyperbeam').basePower).toBe(150);
    expect(requireMove('earthquake').basePower).toBe(100);
    expect(requireMove('closecombat').basePower).toBe(120);
    expect(requireMove('swordsdance').basePower).toBe(0);

    // The legacy bug made every one of these 40.
    const powers = ['tackle', 'flamethrower', 'hyperbeam', 'earthquake'].map(
      (m) => requireMove(m).basePower,
    );
    expect(new Set(powers).size).toBe(4);
  });

  it('normalises accuracy: -1 means never misses', () => {
    expect(requireMove('swift').accuracy).toBeNull();
    expect(requireMove('aerialace').accuracy).toBeNull();
    expect(requireMove('flamethrower').accuracy).toBe(100);
    expect(requireMove('thunder').accuracy).toBe(70);
    expect(requireMove('willowisp').accuracy).toBe(85);
  });

  it('parses primary stat changes from shortDesc', () => {
    const sd = requireMove('swordsdance');
    expect(sd.primary.boosts).toEqual({ target: 'self', boosts: { atk: 2 }, chance: 100 });

    const growl = requireMove('growl');
    expect(growl.primary.boosts).toEqual({ target: 'foe', boosts: { atk: -1 }, chance: 100 });

    const cm = requireMove('calmmind');
    expect(cm.primary.boosts?.target).toBe('self');
    expect(cm.primary.boosts?.boosts.spa).toBe(1);
    expect(cm.primary.boosts?.boosts.spd).toBe(1);

    const cc = requireMove('closecombat');
    expect(cc.primary.boosts?.target).toBe('self');
    expect(cc.primary.boosts?.boosts.def).toBe(-1);
  });

  it('parses primary status from shortDesc', () => {
    expect(requireMove('thunderwave').primary.status).toEqual({ target: 'foe', status: 'par', chance: 100 });
    expect(requireMove('willowisp').primary.status).toEqual({ target: 'foe', status: 'brn', chance: 100 });
    expect(requireMove('toxic').primary.status?.status).toBe('tox');
    expect(requireMove('sleeppowder').primary.status?.status).toBe('slp');
    expect(requireMove('confuseray').primary.status?.volatile).toBe('confusion');
  });

  it('parses heal, drain, recoil and multi-hit', () => {
    expect(requireMove('recover').heal).toBeCloseTo(0.5);
    expect(requireMove('gigadrain').drain).toBeCloseTo(0.5);
    expect(requireMove('doubleedge').recoil).toBeCloseTo(0.33);
    expect(requireMove('doubleslap').hits).toEqual([2, 5]);
    expect(requireMove('doublekick').hits).toEqual([2, 2]);
  });

  it('reads structured secondary effects', () => {
    const bite = requireMove('bite');
    expect(bite.secondary.status?.volatile).toBe('flinch');
    expect(bite.secondary.status?.chance).toBe(30);

    const bolt = requireMove('thunderbolt');
    expect(bolt.secondary.status?.status).toBe('par');
    expect(bolt.secondary.status?.chance).toBe(10);
  });

  it('reads crit stage from critRatio', () => {
    expect(requireMove('tackle').critStage).toBe(0);
    expect(requireMove('slash').critStage).toBeGreaterThan(0);
    expect(requireMove('razorleaf').critStage).toBeGreaterThan(0);
  });

  it('derives Impact anti-correlated with base power', () => {
    const quick = requireMove('quickattack');
    const beam = requireMove('hyperbeam');
    const thunderbolt = requireMove('thunderbolt');
    const tackle = requireMove('tackle');
    const machPunch = requireMove('machpunch');

    // Fast contact jabs are the best stance breakers.
    expect(quick.impact).toBeGreaterThan(tackle.impact);
    expect(machPunch.impact).toBeGreaterThan(thunderbolt.impact);
    // Heavy nukes are the worst.
    expect(beam.impact).toBeLessThan(quick.impact);
    expect(beam.impact).toBeLessThan(tackle.impact);
    // Damage and Impact must not be the same ranking.
    expect(beam.basePower).toBeGreaterThan(quick.basePower);
    expect(beam.impact).toBeLessThan(quick.impact);
    // Status moves never chip Poise.
    expect(requireMove('swordsdance').impact).toBe(0);
    expect(requireMove('thunderwave').impact).toBe(0);
  });

  it('never returns an Impact below the floor for a damaging move', () => {
    for (const move of allMoveRuntimes()) {
      if (move.category === 'status') expect(move.impact).toBe(0);
      else expect(move.impact).toBeGreaterThanOrEqual(2);
    }
  });

  it('builds every move in the dataset without throwing', () => {
    const all = allMoveRuntimes();
    expect(all.length).toBeGreaterThan(800);
    for (const m of all) {
      expect(m.id).toBe(moveSlug(m.name));
      expect(Number.isFinite(m.basePower)).toBe(true);
      expect(Number.isFinite(m.maxPp)).toBe(true);
      expect(m.maxPp).toBeGreaterThan(0);
    }
  });

  it('deriveImpact scales down for multi-hit', () => {
    const single = deriveImpact(
      { category: 'physical', power: 15, flags: { contact: 1 } } as never,
      undefined,
      0,
    );
    const multi = deriveImpact(
      { category: 'physical', power: 15, flags: { contact: 1 } } as never,
      [2, 5],
      0,
    );
    expect(multi).toBeLessThan(single);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// B22 - computed stats. Levels must matter.
// ───────────────────────────────────────────────────────────────────────────────
describe('stats', () => {
  it('scales HP and stats with level', () => {
    expect(computeHp(39, 5)).toBeLessThan(computeHp(39, 50));
    expect(computeHp(39, 50)).toBeLessThan(computeHp(39, 100));
    expect(computeStat(52, 10)).toBeLessThan(computeStat(52, 100));
    // A Lv100 Charmander must massively out-stat a Lv10 one (the legacy bug).
    expect(computeStat(52, 100) / computeStat(52, 10)).toBeGreaterThan(4);
  });

  it('applies canonical boost multipliers', () => {
    expect(boostMultiplier(0)).toBe(1);
    expect(boostMultiplier(1)).toBe(1.5);
    expect(boostMultiplier(2)).toBe(2);
    expect(boostMultiplier(6)).toBe(4);
    expect(boostMultiplier(-1)).toBeCloseTo(2 / 3);
    expect(boostMultiplier(-6)).toBeCloseTo(0.25);
    // Clamped.
    expect(boostMultiplier(99)).toBe(4);
    expect(boostMultiplier(-99)).toBeCloseTo(0.25);
  });

  it('reports a failed boost at the cap', () => {
    const at6 = { atk: 6, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
    const r = applyBoosts(at6, { atk: 1 });
    expect(r.anyApplied).toBe(false);
    expect(r.next.atk).toBe(6);

    const r2 = applyBoosts(at6, { def: 2 });
    expect(r2.anyApplied).toBe(true);
    expect(r2.next.def).toBe(2);
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// Moveset generation - four distinct strategic roles for any species.
// ───────────────────────────────────────────────────────────────────────────────
describe('battleFactory', () => {
  it('gives every one of the 18 type pools resolvable moves', () => {
    const names = TYPES.map((t) => t.name);
    for (const type of names) {
      const species = getSpeciesByName(
        { normal: 'Snorlax', fire: 'Charmander', water: 'Squirtle', grass: 'Bulbasaur',
          electric: 'Pikachu', ice: 'Lapras', fighting: 'Machop', poison: 'Ekans',
          ground: 'Sandshrew', flying: 'Pidgey', psychic: 'Abra', bug: 'Caterpie',
          rock: 'Geodude', ghost: 'Gastly', dragon: 'Dratini', dark: 'Umbreon',
          steel: 'Magnemite', fairy: 'Clefairy' }[type] as string,
      );
      expect(species, `species fixture for ${type}`).toBeTruthy();
      const moves = buildMoveset(species!, 30);
      expect(moves.length, `${type} moveset size`).toBe(4);
      for (const slot of moves) expect(getMove(slot.moveId), `${type}:${slot.moveId}`).toBeTruthy();
      expect(new Set(moves.map((m) => m.moveId)).size).toBe(4);
    }
  });

  it('produces movesets spanning more than one role', () => {
    const pika = getSpeciesByName('Pikachu')!;
    const moves = buildMoveset(pika, 30).map((s) => getMove(s.moveId)!);
    // Not all four moves can be the same category, and not all can be max power.
    const categories = new Set(moves.map((m) => m.category));
    expect(categories.size).toBeGreaterThan(1);
    const impacts = new Set(moves.map((m) => m.impact));
    expect(impacts.size).toBeGreaterThan(1);
  });

  it('builds every species without throwing', () => {
    const sample = ['Pikachu', 'Charizard', 'Gyarados', 'Rayquaza', 'Gengar', 'Magnemite', 'Clefairy', 'Snorlax'];
    for (const name of sample) {
      const c = createCombatant({ species: name, level: 40 }, 'player', 0);
      expect(c.hp).toBeGreaterThan(0);
      expect(c.hp).toBe(c.stats.hp);
      expect(c.maxPoise).toBe(computeMaxPoise(c.stats.def, c.stats.spd));
      expect(c.poise).toBe(c.maxPoise);
      expect(c.moves.length).toBeGreaterThan(0);
    }
  });

  it('scales Poise with bulk', () => {
    const snorlax = createCombatant({ species: 'Snorlax', level: 50 }, 'player', 0);
    const abra = createCombatant({ species: 'Abra', level: 50 }, 'enemy', 0);
    expect(snorlax.maxPoise).toBeGreaterThan(abra.maxPoise);
  });

  it('honours an explicit moveset', () => {
    const c = createCombatant(
      { species: 'Pikachu', level: 20, moves: ['thundershock', 'quickattack', 'thunderwave'] },
      'player',
      0,
    );
    expect(c.moves.map((m) => m.moveId)).toEqual(['thundershock', 'quickattack', 'thunderwave']);
  });

  it('creates a deterministic snapshot from a seed', () => {
    const setup = { playerTeam: [{ species: 'Pikachu', level: 15 }], enemyTeam: [{ species: 'Charmander', level: 15 }], seed: 'test' };
    const a = createBattle(setup);
    const b = createBattle(setup);
    expect(a.rngState).toBe(b.rngState);
    expect(a.phase).toBe('BATTLE_START');
    expect(a.outcome).toBe('ongoing');
    expect(a.activePlayerId).toBe(a.playerParty[0]);
  });
});
