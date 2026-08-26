import { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { gridToWorld } from '../../utils/gridUtils';
import { TILE_SIZE } from '../../utils/constants';
import type { GameMap } from '../../data/mapTypes';
import { getPokemonSprite } from '../../data/pokemon/pokemonSprites';
import type { PokemonSpeciesKey } from '../../data/pokemon/pokemonSprites';

import { makeBushSprite, makeRockSprite, makeFlowerSprite, makeFenceSprite, makeSignSprite } from '../pixel/sprites/envSprites';
import { makeNpcSprite } from '../pixel/sprites/characterSprites';
import type { Dir8 } from '../pixel/sprites/characterSprites';
import { PixelSprite } from '../pixel/PixelSprite';
import { makeGroundTexture, getShadowTexture } from '../pixel/groundTexture';
import { Tree, SmallTree, Building } from '../entities/Mesh3D';
import { WaterSurface } from '../entities/WaterSurface';

const SPRITE_MAP: Record<string, THREE.Texture> = {};

function getSprite(type: string): THREE.Texture {
  if (SPRITE_MAP[type]) return SPRITE_MAP[type];
  let tex: THREE.Texture;
  switch (type) {
    case 'bush': tex = makeBushSprite(); break;
    case 'rock': tex = makeRockSprite(); break;
    case 'flower': tex = makeFlowerSprite(); break;
    case 'fence': tex = makeFenceSprite(); break;
    case 'sign': tex = makeSignSprite(); break;
    default: tex = makeBushSprite(); break;
  }
  SPRITE_MAP[type] = tex;
  return tex;
}

function usePokemonTexture(species: PokemonSpeciesKey): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const sprite = getPokemonSprite(species);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      sprite.animated,
      (texture) => {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.needsUpdate = true;
        setTex(texture);
      },
      undefined,
      () => {
        loader.load(sprite.front, (texture) => {
          texture.magFilter = THREE.NearestFilter;
          texture.minFilter = THREE.NearestFilter;
          texture.needsUpdate = true;
          setTex(texture);
        });
      },
    );
  }, [sprite]);

  return tex;
}

function PokemonSprite({ species, position }: { species: PokemonSpeciesKey; position: [number, number, number] }) {
  const sprite = getPokemonSprite(species);
  const tex = usePokemonTexture(species);
  if (!tex) return null;
  return (
    <PixelSprite
      texture={tex}
      position={position}
      width={sprite.spriteWidth}
      height={sprite.spriteHeight}
      anchorY={0.15}
      animScale={true}
    />
  );
}

interface MapRendererProps {
  mapData: GameMap;
}

function CanvasGround({ mapData }: { mapData: GameMap }) {
  const tex = useMemo(() => makeGroundTexture(mapData), [mapData]);
  const width = mapData.width * TILE_SIZE;
  const height = mapData.height * TILE_SIZE;

  return (
    <mesh
      position={[width / 2, -0.05, height / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={tex} />
    </mesh>
  );
}

function GroundShadow({ position, size }: { position: [number, number, number]; size: number }) {
  const tex = useMemo(() => getShadowTexture(), []);
  return (
    <mesh
      position={[position[0], 0.01, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={position[2] - 0.01}
    >
      <planeGeometry args={[size * 1.2, size * 0.6]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}

const SHADOW_SIZES: Record<string, number> = {
  bush: 1.0,
  rock: 1.2,
  fence: 2.0,
  sign: 0.6,
  flower: 0.3,
};

export function MapRenderer({ mapData }: MapRendererProps) {
  const sortedObjects = useMemo(() => {
    return [...mapData.objects].sort((a, b) => a.gy - b.gy);
  }, [mapData]);

  const waterObjects = useMemo(() => {
    return mapData.objects.filter((o) => o.type === 'water');
  }, [mapData]);

  return (
    <group>
      <CanvasGround mapData={mapData} />

      {waterObjects.map((obj, i) => {
        const [wx, , wz] = gridToWorld(obj.gx, obj.gy);
        const wWU = obj.spriteW || obj.footprintW * TILE_SIZE;
        const wHU = obj.spriteH || obj.footprintH * TILE_SIZE;
        return (
          <WaterSurface
            key={`water-${i}`}
            position={[wx + wWU / 2, 0, wz + wHU / 2]}
            width={wWU}
            height={wHU}
          />
        );
      })}

      {sortedObjects.map((obj, i) => {
        const [wx, , wz] = gridToWorld(obj.gx, obj.gy);
        const centerX = wx + obj.spriteW / 2;
        const centerZ = wz + obj.spriteW / 2;

        if (obj.type === 'water') return null;

        if (obj.type === 'tree') {
          return (
            <group key={`obj-${i}`}>
              <GroundShadow position={[centerX, 0, centerZ]} size={2.5} />
              <Tree position={[centerX, 0, centerZ]} scale={1} />
            </group>
          );
        }

        if (obj.type === 'small_tree') {
          return (
            <group key={`obj-${i}`}>
              <GroundShadow position={[centerX, 0, centerZ]} size={1.5} />
              <SmallTree position={[centerX, 0, centerZ]} scale={1} />
            </group>
          );
        }

        if (obj.type === 'building') {
          return (
            <group key={`obj-${i}`}>
              <GroundShadow position={[centerX, 0, centerZ]} size={5} />
              <Building position={[centerX, 0, centerZ]} variant="red" scale={1} />
            </group>
          );
        }

        if (obj.type === 'building2') {
          return (
            <group key={`obj-${i}`}>
              <GroundShadow position={[centerX, 0, centerZ]} size={5.5} />
              <Building position={[centerX, 0, centerZ]} variant="blue" scale={1} />
            </group>
          );
        }

        const shadowSize = SHADOW_SIZES[obj.type] || 1.0;
        return (
          <group key={`obj-${i}`}>
            {shadowSize > 0 && (
              <GroundShadow position={[centerX, 0, centerZ]} size={shadowSize} />
            )}
            <PixelSprite
              texture={getSprite(obj.type)}
              position={[wx, 0, wz]}
              width={obj.spriteW}
              height={obj.spriteH}
              anchorY={0.15}
              animScale={obj.type === 'flower'}
              animSway={obj.animSway}
            />
          </group>
        );
      })}

      {mapData.npcPositions.map((npc, i) => {
        const [wx, , wz] = gridToWorld(npc.x, npc.y);
        const variant = npc.name?.toLowerCase().includes('professor') ? 'professor'
          : npc.name?.toLowerCase().includes('garden') ? 'gardener'
          : 'resident';
        return (
          <group key={`npc-${i}`}>
            <GroundShadow position={[wx + 0.4, 0, wz + 0.4]} size={0.9} />
            <PixelSprite
              texture={makeNpcSprite('down' as Dir8, 'idle', 0, variant)}
              position={[wx, 0, wz]}
              width={0.8}
              height={1.2}
              anchorY={0.15}
            />
          </group>
        );
      })}

      {mapData.pokemon?.map((p, i) => {
        const [wx, , wz] = gridToWorld(p.gx, p.gy);
        return (
          <PokemonSprite
            key={`pokemon-${i}`}
            species={p.species}
            position={[wx, 0, wz]}
          />
        );
      })}
    </group>
  );
}
