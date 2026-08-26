import { useMemo } from 'react';
import * as THREE from 'three';
import { Billboard } from '@react-three/drei';
import { gridToWorld } from '../../utils/gridUtils';
import { TILE_SIZE } from '../../utils/constants';
import type { GameMap } from '../../data/mapTypes';
import { getPokemonSprite } from '../../data/pokemon/pokemonSprites';
import type { PokemonSpeciesKey } from '../../data/pokemon/pokemonSprites';

import { Bush3D, Rock3D, Flower3D, Fence3D, Sign3D } from '../entities/EnvProps3D';
import { Tree, SmallTree } from '../entities/Tree3D';
import { House } from '../entities/House3D';
import { WaterSurface } from '../entities/WaterSurface';
import { makeGroundTexture } from '../pixel/groundTexture';
import { PixelSprite } from '../pixel/PixelSprite';
import { getCharacterTexture } from '../pixel/sprites/characterSprites';
import { getShadowTexture } from '../pixel/groundTexture';

const pokemonTextureCache = new Map<string, THREE.Texture>();
const pokemonTextureLoading = new Map<string, boolean>();

function getPokemonTexture(species: string): THREE.Texture {
  if (pokemonTextureCache.has(species)) return pokemonTextureCache.get(species)!;

  const placeholder = new THREE.Texture();
  placeholder.magFilter = THREE.NearestFilter;
  placeholder.minFilter = THREE.NearestFilter;
  pokemonTextureCache.set(species, placeholder);

  if (!pokemonTextureLoading.get(species)) {
    pokemonTextureLoading.set(species, true);
    const sprite = getPokemonSprite(species as PokemonSpeciesKey);
    const loader = new THREE.TextureLoader();
    loader.load(
      sprite.front,
      (texture) => {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        pokemonTextureCache.set(species, texture);
      },
      undefined,
      () => {
        // front failed, try gif
        loader.load(
          sprite.animated,
          (texture) => {
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.needsUpdate = true;
            pokemonTextureCache.set(species, texture);
          },
          undefined,
          () => {
            // both failed, make magenta placeholder
            const c = document.createElement('canvas');
            c.width = 32; c.height = 32;
            const ctx = c.getContext('2d')!;
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(0, 0, 32, 32);
            const t = new THREE.CanvasTexture(c);
            t.magFilter = THREE.NearestFilter;
            t.minFilter = THREE.NearestFilter;
            pokemonTextureCache.set(species, t);
          },
        );
      },
    );
  }

  return placeholder;
}

function PokemonSprite({ species, position }: { species: PokemonSpeciesKey; position: [number, number, number] }) {
  const sprite = getPokemonSprite(species);
  const tex = getPokemonTexture(species);
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

const NPC_SPRITE_SIZE = { w: 0.7, h: 1.0 };

interface NpcSpriteProps {
  variant: string;
  position: [number, number, number];
}

const NPC_TINT: Record<string, number> = {
  professor: 0x4488ff,
  gardener: 0x44bb44,
  hiker: 0xaa7744,
  ranger: 0x66aa66,
  resident: 0xffffff,
};

function NpcBillboard({ variant, position }: NpcSpriteProps) {
  const tex = useMemo(() => {
    const t = getCharacterTexture('down');
    return t;
  }, []);
  const shadowTex = useMemo(() => getShadowTexture(), []);
  const tintColor = NPC_TINT[variant] ?? 0xffffff;

  return (
    <group position={position}>
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh position={[0, NPC_SPRITE_SIZE.h * 0.5, 0]} renderOrder={position[2] * 10 + 5}>
          <planeGeometry args={[NPC_SPRITE_SIZE.w, NPC_SPRITE_SIZE.h]} />
          <meshBasicMaterial
            map={tex}
            color={tintColor}
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
        <planeGeometry args={[0.4, 0.25]} />
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

interface MapRendererProps {
  mapData: GameMap;
}

function CanvasGround({ mapData }: { mapData: GameMap }) {
  const tex = useMemo(() => makeGroundTexture(mapData), [mapData]);
  const width = mapData.width * TILE_SIZE;
  const height = mapData.height * TILE_SIZE;

  return (
    <mesh
      position={[width / 2, -0.01, height / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={tex} roughness={0.9} metalness={0} />
    </mesh>
  );
}

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
          : npc.name?.toLowerCase().includes('hik') ? 'hiker'
          : npc.name?.toLowerCase().includes('rang') ? 'ranger'
          : 'resident';
        return (
          <NpcBillboard
            key={`npc-${i}`}
            variant={variantKey}
            position={[wx, 0, wz]}
          />
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