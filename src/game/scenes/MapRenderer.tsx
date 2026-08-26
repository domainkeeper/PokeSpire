import { useMemo } from 'react';
import * as THREE from 'three';
import { gridToWorld } from '../../utils/gridUtils';
import { TILE_SIZE } from '../../utils/constants';
import type { GameMap, TileType } from '../../data/mapTypes';

import { makeTreeSprite, makeSmallTreeSprite, makeBushSprite, makeRockSprite, makeFlowerSprite, makeFenceSprite, makeSignSprite, makeWaterSprite, makeBuildingSprite } from '../pixel/sprites/envSprites';
import { makeNpcSprite } from '../pixel/sprites/characterSprites';
import { PixelSprite } from '../pixel/PixelSprite';

const SPRITE_MAP: Record<string, THREE.Texture> = {};

function getSprite(type: string): THREE.Texture {
  if (SPRITE_MAP[type]) return SPRITE_MAP[type];
  let tex: THREE.Texture;
  switch (type) {
    case 'tree': tex = makeTreeSprite(); break;
    case 'small_tree': tex = makeSmallTreeSprite(); break;
    case 'bush': tex = makeBushSprite(); break;
    case 'rock': tex = makeRockSprite(); break;
    case 'flower': tex = makeFlowerSprite(); break;
    case 'fence': tex = makeFenceSprite(); break;
    case 'sign': tex = makeSignSprite(); break;
    case 'water': tex = makeWaterSprite(); break;
    case 'building': tex = makeBuildingSprite('red'); break;
    case 'building2': tex = makeBuildingSprite('blue'); break;
    default: tex = makeBushSprite(); break;
  }
  SPRITE_MAP[type] = tex;
  return tex;
}

interface MapRendererProps {
  mapData: GameMap;
}

export function MapRenderer({ mapData }: MapRendererProps) {
  // batch ground into one geometry
  const groundMesh = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const uvs: number[] = [];

    const grassColor = new THREE.Color('#4caf50');
    const pathColor = new THREE.Color('#bcaaa4');
    const waterColor = new THREE.Color('#29b6f6');
    const dirtColor = new THREE.Color('#a1887f');

    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const t: TileType = mapData.ground[y]?.[x] || 'grass';
        const [wx, , wz] = gridToWorld(x, y);
        const s = TILE_SIZE;

        let color: THREE.Color;
        switch (t) {
          case 'path': color = pathColor; break;
          case 'water': color = waterColor; break;
          case 'dirt': color = dirtColor; break;
          default: color = grassColor; break;
        }

        const v = [
          wx, -0.05, wz,
          wx + s, -0.05, wz,
          wx + s, -0.05, wz + s,
          wx, -0.05, wz,
          wx + s, -0.05, wz + s,
          wx, -0.05, wz + s,
        ];
        const n = [0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0];

        for (let i = 0; i < 18; i++) positions.push(v[i]);
        for (let i = 0; i < 18; i++) normals.push(n[i]);
        for (let i = 0; i < 6; i++) colors.push(color.r, color.g, color.b);
        uvs.push(0,0, 1,0, 1,1, 0,0, 1,1, 0,1);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    const mat = new THREE.MeshBasicMaterial({ vertexColors: true });
    return new THREE.Mesh(geo, mat);
  }, [mapData]);

  // object sprites sorted by Y for depth
  const sortedObjects = useMemo(() => {
    return [...mapData.objects].sort((a, b) => a.gy - b.gy);
  }, [mapData]);

  return (
    <group>
      <primitive object={groundMesh} />

      {sortedObjects.map((obj, i) => {
        const [wx, , wz] = gridToWorld(obj.gx, obj.gy);
        const tex = getSprite(obj.type);
        const sw = obj.spriteW * TILE_SIZE;
        const sh = obj.spriteH * TILE_SIZE;
        const animScale = obj.type === 'flower';
        const animSway = obj.animSway;

        return (
          <PixelSprite
            key={`obj-${i}`}
            texture={tex}
            position={[wx + sw / 2, 0, wz + sh / 2]}
            width={sw}
            height={sh}
            anchorY={0.2}
            animScale={animScale}
            animSway={animSway}
          />
        );
      })}

      {mapData.npcPositions.map((npc, i) => {
        const [wx, , wz] = gridToWorld(npc.x, npc.y);
        const npcTex = makeNpcSprite(npc.color || '#7b1fa2');
        return (
          <PixelSprite
            key={`npc-${i}`}
            texture={npcTex}
            position={[wx, 0, wz]}
            width={0.8}
            height={1.2}
            anchorY={0.2}
          />
        );
      })}
    </group>
  );
}
