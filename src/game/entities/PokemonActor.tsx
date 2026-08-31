import { useRef, useMemo, useEffect } from 'react';
import { Html } from '@react-three/drei';
import type { Group } from 'three';
import { getPokemonSprite, pokemonAssetId, type PokemonSpeciesKey } from '../../data/pokemon/pokemonSprites';
import type { Theme } from '../../theme/types';
import { SpriteActor } from './SpriteActor';
import { getSingleSprite } from '../pixel/sprites/characterSprites';

let styleInjected = false;
function injectPromptStyles() {
  if (styleInjected) return;
  styleInjected = true;
  const style = document.createElement('style');
  style.textContent = `
@keyframes pokemonPromptPulse {
  0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
  50% { transform: translateY(-3px) scale(1.06); opacity: 0.85; }
}`;
  document.head.appendChild(style);
}

export interface PokemonActorProps {
  species: PokemonSpeciesKey;
  position: [number, number, number];
  theme: Theme;
  phase: number;
  /** True if THIS pokemon is the nearest one in range (only one prompt visible). */
  isNearest: boolean;
  /** Called when the player clicks the interaction prompt or presses confirm. */
  onInteract: () => void;
}

/**
 * Renders a wild Pokemon in the overworld with a proximity-based interaction
 * prompt. When the player is within INTERACT_RANGE tiles, a floating indicator
 * appears above the Pokemon. Clicking it (or pressing Enter/Space) triggers
 * a battle.
 */
export function PokemonActor({
  species,
  position,
  theme,
  phase,
  isNearest,
  onInteract,
}: PokemonActorProps) {
  const sprite = getPokemonSprite(species);
  const tex = useMemo(() => getSingleSprite(pokemonAssetId(species)), [species]);
  const groupRef = useRef<Group>(null);

  useEffect(() => { injectPromptStyles(); }, []);

  return (
    <group ref={groupRef} position={position}>
      <SpriteActor
        texture={tex}
        width={sprite.size}
        height={sprite.size}
        layers={3}
        layerGap={0.018}
        contactShadow={sprite.size * 0.42}
        contactShadowOpacity={theme.lighting.contactShadowOpacity}
        bob={0.02}
        bobSpeed={1.9}
        phase={phase}
      />

      {isNearest && (
        <Html
          position={[0, sprite.size + 0.25, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'auto' }}
          occlude={false}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInteract();
            }}
            style={{
              background: 'rgba(255, 50, 50, 0.92)',
              color: '#fff',
              border: '2px solid #fff',
              borderRadius: '10px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'monospace',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 0 8px rgba(255,50,50,0.6)',
              animation: 'pokemonPromptPulse 1.2s ease-in-out infinite',
              userSelect: 'none',
              lineHeight: 1,
            }}
          >
            {sprite.name}
          </button>
        </Html>
      )}
    </group>
  );
}
