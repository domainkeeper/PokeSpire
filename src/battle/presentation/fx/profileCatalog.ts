/**
 * Animation profile catalog.
 *
 * Eleven categories, each with its own stage timing and visual language. Identity for
 * ~900 moves comes from (category x type palette x modifiers) rather than per-move
 * code, but the categories themselves are deliberately authored so that a beam, a
 * punch, a ground slam and a status cloud do not read alike.
 *
 * This replaces recipes.ts, which declared 13 EffectFamily values and implemented two
 * (`projectile`, `slash`); everything else fell through to a generic particle burst, so
 * Flamethrower, Thunderbolt, Ice Beam, Earthquake, Surf and Hyper Beam were the same
 * effect in different colours.
 */

import type { TypePalette } from '../../../game/effects/presets/typePalettes';
import type { EffectContext } from '../../../game/effects/types';
import {
  buildStageClock,
  MAX_ACTION_MS,
  type AnimCategory,
  type AnimModifier,
  type AnimationProfile,
  type FxSpawn,
  type FxTimeline,
  type RigCue,
  type CameraCueAt,
  type StageTimings,
  type VisualKnobs,
} from './animationTypes';

// ─── Defaults ───────────────────────────────────────────────────────────────
const BASE_KNOBS: VisualKnobs = {
  windupPull: 0.18,
  lunge: 0,
  dashThrough: false,
  projectile: 'none',
  arcHeight: 0,
  beam: false,
  wave: false,
  shield: false,
  heroSheet: 'impact',
  heroScale: 1.2,
  ringCount: 1,
  ringFlat: false,
  shockwaveRadius: 0,
  shockwaveDome: 0.5,
  decal: 'none',
  windupParticles: 10,
  impactParticles: 18,
  auraParticles: 0,
  releaseDolly: 0,
  contact: false,
};

const BASE_TIMINGS: StageTimings = {
  anticipateMs: 120,
  windupMs: 180,
  releaseMs: 80,
  travelMs: 0,
  impactMs: 80,
  reactMs: 200,
  settleMs: 180,
};

interface CategorySpec {
  timings: Partial<StageTimings>;
  knobs: Partial<VisualKnobs>;
}

/**
 * Per-category timing and visual language. See the table in the design doc; the
 * numbers here are the authored source of truth.
 */
export const CATEGORY_SPECS: Record<AnimCategory, CategorySpec> = {
  // Lunge in, connect, drive back. The bread-and-butter physical read.
  CONTACT_STRIKE: {
    timings: { windupMs: 160, travelMs: 0, impactMs: 80 },
    knobs: {
      windupPull: 0.2,
      lunge: 0.62,
      contact: true,
      heroSheet: 'impact',
      heroScale: 1.1,
      ringCount: 1,
      windupParticles: 8,
      impactParticles: 20,
      decal: 'none',
      releaseDolly: 0.03,
    },
  },

  // Dash THROUGH the target with a crescent arc; the attacker ends past the defender.
  SLASH: {
    timings: { anticipateMs: 110, windupMs: 140, releaseMs: 70, impactMs: 70, reactMs: 190, settleMs: 200 },
    knobs: {
      windupPull: 0.26,
      lunge: 1.0,
      dashThrough: true,
      contact: true,
      heroSheet: 'slash',
      heroScale: 1.75,
      ringCount: 0,
      windupParticles: 6,
      impactParticles: 22,
      releaseDolly: 0.045,
    },
  },

  // Rapid repeated contacts. Per-hit impact is small; the escalation carries it.
  MULTI_HIT: {
    timings: { anticipateMs: 110, windupMs: 150, releaseMs: 60, impactMs: 45, reactMs: 180, settleMs: 170 },
    knobs: {
      windupPull: 0.16,
      lunge: 0.5,
      contact: true,
      heroSheet: 'impact',
      heroScale: 0.85,
      ringCount: 0,
      windupParticles: 6,
      impactParticles: 9,
      releaseDolly: 0.02,
    },
  },

  // Charge motes converge at the muzzle, then a cored projectile flies with a trail.
  PROJECTILE: {
    timings: { windupMs: 200, releaseMs: 70, travelMs: 260, impactMs: 80, reactMs: 200, settleMs: 170 },
    knobs: {
      windupPull: 0.14,
      lunge: 0.1,
      projectile: 'orb',
      arcHeight: 0.35,
      heroSheet: 'burst',
      heroScale: 1.35,
      ringCount: 1,
      windupParticles: 14,
      impactParticles: 24,
      releaseDolly: 0.025,
    },
  },

  // Long charge, then a sustained beam that holds through contact.
  BEAM: {
    timings: { anticipateMs: 130, windupMs: 280, releaseMs: 70, travelMs: 200, impactMs: 100, reactMs: 210, settleMs: 190 },
    knobs: {
      windupPull: 0.2,
      lunge: 0.06,
      beam: true,
      heroSheet: 'burst',
      heroScale: 1.5,
      ringCount: 2,
      windupParticles: 16,
      impactParticles: 26,
      decal: 'shockring',
      releaseDolly: 0.05,
    },
  },

  // Rise and slam. Force comes out of the GROUND, not from the attacker's body.
  AREA_GROUND: {
    timings: { anticipateMs: 140, windupMs: 240, releaseMs: 90, travelMs: 0, impactMs: 110, reactMs: 220, settleMs: 200 },
    knobs: {
      windupPull: -0.05,
      lunge: 0,
      heroSheet: null,
      ringCount: 2,
      ringFlat: true,
      shockwaveRadius: 3.1,
      shockwaveDome: 0.22,
      decal: 'crack',
      windupParticles: 10,
      impactParticles: 30,
      releaseDolly: 0.06,
    },
  },

  // A screen-width crest sweeps across the arena.
  AREA_WAVE: {
    timings: { anticipateMs: 120, windupMs: 200, releaseMs: 70, travelMs: 200, impactMs: 90, reactMs: 200, settleMs: 190 },
    knobs: {
      windupPull: 0.12,
      lunge: 0,
      wave: true,
      heroSheet: 'burst',
      heroScale: 1.3,
      ringCount: 1,
      ringFlat: true,
      shockwaveRadius: 1.9,
      shockwaveDome: 0.35,
      windupParticles: 14,
      impactParticles: 24,
      releaseDolly: 0.03,
    },
  },

  // No shake, no flash, no hit-stop, no knockback. Ever.
  STATUS_APPLY: {
    timings: { anticipateMs: 120, windupMs: 220, releaseMs: 60, travelMs: 180, impactMs: 0, reactMs: 200, settleMs: 180 },
    knobs: {
      windupPull: -0.03,
      lunge: 0,
      heroSheet: null,
      ringCount: 1,
      windupParticles: 0,
      impactParticles: 14,
      auraParticles: 10,
      releaseDolly: 0,
      contact: false,
    },
  },

  // Rising ring through the actor plus upward chevrons.
  SELF_BUFF: {
    timings: { anticipateMs: 110, windupMs: 180, releaseMs: 60, travelMs: 0, impactMs: 0, reactMs: 220, settleMs: 190 },
    knobs: {
      windupPull: 0,
      lunge: 0,
      heroSheet: null,
      ringCount: 2,
      ringFlat: true,
      windupParticles: 0,
      impactParticles: 0,
      auraParticles: 22,
      releaseDolly: 0,
    },
  },

  // Gentle rising sparkles. Explicitly calm - healing must never read as an impact.
  HEAL: {
    timings: { anticipateMs: 110, windupMs: 200, releaseMs: 60, travelMs: 0, impactMs: 0, reactMs: 240, settleMs: 200 },
    knobs: {
      windupPull: 0,
      lunge: 0,
      heroSheet: 'sparkle',
      heroScale: 1.1,
      ringCount: 1,
      ringFlat: true,
      windupParticles: 0,
      impactParticles: 0,
      auraParticles: 20,
      releaseDolly: 0,
    },
  },

  // Shield snaps in and holds for the turn.
  GUARD: {
    timings: { anticipateMs: 90, windupMs: 120, releaseMs: 60, travelMs: 0, impactMs: 0, reactMs: 180, settleMs: 160 },
    knobs: {
      windupPull: -0.06,
      lunge: 0,
      shield: true,
      heroSheet: null,
      ringCount: 1,
      windupParticles: 0,
      impactParticles: 8,
      auraParticles: 0,
      releaseDolly: 0,
    },
  },
};

// ─── Modifiers ──────────────────────────────────────────────────────────────
function applyModifiers(
  timings: StageTimings,
  knobs: VisualKnobs,
  modifiers: AnimModifier[],
): { timings: StageTimings; knobs: VisualKnobs } {
  const t = { ...timings };
  const k = { ...knobs };

  for (const mod of modifiers) {
    if (mod === 'heavy') {
      t.windupMs = Math.round(t.windupMs * 1.35);
      t.impactMs = Math.round(t.impactMs * 1.15);
      k.releaseDolly += 0.02;
      k.heroScale *= 1.2;
      k.impactParticles = Math.round(k.impactParticles * 1.3);
      if (k.shockwaveRadius > 0) k.shockwaveRadius *= 1.2;
    }
    if (mod === 'quick') {
      t.anticipateMs = Math.round(t.anticipateMs * 0.75);
      t.windupMs = Math.round(t.windupMs * 0.7);
      t.reactMs = Math.round(t.reactMs * 0.85);
      k.heroScale *= 0.9;
      k.windupParticles = Math.round(k.windupParticles * 0.6);
    }
  }

  return { timings: t, knobs: k };
}

export function buildProfile(
  category: AnimCategory,
  modifiers: AnimModifier[] = [],
  overrides?: { timings?: Partial<StageTimings>; knobs?: Partial<VisualKnobs> },
): AnimationProfile {
  const spec = CATEGORY_SPECS[category];
  const baseTimings: StageTimings = { ...BASE_TIMINGS, ...spec.timings };
  const baseKnobs: VisualKnobs = { ...BASE_KNOBS, ...spec.knobs };

  const withMods = applyModifiers(baseTimings, baseKnobs, modifiers);

  const timings: StageTimings = { ...withMods.timings, ...overrides?.timings };
  const knobs: VisualKnobs = { ...withMods.knobs, ...overrides?.knobs };

  // Enforce the hard duration cap by scaling the non-impact stages.
  const total = buildStageClock(timings).totalMs;
  if (total > MAX_ACTION_MS) {
    const scale = MAX_ACTION_MS / total;
    timings.anticipateMs = Math.round(timings.anticipateMs * scale);
    timings.windupMs = Math.round(timings.windupMs * scale);
    timings.releaseMs = Math.round(timings.releaseMs * scale);
    timings.travelMs = Math.round(timings.travelMs * scale);
    timings.reactMs = Math.round(timings.reactMs * scale);
    timings.settleMs = Math.round(timings.settleMs * scale);
  }

  return { category, timings, knobs, modifiers };
}

// ─── Timeline construction ──────────────────────────────────────────────────
export interface TimelineOptions {
  /** Number of contacts. >1 staggers additional IMPACT beats inside the stage. */
  hitCount: number;
  /** Suppresses all contact FX (miss / immune). */
  whiffed: boolean;
  /** Distance between combatants, world units. */
  distance: number;
}

let uid = 0;
const nextId = () => `fx${++uid}`;

/**
 * Compose a concrete timeline. Every spawn gets an explicit durationMs so the director
 * can reap it; nothing lives forever.
 */
export function buildFxTimeline(
  profile: AnimationProfile,
  palette: TypePalette,
  _context: EffectContext,
  opts: TimelineOptions,
): FxTimeline {
  const { knobs, timings } = profile;
  const clock = buildStageClock(timings);
  const [primary, secondary, glow, pale] = palette.colors;

  const spawns: FxSpawn[] = [];
  const rigCues: RigCue[] = [];
  const cameraCues: CameraCueAt[] = [];

  const hitCount = Math.max(1, opts.hitCount);
  const impactStart = clock.start.IMPACT;
  const impactSpan = Math.max(1, clock.end.IMPACT - clock.start.IMPACT);

  // Multi-hit spreads its contacts across IMPACT + REACT so each lands separately.
  const perHitGap = hitCount > 1 ? Math.max(60, Math.round((impactSpan + timings.reactMs * 0.55) / hitCount)) : 0;
  const impactTimesMs = Array.from({ length: hitCount }, (_, i) => impactStart + i * perHitGap);
  const lastImpact = impactTimesMs[impactTimesMs.length - 1];

  // ── Attacker motion ──
  if (knobs.windupPull !== 0) {
    rigCues.push({
      atMs: clock.start.WINDUP,
      who: 'attacker',
      motion: 'windup',
      amount: knobs.windupPull,
      durationMs: timings.windupMs,
    });
  }
  if (knobs.lunge > 0) {
    rigCues.push({
      atMs: clock.start.RELEASE,
      who: 'attacker',
      motion: knobs.dashThrough ? 'dashThrough' : 'lunge',
      amount: Math.min(knobs.lunge, Math.max(0.2, opts.distance - 1.1)),
      durationMs: timings.releaseMs + impactSpan,
    });
  }
  if (knobs.auraParticles > 0) {
    rigCues.push({
      atMs: clock.start.WINDUP,
      who: 'attacker',
      motion: profile.category === 'HEAL' || profile.category === 'SELF_BUFF' ? 'rise' : 'shudder',
      amount: 0.06,
      durationMs: timings.windupMs + timings.releaseMs,
    });
  }
  if (knobs.shield) {
    rigCues.push({
      atMs: clock.start.WINDUP,
      who: 'attacker',
      motion: 'guardBrace',
      amount: 0.5,
      durationMs: timings.windupMs + timings.releaseMs + timings.reactMs,
    });
  }
  rigCues.push({
    atMs: clock.start.SETTLE,
    who: 'attacker',
    motion: 'settle',
    amount: 1,
    durationMs: timings.settleMs,
  });

  // ── Camera dolly on release ──
  if (knobs.releaseDolly > 0 && !opts.whiffed) {
    cameraCues.push({
      atMs: clock.start.RELEASE,
      dolly: knobs.releaseDolly,
      dollyMs: timings.releaseMs + impactSpan + 120,
    });
  }

  // ── ANTICIPATE: no VFX by design. The pose alone announces the action. ──

  // ── WINDUP: charge ──
  if (knobs.windupParticles > 0) {
    const converge = knobs.beam || knobs.projectile !== 'none';
    spawns.push({
      id: nextId(),
      atMs: clock.start.WINDUP,
      durationMs: timings.windupMs + timings.releaseMs,
      anchor: converge ? 'attackerMuzzle' : 'attacker',
      layer: {
        kind: 'particles',
        config: {
          count: knobs.windupParticles,
          lifetime: (timings.windupMs / 1000) * 0.9,
          speed: converge ? 1.6 : 1.1,
          speedVariance: 0.4,
          spread: converge ? 0.85 : 0.5,
          scale: 0.11,
          scaleVariance: 0.35,
          rotation: 0,
          rotationSpeed: 4,
          opacity: 0.95,
          opacityFade: 0.5,
          gravity: 0,
          color: secondary,
          colorEnd: glow,
          texture: palette.shape,
          additive: true,
          converge,
        },
      },
    });
  }

  // Rising aura for buff / heal / status charge.
  if (knobs.auraParticles > 0) {
    const healing = profile.category === 'HEAL';
    spawns.push({
      id: nextId(),
      atMs: clock.start.WINDUP,
      durationMs: timings.windupMs + timings.releaseMs + timings.reactMs,
      anchor: 'attacker',
      layer: {
        kind: 'particles',
        config: {
          count: knobs.auraParticles,
          lifetime: 0.75,
          speed: 0.95,
          speedVariance: 0.3,
          spread: 0.42,
          scale: healing ? 0.13 : 0.1,
          scaleVariance: 0.4,
          rotation: 0,
          rotationSpeed: 1.5,
          opacity: 1,
          opacityFade: 0.8,
          // Negative gravity: chevrons rise.
          gravity: -1.5,
          color: healing ? '#7dffa8' : glow,
          colorEnd: healing ? '#d6ffe6' : pale,
          texture: healing ? 'star' : palette.shape,
          additive: true,
        },
      },
    });

    // Ground-up ring, the classic setup read.
    if (knobs.ringCount > 0 && (profile.category === 'SELF_BUFF' || profile.category === 'HEAL')) {
      for (let i = 0; i < knobs.ringCount; i++) {
        spawns.push({
          id: nextId(),
          atMs: clock.start.WINDUP + i * 140,
          durationMs: 620,
          anchor: 'attackerGround',
          layer: {
            kind: 'ring',
            config: {
              count: 1,
              lifetime: 0.6,
              radius: 0.75,
              radiusGrow: -0.5,
              thickness: 0.16,
              color: healing ? '#7dffa8' : glow,
              opacity: 0.75,
              flat: true,
            },
          },
        });
      }
    }
  }

  // ── Guard shield ──
  if (knobs.shield) {
    spawns.push({
      id: nextId(),
      atMs: clock.start.WINDUP,
      durationMs: timings.windupMs + timings.releaseMs + timings.reactMs + timings.settleMs,
      anchor: 'targetCore',
      layer: {
        kind: 'shield',
        config: {
          lifetime:
            (timings.windupMs + timings.releaseMs + timings.reactMs + timings.settleMs) / 1000,
          radius: 1.05,
          color: glow,
          opacity: 0.95,
          holdSec: (timings.releaseMs + timings.reactMs) / 1000,
        },
      },
    });
  }

  if (!opts.whiffed) {
    // ── RELEASE / TRAVEL ──
    if (knobs.projectile !== 'none' && timings.travelMs > 0) {
      spawns.push({
        id: nextId(),
        atMs: clock.start.TRAVEL,
        // Flight time IS the travel stage, so arrival coincides with IMPACT.
        durationMs: timings.travelMs + 40,
        anchor: 'attackerMuzzle',
        layer: {
          kind: 'projectile',
          config: {
            durationSec: timings.travelMs / 1000,
            arcHeight: knobs.arcHeight * (palette.motionConfig.arcHeight ?? 1),
            coreScale: knobs.projectile === 'bolt' ? 0.1 : 0.17,
            trailLength: knobs.projectile === 'bolt' ? 5 : 8,
            trailWidth: knobs.projectile === 'bolt' ? 0.13 : 0.2,
            coreColor: pale,
            trailColor: primary,
            spin: knobs.projectile === 'shard' ? 12 : 0,
          },
        },
      });
    }

    if (knobs.beam) {
      const beamLife = timings.travelMs + impactSpan + 90;
      spawns.push({
        id: nextId(),
        atMs: clock.start.TRAVEL,
        durationMs: beamLife + 40,
        anchor: 'attackerMuzzle',
        layer: {
          kind: 'beam',
          config: {
            lifetime: beamLife / 1000,
            width: 0.3,
            color: pale,
            glowColor: primary,
            opacity: 0.95,
            segments: 10,
            extendRatio: Math.max(0.12, timings.travelMs / beamLife),
            wobble: palette.motionConfig.jitter ? 0.05 : 0,
          },
        },
      });
      // Motes drifting along the beam.
      spawns.push({
        id: nextId(),
        atMs: clock.start.TRAVEL + 40,
        durationMs: beamLife,
        anchor: 'midpoint',
        layer: {
          kind: 'particles',
          config: {
            count: 12,
            lifetime: 0.5,
            speed: 1.2,
            speedVariance: 0.6,
            spread: 0.5,
            scale: 0.09,
            scaleVariance: 0.4,
            rotation: 0,
            rotationSpeed: 3,
            opacity: 0.8,
            opacityFade: 0.9,
            gravity: -0.4,
            color: secondary,
            colorEnd: pale,
            texture: palette.shape,
            additive: true,
          },
        },
      });
    }

    if (knobs.wave) {
      const waveLife = timings.travelMs + impactSpan + 140;
      spawns.push({
        id: nextId(),
        atMs: clock.start.TRAVEL,
        durationMs: waveLife + 40,
        anchor: 'attackerGround',
        layer: {
          kind: 'wave',
          config: {
            lifetime: waveLife / 1000,
            width: 4.6,
            height: 1.55,
            color: primary,
            glowColor: pale,
            opacity: 0.8,
          },
        },
      });
      spawns.push({
        id: nextId(),
        atMs: clock.start.TRAVEL + 60,
        durationMs: waveLife,
        anchor: 'midpoint',
        layer: {
          kind: 'particles',
          config: {
            count: 20,
            lifetime: 0.6,
            speed: 2.4,
            speedVariance: 0.7,
            spread: 1.3,
            scale: 0.12,
            scaleVariance: 0.5,
            rotation: 0,
            rotationSpeed: 3,
            opacity: 0.85,
            opacityFade: 0.85,
            gravity: 1.4,
            color: secondary,
            colorEnd: pale,
            texture: palette.shape,
            additive: true,
            directionBias: 0.7,
          },
        },
      });
    }

    // Status delivery: a slow ring drifts to the target and collapses.
    if (profile.category === 'STATUS_APPLY') {
      spawns.push({
        id: nextId(),
        atMs: clock.start.RELEASE,
        durationMs: timings.travelMs + 120,
        anchor: 'attackerMuzzle',
        layer: {
          kind: 'projectile',
          config: {
            durationSec: Math.max(0.08, timings.travelMs / 1000),
            arcHeight: 0.22,
            coreScale: 0.09,
            trailLength: 4,
            trailWidth: 0.26,
            coreColor: pale,
            trailColor: primary,
          },
        },
      });
    }

    // ── IMPACT (per hit) ──
    for (let hit = 0; hit < hitCount; hit++) {
      const at = impactTimesMs[hit];
      // Escalating scale across a multi-hit chain.
      const growth = hitCount > 1 ? 0.8 + (hit / Math.max(1, hitCount - 1)) * 0.55 : 1;

      if (knobs.heroSheet) {
        spawns.push({
          id: nextId(),
          atMs: at,
          durationMs: 420,
          anchor: profile.category === 'HEAL' || profile.category === 'SELF_BUFF' ? 'attacker' : 'targetCore',
          layer: {
            kind: 'flipbook',
            sheet: knobs.heroSheet,
            config: {
              frames: knobs.heroSheet === 'sparkle' ? 6 : 8,
              fps: knobs.heroSheet === 'slash' ? 30 : 26,
              loop: false,
              additive: true,
              color: glow,
              scale: knobs.heroScale * growth,
              opacity: 1,
            },
            randomRotate: knobs.heroSheet === 'slash' || knobs.heroSheet === 'impact',
          },
        });
      }

      if (knobs.impactParticles > 0) {
        spawns.push({
          id: nextId(),
          atMs: at,
          durationMs: 700,
          anchor: profile.category === 'AREA_GROUND' ? 'targetGround' : 'targetCore',
          layer: {
            kind: 'particles',
            config: {
              count: Math.round(knobs.impactParticles * growth),
              lifetime: 0.55,
              speed: profile.category === 'AREA_GROUND' ? 3.4 : 4.1,
              speedVariance: 0.8,
              spread: 1.15,
              scale: 0.1,
              scaleVariance: 0.5,
              rotation: 0,
              rotationSpeed: 8,
              opacity: 1,
              opacityFade: 0.85,
              gravity: profile.category === 'AREA_GROUND' ? 3.2 : 1.4,
              color: primary,
              colorEnd: pale,
              texture: profile.category === 'AREA_GROUND' ? 'square' : palette.shape,
              additive: true,
              directionBias: knobs.contact ? 0.45 : 0.2,
            },
          },
        });
      }

      // Contact dust at the feet — sells weight for melee.
      if (knobs.contact) {
        spawns.push({
          id: nextId(),
          atMs: at,
          durationMs: 620,
          anchor: 'targetGround',
          layer: {
            kind: 'particles',
            config: {
              count: 10,
              lifetime: 0.5,
              speed: 1.7,
              speedVariance: 0.6,
              spread: 0.9,
              scale: 0.15,
              scaleVariance: 0.5,
              rotation: 0,
              rotationSpeed: 2,
              opacity: 0.6,
              opacityFade: 0.95,
              gravity: 0.9,
              color: '#cfc6b4',
              colorEnd: '#8d857a',
              texture: 'smoke',
              additive: false,
            },
          },
        });
      }

      for (let r = 0; r < knobs.ringCount; r++) {
        spawns.push({
          id: nextId(),
          atMs: at + r * 55,
          durationMs: 520,
          anchor: knobs.ringFlat ? 'targetGround' : 'targetCore',
          layer: {
            kind: 'ring',
            config: {
              count: 1,
              lifetime: 0.44,
              radius: 0.28,
              radiusGrow: (knobs.ringFlat ? 2.4 : 1.5) * growth,
              thickness: 0.14,
              color: glow,
              opacity: 0.85 - r * 0.2,
              flat: knobs.ringFlat,
            },
          },
        });
      }

      // Only the first hit gets the heavy ground furniture.
      if (hit === 0) {
        if (knobs.shockwaveRadius > 0) {
          spawns.push({
            id: nextId(),
            atMs: at,
            durationMs: 560,
            anchor: 'targetGround',
            layer: {
              kind: 'shockwave',
              config: {
                lifetime: 0.48,
                radius: knobs.shockwaveRadius,
                color: pale,
                opacity: 0.5,
                dome: knobs.shockwaveDome,
              },
            },
          });
        }

        if (knobs.decal !== 'none') {
          const frames = knobs.decal === 'crack' ? 8 : 8;
          const fps = knobs.decal === 'crack' ? 16 : 26;
          spawns.push({
            id: nextId(),
            atMs: at,
            durationMs: Math.round((frames / fps) * 1000) + 60,
            anchor: 'targetGround',
            layer: {
              kind: 'decal',
              config: {
                sheet: knobs.decal,
                frames,
                fps,
                radius: knobs.decal === 'crack' ? 1.5 : 1.9,
                color: knobs.decal === 'crack' ? '#6b625a' : glow,
                opacity: knobs.decal === 'crack' ? 0.85 : 0.6,
              },
            },
          });
        }
      }
    }
  }

  const totalMs = Math.max(clock.totalMs, lastImpact + timings.reactMs + timings.settleMs);

  return { totalMs, clock, spawns, rigCues, cameraCues, impactTimesMs };
}
