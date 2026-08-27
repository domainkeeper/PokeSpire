import type { PokemonType } from '../../data/pokemon/schemas/index';

export type EffectFamily =
  | 'burst'
  | 'projectile'
  | 'beam'
  | 'cloud'
  | 'pulse'
  | 'ring'
  | 'impact'
  | 'slash'
  | 'sparkle'
  | 'swarm'
  | 'wind'
  | 'frost'
  | 'status';

export type AnchorPoint = 'attacker' | 'target' | 'midpoint' | 'travel';

export interface ParticleConfig {
  count: number;
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
}

export interface RingConfig {
  count: number;
  lifetime: number;
  radius: number;
  radiusGrow: number;
  thickness: number;
  color: string;
  opacity: number;
}

export interface BeamConfig {
  lifetime: number;
  width: number;
  color: string;
  glowColor: string;
  opacity: number;
  segments: number;
}

export interface FlipbookConfig {
  frameWidth: number;
  frameHeight: number;
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
  speed: number;
  arcHeight: number;
  coreScale: number;
  trailLength: number;
  trailWidth: number;
  coreColor: string;
  trailColor: string;
  onArrive: number;
}

export interface FlashConfig {
  color: string;
  duration: number;
  intensity?: number;
}

export interface CameraFeedbackConfig {
  shake?: number;
  punch?: number;
  hitStop?: number;
  flash?: string;
  flashOpacity?: number;
}

export interface EffectPhase {
  at: number;
  anchor: AnchorPoint;
  layer: LayerSpec;
}

export type LayerSpec =
  | { kind: 'particles'; config: ParticleConfig }
  | { kind: 'flipbook'; sheet: string; config: FlipbookConfig }
  | { kind: 'trail'; config: TrailConfig }
  | { kind: 'projectile'; config: ProjectileConfig }
  | { kind: 'beam'; config: BeamConfig }
  | { kind: 'ring'; config: RingConfig }
  | { kind: 'flash'; config: FlashConfig }
  | { kind: 'camera'; config: CameraFeedbackConfig };

export interface EffectTimeline {
  totalDuration: number;
  phases: EffectPhase[];
}

export interface EffectRecipe {
  family: EffectFamily;
  type: PokemonType;
  build: (palette: any, context: EffectContext) => EffectTimeline;
}

export interface EffectPreset {
  family: EffectFamily;
  type: PokemonType;
  duration: number;
  particles: ParticleConfig[];
  rings?: RingConfig[];
  beam?: BeamConfig;
  screenShake?: number;
  flash?: string;
}

export interface EffectContext {
  origin: [number, number, number];
  target: [number, number, number];
  direction: [number, number, number];
  scale: number;
  intensity: number;
}

export interface ActiveEffect {
  id: string;
  preset: EffectPreset;
  context: EffectContext;
  elapsed: number;
  done: boolean;
}

export type ParticleTexture = 'circle' | 'square' | 'diamond' | 'star' | 'leaf' | 'drop' | 'shard' | 'ring' | 'smoke' | 'spark' | 'wave';

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
