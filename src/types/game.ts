export type PokemonType = 'normal' | 'fire' | 'water' | 'grass' | 'electric' | 'bug' | 'flying' | 'poison';
export type Direction = 'up' | 'down' | 'left' | 'right';
export type MoveCategory = 'physical' | 'special';

export interface PokemonSpecies {
  id: number;
  name: string;
  types: [PokemonType] | [PokemonType, PokemonType];
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spd: number;
  };
  moves: string[];
  spriteFront: string;
  spriteBack: string;
  spriteIcon: string;
  catchRate: number;
  evolvesInto?: number;
}

export interface MoveDef {
  id: string;
  name: string;
  type: PokemonType;
  power: number;
  accuracy: number;
  category: MoveCategory;
  pp: number;
}

export interface PartyMember {
  speciesId: number;
  nickname?: string;
  level: number;
  currentHp: number;
  moves: string[];
  xp?: number;
}

export interface SaveGame {
  version: number;
  player: {
    name: string;
    x: number;
    y: number;
    mapId: string;
    facing: Direction;
  };
  party: PartyMember[];
  pokedex: Record<number, 'unseen' | 'seen' | 'caught'>;
  inventory: { itemId: string; qty: number }[];
  money: number;
  badges: string[];
  flags: Record<string, boolean>;
}

export interface TrainerDef {
  id: string;
  name: string;
  party: PartyMember[];
  defeatFlag: string;
  rewardMoney: number;
  rewardBadge?: string;
}