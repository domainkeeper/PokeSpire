import type { PokemonType } from '../../data/pokemon/schemas/index';

/**
 * Layer primitive configs. These are the reusable building blocks the battle
 * animation director composes; they are deliberately dumb data.
 *
 * The former `EffectPreset`, `ActiveEffect`, `EffectPhase`, `EffectTimeline`,
 * `EffectRecipe` and `EffectFamily` types were removed with the parallel preset
 * architecture (presets.ts / effectRegistry.ts / recipes.ts) that nothing consumed.
 * Timing now lives in src/battle/presentation/fx as integer milliseconds only.
 */

export type ParticleTexture =
  | 'circle' | 'square' | 'diamond' | 'star' | 'leaf' | 'drop'
  | 'shard' | 'ring' | 'smoke' | 'spark' | 'wave';

export interface ParticleConfig {
  count: number;
  /** Seconds. */
  lifetime: number;
  speed: number;
  speedVariance: number;
  spread: number;
  scale: number;
  scaleVariance: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  opacityFade: number;
  gravity: number;
  color: string;
  colorEnd?: string;
  texture: ParticleTexture;
  additive?: boolean;
  /** Bias all velocities along the attack direction (0 = radial, 1 = fully directional). */
  directionBias?: number;
  /** Pull particles inward to the origin instead of pushing out (charge-up). */
  converge?: boolean;
}

export interface RingConfig {
  count: number;
  lifetime: number;
  radius: number;
  radiusGrow: number;
  thickness: number;
  color: string;
  opacity: number;
  /** Lay flat on the ground plane instead of facing the camera. */
  flat?: boolean;
}

export interface BeamConfig {
  lifetime: number;
  width: number;
  color: string;
  glowColor: string;
  opacity: number;
  segments: number;
  /** Fraction of lifetime spent extending to full length. */
  extendRatio?: number;
  /** Sine wobble amplitude, for electric/dragon beams. */
  wobble?: number;
}

export interface FlipbookConfig {
  frames: number;
  fps: number;
  loop: boolean;
  additive: boolean;
  color: string;
  scale: number;
  opacity: number;
}

export interface TrailConfig {
  maxLength: number;
  width: number;
  color: string;
  fadeOut: number;
  additive: boolean;
}

export interface ProjectileConfig {
  /** Explicit flight time in seconds. The director derives this from the TRAVEL stage
   *  so arrival and IMPACT coincide by construction rather than by callback race. */
  durationSec: number;
  arcHeight: number;
  coreScale: number;
  trailLength: number;
  trailWidth: number;
  coreColor: string;
  trailColor: string;
  /** Spin the core, for shards/bolts. */
  spin?: number;
}

export interface DecalConfig {
  /** Flipbook sheet laid flat on the ground. */
  sheet: 'crack' | 'shockring' | 'burst';
  frames: number;
  fps: number;
  radius: number;
  color: string;
  opacity: number;
}

export interface ShockwaveConfig {
  lifetime: number;
  radius: number;
  color: string;
  opacity: number;
  /** Vertical stretch: 0 = flat disc, 1 = hemisphere. */
  dome: number;
}

export interface ShieldConfig {
  lifetime: number;
  radius: number;
  color: string;
  opacity: number;
  /** Sustain at full strength before fading, seconds. */
  holdSec: number;
}

export interface WaveConfig {
  lifetime: number;
  width: number;
  height: number;
  color: string;
  glowColor: string;
  opacity: number;
}

/** Positions the director resolves before handing a layer its context. */
export interface EffectContext {
  origin: [number, number, number];
  target: [number, number, number];
  direction: [number, number, number];
  scale: number;
  intensity: number;
}

export function createEffectContext(
  origin: [number, number, number],
  target: [number, number, number],
  scale = 1,
  intensity = 1,
): EffectContext {
  const dx = target[0] - origin[0];
  const dy = target[1] - origin[1];
  const dz = target[2] - origin[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  return { origin, target, direction: [dx / len, dy / len, dz / len], scale, intensity };
}

export const TYPE_COLORS: Record<PokemonType, { primary: string; secondary: string; glow: string }> = {
  normal:   { primary: '#a8a878', secondary: '#c6c6a7', glow: '#e0e0c0' },
  fire:     { primary: '#f08030', secondary: '#f5ac78', glow: '#ff6040' },
  water:    { primary: '#6890f0', secondary: '#98d8d8', glow: '#5898f8' },
  grass:    { primary: '#78c850', secondary: '#a8e878', glow: '#60d040' },
  electric: { primary: '#f8d030', secondary: '#f8e878', glow: '#fff040' },
  ice:      { primary: '#98d8d8', secondary: '#b8e8e8', glow: '#c0f8ff' },
  fighting: { primary: '#c03028', secondary: '#d86048', glow: '#ff5040' },
  poison:   { primary: '#a040a0', secondary: '#c878c8', glow: '#d060d0' },
  ground:   { primary: '#e0c068', secondary: '#f0d888', glow: '#e8d060' },
  flying:   { primary: '#a890f0', secondary: '#c8b8f8', glow: '#b8a8ff' },
  psychic:  { primary: '#f85888', secondary: '#f8a0b8', glow: '#ff6090' },
  rock:     { primary: '#b8a038', secondary: '#d0c060', glow: '#c8b840' },
  bug:      { primary: '#a8b820', secondary: '#c8d840', glow: '#b8c820' },
  ghost:    { primary: '#705898', secondary: '#9878b8', glow: '#8868b0' },
  dragon:   { primary: '#7038f8', secondary: '#9858f8', glow: '#8848ff' },
  dark:     { primary: '#705848', secondary: '#987868', glow: '#886858' },
  steel:    { primary: '#b8b8d0', secondary: '#d0d0e8', glow: '#c8c8e0' },
  fairy:    { primary: '#ee99ac', secondary: '#f4b8c8', glow: '#ffa0b8' },
};
