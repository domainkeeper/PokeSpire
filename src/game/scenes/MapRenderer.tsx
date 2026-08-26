import { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { gridToWorld } from '../../utils/gridUtils';
import { TILE_SIZE } from '../../utils/constants';
import type { GameMap } from '../../data/mapTypes';
import { getPokemonSprite } from '../../data/pokemon/pokemonSprites';
import type { PokemonSpeciesKey } from '../../data/pokemon/pokemonSprites';

import { makeTreeSprite, makeSmallTreeSprite, makeBushSprite, makeRockSprite, makeFlowerSprite, makeFenceSprite, makeSignSprite, makeWaterSprite, makeBuildingSprite } from '../pixel/sprites/envSprites';
import { makeNpcSprite } from '../pixel/sprites/characterSprites';
import { PixelSprite } from '../pixel/PixelSprite';
import { makeGroundTexture, getShadowTexture } from '../pixel/groundTexture';

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
      position={[position[0], 0.02, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={position[2] - 0.01}
    >
      <planeGeometry args={[size * 1.2, size * 0.6]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}

const SHADOW_SIZES: Record<string, number> = {
  tree: 2.5,
  small_tree: 1.5,
  building: 5,
  building2: 5.5,
  bush: 1.0,
  rock: 1.2,
  fence: 2.0,
  sign: 0.6,
  water: 3.0,
  flower: 0.3,
};

export function MapRenderer({ mapData }: MapRendererProps) {
  const sortedObjects = useMemo(() => {
    return [...mapData.objects].sort((a, b) => a.gy - b.gy);
  }, [mapData]);

  return (
    <group>
      <CanvasGround mapData={mapData} />

      {sortedObjects.map((obj, i) => {
        const [wx, , wz] = gridToWorld(obj.gx, obj.gy);
        const shadowSize = SHADOW_SIZES[obj.type] || 1.0;

        return (
          <group key={`obj-${i}`}>
            <GroundShadow position={[wx + obj.spriteW * 0.5, 0, wz + obj.spriteW * 0.5]} size={shadowSize} />
            <PixelSprite
              texture={getSprite(obj.type)}
              position={[wx, 0, wz]}
              width={obj.spriteW}
              height={obj.spriteH}
              anchorY={0.15}
              animScale={obj.type === 'flower'}
              animSway={obj.animSway}
              animWater={obj.type === 'water'}
            />
          </group>
        );
      })}

      {mapData.npcPositions.map((npc, i) => {
        const [wx, , wz] = gridToWorld(npc.x, npc.y);
        return (
          <group key={`npc-${i}`}>
            <GroundShadow position={[wx + 0.35, 0, wz + 0.35]} size={0.8} />
            <PixelSprite
              texture={makeNpcSprite(npc.color || '#7b1fa2')}
              position={[wx, 0, wz]}
              width={0.7}
              height={1.1}
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
