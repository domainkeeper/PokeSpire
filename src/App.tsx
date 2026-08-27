import { useState, useEffect } from 'react';
import { GameCanvas } from './game/GameCanvas';
import { EffectDemo } from './game/effects/EffectDemo';
import { BattleDemo } from './battle/BattleDemo';

export default function App() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const handler = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  if (route === '#effects') {
    return <EffectDemo />;
  }

  if (route === '#battle') {
    return <BattleDemo />;
  }

  return <GameCanvas />;
}
