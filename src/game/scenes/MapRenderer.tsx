import { useMemo, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gridToWorld } from '../../utils/gridUtils';
import { TILE_SIZE } from '../../utils/constants';
import type { GameMap } from '../../data/mapTypes';
import { getPokemonSprite } from '../../data/pokemon/pokemonSprites';
import type { PokemonSpeciesKey } from '../../data/pokemon/pokemonSprites';
import type { TileType } from '../../assets/tileRegistry';

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
        loader.load(
          sprite.front,
          (texture) => {
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            texture.needsUpdate = true;
            setTex(texture);
          },
        );
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

// Tile type to color mapping — rich, saturated palette
const TILE_COLORS: Record<TileType, THREE.Color[]> = {
  grass: [
    new THREE.Color('#3d8b37'),
    new THREE.Color('#4caf50'),
    new THREE.Color('#5cb85c'),
    new THREE.Color('#66bb6a'),
    new THREE.Color('#43a047'),
    new THREE.Color('#388e3c'),
  ],
  path: [
    new THREE.Color('#c8b68e'),
    new THREE.Color('#bcaaa4'),
    new THREE.Color('#d4c49a'),
    new THREE.Color('#a89070'),
  ],
  water: [
    new THREE.Color('#1e88e5'),
    new THREE.Color('#2196f3'),
    new THREE.Color('#42a5f5'),
    new THREE.Color('#1565c0'),
  ],
  dirt: [
    new THREE.Color('#8d6e4c'),
    new THREE.Color('#a1887f'),
    new THREE.Color('#795548'),
  ],
  sand: [
    new THREE.Color('#e8d56a'),
    new THREE.Color('#f0e68c'),
    new THREE.Color('#dbc07c'),
  ],
};

function getColorForTile(type: TileType, x: number, y: number): THREE.Color {
  const palette = TILE_COLORS[type] || TILE_COLORS.grass;
  const idx = ((x * 7 + y * 13 + x * y * 3) % palette.length + palette.length) % palette.length;
  return palette[idx];
}

interface MapRendererProps {
  mapData: GameMap;
}

// Ground rendered as separate colored quads per terrain type using InstancedMesh
function GroundLayer({ mapData }: { mapData: GameMap }) {
  // Build instance data: for each tile type, collect positions and colors
  const instanceData = useMemo(() => {
    const s = TILE_SIZE;
    const halfS = s / 2;
    const byType: Record<string, { positions: number[]; colors: number[]; count: number }> = {};

    for (let y = 0; y < mapData.height; y++) {
      for (let x = 0; x < mapData.width; x++) {
        const t: TileType = mapData.ground[y]?.[x] || 'grass';
        if (!byType[t]) byType[t] = { positions: [], colors: [], count: 0 };

        const [wx, , wz] = gridToWorld(x, y);
        const color = getColorForTile(t, x, y);

        // Center of tile
        byType[t].positions.push(wx + halfS, -0.04, wz + halfS);
        byType[t].colors.push(color.r, color.g, color.b);
        byType[t].count++;
      }
    }

    return byType;
  }, [mapData]);

  return (
    <group>
      {Object.entries(instanceData).map(([type, data]) => {
        if (data.count === 0) return null;
        return (
          <GroundInstancedMesh
            key={type}
            count={data.count}
            positions={data.positions}
            colors={data.colors}
            tileSize={TILE_SIZE}
          />
        );
      })}
    </group>
  );
}

function GroundInstancedMesh({
  count,
  positions,
  colors,
  tileSize,
}: {
  count: number;
  positions: number[];
  colors: number[];
  tileSize: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(tileSize, tileSize).rotateX(-Math.PI / 2), [tileSize]);

  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();

    for (let i = 0; i < count; i++) {
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      col.setRGB(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
      mesh.setColorAt(i, col);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count, positions, colors]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geo, undefined, count]}
      frustumCulled={false}
    >
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

// Simple base ground plane as fallback / absolute minimum guarantee
function BaseGround({ mapData }: { mapData: GameMap }) {
  const width = mapData.width * TILE_SIZE;
  const height = mapData.height * TILE_SIZE;
  const centerX = width / 2;
  const centerZ = height / 2;

  return (
    <mesh
      position={[centerX, -0.06, centerZ]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow={false}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial color="#3d8b37" side={THREE.DoubleSide} />
    </mesh>
  );
}

export function MapRenderer({ mapData }: MapRendererProps) {
  const sortedObjects = useMemo(() => {
    return [...mapData.objects].sort((a, b) => a.gy - b.gy);
  }, [mapData]);

  return (
    <group>
      {/* Absolute base ground - ensures something always renders */}
      <BaseGround mapData={mapData} />

      {/* Detailed tile ground layer */}
      <GroundLayer mapData={mapData} />

      {/* Environment objects */}
      {sortedObjects.map((obj, i) => {
        const [wx, , wz] = gridToWorld(obj.gx, obj.gy);
        const tex = getSprite(obj.type);
        const sw = obj.spriteW;
        const sh = obj.spriteH;
        const animScale = obj.type === 'flower';
        const animSway = obj.animSway;

        return (
          <PixelSprite
            key={`obj-${i}`}
            texture={tex}
            position={[wx, 0, wz]}
            width={sw}
            height={sh}
            anchorY={0.15}
            animScale={animScale}
            animSway={animSway}
            animWater={obj.type === 'water'}
          />
        );
      })}

      {/* NPCs */}
      {mapData.npcPositions.map((npc, i) => {
        const [wx, , wz] = gridToWorld(npc.x, npc.y);
        const npcTex = makeNpcSprite(npc.color || '#7b1fa2');
        return (
          <PixelSprite
            key={`npc-${i}`}
            texture={npcTex}
            position={[wx, 0, wz]}
            width={0.7}
            height={1.1}
            anchorY={0.15}
          />
        );
      })}

      {/* Pokémon */}
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
