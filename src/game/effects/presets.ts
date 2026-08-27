import type { PokemonType } from '../../data/pokemon/schemas/index';
import type { EffectPreset, EffectFamily } from './types';
import { TYPE_COLORS } from './types';

function burst(type: PokemonType, duration = 0.6, count = 24): EffectPreset {
  const c = TYPE_COLORS[type];
  return {
    family: 'burst',
    type,
    duration,
    particles: [
      {
        count,
        lifetime: duration * 0.8,
        speed: 2.5,
        speedVariance: 0.8,
        spread: 1.2,
        scale: 0.12,
        scaleVariance: 0.6,
        rotation: 0,
        rotationSpeed: 6,
        opacity: 1,
        opacityFade: 0.8,
        gravity: 0,
        color: c.primary,
        colorEnd: c.secondary,
        texture: 'circle',
      },
      {
        count: Math.floor(count * 0.4),
        lifetime: duration * 0.5,
        speed: 4,
        speedVariance: 0.5,
        spread: 0.8,
        scale: 0.06,
        scaleVariance: 0.3,
        rotation: 0,
        rotationSpeed: 8,
        opacity: 1,
        opacityFade: 0.9,
        gravity: 0,
        color: c.glow,
        texture: 'spark',
        additive: true,
      },
    ],
    flash: c.glow,
    screenShake: 0.08,
  };
}

function projectile(type: PokemonType, duration = 0.5, count = 16): EffectPreset {
  const c = TYPE_COLORS[type];
  return {
    family: 'projectile',
    type,
    duration,
    particles: [
      {
        count,
        lifetime: duration,
        speed: 5,
        speedVariance: 0.3,
        spread: 0.2,
        scale: 0.1,
        scaleVariance: 0.3,
        rotation: 0,
        rotationSpeed: 10,
        opacity: 1,
        opacityFade: 0.7,
        gravity: 0,
        color: c.primary,
        texture: 'diamond',
      },
      {
        count: Math.floor(count * 0.3),
        lifetime: duration * 0.6,
        speed: 6,
        speedVariance: 0.2,
        spread: 0.1,
        scale: 0.06,
        scaleVariance: 0.2,
        rotation: 0,
        rotationSpeed: 12,
        opacity: 0.9,
        opacityFade: 0.9,
        gravity: 0,
        color: c.glow,
        texture: 'spark',
        additive: true,
      },
    ],
  };
}

function beam(type: PokemonType, duration = 0.5): EffectPreset {
  const c = TYPE_COLORS[type];
  return {
    family: 'beam',
    type,
    duration,
    particles: [],
    beam: {
      lifetime: duration,
      width: 0.15,
      color: c.primary,
      glowColor: c.glow,
      opacity: 0.85,
      segments: 1,
    },
    flash: c.glow,
  };
}

function cloud(type: PokemonType, duration = 0.8, count = 20): EffectPreset {
  const c = TYPE_COLORS[type];
  return {
    family: 'cloud',
    type,
    duration,
    particles: [
      {
        count,
        lifetime: duration,
        speed: 1.2,
        speedVariance: 0.8,
        spread: 1.5,
        scale: 0.18,
        scaleVariance: 0.5,
        rotation: 0,
        rotationSpeed: 2,
        opacity: 0.7,
        opacityFade: 0.6,
        gravity: -0.3,
        color: c.primary,
        colorEnd: c.secondary,
        texture: 'smoke',
      },
    ],
  };
}

function pulse(type: PokemonType, duration = 0.5): EffectPreset {
  const c = TYPE_COLORS[type];
  return {
    family: 'pulse',
    type,
    duration,
    particles: [
      {
        count: 8,
        lifetime: duration,
        speed: 3,
        speedVariance: 0.4,
        spread: 2,
        scale: 0.08,
        scaleVariance: 0.3,
        rotation: 0,
        rotationSpeed: 0,
        opacity: 0.8,
        opacityFade: 0.8,
        gravity: 0,
        color: c.primary,
        texture: 'circle',
        additive: true,
      },
    ],
    rings: [
      {
        count: 2,
        lifetime: duration * 0.7,
        radius: 0.1,
        radiusGrow: 1.5,
        thickness: 0.05,
        color: c.glow,
        opacity: 0.7,
      },
    ],
    flash: c.glow,
  };
}

function impact(type: PokemonType, duration = 0.4, count = 18): EffectPreset {
  const c = TYPE_COLORS[type];
  return {
    family: 'impact',
    type,
    duration,
    particles: [
      {
        count,
        lifetime: duration * 0.7,
        speed: 3,
        speedVariance: 0.7,
        spread: 1,
        scale: 0.1,
        scaleVariance: 0.5,
        rotation: 0,
        rotationSpeed: 8,
        opacity: 1,
        opacityFade: 0.8,
        gravity: 2,
        color: c.primary,
        texture: 'square',
      },
      {
        count: Math.floor(count * 0.5),
        lifetime: duration * 0.5,
        speed: 1,
        speedVariance: 0.5,
        spread: 2,
        scale: 0.15,
        scaleVariance: 0.3,
        rotation: 0,
        rotationSpeed: 1,
        opacity: 0.5,
        opacityFade: 0.7,
        gravity: -0.5,
        color: c.secondary,
        texture: 'smoke',
      },
    ],
    screenShake: 0.1,
  };
}

function slash(type: PokemonType, duration = 0.3, count = 12): EffectPreset {
  const c = TYPE_COLORS[type];
  return {
    family: 'slash',
    type,
    duration,
    particles: [
      {
        count,
        lifetime: duration * 0.6,
        speed: 6,
        speedVariance: 0.3,
        spread: 0.3,
        scale: 0.08,
        scaleVariance: 0.2,
        rotation: 0,
        rotationSpeed: 15,
        opacity: 1,
        opacityFade: 0.9,
        gravity: 0,
        color: c.primary,
        texture: 'diamond',
      },
    ],
    flash: c.glow,
    screenShake: 0.06,
  };
}

function sparkle(type: PokemonType, duration = 0.7, count = 30): EffectPreset {
  const c = TYPE_COLORS[type];
  return {
    family: 'sparkle',
    type,
    duration,
    particles: [
      {
        count,
        lifetime: duration,
        speed: 1.5,
        speedVariance: 1,
        spread: 2,
        scale: 0.08,
        scaleVariance: 0.5,
        rotation: 0,
        rotationSpeed: 4,
        opacity: 1,
        opacityFade: 0.7,
        gravity: -0.5,
        color: c.primary,
        colorEnd: c.glow,
        texture: 'star',
        additive: true,
      },
      {
        count: Math.floor(count * 0.3),
        lifetime: duration * 0.8,
        speed: 0.8,
        speedVariance: 0.5,
        spread: 2.5,
        scale: 0.05,
        scaleVariance: 0.4,
        rotation: 0,
        rotationSpeed: 6,
        opacity: 0.8,
        opacityFade: 0.8,
        gravity: -0.3,
        color: c.glow,
        texture: 'circle',
        additive: true,
      },
    ],
  };
}

function frost(type: PokemonType, duration = 0.6, count = 20): EffectPreset {
  const c = TYPE_COLORS[type];
  return {
    family: 'frost',
    type,
    duration,
    particles: [
      {
        count,
        lifetime: duration,
        speed: 1.5,
        speedVariance: 0.8,
        spread: 1.5,
        scale: 0.1,
        scaleVariance: 0.5,
        rotation: 0,
        rotationSpeed: 3,
        opacity: 0.9,
        opacityFade: 0.6,
        gravity: -0.8,
        color: c.primary,
        texture: 'shard',
      },
      {
        count: Math.floor(count * 0.5),
        lifetime: duration * 1.2,
        speed: 0.3,
        speedVariance: 1,
        spread: 2,
        scale: 0.06,
        scaleVariance: 0.3,
        rotation: 0,
        rotationSpeed: 1,
        opacity: 0.6,
        opacityFade: 0.5,
        gravity: -0.2,
        color: c.glow,
        texture: 'circle',
        additive: true,
      },
    ],
  };
}

function wind(type: PokemonType, duration = 0.5, count = 16): EffectPreset {
  const c = TYPE_COLORS[type];
  return {
    family: 'wind',
    type,
    duration,
    particles: [
      {
        count,
        lifetime: duration,
        speed: 4,
        speedVariance: 0.4,
        spread: 0.5,
        scale: 0.12,
        scaleVariance: 0.3,
        rotation: 0,
        rotationSpeed: 10,
        opacity: 0.7,
        opacityFade: 0.7,
        gravity: 0,
        color: c.primary,
        texture: 'diamond',
      },
      {
        count: Math.floor(count * 0.3),
        lifetime: duration * 0.8,
        speed: 5,
        speedVariance: 0.3,
        spread: 0.3,
        scale: 0.06,
        scaleVariance: 0.2,
        rotation: 0,
        rotationSpeed: 12,
        opacity: 0.5,
        opacityFade: 0.8,
        gravity: 0,
        color: c.glow,
        texture: 'spark',
        additive: true,
      },
    ],
  };
}

function swarm(type: PokemonType, duration = 0.7, count = 24): EffectPreset {
  const c = TYPE_COLORS[type];
  return {
    family: 'swarm',
    type,
    duration,
    particles: [
      {
        count,
        lifetime: duration,
        speed: 2,
        speedVariance: 1,
        spread: 1.5,
        scale: 0.06,
        scaleVariance: 0.3,
        rotation: 0,
        rotationSpeed: 8,
        opacity: 0.9,
        opacityFade: 0.7,
        gravity: 0.5,
        color: c.primary,
        texture: 'diamond',
      },
    ],
  };
}

function status(type: PokemonType, duration = 0.8, count = 14): EffectPreset {
  const c = TYPE_COLORS[type];
  return {
    family: 'status',
    type,
    duration,
    particles: [
      {
        count,
        lifetime: duration,
        speed: 0.8,
        speedVariance: 0.5,
        spread: 1,
        scale: 0.1,
        scaleVariance: 0.4,
        rotation: 0,
        rotationSpeed: 2,
        opacity: 0.7,
        opacityFade: 0.5,
        gravity: -0.3,
        color: c.primary,
        texture: 'ring',
        additive: true,
      },
    ],
    rings: [
      {
        count: 1,
        lifetime: duration * 0.8,
        radius: 0.2,
        radiusGrow: 1,
        thickness: 0.03,
        color: c.glow,
        opacity: 0.5,
      },
    ],
  };
}

export const TYPE_EFFECT_PRESETS: Record<PokemonType, Record<string, EffectPreset>> = {
  normal: {
    burst: burst('normal'),
    projectile: projectile('normal'),
    impact: impact('normal'),
    slash: slash('normal'),
    status: status('normal'),
  },
  fire: {
    burst: burst('fire'),
    projectile: projectile('fire'),
    beam: beam('fire'),
    impact: impact('fire'),
    status: status('fire'),
  },
  water: {
    burst: burst('water'),
    projectile: projectile('water'),
    beam: beam('water'),
    cloud: cloud('water'),
    impact: impact('water'),
    status: status('water'),
  },
  grass: {
    burst: burst('grass'),
    projectile: projectile('grass'),
    cloud: cloud('grass', 0.8, 20),
    impact: impact('grass'),
    status: status('grass'),
  },
  electric: {
    burst: burst('electric', 0.4, 30),
    beam: beam('electric', 0.4),
    pulse: pulse('electric'),
    impact: impact('electric', 0.35),
    status: status('electric'),
  },
  ice: {
    burst: burst('ice'),
    frost: frost('ice'),
    beam: beam('ice'),
    impact: impact('ice'),
    status: status('ice'),
  },
  fighting: {
    burst: burst('fighting', 0.35, 20),
    impact: impact('fighting', 0.3, 22),
    slash: slash('fighting'),
    status: status('fighting'),
  },
  poison: {
    cloud: cloud('poison', 1, 24),
    burst: burst('poison'),
    projectile: projectile('poison'),
    impact: impact('poison'),
    status: status('poison'),
  },
  ground: {
    impact: impact('ground', 0.5, 28),
    burst: burst('ground', 0.5, 20),
    cloud: cloud('ground', 0.6, 16),
    status: status('ground'),
  },
  flying: {
    wind: wind('flying'),
    burst: burst('flying'),
    projectile: projectile('flying'),
    impact: impact('flying'),
    status: status('flying'),
  },
  psychic: {
    pulse: pulse('psychic', 0.7),
    ring: {
      family: 'ring' as EffectFamily,
      type: 'psychic' as PokemonType,
      duration: 0.8,
      particles: [],
      rings: [
        { count: 3, lifetime: 0.7, radius: 0.1, radiusGrow: 2, thickness: 0.04, color: TYPE_COLORS.psychic.glow, opacity: 0.6 },
      ],
      flash: TYPE_COLORS.psychic.glow,
    },
    impact: impact('psychic'),
    status: status('psychic'),
  },
  rock: {
    impact: impact('rock', 0.5, 24),
    burst: burst('rock', 0.5, 20),
    cloud: cloud('rock', 0.5, 12),
    status: status('rock'),
  },
  bug: {
    swarm: swarm('bug'),
    burst: burst('bug'),
    projectile: projectile('bug'),
    impact: impact('bug'),
    status: status('bug'),
  },
  ghost: {
    pulse: pulse('ghost', 0.7),
    burst: burst('ghost', 0.7, 18),
    cloud: cloud('ghost', 0.9, 16),
    impact: impact('ghost'),
    status: status('ghost'),
  },
  dragon: {
    burst: burst('dragon', 0.6, 28),
    beam: beam('dragon', 0.6),
    projectile: projectile('dragon'),
    pulse: pulse('dragon'),
    impact: impact('dragon'),
    status: status('dragon'),
  },
  dark: {
    burst: burst('dark', 0.5, 22),
    cloud: cloud('dark', 0.7, 18),
    impact: impact('dark'),
    slash: slash('dark'),
    status: status('dark'),
  },
  steel: {
    impact: impact('steel', 0.4, 22),
    burst: burst('steel', 0.35, 18),
    projectile: projectile('steel'),
    slash: slash('steel'),
    status: status('steel'),
  },
  fairy: {
    sparkle: sparkle('fairy'),
    burst: burst('fairy', 0.7, 24),
    pulse: pulse('fairy'),
    impact: impact('fairy'),
    status: status('fairy'),
  },
};

export function getEffectPreset(type: PokemonType, family?: string): EffectPreset {
  const typePresets = TYPE_EFFECT_PRESETS[type];
  if (family && typePresets[family]) {
    return typePresets[family];
  }
  // Default: first available preset for the type
  const keys = Object.keys(typePresets);
  return typePresets[keys[0]];
}
