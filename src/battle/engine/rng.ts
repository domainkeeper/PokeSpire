/**
 * Seeded PRNG (mulberry32). PURE.
 *
 * The state lives in the BattleSnapshot, not in a module singleton, so the same
 * seed plus the same action sequence always produces a byte-identical battle.
 * That is what makes the engine replayable and unit-testable.
 */

export interface Rng {
  state: number;
}

/** Advance the state and return [nextState, float in [0,1)]. */
export function nextFloat(state: number): [number, number] {
  let s = (state + 0x6d2b79f5) | 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [s, value];
}

/** Integer in [0, maxExclusive). */
export function nextInt(state: number, maxExclusive: number): [number, number] {
  const [s, f] = nextFloat(state);
  return [s, Math.floor(f * maxExclusive)];
}

/** Integer in [min, max] inclusive. */
export function nextRange(state: number, min: number, max: number): [number, number] {
  const [s, n] = nextInt(state, max - min + 1);
  return [s, min + n];
}

/** True with `percent` probability (0-100). */
export function chance(state: number, percent: number): [number, boolean] {
  if (percent >= 100) return [state, true];
  if (percent <= 0) return [state, false];
  const [s, f] = nextFloat(state);
  return [s, f * 100 < percent];
}

/** Mutable cursor so resolution code can roll without threading state manually. */
export class RngCursor {
  constructor(public state: number) {}

  float(): number {
    const [s, v] = nextFloat(this.state);
    this.state = s;
    return v;
  }

  int(maxExclusive: number): number {
    const [s, v] = nextInt(this.state, maxExclusive);
    this.state = s;
    return v;
  }

  range(min: number, max: number): number {
    const [s, v] = nextRange(this.state, min, max);
    this.state = s;
    return v;
  }

  chance(percent: number): boolean {
    const [s, v] = chance(this.state, percent);
    this.state = s;
    return v;
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(items.length)];
  }
}

/** Derive a stable numeric seed from a string. */
export function seedFromString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}
