import { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { gridToWorld } from '../../utils/gridUtils';
import { TILE_SIZE } from '../../utils/constants';
import type { GameMap } from '../../data/mapTypes';
import { getPokemonSprite } from '../../data/pokemon/pokemonSprites';
import type { PokemonSpeciesKey } from '../../data/pokemon/pokemonSprites';

import { Bush3D, Rock3D, Flower3D, Fence3D, Sign3D } from '../entities/EnvProps3D';
import { Tree, SmallTree } from '../entities/Tree3D';
import { House } from '../entities/House3D';
import { WaterSurface } from '../entities/WaterSurface';
import { Character3D } from '../entities/Character3D';
import { makeGroundTexture } from '../pixel/groundTexture';
import { PixelSprite } from '../pixel/PixelSprite';

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

const NPC_VARIANT_COLORS: Record<string, { jacket: string; hair: string; shorts: string }> = {
  professor: { jacket: '#1565c0', hair: '#e65100', shorts: '#212121' },
  gardener: { jacket: '#2e7d32', hair: '#4e342e', shorts: '#33691e' },
  resident: { jacket: '#c62828', hair: '#1b5e20', shorts: '#3e2723' },
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
              <Tree position={[centerX, 0, centerZ]} scale={1} />
            </group>
          );
        }

        if (obj.type === 'small_tree') {
          return (
            <group key={`obj-${i}`}>
              <SmallTree position={[centerX, 0, centerZ]} scale={1} />
            </group>
          );
        }

        if (obj.type === 'building') {
          return (
            <group key={`obj-${i}`}>
              <House position={[centerX, 0, centerZ]} variant="red" scale={1} />
            </group>
          );
        }

        if (obj.type === 'building2') {
          return (
            <group key={`obj-${i}`}>
              <House position={[centerX, 0, centerZ]} variant="blue" scale={1} />
            </group>
          );
        }

        if (obj.type === 'bush') {
          return (
            <group key={`obj-${i}`}>
              <Bush3D position={[wx + 0.4, 0, wz + 0.4]} scale={1} />
            </group>
          );
        }

        if (obj.type === 'rock') {
          return (
            <group key={`obj-${i}`}>
              <Rock3D position={[wx + 0.4, 0, wz + 0.4]} scale={1} />
            </group>
          );
        }

        if (obj.type === 'flower') {
          return (
            <group key={`obj-${i}`}>
              <Flower3D position={[wx + 0.4, 0, wz + 0.4]} scale={1} />
            </group>
          );
        }

        if (obj.type === 'fence') {
          return (
            <group key={`obj-${i}`}>
              <Fence3D position={[wx + 0.4, 0, wz + 0.4]} scale={1} />
            </group>
          );
        }

        if (obj.type === 'sign') {
          return (
            <group key={`obj-${i}`}>
              <Sign3D position={[wx + 0.4, 0, wz + 0.4]} scale={1} />
            </group>
          );
        }

        return null;
      })}

      {mapData.npcPositions.map((npc, i) => {
        const [wx, , wz] = gridToWorld(npc.x, npc.y);
        const variantKey = npc.name?.toLowerCase().includes('professor') ? 'professor'
          : npc.name?.toLowerCase().includes('garden') ? 'gardener'
          : 'resident';
        const variantColors = NPC_VARIANT_COLORS[variantKey] || NPC_VARIANT_COLORS.resident;
        return (
          <group key={`npc-${i}`} position={[wx, 0, wz]}>
            <Character3D
              isWalking={false}
              walkPhase={0}
              colors={variantColors}
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
