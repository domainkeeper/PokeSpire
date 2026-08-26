import { useMemo } from 'react';
import * as THREE from 'three';
import { TILE_SIZE } from '../../utils/constants';
import { gridToWorld } from '../../utils/gridUtils';
import { Tree, SmallTree } from '../entities/Tree';
import { Rock } from '../entities/Rock';
import { Building } from '../entities/Building';
import { Flower, GrassTuft } from '../entities/Flower';
import { FenceRow } from '../entities/Fence';
import { Sign } from '../entities/Sign';
import { Water } from '../entities/Water';
import { NPC } from '../entities/NPC';
import type { GameMap, TileType } from '../../data/mapTypes';

const GRASS_GRADIENT = (() => {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 1;
  const ctx = c.getContext('2d')!;
  ['#5cb85c','#4caf50','#388e3c','#2e7d32'].forEach((col, i) => {
    ctx.fillStyle = col; ctx.fillRect(i, 0, 1, 1);
  });
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.NearestFilter; t.magFilter = THREE.NearestFilter;
  return t;
})();

const PATH_GRADIENT = (() => {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 1;
  const ctx = c.getContext('2d')!;
  ['#d7ccc8','#bcaaa4','#a1887f','#8d6e63'].forEach((col, i) => {
    ctx.fillStyle = col; ctx.fillRect(i, 0, 1, 1);
  });
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.NearestFilter; t.magFilter = THREE.NearestFilter;
  return t;
})();

interface MapRendererProps {
  mapData: GameMap;
}

function Tile({ type, gx, gy }: { type: TileType; gx: number; gy: number }) {
  const [x, , z] = gridToWorld(gx, gy);

  if (type === 'tree') {
    return gx % 3 === 0 ? <SmallTree position={[x, 0, z]} /> : <Tree position={[x, 0, z]} />;
  }
  if (type === 'rock') return <Rock position={[x, 0, z]} />;
  if (type === 'building') return <Building position={[x, 0, z]} color="red" />;
  if (type === 'building2') return <Building position={[x, 0, z]} color="blue" />;
  if (type === 'fence') return <FenceRow positions={[[x, 0, z]]} />;
  if (type === 'sign') return <Sign position={[x, 0, z]} />;
  if (type === 'water') return <Water position={[x, 0.02, z]} width={TILE_SIZE} height={TILE_SIZE} />;

  return null;
}

export function MapRenderer({ mapData }: MapRendererProps) {
  const groundTiles = useMemo(() => {
    const result: { gx: number; gy: number; type: TileType; wx: number; wz: number }[] = [];
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const t = mapData.tiles[y][x];
        if (t === 'grass' || t === 'path') {
          const [wx, , wz] = gridToWorld(x, y);
          result.push({ gx: x, gy: y, type: t, wx, wz });
        }
      }
    }
    return result;
  }, [mapData]);

  const objectTiles = useMemo(() => {
    const result: { gx: number; gy: number; type: TileType }[] = [];
    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const t = mapData.tiles[y][x];
        if (t !== 'grass' && t !== 'path') {
          result.push({ gx: x, gy: y, type: t });
        }
      }
    }
    return result;
  }, [mapData]);

  const groundGeo = useMemo(() => new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE), []);
  const grassMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#4caf50', gradientMap: GRASS_GRADIENT }), []);
  const pathMat = useMemo(() => new THREE.MeshToonMaterial({ color: '#bcaaa4', gradientMap: PATH_GRADIENT }), []);

  return (
    <group>
      <group>
        {groundTiles.map((t) => (
          <mesh
            key={`${t.gx}-${t.gy}`}
            geometry={groundGeo}
            material={t.type === 'grass' ? grassMat : pathMat}
            position={[t.wx, -0.01, t.wz]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          />
        ))}
      </group>

      <group>
        {objectTiles.map((t) => (
          <Tile key={`${t.gx}-${t.gy}`} type={t.type} gx={t.gx} gy={t.gy} />
        ))}
      </group>

      <group>
        {mapData.decorations.map((d, i) => {
          const [wx, , wz] = gridToWorld(d.x, d.y);
          if (d.type === 'flower') return <Flower key={`d-${i}`} position={[wx, 0, wz]} />;
          return <GrassTuft key={`d-${i}`} position={[wx, 0, wz]} />;
        })}
      </group>

      <group>
        {mapData.npcPositions.map((npc, i) => {
          const [wx, , wz] = gridToWorld(npc.x, npc.y);
          return <NPC key={`npc-${i}`} position={[wx, 0, wz]} name={npc.name} />;
        })}
      </group>
    </group>
  );
}
