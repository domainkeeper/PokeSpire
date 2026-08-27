import { useEffect, useRef } from 'react';
import type { Combatant } from './types';
import { tickGauge } from './combatEngine';

export function useSpeedGauge(
  combatants: Combatant[],
  isRunning: boolean,
  onGaugeFull: (combatantId: string) => void
) {
  const combatantsRef = useRef(combatants);
  combatantsRef.current = combatants;
  const lastTimeRef = useRef<number>(performance.now());
  const onGaugeFullRef = useRef(onGaugeFull);
  onGaugeFullRef.current = onGaugeFull;

  useEffect(() => {
    if (!isRunning) return;

    let animationFrameId: number;

    const update = (time: number) => {
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (delta > 0 && delta < 100) {
        for (const c of combatantsRef.current) {
          if (c.gauge < 100 && c.currentHp > 0) {
            const newGauge = tickGauge(c, c.species.baseStats.spe, delta);
            c.gauge = newGauge;
            if (newGauge >= 100) {
              onGaugeFullRef.current(c.id);
              break;
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(update);
    };

    lastTimeRef.current = performance.now();
    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning]);
}
