import { useState, useEffect } from 'react';
import { useGameStore } from '../../state/gameStore';
import { eventBus, GameEvents } from '../eventBus';

export function TransitionOverlay() {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const currentMapId = useGameStore((s) => s.player.mapId);

  useEffect(() => {
    const unsub = eventBus.on(GameEvents.MAP_TRANSITION, () => {
      setVisible(true);
      setOpacity(1);
      setTimeout(() => setOpacity(0), 400);
      setTimeout(() => setVisible(false), 800);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    setVisible(true);
    setOpacity(1);
    const t = setTimeout(() => {
      setOpacity(0);
      setTimeout(() => setVisible(false), 400);
    }, 200);
    return () => clearTimeout(t);
  }, [currentMapId]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000',
        opacity,
        transition: 'opacity 0.4s ease-in-out',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    />
  );
}
