/**
 * Shared battle UI tokens.
 *
 * All battle UI is a DOM overlay above the single Canvas. Screen anchors are constants
 * because the battle camera is deliberately fixed (no orbiting), so world->screen
 * projection for damage numbers and banners does not need to be plumbed out of the
 * Canvas every frame.
 */

export const UI = {
  font: "'Segoe UI', 'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'Consolas', monospace",

  hp: {
    high: '#3ddc84',
    mid: '#f5c542',
    low: '#ff5c5c',
    track: '#1b2433',
    ghost: 'rgba(255,255,255,0.34)',
  },
  poise: {
    fill: '#8fd8ff',
    full: '#bfe9ff',
    broken: '#ff9f43',
    track: '#182231',
  },
  panel: 'rgba(14,20,32,0.86)',
  panelSolid: '#0e1420',
  border: 'rgba(150,175,210,0.22)',
  text: '#e8eef7',
  textDim: '#93a4bd',
  accent: '#5aa9ff',
  danger: '#ff5c5c',
} as const;

/** Normalised screen anchors (percent) for the two combatant positions. */
export const SCREEN_ANCHOR = {
  player: { x: 30, y: 62 },
  enemy: { x: 70, y: 47 },
} as const;

export function hpColor(fraction: number): string {
  if (fraction > 0.5) return UI.hp.high;
  if (fraction > 0.2) return UI.hp.mid;
  return UI.hp.low;
}

export const CATEGORY_LABEL: Record<string, string> = {
  physical: 'PHYS',
  special: 'SPEC',
  status: 'STAT',
};

export const INTENT_LABEL: Record<string, string> = {
  PHYSICAL: 'PHYSICAL',
  SPECIAL: 'SPECIAL',
  STATUS: 'STATUS',
  GUARD: 'GUARD',
  SWITCH: 'SWITCH',
};

export const INTENT_COLOR: Record<string, string> = {
  PHYSICAL: '#ff8a5c',
  SPECIAL: '#5aa9ff',
  STATUS: '#c58aff',
  GUARD: '#7de3b8',
  SWITCH: '#f5c542',
};
