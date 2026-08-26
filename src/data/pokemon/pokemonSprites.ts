export interface PokemonSpriteData {
  id: number;
  name: string;
  animated: string;
  front: string;
  spriteWidth: number;
  spriteHeight: number;
}

export const POKEMON_SPRITES: Record<string, PokemonSpriteData> = {
  pikachu: {
    id: 25,
    name: 'Pikachu',
    animated: '/assets/pokemon/pikachu.gif',
    front: '/assets/pokemon/pikachu-front.png',
    spriteWidth: 1.0,
    spriteHeight: 1.0,
  },
  eevee: {
    id: 133,
    name: 'Eevee',
    animated: '/assets/pokemon/eevee.gif',
    front: '/assets/pokemon/eevee-front.png',
    spriteWidth: 0.9,
    spriteHeight: 0.9,
  },
  bulbasaur: {
    id: 1,
    name: 'Bulbasaur',
    animated: '/assets/pokemon/bulbasaur.gif',
    front: '/assets/pokemon/bulbasaur-front.png',
    spriteWidth: 1.0,
    spriteHeight: 0.9,
  },
  charmander: {
    id: 4,
    name: 'Charmander',
    animated: '/assets/pokemon/charmander.gif',
    front: '/assets/pokemon/charmander-front.png',
    spriteWidth: 0.9,
    spriteHeight: 0.9,
  },
  squirtle: {
    id: 7,
    name: 'Squirtle',
    animated: '/assets/pokemon/squirtle.gif',
    front: '/assets/pokemon/squirtle-front.png',
    spriteWidth: 0.9,
    spriteHeight: 0.9,
  },
  pidgey: {
    id: 16,
    name: 'Pidgey',
    animated: '/assets/pokemon/pidgey.gif',
    front: '/assets/pokemon/pidgey-front.png',
    spriteWidth: 0.7,
    spriteHeight: 0.7,
  },
  rattata: {
    id: 19,
    name: 'Rattata',
    animated: '/assets/pokemon/rattata.gif',
    front: '/assets/pokemon/rattata-front.png',
    spriteWidth: 0.8,
    spriteHeight: 0.7,
  },
  caterpie: {
    id: 10,
    name: 'Caterpie',
    animated: '/assets/pokemon/caterpie.gif',
    front: '/assets/pokemon/caterpie-front.png',
    spriteWidth: 0.8,
    spriteHeight: 0.6,
  },
};

export type PokemonSpeciesKey = keyof typeof POKEMON_SPRITES;

export function getPokemonSprite(species: PokemonSpeciesKey): PokemonSpriteData {
  return POKEMON_SPRITES[species];
}
