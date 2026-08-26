export const TILE_SIZE = 0.125;

export const PLAYER_SPEED = 0.6;
export const PLAYER_ACCELERATION = 10;
export const PLAYER_DECELERATION = 16;

export const MAP_TOWN = 'town';
export const MAP_ROUTE1 = 'route1';

// Camera rig. These are now the single source of truth for FollowCamera; they
// previously existed but were unused while FollowCamera hardcoded 4.5 / 4.0.
// Values below preserve the framing that was actually shipping.
export const CAMERA_HEIGHT = 4.5;
export const CAMERA_DISTANCE = 4.0;
export const CAMERA_LERP = 6;

export const FOG_NEAR = 20;
export const FOG_FAR = 35;

/**
 * How far below land level water sits, in world units (~1.1 tiles).
 * The terrain is a terraced heightfield, so this produces a real bank face
 * instead of the old coplanar "blue rectangle".
 */
export const WATER_DEPTH = 0.14;
/** Water surface sits above the bed but below the shore. */
export const WATER_SURFACE_DEPTH = WATER_DEPTH * 0.35;

/**
 * Vertical size of one authored elevation step, in world units.
 * Roughly 1.5 micro-tiles: readable as a terrace without becoming a wall.
 */
export const ELEVATION_STEP = 0.19;

/**
 * Micro-tiles per terrain mesh cell. Elevation and collision are authored at
 * micro-tile resolution; the mesh is built at this coarser resolution so the
 * terraced geometry stays cheap (town: 150x150 cells rather than 300x300).
 */
export const TERRAIN_CELL = 2;

/**
 * Largest elevation difference the player can walk up/down in one step.
 * Anything steeper is a cliff and blocks movement.
 */
export const MAX_CLIMB_STEPS = 1;

export const PLAYER_SPRITE_W = 2.0;
export const PLAYER_SPRITE_H = 3.0;
