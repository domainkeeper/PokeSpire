/**
 * Camera + screen FX bus and the single-writer camera rig.
 *
 * FIXES B15 - BattleScreen mounted OrbitControls (writing the camera transform every
 * frame) alongside CameraFeedback (caching an initial position and writing absolute
 * positions). The two fought each other and directed combat camera work was impossible.
 *
 * Here there is exactly ONE writer. A fixed base rig plus additive channels:
 *   shake   - random offset, ignores hit-stop so impacts jolt
 *   punch   - brief push along the view axis
 *   dolly   - sustained push-in during contact
 *   framing - eased target/position for scripted framing
 *
 * Screen-space flash is a DOM overlay, not a world plane: the old FlashEffect was a
 * 50x50 plane at z=-5 while the camera sat at z~7, so it rendered BEHIND the
 * combatants and could never function as a hit flash.
 */

import * as THREE from 'three';
import { battleClock } from './battleClock';

// ─── Camera channels ────────────────────────────────────────────────────────
export interface CameraCue {
  /** Peak random offset in world units. */
  shake?: number;
  /** Brief push along the view axis. */
  punch?: number;
  /** Sustained push-in, world units. */
  dolly?: number;
  /** Duration of the dolly hold, ms. */
  dollyMs?: number;
}

interface CameraState {
  shakeAmp: number;
  shakeTime: number;
  shakeDuration: number;
  punchAmp: number;
  punchTime: number;
  punchDuration: number;
  dollyTarget: number;
  dollyCurrent: number;
  dollyTime: number;
  dollyDuration: number;
}

const camera: CameraState = {
  shakeAmp: 0,
  shakeTime: 0,
  shakeDuration: 0,
  punchAmp: 0,
  punchTime: 0,
  punchDuration: 0,
  dollyTarget: 0,
  dollyCurrent: 0,
  dollyTime: 0,
  dollyDuration: 0,
};

const SHAKE_DURATION = 0.22;
const PUNCH_DURATION = 0.12;

/** Larger shake replaces a smaller active one; shakes never stack. */
export function cameraCue(cue: CameraCue): void {
  if (cue.shake && cue.shake > camera.shakeAmp * remainingFactor(camera.shakeTime, camera.shakeDuration)) {
    camera.shakeAmp = cue.shake;
    camera.shakeTime = 0;
    camera.shakeDuration = SHAKE_DURATION;
  }
  if (cue.punch && cue.punch > camera.punchAmp * remainingFactor(camera.punchTime, camera.punchDuration)) {
    camera.punchAmp = cue.punch;
    camera.punchTime = 0;
    camera.punchDuration = PUNCH_DURATION;
  }
  if (cue.dolly !== undefined) {
    camera.dollyTarget = cue.dolly;
    camera.dollyTime = 0;
    camera.dollyDuration = (cue.dollyMs ?? 300) / 1000;
  }
}

function remainingFactor(time: number, duration: number): number {
  if (duration <= 0) return 0;
  return Math.max(0, 1 - time / duration);
}

export function resetCamera(): void {
  camera.shakeAmp = 0;
  camera.shakeTime = 0;
  camera.punchAmp = 0;
  camera.punchTime = 0;
  camera.dollyTarget = 0;
  camera.dollyCurrent = 0;
}

/**
 * Compute the additive camera offset for this frame.
 * `rawDelta` is unscaled on purpose: shake must survive hit-stop.
 */
export function advanceCamera(rawDelta: number): { offset: THREE.Vector3; dolly: number } {
  let x = 0;
  let y = 0;

  if (camera.shakeTime < camera.shakeDuration) {
    camera.shakeTime += rawDelta;
    const t = Math.min(1, camera.shakeTime / camera.shakeDuration);
    // Decaying, sign-alternating so it reads as a vibration rather than drift.
    const decay = (1 - t) * (1 - t);
    const amp = camera.shakeAmp * decay;
    x = (Math.random() - 0.5) * 2 * amp;
    y = (Math.random() - 0.5) * 2 * amp * 0.7;
  } else {
    camera.shakeAmp = 0;
  }

  let punch = 0;
  if (camera.punchTime < camera.punchDuration) {
    camera.punchTime += rawDelta;
    const t = Math.min(1, camera.punchTime / camera.punchDuration);
    punch = camera.punchAmp * Math.sin(t * Math.PI);
  } else {
    camera.punchAmp = 0;
  }

  // Dolly eases in then releases.
  if (camera.dollyDuration > 0) {
    camera.dollyTime += rawDelta;
    const t = camera.dollyTime / camera.dollyDuration;
    if (t >= 1) {
      camera.dollyTarget = 0;
      camera.dollyDuration = 0;
    }
  }
  camera.dollyCurrent += (camera.dollyTarget - camera.dollyCurrent) * Math.min(1, rawDelta * 8);

  return { offset: new THREE.Vector3(x, y, 0), dolly: camera.dollyCurrent + punch };
}

// ─── Screen FX (DOM overlay) ────────────────────────────────────────────────
export interface ScreenFxCue {
  kind: 'flash' | 'vignette' | 'speedlines' | 'desaturate';
  color?: string;
  /** Peak opacity 0-1. */
  intensity: number;
  durationMs: number;
}

type ScreenFxListener = (cue: ScreenFxCue) => void;
const screenListeners = new Set<ScreenFxListener>();

export function onScreenFx(listener: ScreenFxListener): () => void {
  screenListeners.add(listener);
  return () => screenListeners.delete(listener);
}

export function screenFx(cue: ScreenFxCue): void {
  for (const l of screenListeners) l(cue);
}

// ─── Damage numbers / banners (DOM overlay, world-projected) ────────────────
export interface FloatingNumberCue {
  id: number;
  text: string;
  /** World position to project from. */
  world: [number, number, number];
  variant: 'normal' | 'critical' | 'break' | 'resisted' | 'heal' | 'status';
  scale: number;
}

type FloatingListener = (cue: FloatingNumberCue) => void;
const floatingListeners = new Set<FloatingListener>();
let floatingId = 0;

export function onFloatingNumber(listener: FloatingListener): () => void {
  floatingListeners.add(listener);
  return () => floatingListeners.delete(listener);
}

export function floatingNumber(cue: Omit<FloatingNumberCue, 'id'>): void {
  const full = { ...cue, id: ++floatingId };
  for (const l of floatingListeners) l(full);
}

// ─── Convenience: the impact-tier feedback table ────────────────────────────
/**
 * Impact through CONTRAST, not volume. Shake is PROHIBITED on misses, immunities,
 * resisted hits, status application, stat changes, healing, Guard, switching and
 * end-of-turn ticks. Flash only at T3/T4/Break.
 */
export const IMPACT_FEEDBACK = {
  T0: { hitStop: 0, shake: 0, punch: 0, flash: 0, numberScale: 0.85 },
  T1: { hitStop: 55, shake: 0.05, punch: 0.03, flash: 0, numberScale: 1 },
  T2: { hitStop: 75, shake: 0.07, punch: 0.045, flash: 0, numberScale: 1.15 },
  T3: { hitStop: 100, shake: 0.1, punch: 0.065, flash: 0.06, numberScale: 1.5 },
  T4: { hitStop: 130, shake: 0.11, punch: 0.07, flash: 0.1, numberScale: 1.6 },
} as const;

export function isFrozen(): boolean {
  return battleClock.timeScale === 0;
}
