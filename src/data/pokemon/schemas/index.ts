export const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison',
  'ground', 'flying', 'psychic', 'rock', 'bug', 'ghost', 'dragon', 'dark',
  'steel', 'fairy',
] as const;

export type PokemonType = (typeof POKEMON_TYPES)[number];

export interface TypeEffectiveness {
  id: number;
  name: string;
  damageTaken: Record<PokemonType, 0 | 1 | 2 | 3 | 4>;
}

export interface TypeData {
  types: TypeEffectiveness[];
}

export interface PokemonSpeciesData {
  id: number;
  name: string;
  species: string;
  generation: number;
  types: PokemonType[];
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  abilities: {
    regular: string[];
    hidden: string[];
  };
  height: number;
  weight: number;
  genderRatio: { M: number; F: number };
  eggGroups: string[];
  captureRate: number;
  baseExperience: number;
  baseHappiness: number;
  growthRate: string;
  forms: string[];
  baseForme: string;
  prevo: string | null;
  evos: string[];
  canHatch: boolean;
  isMega: boolean;
  isGmax: boolean;
  isLegendary: boolean;
  isMythical: boolean;
  isBaby: boolean;
  nfe: boolean;
 bst: number;
  spritePath: string;
  iconPath: string;
}

export interface MoveData {
  id: number;
  name: string;
  type: PokemonType;
  category: 'physical' | 'special' | 'status';
  power: number;
  accuracy: number | true;
  pp: number;
  priority: number;
  target: string;
  flags: Record<string, number>;
  desc: string;
  shortDesc: string;
  secondary: {
    chance: number;
    status?: string;
    boosts?: Record<string, number>;
    volatileStatus?: string;
  } | null;
  critRatio: number;
  maxMove: { basePower?: number } | null;
  zMove: { basePower?: number } | null;
}

export interface AbilityData {
  id: number;
  name: string;
  desc: string;
  shortDesc: string;
  flags: Record<string, number>;
}

export interface ItemData {
  id: number;
  name: string;
  desc: string;
  shortDesc: string;
  generation: number;
  spritePath: string;
}

export interface BerryData {
  id: number;
  name: string;
  firmness: string;
  growthTime: number;
  maxHarvest: number;
  naturalGiftPower: number;
  naturalGiftType: string;
  size: number;
  smoothness: number;
  soilDryness: number;
  flavors: {
    spicy: number;
    dry: number;
    sweet: number;
    bitter: number;
    sour: number;
  };
  spritePath: string;
}

export interface EvolutionData {
  species: string;
  targetSpecies: string;
  trigger: string;
  conditions: {
    level?: number;
    item?: string;
    move?: string;
    happiness?: number;
    time?: string;
    heldItem?: string;
    knownMoveType?: string;
    location?: string;
    gender?: string;
    needsOverworldRain?: boolean;
    relativePhysicalStats?: number;
    partySpecies?: string;
    partyType?: string;
    tradeSpecies?: string;
  };
}

export interface MegaEvolutionData {
  baseSpecies: string;
  megaForme: string;
  megaStone: string;
  types: string[];
  abilities: { regular: string[]; hidden: string[] };
  baseStats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  spritePath: string;
}

export interface MegaStoneData {
  id: number;
  name: string;
  desc: string;
  shortDesc: string;
  generation: number;
  targetSpecies: string;
  spritePath: string;
}

export interface PokemonAssets {
  [id: string]: {
    front: string;
    back: string;
    shinyFront: string;
    shinyBack: string;
    icon: string;
    animated?: string;
    cry?: string;
    forms?: Record<string, { front: string; back?: string }>;
  };
}

export interface ManifestEntry {
  source: string;
  url: string;
  localPath: string;
  assetCount: number;
  successCount: number;
  failCount: number;
  timestamp: string;
  checksum?: string;
}
