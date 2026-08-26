import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../state/gameStore';
import { buildBlockedGrid, gridToWorld } from '../../utils/gridUtils';
import {
  PLAYER_SPEED,
  PLAYER_ACCELERATION,
  PLAYER_DECELERATION,
  TILE_SIZE,
} from '../../utils/constants';
import { Character3D } from './Character3D';
import type { GameMap } from '../../data/mapTypes';

interface PlayerProps {
  mapData: GameMap;
  onExitCheck?: (gx: number, gy: number) => void;
}

function computeDir8(dx: number, dz: number): string {
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

function dirToRotationY(dir: string): number {
  const map: Record<string, number> = {
    down: 0,
    down_right: -Math.PI / 4,
    right: -Math.PI / 2,
    up_right: -Math.PI * 3 / 4,
    up: Math.PI,
    up_left: Math.PI * 3 / 4,
    left: Math.PI / 2,
    down_left: Math.PI / 4,
  };
  return map[dir] ?? 0;
}

function dirToFacing4(dir: string): 'up' | 'down' | 'left' | 'right' {
  if (dir.includes('up')) return 'up';
  if (dir.includes('down')) return 'down';
  if (dir.includes('left')) return 'left';
  return 'right';
}

export function Player({ mapData, onExitCheck }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector3());
  const walkPhase = useRef(0);
  const keysDown = useRef(new Set<string>());
  const currentDir = useRef('down');
  const rotYRef = useRef(0);
  const isMovingRef = useRef(false);

  const player = useGameStore((s) => s.player);
  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition);

  const blocked = useMemo(
    () => buildBlockedGrid(mapData.width, mapData.height, mapData.objects),
    [mapData],
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
    (wx: number, wz: number, dir: string) => {
      const gx = Math.round(wx / TILE_SIZE);
      const gz = Math.round(wz / TILE_SIZE);
      if (gx < 0 || gx >= mapData.width || gz < 0 || gz >= mapData.height) return;
      const facing4 = dirToFacing4(dir);
      setPlayerPosition(gx, gz, facing4, mapData.name);
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
    if (!groupRef.current) return;

    const keys = keysDown.current;
    let dx = 0;
    let dz = 0;

    if (keys.has('w') || keys.has('arrowup')) dz = -1;
    if (keys.has('s') || keys.has('arrowdown')) dz = 1;
    if (keys.has('a') || keys.has('arrowleft')) dx = -1;
    if (keys.has('d') || keys.has('arrowright')) dx = 1;

    const isMoving = dx !== 0 || dz !== 0;
    isMovingRef.current = isMoving;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) {
      dx /= len;
      dz /= len;
    }

    if (isMoving) {
      currentDir.current = computeDir8(dx, dz);
      rotYRef.current = dirToRotationY(currentDir.current);
    }

    const vel = velocity.current;
    const targetSpeed = isMoving ? PLAYER_SPEED : 0;
    const accel = isMoving ? PLAYER_ACCELERATION : PLAYER_DECELERATION;

    vel.x += (dx * targetSpeed - vel.x) * Math.min(accel * delta, 1);
    vel.z += (dz * targetSpeed - vel.z) * Math.min(accel * delta, 1);

    const g = groupRef.current;
    const newX = g.position.x + vel.x * delta;
    const newZ = g.position.z + vel.z * delta;

    const canMoveX = !checkCollision(newX, g.position.z);
    const canMoveZ = !checkCollision(g.position.x, newZ);

    if (canMoveX) g.position.x = newX;
    else vel.x = 0;
    if (canMoveZ) g.position.z = newZ;
    else vel.z = 0;

    if (isMoving) {
      walkPhase.current += delta * 8;
      g.position.y = Math.abs(Math.sin(walkPhase.current * 2)) * 0.03;
    } else {
      walkPhase.current *= 0.85;
      g.position.y = Math.sin(Date.now() * 0.002) * 0.008;
    }

    // Smooth rotation lerp
    let target = rotYRef.current;
    let current = g.rotation.y;
    let diff = target - current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    g.rotation.y += diff * Math.min(1, 12 * delta);

    const gx = Math.round(g.position.x / TILE_SIZE);
    const gz = Math.round(g.position.z / TILE_SIZE);
    const facing4 = dirToFacing4(currentDir.current);
    if (gx !== player.x || gz !== player.y || facing4 !== player.facing) {
      setPlayerPosition(gx, gz, facing4, mapData.name);
    }

    checkExit(g.position.x, g.position.z, currentDir.current);
  });

  const wp = gridToWorld(player.x, player.y);

  return (
    <group ref={groupRef} position={[wp[0], 0, wp[2]]}>
      <Character3D
        isWalking={isMovingRef.current}
        walkPhase={walkPhase.current}
      />
    </group>
  );
}
