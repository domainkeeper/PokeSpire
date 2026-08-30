/**
 * Reusable VFX layer primitives.
 *
 * Composition, timing and per-move identity live in src/battle/presentation/fx.
 * This module exports only dumb, self-contained renderers.
 */

export { ParticleEffect } from './ParticleEffect';
export { RingEffect } from './RingEffect';
export { BeamEffect } from './BeamEffect';
export { TrailEffect } from './TrailEffect';
export { ProjectileEffect } from './ProjectileEffect';
export { FlipbookEffect } from './FlipbookEffect';
export { DecalEffect } from './DecalEffect';
export { ShockwaveEffect } from './ShockwaveEffect';
export { ShieldEffect } from './ShieldEffect';
export { WaveEffect } from './WaveEffect';

export { getTypePalette, TYPE_PALETTES, type TypePalette } from './presets/typePalettes';
export { STATUS_PRESETS, type StatusPreset } from './presets/statusPresets';
export { StatusOverlay } from './status/StatusOverlay';
export { useQualityStore, type QualityTier } from './quality/qualityStore';
export { getParticleTexture } from './particleTextures';

export { TYPE_COLORS, createEffectContext } from './types';
export type {
  EffectContext,
  ParticleConfig,
  ParticleTexture,
  RingConfig,
  BeamConfig,
  TrailConfig,
  ProjectileConfig,
  FlipbookConfig,
  DecalConfig,
  ShockwaveConfig,
  ShieldConfig,
  WaveConfig,
} from './types';
