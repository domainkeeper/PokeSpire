import { useState, useCallback, useRef, useMemo } from 'react';
import type { PokemonType } from '../../data/pokemon/schemas/index';
import type { EffectContext, EffectTimeline, EffectFamily } from './types';
import { getTypePalette } from './presets/typePalettes';
import { buildRecipe } from './presets/recipes';
import { MOVE_OVERRIDES } from './presets/moveOverrides';
import { EffectTimelinePlayer } from './timeline/EffectTimelinePlayer';
import { createEffectContext } from './effectRegistry';

interface MoveEffectProps {
  type: PokemonType;
  category?: 'physical' | 'special' | 'status';
  moveName?: string;
  origin: [number, number, number];
  target: [number, number, number];
  scale?: number;
  intensity?: number;
  onComplete?: () => void;
}

export function MoveEffect({
  type,
  category = 'special',
  moveName = '',
  origin,
  target,
  scale = 1,
  intensity = 1,
  onComplete,
}: MoveEffectProps) {
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);

  const palette = useMemo(() => getTypePalette(type), [type]);

  const family: EffectFamily = useMemo(() => {
    const lowerName = moveName.toLowerCase().replace(/[^a-z]/g, '');
    if (MOVE_OVERRIDES[lowerName]) {
      return MOVE_OVERRIDES[lowerName].family;
    }
    return category === 'physical' ? 'slash' : 'projectile';
  }, [moveName, category]);

  const context: EffectContext = useMemo(
    () => createEffectContext(origin, target, scale, intensity),
    [origin[0], origin[1], origin[2], target[0], target[1], target[2], scale, intensity],
  );

  const timeline: EffectTimeline = useMemo(
    () => buildRecipe(family, palette, context, 0.8),
    [family, palette, context]
  );

  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setDone(true);
    onComplete?.();
  }, [onComplete]);

  if (done) return null;

  return (
    <EffectTimelinePlayer
      timeline={timeline}
      context={context}
      onComplete={handleComplete}
    />
  );
}

export { createEffectContext };
export type { EffectContext };
