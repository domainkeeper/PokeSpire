import type { EffectTimeline, EffectFamily } from '../types';
import type { TypePalette } from './typePalettes';
import type { EffectContext } from '../types';

export function buildRecipe(
  family: EffectFamily,
  palette: TypePalette,
  _context: EffectContext,
  duration = 0.8
): EffectTimeline {
  const [primary, secondary, glow] = palette.colors;

  switch (family) {
    case 'projectile':
      return {
        totalDuration: duration,
        phases: [
          {
            at: 0,
            anchor: 'attacker',
            layer: {
              kind: 'particles',
              config: {
                count: 14,
                lifetime: duration * 0.4,
                speed: 2.5,
                speedVariance: 0.5,
                spread: 0.6,
                scale: 0.1,
                scaleVariance: 0.2,
                rotation: 0,
                rotationSpeed: 5,
                opacity: 1,
                opacityFade: 0.8,
                gravity: 0,
                color: primary,
                colorEnd: secondary,
                texture: palette.shape,
                additive: true,
              },
            },
          },
          {
            at: duration * 0.2,
            anchor: 'travel' as const,
            layer: {
              kind: 'projectile',
              config: {
                speed: 9.0,
                arcHeight: palette.motionConfig.arcHeight ?? 0.2,
                coreScale: 0.15,
                trailLength: 6,
                trailWidth: 0.08,
                coreColor: glow,
                trailColor: primary,
                onArrive: 2,
              },
            },
          },
          {
            at: duration * 0.6,
            anchor: 'target',
            layer: {
              kind: 'flipbook',
              sheet: 'impact',
              config: {
                frameWidth: 32,
                frameHeight: 32,
                frames: 6,
                fps: 22,
                loop: false,
                additive: true,
                color: glow,
                scale: 1.3,
                opacity: 1,
              },
            },
          },
          {
            at: duration * 0.6,
            anchor: 'target',
            layer: {
              kind: 'ring',
              config: {
                count: 1,
                lifetime: 0.4,
                radius: 0.25,
                radiusGrow: 1.8,
                thickness: 0.06,
                color: glow,
                opacity: 0.9,
              },
            },
          },
          {
            at: duration * 0.6,
            anchor: 'target',
            layer: {
              kind: 'camera',
              config: {
                shake: 0.06,
                punch: 0.04,
                hitStop: 60,
                flash: glow,
                flashOpacity: 0.25,
              },
            },
          },
        ],
      };

    case 'slash':
      return {
        totalDuration: duration,
        phases: [
          {
            at: 0,
            anchor: 'target',
            layer: {
              kind: 'flipbook',
              sheet: 'slash',
              config: {
                frameWidth: 32,
                frameHeight: 32,
                frames: 8,
                fps: 24,
                loop: false,
                additive: true,
                color: glow,
                scale: 1.5,
                opacity: 1,
              },
            },
          },
          {
            at: 0,
            anchor: 'target',
            layer: {
              kind: 'particles',
              config: {
                count: 20,
                lifetime: duration * 0.5,
                speed: 4.0,
                speedVariance: 1.0,
                spread: 1.2,
                scale: 0.08,
                scaleVariance: 0.3,
                rotation: 0,
                rotationSpeed: 8,
                opacity: 1,
                opacityFade: 0.9,
                gravity: 0.5,
                color: primary,
                colorEnd: secondary,
                texture: 'shard',
                additive: true,
              },
            },
          },
          {
            at: 0,
            anchor: 'target',
            layer: {
              kind: 'camera',
              config: {
                shake: 0.07,
                punch: 0.05,
                hitStop: 70,
                flash: glow,
                flashOpacity: 0.3,
              },
            },
          },
        ],
      };

    default:
      return {
        totalDuration: duration,
        phases: [
          {
            at: 0,
            anchor: 'target',
            layer: {
              kind: 'particles',
              config: {
                count: 24,
                lifetime: duration * 0.6,
                speed: 3.0,
                speedVariance: 0.8,
                spread: 1.5,
                scale: 0.12,
                scaleVariance: 0.4,
                rotation: 0,
                rotationSpeed: 6,
                opacity: 1,
                opacityFade: 0.9,
                gravity: 0,
                color: primary,
                colorEnd: glow,
                texture: palette.shape,
                additive: true,
              },
            },
          },
          {
            at: 0,
            anchor: 'target',
            layer: {
              kind: 'ring',
              config: {
                count: 1,
                lifetime: 0.5,
                radius: 0.2,
                radiusGrow: 2.0,
                thickness: 0.05,
                color: glow,
                opacity: 0.8,
              },
            },
          },
          {
            at: 0,
            anchor: 'target',
            layer: {
              kind: 'camera',
              config: {
                shake: 0.05,
                punch: 0.03,
                hitStop: 40,
                flash: glow,
                flashOpacity: 0.2,
              },
            },
          },
        ],
      };
  }
}
