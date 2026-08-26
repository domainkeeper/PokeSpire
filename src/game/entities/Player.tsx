import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../state/gameStore';
import { gridToWorld, buildBlockedGrid } from '../../utils/gridUtils';
import { PLAYER_SPEED } from '../../utils/constants';
import { makePlayerSprite } from '../pixel/sprites/characterSprites';
import type { Direction } from '../../types/game';
import type { GameMap } from '../../data/mapTypes';

interface PlayerProps {
  mapData: GameMap;
  onExitCheck?: (gx: number, gy: number) => void;
}

const DIR_DX: Record<Direction, number> = { down: 0, up: 0, left: -1, right: 1 };
const DIR_DY: Record<Direction, number> = { down: 1, up: -1, left: 0, right: 0 };

export function Player({ mapData, onExitCheck }: PlayerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetWorld = useRef(new THREE.Vector3());
  const isMoving = useRef(false);
  const bobPhase = useRef(0);
  const keysDown = useRef(new Set<string>());

  const player = useGameStore((s) => s.player);
  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition);

  const blocked = useMemo(
    () => buildBlockedGrid(mapData.width, mapData.height, mapData.objects),
    [mapData],
  );

  const wp = gridToWorld(player.x, player.y);
  targetWorld.current.set(wp[0], 0, wp[2]);

  const mat = useRef<THREE.MeshBasicMaterial>(
    new THREE.MeshBasicMaterial({
      map: makePlayerSprite('down'),
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );

  const tryMove = useCallback(
    (dir: Direction) => {
      if (isMoving.current) return;

      const dx = DIR_DX[dir];
      const dy = DIR_DY[dir];
      const nx = player.x + dx;
      const ny = player.y + dy;

      setPlayerPosition(player.x, player.y, dir, mapData.name);

      if (!isWalkable(blocked, nx, ny, mapData.width, mapData.height)) {
        return;
      }

      setPlayerPosition(nx, ny, dir, mapData.name);
      const newWp = gridToWorld(nx, ny);
      targetWorld.current.set(newWp[0], 0, newWp[2]);
      isMoving.current = true;

      if (onExitCheck) {
        const exit = mapData.exits.find(
          (e) => nx >= e.x && nx < e.x + e.w && ny >= e.y && ny < e.y + e.h,
        );
        if (exit) {
          setTimeout(() => onExitCheck(nx, ny), 100);
        }
      }
    },
    [player.x, player.y, mapData, setPlayerPosition, onExitCheck, blocked],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => keysDown.current.add(e.key.toLowerCase());
    const onKeyUp = (e: KeyboardEvent) => keysDown.current.delete(e.key.toLowerCase());
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
    let dir: Direction | null = null;

    if (keys.has('w') || keys.has('arrowup')) dir = 'up';
    else if (keys.has('s') || keys.has('arrowdown')) dir = 'down';
    else if (keys.has('a') || keys.has('arrowleft')) dir = 'left';
    else if (keys.has('d') || keys.has('arrowright')) dir = 'right';

    if (dir && !isMoving.current) {
      tryMove(dir);
    }

    const pos = meshRef.current.position;
    const target = targetWorld.current;

    if (isMoving.current) {
      const ddx = target.x - pos.x;
      const ddz = target.z - pos.z;
      const dist = Math.sqrt(ddx * ddx + ddz * ddz);

      if (dist < 0.02) {
        pos.x = target.x;
        pos.z = target.z;
        isMoving.current = false;

        // continue moving if key held
        const keys2 = keysDown.current;
        let nextDir: Direction | null = null;
        if (keys2.has('w') || keys2.has('arrowup')) nextDir = 'up';
        else if (keys2.has('s') || keys2.has('arrowdown')) nextDir = 'down';
        else if (keys2.has('a') || keys2.has('arrowleft')) nextDir = 'left';
        else if (keys2.has('d') || keys2.has('arrowright')) nextDir = 'right';
        if (nextDir) tryMove(nextDir);
      } else {
        const step = PLAYER_SPEED * delta;
        if (step >= dist) {
          pos.x = target.x;
          pos.z = target.z;
        } else {
          pos.x += (ddx / dist) * step;
          pos.z += (ddz / dist) * step;
        }
      }

      bobPhase.current += delta * 10;
      meshRef.current.position.y = Math.sin(bobPhase.current) * 0.03;
    } else {
      bobPhase.current += delta * 2;
      meshRef.current.position.y = Math.sin(bobPhase.current) * 0.015;
    }

    // update sprite facing
    const facing = useGameStore.getState().player.facing;
    const newTex = makePlayerSprite(facing);
    mat.current.map = newTex;
    mat.current.needsUpdate = true;

    if (facing === 'left') {
      meshRef.current.scale.x = -1;
    } else if (facing === 'right') {
      meshRef.current.scale.x = 1;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[wp[0], 0, wp[2]]}
      material={mat.current}
      renderOrder={100}
    >
      <planeGeometry args={[0.8, 1.2]} />
    </mesh>
  );
}

function isWalkable(
  blocked: boolean[][],
  gx: number,
  gy: number,
  mapWidth: number,
  mapHeight: number,
): boolean {
  if (gx < 0 || gx >= mapWidth || gy < 0 || gy >= mapHeight) return false;
  return !blocked[gy]?.[gx];
}
