import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Billboard } from '@react-three/drei';
import { useGameStore } from '../../state/gameStore';
import { buildBlockedGrid, gridToWorld } from '../../utils/gridUtils';
import {
  PLAYER_SPEED,
  PLAYER_ACCELERATION,
  PLAYER_DECELERATION,
  TILE_SIZE,
} from '../../utils/constants';
import type { GameMap } from '../../data/mapTypes';
import { getCharacterTexture, setCharacterFrame, ensureCharacterTexturesLoaded, type Dir8, type WalkFrame } from '../pixel/sprites/characterSprites';
import { getShadowTexture } from '../pixel/groundTexture';

interface PlayerProps {
  mapData: GameMap;
  onExitCheck?: (gx: number, gy: number) => void;
}

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
  if (angle >= -67.5 && angle < -22.5) return 'down_left';
  return 'down';
}

function dirToFacing4(dir: Dir8): 'up' | 'down' | 'left' | 'right' {
  if (dir.includes('up')) return 'up';
  if (dir.includes('down') && !dir.includes('left') && !dir.includes('right')) return 'down';
  if (dir.includes('left')) return 'left';
  if (dir.includes('right')) return 'right';
  if (dir === 'down_left' || dir === 'down_right') return 'down';
  if (dir === 'up_left' || dir === 'up_right') return 'up';
  return 'down';
}

const SPRITE_W = 0.7;
const SPRITE_H = 1.0;

export function Player({ mapData, onExitCheck }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const velocity = useRef(new THREE.Vector3());
  const walkPhase = useRef(0);
  const keysDown = useRef(new Set<string>());
  const currentDir = useRef<Dir8>('down');
  const isMovingRef = useRef(false);
  const walkFrame = useRef<WalkFrame>(0);
  const walkTimer = useRef(0);
  const lastDir = useRef<Dir8>('down');
  const lastFrame = useRef<WalkFrame>(0);

  const shadowTex = useMemo(() => getShadowTexture(), []);

  // Eagerly load all character textures
  const textures = useMemo(() => {
    ensureCharacterTexturesLoaded();
    const dirs: Dir8[] = ['down', 'down_right', 'right', 'up_right', 'up', 'up_left', 'left', 'down_left'];
    const map = new Map<Dir8, THREE.Texture>();
    for (const d of dirs) {
      map.set(d, getCharacterTexture(d));
    }
    return map;
  }, []);

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
    (wx: number, wz: number, dir: Dir8) => {
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
    if (!groupRef.current || !meshRef.current) return;

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
      walkTimer.current += delta;
      if (walkTimer.current > 0.12) {
        walkTimer.current = 0;
        walkFrame.current = ((walkFrame.current + 1) % 4) as WalkFrame;
      }
      g.position.y = Math.abs(Math.sin(walkPhase.current * 2)) * 0.003;
    } else {
      walkPhase.current *= 0.85;
      g.position.y = 0;
      walkFrame.current = 0;
      walkTimer.current = 0;
    }

    // Update sprite texture
    const dir = currentDir.current;
    const frame = isMoving ? walkFrame.current : 0 as WalkFrame;

    if (dir !== lastDir.current || frame !== lastFrame.current) {
      lastDir.current = dir;
      lastFrame.current = frame;
      const tex = textures.get(dir);
      if (tex) {
        setCharacterFrame(tex, frame);
        (meshRef.current.material as THREE.MeshBasicMaterial).map = tex;
        (meshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
      }
    }

    const gx = Math.round(g.position.x / TILE_SIZE);
    const gz = Math.round(g.position.z / TILE_SIZE);
    const facing4 = dirToFacing4(currentDir.current);
    if (gx !== player.x || gz !== player.y || facing4 !== player.facing) {
      setPlayerPosition(gx, gz, facing4, mapData.name);
    }

    checkExit(g.position.x, g.position.z, currentDir.current);
  });

  const wp = gridToWorld(player.x, player.y);
  const initialTex = textures.get('down') || new THREE.Texture();

  return (
    <group ref={groupRef} position={[wp[0], 0, wp[2]]}>
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh ref={meshRef} position={[0, SPRITE_H * 0.5, 0]} renderOrder={wp[2] * 10 + 5}>
          <planeGeometry args={[SPRITE_W, SPRITE_H]} />
          <meshBasicMaterial
            map={initialTex}
            transparent
            alphaTest={0.1}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </Billboard>
      <mesh
        position={[0, 0.005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={-1}
      >
        <planeGeometry args={[0.5, 0.15]} />
        <meshBasicMaterial
          map={shadowTex}
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
