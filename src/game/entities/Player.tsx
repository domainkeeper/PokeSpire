import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../state/gameStore';
import {
  buildBlockedGrid,
  gridToWorld,
  canMoveTo,
  findNearestWalkable,
  type BlockedGrid,
} from '../../utils/gridUtils';
import {
  PLAYER_SPEED,
  PLAYER_ACCELERATION,
  PLAYER_DECELERATION,
  TILE_SIZE,
} from '../../utils/constants';
import type { GameMap } from '../../data/mapTypes';
import type { Theme } from '../../theme/types';
import {
  createDirectionTexture,
  setFrame,
  preloadManifest,
  PLAYER_MANIFEST,
  ALL_DIRS,
  type Dir8,
} from '../pixel/sprites/characterSprites';
import { SpriteActor } from './SpriteActor';
import { buildTerrain } from '../terrain/heightfield';
import { setPlayerTransform } from '../playerTransform';

interface PlayerProps {
  mapData: GameMap;
  theme: Theme;
  onExitCheck?: (gx: number, gy: number) => void;
}

/** Movement vector -> one of 8 compass facings (PLAN.md 5). */
function computeDir8(dx: number, dz: number): Dir8 {
  if (dx === 0 && dz === 0) return 'down';
  const angle = Math.atan2(dx, dz) * (180 / Math.PI);
  if (angle >= -22.5 && angle < 22.5) return 'down';
  if (angle >= 22.5 && angle < 67.5) return 'down_right';
  if (angle >= 67.5 && angle < 112.5) return 'right';
  if (angle >= 112.5 && angle < 157.5) return 'up_right';
  if (angle >= 157.5 || angle < -157.5) return 'up';
  if (angle >= -157.5 && angle < -112.5) return 'up_left';
  if (angle >= -112.5 && angle < -67.5) return 'left';
  return 'down_left';
}

function dirToFacing4(dir: Dir8): 'up' | 'down' | 'left' | 'right' {
  if (dir === 'up' || dir === 'up_left' || dir === 'up_right') return 'up';
  if (dir === 'left') return 'left';
  if (dir === 'right') return 'right';
  return 'down';
}

// Source frames are 32x32; a square quad keeps the sprite unstretched.
const SPRITE_SIZE = 0.78;

const MOVE_KEYS = new Set([
  'w',
  'a',
  's',
  'd',
  'arrowup',
  'arrowdown',
  'arrowleft',
  'arrowright',
]);

export function Player({ mapData, theme, onExitCheck }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector3());
  const keysDown = useRef(new Set<string>());
  const joystickDir = useRef({ dx: 0, dz: 0 });
  const currentDir = useRef<Dir8>('down');
  const walkFrame = useRef(0);
  const walkTimer = useRef(0);
  const lastKey = useRef('');

  // Only write to the store when the grid cell or facing actually changes.
  const publishedCell = useRef({ gx: -1, gy: -1, facing: '' });
  // Fire an exit exactly once per entry, instead of scheduling a timer per frame.
  const exitLatched = useRef(false);
  const placedForMap = useRef<string | null>(null);

  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition);

  const blocked = useMemo<BlockedGrid>(() => buildBlockedGrid(mapData), [mapData]);
  const terrain = useMemo(() => buildTerrain(mapData), [mapData]);

  /*
   * The player owns private texture instances, one per direction. setFrame
   * mutates texture.offset, so sharing textures with NPCs made every NPC animate
   * in lockstep with the player's walk cycle.
   */
  const textures = useMemo(() => {
    preloadManifest(PLAYER_MANIFEST);
    const m = new Map<Dir8, THREE.Texture>();
    for (const d of ALL_DIRS) m.set(d, createDirectionTexture(PLAYER_MANIFEST, d));
    return m;
  }, []);

  useEffect(() => {
    const owned = textures;
    return () => {
      for (const t of owned.values()) t.dispose();
    };
  }, [textures]);

  // Active direction sheet. Swapped imperatively via SpriteActor's textureRef,
  // so changing direction costs no React re-render.
  const activeTexture = useRef<THREE.Texture | undefined>(textures.get('down'));

  const canStep = useCallback(
    (fromGx: number, fromGy: number, wx: number, wz: number): boolean => {
      const gx = Math.round(wx / TILE_SIZE);
      const gy = Math.round(wz / TILE_SIZE);
      return canMoveTo(blocked, fromGx, fromGy, gx, gy);
    },
    [blocked],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (MOVE_KEYS.has(k)) {
        keysDown.current.add(k);
        // Stop arrow keys scrolling the page behind the canvas.
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keysDown.current.delete(e.key.toLowerCase());
    // Without this, held keys stick forever when the window loses focus.
    const onBlur = () => keysDown.current.clear();

    const onJoystickMove = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        joystickDir.current = { dx: detail.dx, dz: detail.dz };
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('joystick-move', onJoystickMove as EventListener);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('joystick-move', onJoystickMove as EventListener);
    };
  }, []);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;

    // --- placement / map change ---------------------------------------------
    if (placedForMap.current !== mapData.name) {
      const stored = useGameStore.getState().player;
      const [rx, ry] =
        findNearestWalkable(blocked, stored.x, stored.y) ?? [stored.x, stored.y];
      const [sx, , sz] = gridToWorld(rx, ry);
      g.position.set(sx, terrain.heightAt(rx, ry), sz);
      velocity.current.set(0, 0, 0);
      placedForMap.current = mapData.name;
      publishedCell.current = { gx: -1, gy: -1, facing: '' };
      // Don't immediately re-trigger the exit we just arrived through.
      exitLatched.current = true;
      setPlayerTransform(sx, sz, mapData.name);
    }

    // --- input --------------------------------------------------------------
    const keys = keysDown.current;
    let dx = 0;
    let dz = 0;
    if (keys.has('w') || keys.has('arrowup')) dz -= 1;
    if (keys.has('s') || keys.has('arrowdown')) dz += 1;
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
    if (keys.has('d') || keys.has('arrowright')) dx += 1;

    // Blend in virtual joystick input
    const joy = joystickDir.current;
    if (joy.dx !== 0 || joy.dz !== 0) {
      dx += joy.dx;
      dz += joy.dz;
    }

    const isMoving = dx !== 0 || dz !== 0;
    const len = Math.hypot(dx, dz);
    if (len > 0) {
      dx /= len;
      dz /= len;
      currentDir.current = computeDir8(dx, dz);
    }

    // --- movement, wall sliding, cliff rejection ---------------------------
    const vel = velocity.current;
    const target = isMoving ? PLAYER_SPEED : 0;
    const accel = isMoving ? PLAYER_ACCELERATION : PLAYER_DECELERATION;
    const t = Math.min(accel * delta, 1);
    vel.x += (dx * target - vel.x) * t;
    vel.z += (dz * target - vel.z) * t;

    const curGx = Math.round(g.position.x / TILE_SIZE);
    const curGy = Math.round(g.position.z / TILE_SIZE);

    const nextX = g.position.x + vel.x * delta;
    const nextZ = g.position.z + vel.z * delta;

    if (canStep(curGx, curGy, nextX, g.position.z)) g.position.x = nextX;
    else vel.x = 0;
    if (canStep(curGx, curGy, g.position.x, nextZ)) g.position.z = nextZ;
    else vel.z = 0;

    // --- grounding ----------------------------------------------------------
    const gx = Math.round(g.position.x / TILE_SIZE);
    const gy = Math.round(g.position.z / TILE_SIZE);
    const groundY = terrain.heightAt(gx, gy);
    // Ease onto terraces so stepping up a ledge is smooth, not a snap.
    g.position.y += (groundY - g.position.y) * Math.min(14 * delta, 1);

    // --- animation ----------------------------------------------------------
    if (isMoving) {
      walkTimer.current += delta;
      if (walkTimer.current > PLAYER_MANIFEST.frameDuration) {
        walkTimer.current = 0;
        walkFrame.current = (walkFrame.current + 1) % PLAYER_MANIFEST.frames;
      }
    } else {
      walkFrame.current = 0;
      walkTimer.current = 0;
    }

    const dir = currentDir.current;
    const frame = isMoving ? walkFrame.current : 0;
    const key = `${dir}:${frame}`;
    if (key !== lastKey.current) {
      lastKey.current = key;
      const tex = textures.get(dir);
      if (tex) {
        setFrame(tex, PLAYER_MANIFEST, frame);
        activeTexture.current = tex;
      }
    }

    // --- publish continuous position (camera + sun rig read this) ----------
    setPlayerTransform(g.position.x, g.position.z, mapData.name);

    // --- publish grid cell, only on change ---------------------------------
    const facing4 = dirToFacing4(dir);
    const pub = publishedCell.current;
    if (gx !== pub.gx || gy !== pub.gy || facing4 !== pub.facing) {
      pub.gx = gx;
      pub.gy = gy;
      pub.facing = facing4;
      setPlayerPosition(gx, gy, facing4, mapData.name);

      const inExit = mapData.exits.some(
        (e) => gx >= e.x && gx < e.x + e.w && gy >= e.y && gy < e.y + e.h,
      );
      if (inExit && !exitLatched.current) {
        exitLatched.current = true;
        onExitCheck?.(gx, gy);
      } else if (!inExit) {
        exitLatched.current = false;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <SpriteActor
        texture={textures.get('down')}
        textureRef={activeTexture}
        width={SPRITE_SIZE}
        height={SPRITE_SIZE}
        layers={4}
        layerGap={0.02}
        contactShadow={0.26}
        contactShadowOpacity={theme.lighting.contactShadowOpacity}
      />
    </group>
  );
}
