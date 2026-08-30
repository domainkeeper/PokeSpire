/**
 * Snapshot construction. PURE.
 *
 * The species dataset carries no learnsets, so movesets are assembled from a bounded,
 * type-indexed pool. Every entry is chosen so that a generated set spans four
 * different strategic roles rather than four damage numbers:
 *
 *   1. STAB    - primary damage, scaled to level
 *   2. COVERAGE- answers what STAB cannot hit
 *   3. BREAKER - low power, high Impact (priority/contact) to buy a Stagger
 *   4. UTILITY - status, debuff, setup or recovery
 *
 * That is what makes "pick the highest damage move" wrong from turn one.
 */

import { getSpeciesById, getSpeciesByName } from '../../data/pokemon/species';
import type { PokemonSpeciesData, PokemonType } from '../../data/pokemon/schemas/index';
import type {
  BattleCombatant,
  BattleSnapshot,
  CombatantId,
  MoveSlot,
  Side,
  StatSpread,
} from './battleTypes';
import { getMove, moveSlug } from './moveRegistry';
import { computeMaxPoise } from './poise';
import { seedFromString } from './rng';
import { computeStats } from './stats';

// ─── Move pools ─────────────────────────────────────────────────────────────
interface MovePool {
  /** Ordered low -> high power. */
  physical: string[];
  special: string[];
  /** Low power, high Impact: priority or contact. Stance breakers. */
  breaker: string[];
  /** Status, debuff, setup or recovery. */
  utility: string[];
}

const TYPE_POOLS: Record<PokemonType, MovePool> = {
  normal: {
    physical: ['Tackle', 'Headbutt', 'Body Slam', 'Double-Edge'],
    special: ['Swift', 'Swift', 'Hyper Voice', 'Hyper Beam'],
    breaker: ['Quick Attack', 'Fake Out'],
    utility: ['Growl', 'Screech', 'Swords Dance', 'Work Up'],
  },
  fire: {
    physical: ['Fire Punch', 'Fire Punch', 'Flare Blitz', 'Flare Blitz'],
    special: ['Ember', 'Flamethrower', 'Flamethrower', 'Fire Blast'],
    breaker: ['Flame Charge', 'Fire Punch'],
    utility: ['Will-O-Wisp', 'Will-O-Wisp', 'Nasty Plot'],
  },
  water: {
    physical: ['Aqua Jet', 'Waterfall', 'Waterfall', 'Liquidation'],
    special: ['Water Gun', 'Bubble Beam', 'Surf', 'Hydro Pump'],
    breaker: ['Aqua Jet', 'Waterfall'],
    utility: ['Scald', 'Bubble Beam', 'Calm Mind'],
  },
  grass: {
    physical: ['Vine Whip', 'Razor Leaf', 'Seed Bomb', 'Leaf Blade'],
    special: ['Absorb', 'Mega Drain', 'Giga Drain', 'Energy Ball'],
    breaker: ['Vine Whip', 'Razor Leaf'],
    utility: ['Sleep Powder', 'Leech Seed', 'Growth'],
  },
  electric: {
    physical: ['Nuzzle', 'Thunder Punch', 'Thunder Punch', 'Wild Charge'],
    special: ['Thunder Shock', 'Charge Beam', 'Thunderbolt', 'Thunder'],
    breaker: ['Nuzzle', 'Thunder Punch'],
    utility: ['Thunder Wave', 'Thunder Wave', 'Charge Beam'],
  },
  ice: {
    physical: ['Ice Shard', 'Ice Punch', 'Ice Punch', 'Icicle Crash'],
    special: ['Powder Snow', 'Aurora Beam', 'Ice Beam', 'Blizzard'],
    breaker: ['Ice Shard', 'Ice Punch'],
    utility: ['Icy Wind', 'Aurora Beam', 'Mist'],
  },
  fighting: {
    physical: ['Karate Chop', 'Brick Break', 'Brick Break', 'Close Combat'],
    special: ['Vacuum Wave', 'Aura Sphere', 'Aura Sphere', 'Focus Blast'],
    breaker: ['Mach Punch', 'Karate Chop'],
    utility: ['Bulk Up', 'Bulk Up', 'Low Sweep'],
  },
  poison: {
    physical: ['Poison Sting', 'Poison Jab', 'Poison Jab', 'Gunk Shot'],
    special: ['Acid', 'Sludge', 'Sludge Bomb', 'Sludge Wave'],
    breaker: ['Poison Sting', 'Poison Jab'],
    utility: ['Toxic', 'Toxic', 'Acid Armor'],
  },
  ground: {
    physical: ['Mud Shot', 'Bulldoze', 'Dig', 'Earthquake'],
    special: ['Mud-Slap', 'Mud Shot', 'Earth Power', 'Earth Power'],
    breaker: ['Bulldoze', 'Mud Shot'],
    utility: ['Mud-Slap', 'Sand Attack', 'Bulldoze'],
  },
  flying: {
    physical: ['Peck', 'Wing Attack', 'Aerial Ace', 'Brave Bird'],
    special: ['Gust', 'Air Cutter', 'Air Slash', 'Hurricane'],
    breaker: ['Peck', 'Wing Attack'],
    utility: ['Roost', 'Air Slash', 'Agility'],
  },
  psychic: {
    physical: ['Zen Headbutt', 'Zen Headbutt', 'Psycho Cut', 'Psycho Cut'],
    special: ['Confusion', 'Psybeam', 'Psyshock', 'Psychic'],
    breaker: ['Zen Headbutt', 'Psycho Cut'],
    utility: ['Hypnosis', 'Calm Mind', 'Psybeam'],
  },
  bug: {
    physical: ['Bug Bite', 'Bug Bite', 'X-Scissor', 'Megahorn'],
    special: ['Struggle Bug', 'Silver Wind', 'Bug Buzz', 'Bug Buzz'],
    breaker: ['Bug Bite', 'Struggle Bug'],
    utility: ['String Shot', 'Struggle Bug', 'Silver Wind'],
  },
  rock: {
    physical: ['Rock Throw', 'Rock Tomb', 'Rock Slide', 'Stone Edge'],
    special: ['Ancient Power', 'Ancient Power', 'Power Gem', 'Power Gem'],
    breaker: ['Rock Throw', 'Rock Tomb'],
    utility: ['Rock Tomb', 'Iron Defense', 'Rock Polish'],
  },
  ghost: {
    physical: ['Shadow Sneak', 'Shadow Claw', 'Shadow Claw', 'Phantom Force'],
    special: ['Astonish', 'Hex', 'Shadow Ball', 'Shadow Ball'],
    breaker: ['Shadow Sneak', 'Astonish'],
    utility: ['Confuse Ray', 'Confuse Ray', 'Nasty Plot'],
  },
  dragon: {
    physical: ['Dragon Tail', 'Dragon Claw', 'Dragon Claw', 'Outrage'],
    special: ['Dragon Breath', 'Dragon Pulse', 'Dragon Pulse', 'Draco Meteor'],
    breaker: ['Dragon Tail', 'Dragon Claw'],
    utility: ['Dragon Dance', 'Dragon Breath', 'Dragon Dance'],
  },
  dark: {
    physical: ['Bite', 'Bite', 'Crunch', 'Crunch'],
    special: ['Snarl', 'Snarl', 'Dark Pulse', 'Dark Pulse'],
    breaker: ['Sucker Punch', 'Bite'],
    utility: ['Snarl', 'Torment', 'Nasty Plot'],
  },
  steel: {
    physical: ['Metal Claw', 'Metal Claw', 'Iron Head', 'Iron Head'],
    special: ['Mirror Shot', 'Flash Cannon', 'Flash Cannon', 'Flash Cannon'],
    breaker: ['Bullet Punch', 'Metal Claw'],
    utility: ['Iron Defense', 'Metal Sound', 'Iron Defense'],
  },
  fairy: {
    physical: ['Play Rough', 'Play Rough', 'Play Rough', 'Play Rough'],
    special: ['Fairy Wind', 'Draining Kiss', 'Dazzling Gleam', 'Moonblast'],
    breaker: ['Fairy Wind', 'Play Rough'],
    utility: ['Charm', 'Charm', 'Moonlight'],
  },
};

/** Used whenever a pooled name fails to resolve. All verified to exist. */
const UNIVERSAL_FALLBACK = ['Tackle', 'Quick Attack', 'Growl', 'Leer', 'Swift', 'Screech'];

function levelTier(level: number): number {
  if (level < 15) return 0;
  if (level < 30) return 1;
  if (level < 45) return 2;
  return 3;
}

function pickResolvable(candidates: string[], used: Set<string>): string | null {
  for (const name of candidates) {
    if (!name) continue;
    const move = getMove(name);
    if (move && !used.has(move.id)) return move.id;
  }
  return null;
}

/**
 * Build a four-role moveset. Roles are filled in priority order and each falls back
 * progressively, so every species ends up with four distinct, resolvable moves.
 */
export function buildMoveset(species: PokemonSpeciesData, level: number): MoveSlot[] {
  const tier = levelTier(level);
  const types = species.types as PokemonType[];
  const primary = types[0] ?? 'normal';
  const secondary = types[1] ?? primary;
  const prefersPhysical = species.baseStats.atk >= species.baseStats.spa;

  const primaryPool = TYPE_POOLS[primary] ?? TYPE_POOLS.normal;
  const secondaryPool = TYPE_POOLS[secondary] ?? TYPE_POOLS.normal;

  const used = new Set<string>();
  const ids: string[] = [];

  const push = (id: string | null) => {
    if (id && !used.has(id)) {
      used.add(id);
      ids.push(id);
    }
  };

  const mainList = prefersPhysical ? primaryPool.physical : primaryPool.special;
  const offList = prefersPhysical ? secondaryPool.special : secondaryPool.physical;

  // 1. STAB, scaled to level.
  push(pickResolvable([mainList[tier], ...[...mainList].reverse()], used));

  // 2. Coverage from the other type / other category.
  push(
    pickResolvable(
      [
        offList[tier],
        ...[...offList].reverse(),
        (prefersPhysical ? secondaryPool.physical : secondaryPool.special)[tier],
        ...TYPE_POOLS.normal.physical,
      ],
      used,
    ),
  );

  // 3. Breaker: low power, high Impact.
  push(
    pickResolvable(
      [...primaryPool.breaker, ...secondaryPool.breaker, 'Quick Attack', 'Tackle'],
      used,
    ),
  );

  // 4. Utility.
  push(
    pickResolvable(
      [primaryPool.utility[Math.min(tier, primaryPool.utility.length - 1)], ...primaryPool.utility, ...secondaryPool.utility, 'Growl', 'Leer'],
      used,
    ),
  );

  // Guarantee four slots.
  while (ids.length < 4) {
    const filler = pickResolvable(UNIVERSAL_FALLBACK, used);
    if (!filler) break;
    push(filler);
  }

  return ids.slice(0, 4).map((moveId) => {
    const move = getMove(moveId)!;
    return { moveId: move.id, pp: move.maxPp, maxPp: move.maxPp };
  });
}

// ─── Combatant ──────────────────────────────────────────────────────────────
export interface CombatantSpec {
  species: string | number;
  level: number;
  /** Explicit moveset by name or slug. Generated when omitted. */
  moves?: string[];
  nickname?: string;
}

function resolveSpecies(ref: string | number): PokemonSpeciesData {
  const found = typeof ref === 'number' ? getSpeciesById(ref) : getSpeciesByName(ref);
  if (found) return found;
  const fallback = getSpeciesById(25);
  if (!fallback) throw new Error('[battleFactory] species dataset unavailable');
  return fallback;
}

export function createCombatant(spec: CombatantSpec, side: Side, slot: number): BattleCombatant {
  const species = resolveSpecies(spec.species);
  const level = Math.max(1, Math.min(100, Math.round(spec.level)));

  const base: StatSpread = {
    hp: species.baseStats.hp,
    atk: species.baseStats.atk,
    def: species.baseStats.def,
    spa: species.baseStats.spa,
    spd: species.baseStats.spd,
    spe: species.baseStats.spe,
  };
  const stats = computeStats(base, level);

  let moves: MoveSlot[];
  if (spec.moves && spec.moves.length > 0) {
    moves = spec.moves
      .map((name) => getMove(name))
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .map((m) => ({ moveId: m.id, pp: m.maxPp, maxPp: m.maxPp }));
    if (moves.length === 0) moves = buildMoveset(species, level);
  } else {
    moves = buildMoveset(species, level);
  }

  const maxPoise = computeMaxPoise(stats.def, stats.spd);

  return {
    id: `${side}-${slot}-${moveSlug(species.name)}`,
    side,
    slot,
    speciesId: species.id,
    name: spec.nickname ?? species.name,
    level,
    types: species.types as PokemonType[],
    stats,
    hp: stats.hp,
    poise: maxPoise,
    maxPoise,
    staggeredTurns: 0,
    moves,
    status: null,
    volatiles: [],
    boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 },
    fainted: false,
    guardLocked: false,
    guarding: false,
    pendingMoveId: null,
  };
}

// ─── Snapshot ───────────────────────────────────────────────────────────────
export interface BattleSetup {
  playerTeam: CombatantSpec[];
  enemyTeam: CombatantSpec[];
  seed?: string | number;
}

export function createBattle(setup: BattleSetup): BattleSnapshot {
  if (setup.playerTeam.length === 0 || setup.enemyTeam.length === 0) {
    throw new Error('[battleFactory] both teams need at least one member');
  }

  const combatants: Record<CombatantId, BattleCombatant> = {};
  const playerParty: CombatantId[] = [];
  const enemyParty: CombatantId[] = [];

  setup.playerTeam.forEach((spec, i) => {
    const c = createCombatant(spec, 'player', i);
    combatants[c.id] = c;
    playerParty.push(c.id);
  });

  setup.enemyTeam.forEach((spec, i) => {
    const c = createCombatant(spec, 'enemy', i);
    combatants[c.id] = c;
    enemyParty.push(c.id);
  });

  const rngState =
    typeof setup.seed === 'number'
      ? setup.seed | 0
      : seedFromString(String(setup.seed ?? `${Date.now()}`));

  return {
    phase: 'BATTLE_START',
    turn: 1,
    rngState,
    combatants,
    playerParty,
    enemyParty,
    activePlayerId: playerParty[0],
    activeEnemyId: enemyParty[0],
    enemyIntent: null,
    pendingForcedSwitch: [],
    outcome: 'ongoing',
  };
}
