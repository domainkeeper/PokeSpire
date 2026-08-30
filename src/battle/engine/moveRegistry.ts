/**
 * MoveData -> MoveRuntime normalisation. PURE.
 *
 * This module is the single source of truth for move properties in battle, and it
 * fixes three live defects:
 *
 *   N2 - moves.ts keys MOVES_BY_NAME by `name.toLowerCase()`, i.e. "quick attack".
 *        App.tsx and BattleDemo.tsx looked up "quickattack"/"thundershock"/
 *        "watergun"/"vinewhip", all of which missed and fell through to a generic
 *        Normal-type Physical 40-power stub. We index by a normalised slug so both
 *        spellings resolve.
 *   N3 - MoveData exposes `power`; combatEngine read `move.basePower`, which never
 *        existed, so `Number(undefined) || 40` made EVERY move 40 base power.
 *   N6 - Primary effects (stat changes, status, heal, drain, recoil, multi-hit,
 *        charge) are not in structured fields; `secondary` is null for all of them.
 *        Only `shortDesc` carries them. Showdown's shortDesc phrasing is highly
 *        regular, so we parse it rather than hand-authoring ~900 moves.
 */

import { getAllMoves, getMoveByName } from '../../data/pokemon/moves';
import type { MoveData, PokemonType } from '../../data/pokemon/schemas/index';
import type {
  BoostEffect,
  BoostKey,
  BoostSpread,
  MoveCategory,
  MoveRuntime,
  NonVolatileStatus,
  StatusEffect,
  VolatileStatus,
} from './battleTypes';

// ─── Slug normalisation ─────────────────────────────────────────────────────
export function moveSlug(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ─── shortDesc parsing ──────────────────────────────────────────────────────
const STAT_WORDS: Record<string, BoostKey> = {
  attack: 'atk',
  defense: 'def',
  'sp. atk': 'spa',
  'sp. def': 'spd',
  speed: 'spe',
  accuracy: 'acc',
  evasiveness: 'eva',
  evasion: 'eva',
};

/** "Attack and Defense" / "Attack, Defense, Speed" -> [atk, def, spe] */
function parseStatList(raw: string): BoostKey[] {
  return raw
    .split(/,| and /i)
    .map((s) => s.trim().toLowerCase())
    .map((s) => STAT_WORDS[s])
    .filter((s): s is BoostKey => Boolean(s));
}

function buildBoostSpread(keys: BoostKey[], delta: number): Partial<BoostSpread> {
  const out: Partial<BoostSpread> = {};
  for (const k of keys) out[k] = delta;
  return out;
}

const STATUS_PATTERNS: [RegExp, NonVolatileStatus][] = [
  [/badly poisons?/i, 'tox'],
  [/\bpoisons?\b/i, 'psn'],
  [/\bburns?\b/i, 'brn'],
  [/\bparalyzes?\b/i, 'par'],
  [/\bfreezes?\b/i, 'frz'],
  [/(falls? asleep|puts? the target to sleep|causes? the target to fall asleep)/i, 'slp'],
];

const VOLATILE_PATTERNS: [RegExp, VolatileStatus][] = [
  [/\bconfus/i, 'confusion'],
  [/\bflinch/i, 'flinch'],
  [/leech seed|seeds? the target/i, 'leechseed'],
];

interface ParsedPrimary {
  boosts?: BoostEffect;
  status?: StatusEffect;
  heal?: number;
  drain?: number;
  recoil?: number;
  hits?: [number, number];
  charge?: boolean;
}

const WORD_COUNTS: Record<string, number> = { twice: 2, thrice: 3, 'three times': 3 };

/**
 * Extract primary (guaranteed) effects from shortDesc. Deliberately conservative:
 * anything not confidently matched is simply absent, which degrades to a plain
 * damaging move rather than a wrong one.
 */
export function parsePrimaryEffects(move: MoveData): ParsedPrimary {
  const desc = move.shortDesc || '';
  const out: ParsedPrimary = {};

  // Stat changes ------------------------------------------------------------
  // The stat list must allow '.' because Showdown writes "Sp. Atk" / "Sp. Def",
  // so a [^.] class silently fails on every special-stat move.
  const STAT_CAPTURE = "([A-Za-z.,'\\s-]+?)";
  const boostPatterns: [RegExp, 'self' | 'foe', number][] = [
    [new RegExp(`raises? the user's ${STAT_CAPTURE} by (\\d+)`, 'i'), 'self', 1],
    [new RegExp(`lowers? the user's ${STAT_CAPTURE} by (\\d+)`, 'i'), 'self', -1],
    [new RegExp(`lowers? the (?:foe\\(s\\)|target's|foe's) ${STAT_CAPTURE} by (\\d+)`, 'i'), 'foe', -1],
    [new RegExp(`raises? the (?:foe\\(s\\)|target's) ${STAT_CAPTURE} by (\\d+)`, 'i'), 'foe', 1],
  ];

  for (const [re, target, sign] of boostPatterns) {
    const m = desc.match(re);
    if (!m) continue;
    const keys = parseStatList(m[1]);
    if (!keys.length) continue;
    out.boosts = {
      target,
      boosts: buildBoostSpread(keys, sign * Number(m[2])),
      chance: 100,
    };
    break;
  }

  // Status ------------------------------------------------------------------
  // Only for status-category moves; damaging moves carry these via `secondary`.
  if (move.category === 'status') {
    for (const [re, status] of STATUS_PATTERNS) {
      if (re.test(desc)) {
        out.status = { target: 'foe', status, chance: 100 };
        break;
      }
    }
    if (!out.status) {
      for (const [re, volatile] of VOLATILE_PATTERNS) {
        if (re.test(desc) && volatile !== 'flinch') {
          out.status = { target: 'foe', volatile, chance: 100 };
          break;
        }
      }
    }
  }

  // Heal --------------------------------------------------------------------
  const heal = desc.match(/heals? the user by (\d+)%/i);
  if (heal) out.heal = Number(heal[1]) / 100;
  else if (/heals? the user by 1\/2/i.test(desc)) out.heal = 0.5;

  // Drain -------------------------------------------------------------------
  const drain = desc.match(/user recovers (\d+)% of the damage/i);
  if (drain) out.drain = Number(drain[1]) / 100;

  // Recoil ------------------------------------------------------------------
  const recoilPct = desc.match(/has (\d+)% recoil/i);
  if (recoilPct) out.recoil = Number(recoilPct[1]) / 100;
  else {
    const recoilFrac = desc.match(/has (\d+)\/(\d+) recoil/i);
    if (recoilFrac) out.recoil = Number(recoilFrac[1]) / Number(recoilFrac[2]);
  }

  // Multi-hit ---------------------------------------------------------------
  const hitRange = desc.match(/hits (\d+)-(\d+) times/i);
  if (hitRange) out.hits = [Number(hitRange[1]), Number(hitRange[2])];
  else {
    const hitWord = desc.match(/hits (twice|thrice|three times|\d+ times)/i);
    if (hitWord) {
      const token = hitWord[1].toLowerCase();
      const n = WORD_COUNTS[token] ?? parseInt(token, 10);
      if (Number.isFinite(n) && n > 1) out.hits = [n, n];
    }
  }

  // Two-turn charge ---------------------------------------------------------
  if (/charges? turn 1|charges,? then/i.test(desc)) out.charge = true;

  return out;
}

// ─── Secondary (structured) effects ─────────────────────────────────────────
function parseSecondary(move: MoveData): { boosts?: BoostEffect; status?: StatusEffect } {
  const sec = move.secondary;
  if (!sec) return {};
  const out: { boosts?: BoostEffect; status?: StatusEffect } = {};
  const chance = sec.chance ?? 100;

  if (sec.boosts) {
    const boosts: Partial<BoostSpread> = {};
    for (const [k, v] of Object.entries(sec.boosts)) {
      const key = k as BoostKey;
      if (typeof v === 'number') boosts[key] = v;
    }
    if (Object.keys(boosts).length) {
      // Showdown secondary boosts on a damaging move target the defender unless
      // every delta is positive, in which case it is a self-buff rider.
      const allPositive = Object.values(boosts).every((v) => (v ?? 0) > 0);
      out.boosts = { target: allPositive ? 'self' : 'foe', boosts, chance };
    }
  }

  if (sec.status) {
    out.status = { target: 'foe', status: sec.status as NonVolatileStatus, chance };
  } else if (sec.volatileStatus) {
    out.status = { target: 'foe', volatile: sec.volatileStatus as VolatileStatus, chance };
  }

  return out;
}

// ─── Poise damage (Impact) derivation ───────────────────────────────────────
/**
 * Impact is the second offensive number, and it is DELIBERATELY anti-correlated
 * with basePower. That is the mechanism that stops "pick the highest-damage move"
 * from being correct: fast contact jabs shatter stance, heavy beams do not.
 *
 * Derived from data we already have, so no per-move authoring is needed.
 */
const IMPACT_FLAG_BONUS: Record<string, number> = {
  contact: 6,
  punch: 5,
  bite: 4,
  slicing: 3,
  bullet: -3,
  sound: -4,
  powder: -5,
  pulse: -2,
};

export const MIN_IMPACT = 2;

export function deriveImpact(
  move: MoveData,
  hits: [number, number] | undefined,
  priority: number,
): number {
  if (move.category === 'status') return 0;

  let impact = move.category === 'physical' ? 14 : 11;

  for (const [flag, bonus] of Object.entries(IMPACT_FLAG_BONUS)) {
    if (move.flags[flag]) impact += bonus;
  }

  // Priority moves are efficient stance-breakers.
  if (priority > 0) impact += 8;

  // Heavy moves trade Impact for damage.
  const power = move.power || 0;
  impact -= Math.min(10, Math.max(0, Math.floor((power - 40) / 12)));

  // Multi-hit applies Impact per hit, so scale down to keep totals sane.
  if (hits) impact = Math.ceil(impact * 0.45);

  return Math.max(MIN_IMPACT, impact);
}

// ─── critRatio -> crit stage ────────────────────────────────────────────────
function critStageFrom(critRatio: number | undefined): number {
  if (!critRatio || critRatio <= 1) return 0;
  if (critRatio === 2) return 1;
  if (critRatio === 3) return 2;
  return 3;
}

// ─── Build ──────────────────────────────────────────────────────────────────
function build(move: MoveData): MoveRuntime {
  const primary = parsePrimaryEffects(move);
  const secondary = parseSecondary(move);
  const priority = move.priority ?? 0;

  // accuracy: -1 (and `true`) both mean "never misses" in the source data.
  const rawAcc = move.accuracy as number | boolean;
  const accuracy = rawAcc === true || rawAcc === -1 || rawAcc === null || rawAcc === undefined
    ? null
    : Number(rawAcc);

  return {
    id: moveSlug(move.name),
    name: move.name,
    type: move.type as PokemonType,
    category: move.category as MoveCategory,
    // FIX N3: read `power`, not the non-existent `basePower`.
    basePower: move.power ?? 0,
    accuracy,
    maxPp: move.pp ?? 20,
    priority,
    critStage: critStageFrom(move.critRatio),
    impact: deriveImpact(move, primary.hits, priority),
    hits: primary.hits,
    drain: primary.drain,
    recoil: primary.recoil,
    heal: primary.heal,
    primary: { boosts: primary.boosts, status: primary.status },
    secondary,
    flags: Object.freeze({ ...move.flags }),
    shortDesc: move.shortDesc || '',
  };
}

// ─── Registry ───────────────────────────────────────────────────────────────
const BY_SLUG = new Map<string, MoveRuntime>();
let initialised = false;

function ensureInit(): void {
  if (initialised) return;
  initialised = true;
  for (const move of getAllMoves()) {
    const runtime = build(move);
    if (!BY_SLUG.has(runtime.id)) BY_SLUG.set(runtime.id, runtime);
  }
}

/**
 * Resolve a move by id, name, or slug. Accepts "quickattack", "quick attack",
 * "Quick Attack" and "quick-attack" identically.
 */
export function getMove(idOrName: string): MoveRuntime | undefined {
  ensureInit();
  const slug = moveSlug(idOrName);
  const hit = BY_SLUG.get(slug);
  if (hit) return hit;
  // Last resort: the raw data lookup, in case of an exact-name-only entry.
  const raw = getMoveByName(idOrName);
  return raw ? build(raw) : undefined;
}

/** Throws rather than silently substituting a wrong move. */
export function requireMove(idOrName: string): MoveRuntime {
  const move = getMove(idOrName);
  if (!move) throw new Error(`[moveRegistry] unknown move: "${idOrName}"`);
  return move;
}

export function hasMove(idOrName: string): boolean {
  return getMove(idOrName) !== undefined;
}

export function allMoveRuntimes(): MoveRuntime[] {
  ensureInit();
  return [...BY_SLUG.values()];
}

/** Does this move make physical contact? Drives animation category + Impact. */
export function isContactMove(move: MoveRuntime): boolean {
  return Boolean(move.flags.contact);
}
