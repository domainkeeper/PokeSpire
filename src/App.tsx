import { useEffect, useMemo, useState } from 'react';
import { GameCanvas } from './game/GameCanvas';
import { EffectDemo } from './game/effects/EffectDemo';
import { BattleRuntime, createBattle } from './battle';
import type { BattleSnapshot } from './battle';
import type { CombatantSpec } from './battle/engine/battleFactory';
import { useGameStore } from './state/gameStore';
import { getSpeciesById } from './data/pokemon/species';

/**
 * Fallback player team for wild encounters until the party system is populated.
 * Two members so SWITCH is exercised; the engine supports N per side either way.
 */
const DEFAULT_PLAYER_TEAM: CombatantSpec[] = [
  { species: 'Pikachu', level: 22 },
  { species: 'Squirtle', level: 20 },
];

function BattleRoute() {
  const pendingBattle = useGameStore((s) => s.pendingBattle);
  const endBattle = useGameStore((s) => s.endBattle);
  const party = useGameStore((s) => s.party);

  // Build the snapshot once per encounter so a re-render never restarts the battle.
  const snapshot: BattleSnapshot = useMemo(() => {
    const playerTeam: CombatantSpec[] =
      party.length > 0
        ? party.map((m) => ({
            species: getSpeciesById(m.speciesId)?.name ?? 'Pikachu',
            level: m.level,
            nickname: m.nickname,
          }))
        : DEFAULT_PLAYER_TEAM;

    const enemySpecies = pendingBattle?.enemySpecies ?? 'Charmander';
    const enemyLevel = Math.max(
      5,
      Math.round(playerTeam.reduce((a, p) => a + p.level, 0) / playerTeam.length),
    );

    return createBattle({
      playerTeam,
      enemyTeam: [{ species: enemySpecies, level: enemyLevel }],
      seed: `${enemySpecies}-${Date.now()}`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingBattle?.enemySpecies]);

  return (
    <BattleRuntime
      initial={snapshot}
      onBattleEnd={() => {
        endBattle();
      }}
    />
  );
}

export default function App() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const handler = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  if (route === '#effects') return <EffectDemo />;
  if (route === '#battle') return <BattleRoute />;

  return <GameCanvas />;
}
