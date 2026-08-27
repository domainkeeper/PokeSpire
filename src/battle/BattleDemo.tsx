import { BattleScreen } from './BattleScreen';
import { PokemonDatabase } from '../data/pokemon/PokemonDatabase';
import type { Combatant, BattleMove } from './types';
import { getMoveExtension } from './moveExtensions';
import type { Species, Ability } from '@pkmn/dex';

export function BattleDemo() {
  const pikachuSpecies = PokemonDatabase.getSpeciesByName('Pikachu') as unknown as Species;
  const charmanderSpecies = PokemonDatabase.getSpeciesByName('Charmander') as unknown as Species;

  const createBattleMove = (name: string): BattleMove => {
    const dexMove = PokemonDatabase.getMoveByName(name);
    const ext = getMoveExtension(name);
    return {
      ...(dexMove || {
        id: name,
        name,
        type: 'Normal',
        category: 'Physical',
        basePower: 40,
        accuracy: 100,
        pp: 35,
        priority: 0,
        target: 'normal',
      }),
      ...ext,
    } as unknown as BattleMove;
  };

  const pikaMoves: BattleMove[] = [
    createBattleMove('tackle'),
    createBattleMove('thundershock'),
    createBattleMove('quickattack'),
  ];

  const charMoves: BattleMove[] = [
    createBattleMove('scratch'),
    createBattleMove('ember'),
  ];

  const player: Combatant = {
    id: 'player-1',
    species: pikachuSpecies,
    level: 10,
    currentHp: 100,
    maxHp: 100,
    ability: { id: 'static', name: 'Static', rating: 3, num: 9 } as unknown as Ability,
    moves: pikaMoves,
    gauge: 0,
    arenaPosition: 30,
    statusConditions: [],
    volatileFlags: {},
    isPlayerControlled: true,
  };

  const enemy: Combatant = {
    id: 'enemy-1',
    species: charmanderSpecies,
    level: 10,
    currentHp: 100,
    maxHp: 100,
    ability: { id: 'blaze', name: 'Blaze', rating: 3, num: 66 } as unknown as Ability,
    moves: charMoves,
    gauge: 0,
    arenaPosition: 70,
    statusConditions: [],
    volatileFlags: {},
    isPlayerControlled: false,
  };

  return (
    <BattleScreen
      playerPokemon={player}
      enemyPokemon={enemy}
      onBattleEnd={(victory) => {
        alert(victory ? 'Victory!' : 'Defeat!');
        window.location.hash = '';
      }}
    />
  );
}
