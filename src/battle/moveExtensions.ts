import type { BattleMoveExtension } from './types';

export const MOVE_EXTENSIONS: Record<string, BattleMoveExtension> = {
  tackle: { aimed: false, shape: 'single', shapeSize: 0, precisionBonusMultiplier: 1 },
  ember: { aimed: true, shape: 'cone', shapeSize: 30, precisionBonusMultiplier: 1.2 },
  scratch: { aimed: false, shape: 'single', shapeSize: 0, precisionBonusMultiplier: 1 },
  watergun: { aimed: true, shape: 'line', shapeSize: 25, precisionBonusMultiplier: 1.2 },
  thundershock: { aimed: true, shape: 'circle', shapeSize: 20, precisionBonusMultiplier: 1.25 },
  vinewhip: { aimed: false, shape: 'single', shapeSize: 0, precisionBonusMultiplier: 1 },
  quickattack: { aimed: false, shape: 'single', shapeSize: 0, precisionBonusMultiplier: 1 },
  flamethrower: { aimed: true, shape: 'cone', shapeSize: 35, precisionBonusMultiplier: 1.3 },
  surf: { aimed: false, shape: 'single', shapeSize: 0, precisionBonusMultiplier: 1 },
  thunderbolt: { aimed: true, shape: 'circle', shapeSize: 25, precisionBonusMultiplier: 1.3 },
  icebeam: { aimed: true, shape: 'line', shapeSize: 30, precisionBonusMultiplier: 1.25 },
};

const DEFAULT_EXTENSION: BattleMoveExtension = {
  aimed: false,
  shape: 'single',
  shapeSize: 0,
  precisionBonusMultiplier: 1,
};

export function getMoveExtension(moveId: string): BattleMoveExtension {
  return MOVE_EXTENSIONS[moveId.toLowerCase().replace(/[^a-z0-9]/g, '')] ?? DEFAULT_EXTENSION;
}
