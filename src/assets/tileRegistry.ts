// Kenney RPG Pack tile mapping
// Each tile is 64x64 PNG from /public/assets/tiles/kenney-rpg/PNG/
export interface TileAsset {
  path: string;
  name: string;
}

// Map tile types to Kenney RPG tile numbers
// Based on preview analysis: grass=0-7, dirt=8-15, water=16-23, path=24-31, etc.
export const TILE_ASSETS: Record<string, TileAsset> = {
  // Grass variants
  'grass_1': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile000.png', name: 'grass_1' },
  'grass_2': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile001.png', name: 'grass_2' },
  'grass_3': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile002.png', name: 'grass_3' },
  'grass_4': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile003.png', name: 'grass_4' },
  'grass_5': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile004.png', name: 'grass_5' },
  'grass_6': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile005.png', name: 'grass_6' },
  'grass_7': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile006.png', name: 'grass_7' },
  'grass_8': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile007.png', name: 'grass_8' },
  // Dirt/path
  'dirt_1': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile008.png', name: 'dirt_1' },
  'dirt_2': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile009.png', name: 'dirt_2' },
  'path_1': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile010.png', name: 'path_1' },
  'path_2': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile011.png', name: 'path_2' },
  // Water
  'water_1': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile012.png', name: 'water_1' },
  'water_2': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile013.png', name: 'water_2' },
  // Stone/path
  'stone_1': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile016.png', name: 'stone_1' },
  'stone_2': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile017.png', name: 'stone_2' },
  // Wall
  'wall_1': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile024.png', name: 'wall_1' },
  'wall_2': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile025.png', name: 'wall_2' },
  // Trees (from bottom section of spritesheet)
  'tree_1': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile144.png', name: 'tree_1' },
  'tree_2': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile145.png', name: 'tree_2' },
  'tree_3': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile146.png', name: 'tree_3' },
  'tree_4': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile147.png', name: 'tree_4' },
  // Fence
  'fence_1': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile101.png', name: 'fence_1' },
  'fence_2': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile102.png', name: 'fence_2' },
  // Door
  'door_1': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile175.png', name: 'door_1' },
  // Window
  'window_1': { path: '/assets/tiles/kenney-rpg/PNG/rpgTile161.png', name: 'window_1' },
};

export type TileType = 'grass' | 'path' | 'water' | 'dirt' | 'sand';

// Maps logical tile types to available Kenney tile variants
export const TILE_TYPE_MAP: Record<TileType, string[]> = {
  grass: ['grass_1', 'grass_2', 'grass_3', 'grass_4', 'grass_5', 'grass_6'],
  path: ['path_1', 'path_2', 'stone_1', 'stone_2'],
  water: ['water_1', 'water_2'],
  dirt: ['dirt_1', 'dirt_2'],
  sand: ['dirt_1', 'dirt_2'],
};

// Get a tile variant based on position (deterministic)
export function getTileVariant(type: TileType, x: number, y: number): string {
  const variants = TILE_TYPE_MAP[type] || TILE_TYPE_MAP.grass;
  const hash = ((x * 7 + y * 13) % variants.length + variants.length) % variants.length;
  return variants[hash];
}
