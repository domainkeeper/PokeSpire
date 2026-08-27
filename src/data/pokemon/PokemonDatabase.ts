/**
 * PokemonDatabase — Unified data access layer for all Pokemon game data.
 *
 * Usage:
 *   import { PokemonDatabase } from './pokemon/index';
 *   const pika = PokemonDatabase.getSpecies(25);
 *   const tackle = PokemonDatabase.getMoveByName('Tackle');
 *   const eff = PokemonDatabase.getEffectiveness('fire', ['grass']);
 */

import {
  getSpeciesById, getSpeciesByName, getAllSpecies, getSpeciesCount,
  getMoveById, getMoveByName, getAllMoves, getMoveCount,
  getAbilityById, getAbilityByName, getAllAbilities, getAbilityCount,
  getItemById, getItemByName, getAllItems, getItemCount,
  getEvolutionsForSpecies, getAllEvolutions, getEvolutionCount,
  TYPES, getTypeByName, getTypeById, getEffectiveness, TYPE_NAMES,
  getBerryById, getBerryByName, getAllBerries, getBerryCount,
  getMegaByStone, getMegasForSpecies, getAllMegaEvolutions,
  getMegaStoneById, getMegaStoneByName, getMegaStonesForSpecies, getAllMegaStones,
} from './index.ts';

import type {
  PokemonSpeciesData,
  MoveData,
  AbilityData,
  ItemData,
  TypeEffectiveness,
  EvolutionData,
  PokemonType,
  BerryData,
  MegaEvolutionData,
  MegaStoneData,
} from './schemas/index.ts';

export const PokemonDatabase = {
  // --- Species ---
  getSpecies: getSpeciesById,
  getSpeciesByName,
  getAllSpecies,
  getSpeciesCount,

  // --- Moves ---
  getMove: getMoveById,
  getMoveByName,
  getAllMoves,
  getMoveCount,

  // --- Abilities ---
  getAbility: getAbilityById,
  getAbilityByName,
  getAllAbilities,
  getAbilityCount,

  // --- Items ---
  getItem: getItemById,
  getItemByName,
  getAllItems,
  getItemCount,

  // --- Types ---
  getType: getTypeByName,
  getTypeById,
  getTypeNames: () => TYPE_NAMES,
  getEffectiveness,
  getAllTypes: () => TYPES,

  // --- Evolutions ---
  getEvolutions: getEvolutionsForSpecies,
  getAllEvolutions,
  getEvolutionCount,

  // --- Berries ---
  getBerry: getBerryById,
  getBerryByName,
  getAllBerries,
  getBerryCount,

  // --- Mega Evolution ---
  getMegaByStone,
  getMegasForSpecies,
  getAllMegaEvolutions,

  // --- Mega Stones ---
  getMegaStone: getMegaStoneById,
  getMegaStoneByName,
  getMegaStonesForSpecies,
  getAllMegaStones,

  // --- Convenience ---
  /** Get the base stats BST for a species. */
  getBST(id: number): number {
    const s = getSpeciesById(id);
    if (!s) return 0;
    return s.bst || (
      s.baseStats.hp + s.baseStats.atk + s.baseStats.def +
      s.baseStats.spa + s.baseStats.spd + s.baseStats.spe
    );
  },

  /** Get all species of a given type. */
  getSpeciesByType(type: PokemonType): PokemonSpeciesData[] {
    return getAllSpecies().filter(s => s.types.includes(type));
  },

  /** Get the evolution chain for a species (all pre-evos and evos recursively). */
  getEvolutionChain(species: string): EvolutionData[] {
    const chain: EvolutionData[] = [];
    const visited = new Set<string>();

    function walk(name: string) {
      if (visited.has(name.toLowerCase())) return;
      visited.add(name.toLowerCase());

      // Get evolutions of this species
      const evos = getEvolutionsForSpecies(name);
      for (const evo of evos) {
        chain.push(evo);
        walk(evo.targetSpecies);
      }

      // Get pre-evolution
      const speciesData = getSpeciesByName(name);
      if (speciesData?.prevo) {
        walk(speciesData.prevo);
      }
    }

    walk(species);
    return chain;
  },

  /** Get species that evolve FROM the given species. */
  getEvolutionsFrom(species: string): EvolutionData[] {
    return getEvolutionsForSpecies(species);
  },

  /** Get species that evolve INTO the given species. */
  getPreEvolution(species: string): PokemonSpeciesData | null {
    const s = getSpeciesByName(species);
    if (!s?.prevo) return null;
    return getSpeciesByName(s.prevo) || null;
  },

  /** Get all legendary Pokemon. */
  getLegendaries(): PokemonSpeciesData[] {
    return getAllSpecies().filter(s => s.isLegendary);
  },

  /** Get all Pokemon in a generation. */
  getSpeciesByGeneration(gen: number): PokemonSpeciesData[] {
    return getAllSpecies().filter(s => s.generation === gen);
  },
};

export type { PokemonSpeciesData, MoveData, AbilityData, ItemData, TypeEffectiveness, EvolutionData, PokemonType, BerryData, MegaEvolutionData, MegaStoneData };
