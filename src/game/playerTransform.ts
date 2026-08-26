/**
 * Continuous player position, shared between the Player entity (writer) and the
 * follow camera / shadow rig (readers).
 *
 * This deliberately lives outside Zustand. The store holds the *grid* cell for
 * save-game purposes and must only be written when that cell actually changes;
 * the camera and shadow frustum need the smooth sub-tile position every frame.
 * Routing per-frame motion through the store previously caused a store write on
 * every single frame, re-rendering Player 60x/sec and snapping it back to tile
 * centres via R3F's re-applied `position` prop.
 */
export interface PlayerTransform {
  /** World-space X (world units, not grid cells). */
  x: number;
  /** World-space Z (world units, not grid cells). */
  z: number;
  /** Map the values above belong to; readers use this to avoid a 1-frame jump. */
  mapId: string;
  /** True once the Player entity has placed itself for the current map. */
  ready: boolean;
}

export const playerTransform: PlayerTransform = {
  x: 0,
  z: 0,
  mapId: '',
  ready: false,
};

export function setPlayerTransform(x: number, z: number, mapId: string): void {
  playerTransform.x = x;
  playerTransform.z = z;
  playerTransform.mapId = mapId;
  playerTransform.ready = true;
}

export function invalidatePlayerTransform(): void {
  playerTransform.ready = false;
}
