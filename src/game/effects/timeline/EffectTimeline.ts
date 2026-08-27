import type { EffectTimeline, EffectPhase, AnchorPoint } from '../types';
import type { TypePalette } from '../presets/typePalettes';
import type { PokemonType } from '../../../data/pokemon/schemas/index';

export function createTimeline(totalDuration: number, phases: EffectPhase[]): EffectTimeline {
  return { totalDuration, phases };
}

export function buildSimpleTimeline(_type: PokemonType, _family: string, palette: TypePalette, duration = 0.8): EffectTimeline {
  const primaryColor = palette.colors[0];
  const secondaryColor = palette.colors[1];
  const glowColor = palette.colors[2];

  const phases: EffectPhase[] = [
    {
      at: 0,
      anchor: 'attacker',
      layer: {
        kind: 'particles',
        config: {
          count: 16,
          lifetime: duration * 0.5,
          speed: 2.0,
          speedVariance: 0.5,
          spread: 0.8,
          scale: 0.1,
          scaleVariance: 0.3,
          rotation: 0,
          rotationSpeed: 4,
          opacity: 1,
          opacityFade: 0.8,
          gravity: 0,
          color: primaryColor,
          colorEnd: secondaryColor,
          texture: palette.shape,
          additive: true,
        },
      },
    },
    {
      at: duration * 0.3,
      anchor: 'travel' as AnchorPoint,
      layer: {
        kind: 'projectile',
        config: {
          speed: 8.0,
          arcHeight: palette.motionConfig.arcHeight ?? 0.2,
          coreScale: 0.15,
          trailLength: 5,
          trailWidth: 0.08,
          coreColor: glowColor,
          trailColor: primaryColor,
          onArrive: 1,
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
          fps: 20,
          loop: false,
          additive: true,
          color: glowColor,
          scale: 1.2,
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
          radius: 0.2,
          radiusGrow: 1.5,
          thickness: 0.05,
          color: glowColor,
          opacity: 0.8,
        },
      },
    },
    {
      at: duration * 0.6,
      anchor: 'target',
      layer: {
        kind: 'camera',
        config: {
          shake: 0.05,
          punch: 0.04,
          hitStop: 50,
          flash: glowColor,
          flashOpacity: 0.2,
        },
      },
    },
  ];

  return { totalDuration: duration, phases };
}
