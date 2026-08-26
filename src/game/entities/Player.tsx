import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../state/gameStore';
import { gridToWorld, isWalkable } from '../../utils/gridUtils';
import { PLAYER_SPEED } from '../../utils/constants';
import { PLAYER_GRADIENT, SKIN_GRADIENT } from '../../utils/toonMaterials';
import type { Direction } from '../../types/game';
import type { GameMap } from '../../data/mapTypes';

interface PlayerProps {
  mapData: GameMap;
  onMove?: () => void;
  onExitCheck?: (gx: number, gy: number) => void;
}

const DIR_TO_ANGLE: Record<Direction, number> = {
  down: 0,
  up: Math.PI,
  left: Math.PI / 2,
  right: -Math.PI / 2,
};

export function Player({ mapData, onMove, onExitCheck }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3());
  const isMoving = useRef(false);
  const bobPhase = useRef(0);
  const keysDown = useRef(new Set<string>());

  const { x: gx, y: gy, facing } = useGameStore((s) => s.player);
  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition);

  const worldPos = gridToWorld(gx, gy);
  targetPos.current.set(worldPos[0], worldPos[1], worldPos[2]);

  const tryMove = useCallback(
    (dir: Direction) => {
      if (isMoving.current) return;

      const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
      const dy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
      const nx = gx + dx;
      const ny = gy + dy;

      setPlayerPosition(gx, gy, dir, mapData.name);

      if (!isWalkable(mapData.blocked, nx, ny, mapData.width, mapData.height)) {
        return;
      }

      setPlayerPosition(nx, ny, dir, mapData.name);
      const wp = gridToWorld(nx, ny);
      targetPos.current.set(wp[0], wp[1], wp[2]);
      isMoving.current = true;
      onMove?.();

      if (onExitCheck) {
        const exit = mapData.exits.find((e) => e.x === nx && e.y === ny);
        if (exit) {
          setTimeout(() => onExitCheck(nx, ny), 150);
        }
      }
    },
    [gx, gy, mapData, setPlayerPosition, onMove, onExitCheck],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysDown.current.add(e.key.toLowerCase());
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
    let dir: Direction | null = null;

    if (keys.has('w') || keys.has('arrowup')) dir = 'up';
    else if (keys.has('s') || keys.has('arrowdown')) dir = 'down';
    else if (keys.has('a') || keys.has('arrowleft')) dir = 'left';
    else if (keys.has('d') || keys.has('arrowright')) dir = 'right';

    if (dir && !isMoving.current) {
      tryMove(dir);
    }

    const pos = groupRef.current.position;
    const target = targetPos.current;

    if (isMoving.current) {
      const dist = pos.distanceTo(target);
      if (dist < 0.05) {
        pos.copy(target);
        isMoving.current = false;
      } else {
        pos.lerp(target, Math.min(1, PLAYER_SPEED * delta));
      }
      bobPhase.current += delta * 12;
      groupRef.current.position.y = Math.sin(bobPhase.current) * 0.06;
    } else {
      bobPhase.current += delta * 2;
      groupRef.current.position.y = Math.sin(bobPhase.current) * 0.03;
    }

    const targetAngle = DIR_TO_ANGLE[facing];
    const mesh = groupRef.current.children[0];
    if (mesh) {
      const current = mesh.rotation.y;
      let diff = targetAngle - current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      mesh.rotation.y += diff * Math.min(1, 10 * delta);
    }
  });

  return (
    <group ref={groupRef} position={[worldPos[0], 0, worldPos[2]]}>
      <group>
        <mesh position={[0, 0.4, 0]} castShadow>
          <capsuleGeometry args={[0.25, 0.4, 8, 16]} />
          <meshToonMaterial color="#42a5f5" gradientMap={PLAYER_GRADIENT} />
        </mesh>
        <mesh position={[0, 0.95, 0]} castShadow>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshToonMaterial color="#ffcc80" gradientMap={SKIN_GRADIENT} />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow>
          <sphereGeometry args={[0.24, 12, 12]} />
          <meshToonMaterial color="#5d4037" gradientMap={PLAYER_GRADIENT} />
        </mesh>
      </group>
    </group>
  );
}
