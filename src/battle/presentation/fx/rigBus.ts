/**
 * Rig cue bus.
 *
 * The director tells a combatant's sprite HOW to move; the rig decides how that looks.
 * A plain listener map rather than a store, because cues fire mid-frame and must not
 * trigger React renders.
 */

import type { RigMotion } from './animationTypes';

export interface RigCommand {
  motion: RigMotion;
  /** World units for translations, 0-1 intensity otherwise. */
  amount: number;
  durationMs: number;
}

type Listener = (cmd: RigCommand) => void;

const listeners = new Map<string, Set<Listener>>();

export function onRigCue(combatantId: string, listener: Listener): () => void {
  let set = listeners.get(combatantId);
  if (!set) {
    set = new Set();
    listeners.set(combatantId, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) listeners.delete(combatantId);
  };
}

export function rigCue(combatantId: string, cmd: RigCommand): void {
  const set = listeners.get(combatantId);
  if (!set) return;
  for (const l of set) l(cmd);
}

// ─── Transient visual state pushed to a rig (flash / tint / pose) ────────────
export interface RigStateCue {
  /** White hit flash, 0-1. Decays automatically. */
  flash?: number;
  /** Persistent tint colour, or null to clear. */
  tint?: string | null;
  /** Staggered pose. */
  staggered?: boolean;
  /** KO sequence. */
  fainted?: boolean;
}

type StateListener = (cue: RigStateCue) => void;
const stateListeners = new Map<string, Set<StateListener>>();

export function onRigState(combatantId: string, listener: StateListener): () => void {
  let set = stateListeners.get(combatantId);
  if (!set) {
    set = new Set();
    stateListeners.set(combatantId, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) stateListeners.delete(combatantId);
  };
}

export function rigState(combatantId: string, cue: RigStateCue): void {
  const set = stateListeners.get(combatantId);
  if (!set) return;
  for (const l of set) l(cue);
}
