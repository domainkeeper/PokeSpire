import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../state/gameStore';
import { buildBlockedGrid, gridToWorld } from '../../utils/gridUtils';
import {
  PLAYER_SPEED,
  PLAYER_ACCELERATION,
  PLAYER_DECELERATION,
  PLAYER_SPRITE_W,
  PLAYER_SPRITE_H,
  TILE_SIZE,
} from '../../utils/constants';
import { makePlayerSprite } from '../pixel/sprites/characterSprites';
import type { Dir8, WalkFrame } from '../pixel/sprites/characterSprites';
import type { GameMap } from '../../data/mapTypes';

interface PlayerProps {
  mapData: GameMap;
  onExitCheck?: (gx: number, gy: number) => void;
}

function computeDir8(dx: number, dz: number): Dir8 {
  if (dx === 0 && dz === 0) return 'down';
  const angle = Math.atan2(dx, -dz) * (180 / Math.PI);
  if (angle >= -22.5 && angle < 22.5) return 'down';
  if (angle >= 22.5 && angle < 67.5) return 'down_right';
  if (angle >= 67.5 && angle < 112.5) return 'right';
  if (angle >= 112.5 && angle < 157.5) return 'up_right';
  if (angle >= 157.5 || angle < -157.5) return 'up';
  if (angle >= -157.5 && angle < -112.5) return 'up_left';
  if (angle >= -112.5 && angle < -67.5) return 'left';
  if (angle >= -67.5 && angle < -22.5) return 'down_left';
  return 'down';
}

export function Player({ mapData, onExitCheck }: PlayerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const velocity = useRef(new THREE.Vector3());
  const walkPhase = useRef(0);
  const keysDown = useRef(new Set<string>());
  const currentDir = useRef<Dir8>('down');
  const currentFrame = useRef<WalkFrame>(0);

  const player = useGameStore((s) => s.player);
  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition);

  const blocked = useMemo(
    () => buildBlockedGrid(mapData.width, mapData.height, mapData.objects),
    [mapData],
  );

  const wp = gridToWorld(player.x, player.y);

  const mat = useRef<THREE.MeshBasicMaterial>(
    new THREE.MeshBasicMaterial({
      map: makePlayerSprite('down', 'idle', 0),
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
      depthWrite: true,
    }),
  );

  const checkCollision = useCallback(
    (wx: number, wz: number): boolean => {
      const gx = Math.round(wx / TILE_SIZE);
      const gz = Math.round(wz / TILE_SIZE);
      if (gx < 0 || gx >= mapData.width || gz < 0 || gz >= mapData.height) return true;
      return blocked[gz]?.[gx] ?? true;
    },
    [blocked, mapData],
  );

  const checkExit = useCallback(
    (wx: number, wz: number, dir: Dir8) => {
      const gx = Math.round(wx / TILE_SIZE);
      const gz = Math.round(wz / TILE_SIZE);
      if (gx < 0 || gx >= mapData.width || gz < 0 || gz >= mapData.height) return;
      const facing4 = dir.includes('up') ? 'up' : dir.includes('down') ? 'down' : dir.includes('left') ? 'left' : 'right';
      setPlayerPosition(gx, gz, facing4 as 'up' | 'down' | 'left' | 'right', mapData.name);
      if (onExitCheck) {
        const exit = mapData.exits.find(
          (e) => gx >= e.x && gx < e.x + e.w && gz >= e.y && gz < e.y + e.h,
        );
        if (exit) {
          setTimeout(() => onExitCheck(gx, gz), 100);
        }
      }
    },
    [mapData, setPlayerPosition, onExitCheck],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        keysDown.current.add(k);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysDown.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const keys = keysDown.current;
    let dx = 0;
    let dz = 0;

    if (keys.has('w') || keys.has('arrowup')) dz = -1;
    if (keys.has('s') || keys.has('arrowdown')) dz = 1;
    if (keys.has('a') || keys.has('arrowleft')) dx = -1;
    if (keys.has('d') || keys.has('arrowright')) dx = 1;

    const isMoving = dx !== 0 || dz !== 0;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) {
      dx /= len;
      dz /= len;
    }

    if (isMoving) {
      currentDir.current = computeDir8(dx, dz);
    }

    const vel = velocity.current;
    const targetSpeed = isMoving ? PLAYER_SPEED : 0;
    const accel = isMoving ? PLAYER_ACCELERATION : PLAYER_DECELERATION;

    vel.x += (dx * targetSpeed - vel.x) * Math.min(accel * delta, 1);
    vel.z += (dz * targetSpeed - vel.z) * Math.min(accel * delta, 1);

    const pos = meshRef.current.position;
    const newX = pos.x + vel.x * delta;
    const newZ = pos.z + vel.z * delta;

    const canMoveX = !checkCollision(newX, pos.z);
    const canMoveZ = !checkCollision(pos.x, newZ);

    if (canMoveX) {
      pos.x = newX;
    } else {
      vel.x = 0;
    }
    if (canMoveZ) {
      pos.z = newZ;
    } else {
      vel.z = 0;
    }

    const gx = Math.round(pos.x / TILE_SIZE);
    const gz = Math.round(pos.z / TILE_SIZE);
    const facing4 = currentDir.current.includes('up') ? 'up' : currentDir.current.includes('down') ? 'down' : currentDir.current.includes('left') ? 'left' : 'right';
    if (gx !== player.x || gz !== player.y || facing4 !== player.facing) {
      setPlayerPosition(gx, gz, facing4 as 'up' | 'down' | 'left' | 'right', mapData.name);
    }

    checkExit(pos.x, pos.z, currentDir.current);

    const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    const animState: 'idle' | 'walk' = speed > 0.05 ? 'walk' : 'idle';

    if (animState === 'walk') {
      walkPhase.current += delta * 8;
      currentFrame.current = Math.floor(walkPhase.current) % 4 as WalkFrame;
    } else {
      walkPhase.current = 0;
      currentFrame.current = 0;
    }

    const bobAmount = animState === 'walk'
      ? Math.sin(walkPhase.current * 2) * 0.02
      : Math.sin(Date.now() * 0.0015) * 0.01;
    pos.y = PLAYER_SPRITE_H * 0.15 + bobAmount;

    const newTex = makePlayerSprite(currentDir.current, animState, currentFrame.current);
    mat.current.map = newTex;
    mat.current.needsUpdate = true;

    meshRef.current.scale.x = 1;
  });

  return (
    <mesh
      ref={meshRef}
      position={[wp[0], PLAYER_SPRITE_H * 0.15, wp[2]]}
      material={mat.current}
      renderOrder={9999}
    >
      <planeGeometry args={[PLAYER_SPRITE_W, PLAYER_SPRITE_H]} />
    </mesh>
  );
}
