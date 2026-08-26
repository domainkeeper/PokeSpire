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
  oddish: {
    id: 43,
    name: 'Oddish',
    animated: '/assets/pokemon/oddish.gif',
    front: '/assets/pokemon/oddish-front.png',
    spriteWidth: 0.7,
    spriteHeight: 0.8,
  },
  bellsprout: {
    id: 69,
    name: 'Bellsprout',
    animated: '/assets/pokemon/bellsprout.gif',
    front: '/assets/pokemon/bellsprout-front.png',
    spriteWidth: 0.7,
    spriteHeight: 0.9,
  },
  jigglypuff: {
    id: 39,
    name: 'Jigglypuff',
    animated: '/assets/pokemon/jigglypuff.gif',
    front: '/assets/pokemon/jigglypuff-front.png',
    spriteWidth: 0.8,
    spriteHeight: 0.8,
  },
  mankey: {
    id: 56,
    name: 'Mankey',
    animated: '/assets/pokemon/mankey.gif',
    front: '/assets/pokemon/mankey-front.png',
    spriteWidth: 0.8,
    spriteHeight: 0.9,
  },
  nidoran_m: {
    id: 32,
    name: 'Nidoran♂',
    animated: '/assets/pokemon/nidoran-m.gif',
    front: '/assets/pokemon/nidoran-m-front.png',
    spriteWidth: 0.7,
    spriteHeight: 0.8,
  },
  nidoran_f: {
    id: 29,
    name: 'Nidoran♀',
    animated: '/assets/pokemon/nidoran-f.gif',
    front: '/assets/pokemon/nidoran-f-front.png',
    spriteWidth: 0.7,
    spriteHeight: 0.8,
  },
};

export type PokemonSpeciesKey = keyof typeof POKEMON_SPRITES;

export function getPokemonSprite(species: PokemonSpeciesKey): PokemonSpriteData {
  return POKEMON_SPRITES[species];
}
