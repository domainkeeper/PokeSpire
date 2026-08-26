/**
 * Theme system contracts.
 *
 * Every colour, light and atmosphere value in the game is read from the active
 * Theme. Nothing in the render layer may hardcode a colour. Adding a new look
 * (new biome, new time of day, new region) is a single data file in
 * `src/theme/themes/` plus one `registerTheme` call - no render code changes.
 *
 * This is deliberately over-specified relative to what is used today so that
 * later additions (interiors, night, weather, new biomes) drop into the existing
 * shape instead of forcing a refactor.
 */

/**
 * Five-stop colour ramp, darkest to lightest.
 *
 * Pixel-art shading needs a small fixed number of bands; five covers
 * shadow / dark / base / light / highlight for every material in the game.
 */
export interface Ramp {
  darkest: string;
  dark: string;
  base: string;
  light: string;
  lightest: string;
}

/** Ordered access, so painters can index bands procedurally. */
export const RAMP_KEYS = ['darkest', 'dark', 'base', 'light', 'lightest'] as const;
export type RampKey = (typeof RAMP_KEYS)[number];

export function rampBand(ramp: Ramp, index: number): string {
  const k = RAMP_KEYS[Math.max(0, Math.min(RAMP_KEYS.length - 1, index))];
  return ramp[k];
}

export interface ThemePalette {
  /* terrain */
  grass: Ramp;
  path: Ramp;
  dirt: Ramp;
  sand: Ramp;
  stone: Ramp;
  /** Murky bed seen through the water surface. */
  waterBed: Ramp;
  /** The animated surface itself. */
  waterSurface: Ramp;
  /** Vertical faces of terraces / cliffs. */
  cliff: Ramp;

  /* props */
  foliage: Ramp;
  foliageAlt: Ramp;
  trunk: Ramp;
  rock: Ramp;
  wood: Ramp;

  /* structures */
  wall: Ramp;
  wallAlt: Ramp;
  roof: Ramp;
  roofAlt: Ramp;
  window: Ramp;
  door: Ramp;

  /* accents */
  flowers: string[];
  /** Small bright details: lanterns, signs, berries. */
  accents: string[];
}

export interface ThemeLighting {
  sun: {
    color: string;
    intensity: number;
    /** Compass direction of the sun, radians. */
    azimuth: number;
    /** Height above horizon, radians. Low = long dramatic shadows. */
    elevation: number;
  };
  ambient: { color: string; intensity: number };
  hemisphere: { sky: string; ground: string; intensity: number };
  /** Opacity of the cheap blob shadow under actors. */
  contactShadowOpacity: number;
}

export type SkylineStyle = 'hills' | 'mountains' | 'city' | 'none';

export interface ThemeSky {
  /** Vertical gradient, top to horizon. */
  top: string;
  mid: string;
  horizon: string;
  cloud: string;
  cloudShade: string;
  /** Distant parallax silhouette bands, far to near. */
  skylineFar: string;
  skylineMid: string;
  skylineNear: string;
  skylineStyle: SkylineStyle;
  /** Optional low sun / moon disc. */
  disc?: { color: string; x: number; y: number; radius: number };
  /** Horizontal band of water on the horizon (coastal themes). */
  sea?: { color: string; shimmer: string };
}

export interface ThemeFog {
  color: string;
  near: number;
  far: number;
  enabled: boolean;
}

export interface Theme {
  id: string;
  name: string;
  /** Clear colour behind everything. */
  background: string;
  palette: ThemePalette;
  lighting: ThemeLighting;
  sky: ThemeSky;
  fog: ThemeFog;
  water: {
    /** Multiplied over the surface texture. Keep near-white unless tinting. */
    tint: string;
    opacity: number;
  };
}
