import { useSyncExternalStore } from 'react';
import type { Theme } from './types';
import { coastalDay } from './themes/coastalDay';
import { duskCity } from './themes/duskCity';
import { forestDay } from './themes/forestDay';
import { duskOutskirts } from './themes/duskOutskirts';
import type { GameMap } from '../data/mapTypes';
import { resolveThemeId } from '../data/mapTypes';

export type { Theme, ThemePalette, Ramp, ThemeLighting, ThemeSky, ThemeFog } from './types';
export { rampBand, RAMP_KEYS } from './types';

/**
 * Theme registry.
 *
 * Register once at module load; look up by id anywhere. A map declares its theme
 * by id (see GameMap.themeId), so re-skinning a region is a data edit.
 *
 * To add a theme:
 *   1. create `src/theme/themes/myTheme.ts` exporting a Theme
 *   2. registerTheme(myTheme) below
 * Nothing else changes.
 */
const registry = new Map<string, Theme>();

export function registerTheme(theme: Theme): void {
  registry.set(theme.id, theme);
}

registerTheme(coastalDay);
registerTheme(duskCity);
registerTheme(forestDay);
registerTheme(duskOutskirts);

export const DEFAULT_THEME_ID = coastalDay.id;

export function getTheme(id: string | undefined): Theme {
  if (!id) return registry.get(DEFAULT_THEME_ID)!;
  const t = registry.get(id);
  if (!t) {
    console.warn(`[theme] unknown theme "${id}", falling back to ${DEFAULT_THEME_ID}`);
    return registry.get(DEFAULT_THEME_ID)!;
  }
  return t;
}

export function listThemes(): Theme[] {
  return [...registry.values()];
}

/* ------------------------------------------------------------- active ---- */

/*
 * The active theme is kept outside React so non-React code (texture generators,
 * prop factories) can read it synchronously, with a subscription so React
 * components re-render on change.
 */
let activeThemeId = DEFAULT_THEME_ID;
const listeners = new Set<() => void>();

export function getActiveTheme(): Theme {
  return getTheme(activeThemeId);
}

export function getActiveThemeId(): string {
  return activeThemeId;
}

export function setActiveTheme(id: string): void {
  if (id === activeThemeId) return;
  if (!registry.has(id)) {
    console.warn(`[theme] cannot activate unknown theme "${id}"`);
    return;
  }
  activeThemeId = id;
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** React hook. Re-renders the caller whenever the active theme changes. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getActiveTheme, getActiveTheme);
}

export function useActiveThemeId(): string {
  return useSyncExternalStore(subscribe, getActiveThemeId, getActiveThemeId);
}

/* ------------------------------------------------------------------ map override ---- */

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function deepMerge<T>(base: T, patch: unknown): T {
  if (!isObj(patch)) return base;
  const out: Record<string, unknown> = Array.isArray(base) ? [...(base as unknown[])] as never : { ...(base as object) } as never;
  for (const k of Object.keys(patch)) {
    const bv = (out as Record<string, unknown>)[k];
    const pv = (patch as Record<string, unknown>)[k];
    out[k] = isObj(bv) && isObj(pv) ? deepMerge(bv, pv) : pv;   // arrays replaced wholesale
  }
  return out as T;
}

/** Full theme for a map: base (by id/region) + optional deep-merged override. */
export function resolveMapTheme(map: GameMap, playerX?: number): Theme {
  const base = getTheme(resolveThemeId(map, playerX));
  if (!map.themeOverride) return base;
  const merged = deepMerge(base, map.themeOverride);
  merged.id = `${base.id}#${map.name}`; // unique id so id-keyed caches don't collide
  return merged;
}
