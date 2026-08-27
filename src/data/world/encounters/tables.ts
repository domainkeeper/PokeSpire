import type { EncounterEntry } from '../worldTypes';

export const COAST_GRASS: EncounterEntry[] = [
  { species: 'pidgey', weight: 4, min: 3, max: 8 },
  { species: 'rattata', weight: 3, min: 3, max: 7 },
  { species: 'caterpie', weight: 2, min: 2, max: 6 },
  { species: 'pikachu', weight: 1, min: 4, max: 9 },
];

export const MEADOW_GRASS: EncounterEntry[] = [
  { species: 'pidgey', weight: 3, min: 4, max: 10 },
  { species: 'rattata', weight: 3, min: 4, max: 9 },
  { species: 'eevee', weight: 1, min: 5, max: 10 },
  { species: 'pikachu', weight: 1, min: 5, max: 10 },
];

export const FOREST: EncounterEntry[] = [
  { species: 'caterpie', weight: 4, min: 4, max: 10 },
  { species: 'bulbasaur', weight: 1, min: 5, max: 10 },
  { species: 'pidgey', weight: 2, min: 4, max: 9 },
  { species: 'pikachu', weight: 1, min: 5, max: 10 },
];

export const CAVE: EncounterEntry[] = [
  { species: 'charmander', weight: 1, min: 6, max: 12 },
  { species: 'rattata', weight: 3, min: 5, max: 10 },
  { species: 'pikachu', weight: 1, min: 6, max: 11 },
];

export const WATER_SURF: EncounterEntry[] = [
  { species: 'squirtle', weight: 2, min: 5, max: 10 },
  { species: 'pidgey', weight: 2, min: 4, max: 9 },
  { species: 'rattata', weight: 1, min: 4, max: 8 },
];

export const CITY_NIGHT: EncounterEntry[] = [
  { species: 'rattata', weight: 3, min: 5, max: 10 },
  { species: 'pidgey', weight: 2, min: 5, max: 9 },
  { species: 'pikachu', weight: 1, min: 6, max: 11 },
];
