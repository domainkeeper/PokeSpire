import type { AnchorStand } from '../status/anchors';

export interface StatusPreset {
  id: string;
  name: string;
  color: string;
  anchor: AnchorStand;
  particleCount: number;
  loopInterval: number;
}

export const STATUS_PRESETS: Record<string, StatusPreset> = {
  burn: {
    id: 'burn',
    name: 'Burn',
    color: '#ff6020',
    anchor: 'base',
    particleCount: 8,
    loopInterval: 1200,
  },
  poison: {
    id: 'poison',
    name: 'Poison',
    color: '#a040a0',
    anchor: 'bodyCenter',
    particleCount: 6,
    loopInterval: 1400,
  },
  paralysis: {
    id: 'paralysis',
    name: 'Paralysis',
    color: '#ffd800',
    anchor: 'bodyCenter',
    particleCount: 5,
    loopInterval: 900,
  },
  sleep: {
    id: 'sleep',
    name: 'Sleep',
    color: '#8090ff',
    anchor: 'head',
    particleCount: 3,
    loopInterval: 2000,
  },
  freeze: {
    id: 'freeze',
    name: 'Freeze',
    color: '#80e8ff',
    anchor: 'bodyCenter',
    particleCount: 10,
    loopInterval: 2500,
  },
  confusion: {
    id: 'confusion',
    name: 'Confusion',
    color: '#ff80c0',
    anchor: 'head',
    particleCount: 4,
    loopInterval: 1000,
  },
};
