import { create } from 'zustand';
import type { SaveGame, PartyMember, Direction } from '../types/game';
import { loadSave, saveGame as persistSave } from './persistence';
import { getMap } from '../data/maps';

const START_MAP_ID = 'coastal-city';

/**
 * Derive the starting position from the map's own spawn marker instead of
 * hardcoding it. The previous hardcoded (60, 76) sat in the middle of the
 * residential pond and ignored `townMap.spawn` entirely.
 */
function startingPlayerState(): SaveGame['player'] {
  const map = getMap(START_MAP_ID);
  const spawn = map?.spawn ?? { x: 0, y: 0, facing: 'down' as Direction };
  return {
    name: 'Player',
    x: spawn.x,
    y: spawn.y,
    mapId: START_MAP_ID,
    facing: spawn.facing,
  };
}

interface GameStore extends SaveGame {
  setPlayerPosition: (x: number, y: number, facing: Direction, mapId: string) => void;
  addToParty: (member: PartyMember) => boolean;
  removeFromParty: (index: number) => void;
  updatePartyMember: (index: number, updates: Partial<PartyMember>) => void;
  updatePokedex: (speciesId: number, status: 'seen' | 'caught') => void;
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean;
  setFlag: (flag: string, value: boolean) => void;
  addBadge: (badge: string) => void;
  addItem: (itemId: string, qty?: number) => void;
  removeItem: (itemId: string, qty?: number) => boolean;
  save: () => void;
  load: () => boolean;
  resetGame: () => void;
}

const defaultSave: SaveGame = {
  version: 1,
  player: startingPlayerState(),
  party: [],
  pokedex: {},
  inventory: [],
  money: 3000,
  badges: [],
  flags: {},
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...defaultSave,

  setPlayerPosition: (x, y, facing, mapId) => {
    set({ player: { ...get().player, x, y, facing, mapId } });
  },

  addToParty: (member) => {
    const party = get().party;
    if (party.length >= 6) return false;
    set({ party: [...party, member] });
    return true;
  },

  removeFromParty: (index) => {
    const party = [...get().party];
    party.splice(index, 1);
    set({ party });
  },

  updatePartyMember: (index, updates) => {
    const party = [...get().party];
    party[index] = { ...party[index], ...updates };
    set({ party });
  },

  updatePokedex: (speciesId, status) => {
    const pokedex = { ...get().pokedex };
    const current = pokedex[speciesId];
    if (current === 'caught') return;
    if (current === 'seen' && status === 'seen') return;
    pokedex[speciesId] = status;
    set({ pokedex });
  },

  addMoney: (amount) => {
    set({ money: get().money + amount });
  },

  spendMoney: (amount) => {
    const money = get().money;
    if (money < amount) return false;
    set({ money: money - amount });
    return true;
  },

  setFlag: (flag, value) => {
    set({ flags: { ...get().flags, [flag]: value } });
  },

  addBadge: (badge) => {
    const badges = get().badges;
    if (badges.includes(badge)) return;
    set({ badges: [...badges, badge] });
  },

  addItem: (itemId, qty = 1) => {
    const inventory = [...get().inventory];
    const existing = inventory.find((i) => i.itemId === itemId);
    if (existing) {
      existing.qty += qty;
    } else {
      inventory.push({ itemId, qty });
    }
    set({ inventory });
  },

  removeItem: (itemId, qty = 1) => {
    const inventory = [...get().inventory];
    const index = inventory.findIndex((i) => i.itemId === itemId);
    if (index === -1) return false;
    if (inventory[index].qty < qty) return false;
    inventory[index].qty -= qty;
    if (inventory[index].qty <= 0) {
      inventory.splice(index, 1);
    }
    set({ inventory });
    return true;
  },

  save: () => {
    const state = get();
    persistSave(state);
  },

  load: () => {
    const loaded = loadSave();
    if (!loaded) return false;
    set(loaded);
    return true;
  },

  resetGame: () => {
    set(defaultSave);
  },
}));
