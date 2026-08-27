import type { GameMap } from '../mapTypes';
import type { PokemonSpeciesKey } from '../pokemon/pokemonSprites';

export interface MapMeta {
  id: string;
  name: string;
  regionId: string;
  width: number;
  height: number;
  pixelsPerTile: number;
  themeId: string;
  layout: { worldX: number; worldY: number };
}

export interface MapModule {
  meta: MapMeta;
  build: () => GameMap;
}

export interface EncounterEntry {
  species: PokemonSpeciesKey;
  weight: number;
  min: number;
  max: number;
}

export interface EncounterZone {
  id: string;
  biome: 'grass' | 'water' | 'cave' | 'sand';
  rects: { x: number; y: number; w: number; h: number }[];
  table: EncounterEntry[];
  rarity?: 'common' | 'uncommon' | 'rare';
  requiresTag?: string;
}
