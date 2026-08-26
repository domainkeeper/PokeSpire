import { registerPokemonSprite } from '../../assets/registry';

/**
 * Species visual data.
 *
 * NOTE the deliberate lack of a `Record<string, ...>` annotation: that annotation
 * used to collapse `keyof typeof POKEMON_SPRITES` to plain `string`, so
 * PokemonSpeciesKey provided zero type safety and a typo in map data compiled
 * fine then threw at runtime. `satisfies` keeps the literal key union.
 */
export interface PokemonSpriteData {
  id: number;
  name: string;
  /** File name inside public/assets/pokemon, resolved via the asset registry. */
  file: string;
  /** Rendered size in world units. Source art is square, so one value. */
  size: number;
}

export const POKEMON_SPRITES = {
  pikachu:    { id: 25,  name: 'Pikachu',    file: 'pikachu-front.png',    size: 0.62 },
  eevee:      { id: 133, name: 'Eevee',      file: 'eevee-front.png',      size: 0.6  },
  bulbasaur:  { id: 1,   name: 'Bulbasaur',  file: 'bulbasaur-front.png',  size: 0.6  },
  charmander: { id: 4,   name: 'Charmander', file: 'charmander-front.png', size: 0.6  },
  squirtle:   { id: 7,   name: 'Squirtle',   file: 'squirtle-front.png',   size: 0.58 },
  pidgey:     { id: 16,  name: 'Pidgey',     file: 'pidgey-front.png',     size: 0.5  },
  rattata:    { id: 19,  name: 'Rattata',    file: 'rattata-front.png',    size: 0.5  },
  caterpie:   { id: 10,  name: 'Caterpie',   file: 'caterpie-front.png',   size: 0.48 },
} satisfies Record<string, PokemonSpriteData>;

/**
 * Species keys with real literal types. A typo in map data is now a COMPILE
 * error instead of a runtime crash.
 */
export type PokemonSpeciesKey = keyof typeof POKEMON_SPRITES;

export const ALL_SPECIES = Object.keys(POKEMON_SPRITES) as PokemonSpeciesKey[];

// Register every species with the asset registry so nothing else builds paths.
for (const key of ALL_SPECIES) {
  registerPokemonSprite(key, POKEMON_SPRITES[key].file);
}

export function getPokemonSprite(species: PokemonSpeciesKey): PokemonSpriteData {
  return POKEMON_SPRITES[species];
}

export function pokemonAssetId(species: PokemonSpeciesKey): string {
  return `mon.${species}.front`;
}
