import { useMemo } from 'react';
import { gridToWorld, objectFootprint } from '../../utils/gridUtils';
import { TILE_SIZE } from '../../utils/constants';
import type { GameMap } from '../../data/mapTypes';
import { resolvePropId } from '../../data/props/propAliases';
import { PROP_REGISTRY, type PropId } from '../../data/props/propRegistry';
import { getPokemonSprite, pokemonAssetId } from '../../data/pokemon/pokemonSprites';
import type { PokemonSpeciesKey } from '../../data/pokemon/pokemonSprites';
import type { Theme } from '../../theme/types';

import { InstancedProps, type PropInstance } from '../entities/InstancedProps';
import { getPropParts } from '../entities/propFactory';
import { SpriteActor } from '../entities/SpriteActor';
import { WaterPlane } from '../entities/WaterPlane';
import { buildTerrain } from '../terrain/heightfield';
import { makeGroundTexture, hasWater, groundPixelSize } from '../terrain/groundTexture';
import { createTerrainMaterial } from '../terrain/terrainMaterial';
import { getSingleSprite, getIdleTexture, PLAYER_MANIFEST } from '../pixel/sprites/characterSprites';

/**
 * Deterministic per-placement hash. Same tile always yields the same variant,
 * yaw and scale, so the world is varied but stable across reloads and renders.
 */
function propHash(gx: number, gy: number): number {
  let h = (gx * 374761393 + gy * 668265263) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return (h ^ (h >> 16)) >>> 0;
}

/* --------------------------------------------------------------- ground --- */

function Terrain({ mapData, theme }: { mapData: GameMap; theme: Theme }) {
  const terrain = useMemo(() => buildTerrain(mapData), [mapData]);
  const material = useMemo(() => {
    const tex = makeGroundTexture(mapData, theme);
    return createTerrainMaterial(tex, theme, groundPixelSize(mapData));
  }, [mapData, theme]);

  return <mesh geometry={terrain.geometry} material={material} receiveShadow />;
}

/* ---------------------------------------------------------------- props --- */

/**
 * Instances grouped by (prop id, variant). One InstancedProps per group means
 * one draw call per part for every copy of that prop in the map, regardless of
 * how many are placed.
 */
type PropGroups = Map<string, { id: PropId; variant: number; instances: PropInstance[] }>;

function groupProps(mapData: GameMap, terrainHeight: (gx: number, gy: number) => number): PropGroups {
  const groups: PropGroups = new Map();

  for (const obj of mapData.objects) {
    const id = resolvePropId(obj.type);
    const def = PROP_REGISTRY[id];
    if (!def) {
      console.warn(`[MapRenderer] unknown prop id "${obj.type}"`);
      continue;
    }

    const fp = objectFootprint(obj);
    const h = propHash(obj.gx, obj.gy);

    // Centre the visual on the collision footprint, so what you see is what
    // blocks you.
    const [wx, , wz] = gridToWorld(obj.gx, obj.gy);
    const cx = wx + (fp.w * TILE_SIZE) / 2;
    const cz = wz + (fp.h * TILE_SIZE) / 2;

    // Sit the prop on the terrace it was placed on.
    const groundY =
      def.groundToTerrain === false
        ? 0
        : terrainHeight(obj.gx + Math.floor(fp.w / 2), obj.gy + Math.floor(fp.h / 2));

    const variant = obj.variant ?? (def.variants > 1 ? h % def.variants : 0);

    let scale = obj.scale ?? 1;
    if (def.scaleJitter) {
      const [lo, hi] = def.scaleJitter;
      scale *= lo + (((h >> 8) % 1000) / 1000) * (hi - lo);
    }

    let rotationY = obj.yaw ?? 0;
    if (def.randomYaw) rotationY += (((h >> 18) % 1000) / 1000) * Math.PI * 2;

    const key = `${id}#${variant}`;
    let group = groups.get(key);
    if (!group) {
      group = { id, variant, instances: [] };
      groups.set(key, group);
    }
    group.instances.push({ position: [cx, groundY, cz], scale, rotationY });
  }

  return groups;
}

/* ----------------------------------------------------------------- npcs --- */

const NPC_ROLE_TINT: Record<string, string> = {
  professor: '#a8ccff',
  gardener: '#a8e8a0',
  hiker: '#e8c898',
  ranger: '#a8e0a8',
  nurse: '#ffbcd4',
  merchant: '#ffd8a0',
  scientist: '#a8e8e8',
  sailor: '#aab4f0',
  elder: '#d8c0a8',
  trainer: '#ff9c9c',
  resident: '#ffffff',
};

function npcRole(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('professor')) return 'professor';
  if (n.includes('garden')) return 'gardener';
  if (n.includes('hik')) return 'hiker';
  if (n.includes('rang')) return 'ranger';
  if (n.includes('nurse')) return 'nurse';
  if (n.includes('merchant') || n.includes('shop')) return 'merchant';
  if (n.includes('scientist')) return 'scientist';
  if (n.includes('sailor') || n.includes('fisher')) return 'sailor';
  if (n.includes('elder')) return 'elder';
  if (n.includes('trainer') || n.includes('leader') || n.includes('catcher')) return 'trainer';
  return 'resident';
}

const NPC_SIZE = 0.72;

function Npc({
  name,
  color,
  position,
  theme,
  phase,
}: {
  name: string;
  color?: string;
  position: [number, number, number];
  theme: Theme;
  phase: number;
}) {
  // Shared idle texture: never handed to setFrame, so the player's walk cycle
  // cannot mutate it out from under every NPC.
  const tex = useMemo(() => getIdleTexture(PLAYER_MANIFEST, 'down'), []);
  const tint = color ?? NPC_ROLE_TINT[npcRole(name)] ?? '#ffffff';

  return (
    <group position={position}>
      <SpriteActor
        texture={tex}
        width={NPC_SIZE}
        height={NPC_SIZE}
        layers={3}
        tint={tint}
        contactShadow={0.22}
        contactShadowOpacity={theme.lighting.contactShadowOpacity}
        bob={0.012}
        bobSpeed={1.1}
        phase={phase}
      />
    </group>
  );
}

/* -------------------------------------------------------------- pokemon --- */

function Pokemon({
  species,
  position,
  theme,
  phase,
}: {
  species: PokemonSpeciesKey;
  position: [number, number, number];
  theme: Theme;
  phase: number;
}) {
  const sprite = getPokemonSprite(species);
  const tex = useMemo(() => getSingleSprite(pokemonAssetId(species)), [species]);

  return (
    <group position={position}>
      <SpriteActor
        texture={tex}
        width={sprite.size}
        height={sprite.size}
        layers={3}
        layerGap={0.018}
        contactShadow={sprite.size * 0.42}
        contactShadowOpacity={theme.lighting.contactShadowOpacity}
        bob={0.02}
        bobSpeed={1.9}
        phase={phase}
      />
    </group>
  );
}

/* ------------------------------------------------------------ renderer --- */

export function MapRenderer({ mapData, theme }: { mapData: GameMap; theme: Theme }) {
  const terrain = useMemo(() => buildTerrain(mapData), [mapData]);
  const groups = useMemo(() => groupProps(mapData, terrain.heightAt), [mapData, terrain]);
  const mapHasWater = useMemo(() => hasWater(mapData), [mapData]);

  return (
    <group>
      <Terrain mapData={mapData} theme={theme} />
      {mapHasWater && <WaterPlane mapData={mapData} theme={theme} />}

      {[...groups.entries()].map(([key, g]) => (
        <InstancedProps
          key={key}
          parts={getPropParts(theme, g.id, g.variant)}
          instances={g.instances}
        />
      ))}

      {mapData.npcPositions.map((npc, i) => {
        const [wx, , wz] = gridToWorld(npc.x, npc.y);
        return (
          <Npc
            key={`npc-${i}`}
            name={npc.name}
            color={npc.color}
            position={[wx, terrain.heightAt(npc.x, npc.y), wz]}
            theme={theme}
            phase={i * 0.7}
          />
        );
      })}

      {mapData.pokemon?.map((p, i) => {
        const [wx, , wz] = gridToWorld(p.gx, p.gy);
        return (
          <Pokemon
            key={`mon-${i}`}
            species={p.species}
            position={[wx, terrain.heightAt(p.gx, p.gy), wz]}
            theme={theme}
            phase={i * 1.3}
          />
        );
      })}
    </group>
  );
}
