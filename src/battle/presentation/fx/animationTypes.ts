/**
 * Animation specification types.
 *
 * Pipeline:  MoveRuntime -> AnimationProfile -> FxTimeline -> layer instances
 *            (profileResolver)  (profileCatalog)  (MoveFxDirector)
 *
 * Two hard rules encoded here:
 *   1. ALL timings are integer milliseconds. The legacy EffectPhase.at was authored in
 *      seconds and compared against ms, so every phase spawned on frame 1 and attacks
 *      had no windup, travel or impact beat. Naming every field `...Ms` makes that
 *      class of bug unwritable.
 *   2. Every spawned layer carries an explicit durationMs and is reaped when it
 *      expires. The legacy player only ever appended to activeLayers, so its
 *      completion condition (activeLayers.length === 0) could never become true and
 *      onComplete never fired.
 */

import type {
  BeamConfig,
  DecalConfig,
  FlipbookConfig,
  ParticleConfig,
  ProjectileConfig,
  RingConfig,
  ShieldConfig,
  ShockwaveConfig,
  WaveConfig,
} from '../../../game/effects/types';

// ─── Stages ─────────────────────────────────────────────────────────────────
export const STAGES = [
  'ANTICIPATE',
  'WINDUP',
  'RELEASE',
  'TRAVEL',
  'IMPACT',
  'REACT',
  'SETTLE',
] as const;

export type StageName = (typeof STAGES)[number];

export interface StageTimings {
  anticipateMs: number;
  windupMs: number;
  releaseMs: number;
  travelMs: number;
  impactMs: number;
  reactMs: number;
  settleMs: number;
}

/** Absolute start offset of each stage, plus the total. */
export interface StageClock {
  start: Record<StageName, number>;
  end: Record<StageName, number>;
  totalMs: number;
}

export function buildStageClock(t: StageTimings): StageClock {
  const order: [StageName, number][] = [
    ['ANTICIPATE', t.anticipateMs],
    ['WINDUP', t.windupMs],
    ['RELEASE', t.releaseMs],
    ['TRAVEL', t.travelMs],
    ['IMPACT', t.impactMs],
    ['REACT', t.reactMs],
    ['SETTLE', t.settleMs],
  ];
  const start = {} as Record<StageName, number>;
  const end = {} as Record<StageName, number>;
  let cursor = 0;
  for (const [name, duration] of order) {
    start[name] = cursor;
    cursor += Math.max(0, Math.round(duration));
    end[name] = cursor;
  }
  return { start, end, totalMs: cursor };
}

/** Hard ceiling. A profile exceeding this is clamped and warned about. */
export const MAX_ACTION_MS = 1600;
/** Safety net: force-complete this long after the planned total. */
export const STAGE_TIMEOUT_SLACK_MS = 400;

// ─── Categories ─────────────────────────────────────────────────────────────
export type AnimCategory =
  | 'CONTACT_STRIKE'
  | 'SLASH'
  | 'MULTI_HIT'
  | 'PROJECTILE'
  | 'BEAM'
  | 'AREA_GROUND'
  | 'AREA_WAVE'
  | 'STATUS_APPLY'
  | 'SELF_BUFF'
  | 'HEAL'
  | 'GUARD';

export type AnimModifier = 'heavy' | 'quick' | 'recoil';

// ─── Visual knobs ───────────────────────────────────────────────────────────
/**
 * Per-category visual language. Identity comes from combining these with the type
 * palette, NOT from per-move code.
 */
export interface VisualKnobs {
  /** World units the attacker pulls back during WINDUP. */
  windupPull: number;
  /** World units the attacker drives forward on RELEASE. */
  lunge: number;
  /** Dash past the target and return (slashes) rather than stopping short. */
  dashThrough: boolean;

  projectile: 'none' | 'orb' | 'bolt' | 'shard';
  arcHeight: number;
  beam: boolean;
  wave: boolean;
  shield: boolean;

  /** Hero flipbook played at the contact point. */
  heroSheet: 'impact' | 'slash' | 'burst' | 'sparkle' | null;
  heroScale: number;

  ringCount: number;
  ringFlat: boolean;
  shockwaveRadius: number;
  shockwaveDome: number;
  decal: 'none' | 'crack' | 'shockring' | 'burst';

  windupParticles: number;
  impactParticles: number;
  /** Rising particles around the actor (buff / heal / status charge). */
  auraParticles: number;

  /** Camera push on RELEASE, world units. */
  releaseDolly: number;
  /** Does the attacker physically touch the defender? Drives dust and rig motion. */
  contact: boolean;
}

export interface AnimationProfile {
  category: AnimCategory;
  timings: StageTimings;
  knobs: VisualKnobs;
  modifiers: AnimModifier[];
}

/** Author-time override: category plus optional timing/visual tweaks. */
export interface ProfileOverride {
  category: AnimCategory;
  modifiers?: AnimModifier[];
  timings?: Partial<StageTimings>;
  knobs?: Partial<VisualKnobs>;
}

// ─── Layers ─────────────────────────────────────────────────────────────────
export type FxAnchor =
  | 'attacker'
  | 'attackerMuzzle'
  | 'target'
  | 'targetCore'
  | 'targetGround'
  | 'attackerGround'
  | 'midpoint';

export type FxLayer =
  | { kind: 'particles'; config: ParticleConfig }
  | { kind: 'ring'; config: RingConfig }
  | { kind: 'beam'; config: BeamConfig }
  | { kind: 'projectile'; config: ProjectileConfig }
  | { kind: 'flipbook'; sheet: string; config: FlipbookConfig; flat?: boolean; randomRotate?: boolean }
  | { kind: 'decal'; config: DecalConfig }
  | { kind: 'shockwave'; config: ShockwaveConfig }
  | { kind: 'shield'; config: ShieldConfig }
  | { kind: 'wave'; config: WaveConfig };

export interface FxSpawn {
  /** Stable key so React can reconcile without remounting. */
  id: string;
  atMs: number;
  durationMs: number;
  anchor: FxAnchor;
  layer: FxLayer;
}

// ─── Rig cues (sprite motion) ───────────────────────────────────────────────
export type RigMotion =
  | 'windup'
  | 'lunge'
  | 'dashThrough'
  | 'recoil'
  | 'flinch'
  | 'rise'
  | 'sink'
  | 'hop'
  | 'shudder'
  | 'settle'
  | 'guardBrace'
  | 'staggerDrop';

export interface RigCue {
  atMs: number;
  /** 'attacker' | 'target' — resolved to a combatant id by the director. */
  who: 'attacker' | 'target';
  motion: RigMotion;
  /** Magnitude in world units, or a 0-1 intensity for non-translating motions. */
  amount: number;
  durationMs: number;
}

export interface CameraCueAt {
  atMs: number;
  dolly?: number;
  dollyMs?: number;
}

export interface FxTimeline {
  totalMs: number;
  clock: StageClock;
  spawns: FxSpawn[];
  rigCues: RigCue[];
  cameraCues: CameraCueAt[];
  /** Absolute ms at which each hit lands. Length = hit count. */
  impactTimesMs: number[];
}
