/**
 * Battle clock: hit-stop timescale.
 *
 * FIXES B14/A4 - recipes emitted `hitStop: 40-70` and CameraFeedback read it and threw
 * it away. Nothing was ever frozen.
 *
 * Deliberately a plain module, not a store: this is read every frame by every animated
 * consumer, so it must not trigger React renders. Rule: hit-stop freezes combatant
 * animation and particles; camera shake explicitly ignores it, which is what makes an
 * impact read as a jolt rather than a pause.
 */

export const battleClock = {
  /** 0 = frozen, 1 = normal, >1 = fast-forward. Multiply your delta by this. */
  timeScale: 1,
  /** Player-facing speed control, independent of hit-stop. */
  playbackRate: 1,
  /** Remaining hit-stop, seconds. */
  hitStopRemaining: 0,
};

/** Larger hit-stop wins; they never accumulate. */
export function requestHitStop(durationMs: number): void {
  const seconds = Math.max(0, durationMs) / 1000;
  if (seconds > battleClock.hitStopRemaining) battleClock.hitStopRemaining = seconds;
}

export function setPlaybackRate(rate: number): void {
  battleClock.playbackRate = Math.max(0.25, Math.min(8, rate));
}

export function clearHitStop(): void {
  battleClock.hitStopRemaining = 0;
  battleClock.timeScale = battleClock.playbackRate;
}

/**
 * Advance the clock. Called exactly once per frame by <BattleClockDriver/>, using the
 * raw unscaled delta.
 *
 * The budget is decremented BEFORE deciding timeScale, so the frame that exhausts the
 * hit-stop is also the frame that releases it. Deciding first would freeze for one
 * extra frame every single hit.
 */
export function advanceClock(rawDelta: number): void {
  if (battleClock.hitStopRemaining > 0) {
    battleClock.hitStopRemaining = Math.max(0, battleClock.hitStopRemaining - rawDelta);
  }
  battleClock.timeScale = battleClock.hitStopRemaining > 0 ? 0 : battleClock.playbackRate;
}

/** Scaled delta for anything that should freeze during hit-stop. */
export function scaledDelta(rawDelta: number): number {
  return rawDelta * battleClock.timeScale;
}

export function resetClock(): void {
  battleClock.timeScale = 1;
  battleClock.playbackRate = 1;
  battleClock.hitStopRemaining = 0;
}
