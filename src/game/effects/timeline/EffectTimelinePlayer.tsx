import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { EffectTimeline, EffectContext, LayerSpec, AnchorPoint } from '../types';
import { ParticleEffect } from '../ParticleEffect';
import { RingEffect } from '../RingEffect';
import { BeamEffect } from '../BeamEffect';
import { FlashEffect } from '../FlashEffect';
import { FlipbookEffect } from '../FlipbookEffect';
import { ProjectileEffect } from '../ProjectileEffect';
import { cameraFeedback } from '../camera/cameraBus';
import * as THREE from 'three';

interface ActiveLayer {
  id: string;
  phaseIndex: number;
  layer: LayerSpec;
  anchor: AnchorPoint;
  spawnTime: number;
}

interface EffectTimelinePlayerProps {
  timeline: EffectTimeline;
  context: EffectContext;
  onComplete: () => void;
}

export const EffectTimelinePlayer: React.FC<EffectTimelinePlayerProps> = ({
  timeline,
  context,
  onComplete,
}) => {
  const elapsedRef = useRef(0);
  const completedRef = useRef(false);
  const [activeLayers, setActiveLayers] = useState<ActiveLayer[]>([]);
  const spawnedPhasesRef = useRef<Set<number>>(new Set());

  useFrame((_, delta) => {
    if (completedRef.current) return;

    elapsedRef.current += delta;
    const elapsedMs = elapsedRef.current * 1000;

    // Check for new phase spawns
    const newActive: ActiveLayer[] = [];
    timeline.phases.forEach((phase, idx) => {
      if (!spawnedPhasesRef.current.has(idx) && phase.at <= elapsedMs) {
        spawnedPhasesRef.current.add(idx);
        
        if (phase.layer.kind === 'camera') {
          cameraFeedback.trigger(phase.layer.config);
        }

        newActive.push({
          id: `phase-${idx}-${Math.random()}`,
          phaseIndex: idx,
          layer: phase.layer,
          anchor: phase.anchor,
          spawnTime: elapsedRef.current,
        });
      }
    });

    if (newActive.length > 0) {
      setActiveLayers((prev) => [...prev, ...newActive]);
    }

    // Check completion
    if (elapsedRef.current >= timeline.totalDuration && activeLayers.length === 0) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }
  });

  const getAnchorPosition = (anchor: AnchorPoint): [number, number, number] => {
    const orig = new THREE.Vector3(...context.origin);
    const targ = new THREE.Vector3(...context.target);
    switch (anchor) {
      case 'attacker':
        return [orig.x, orig.y, orig.z];
      case 'target':
        return [targ.x, targ.y, targ.z];
      case 'midpoint':
      case 'travel':
        return [(orig.x + targ.x) / 2, (orig.y + targ.y) / 2, (orig.z + targ.z) / 2];
    }
  };

  return (
    <group>
      {activeLayers.map((active) => {
        const pos = getAnchorPosition(active.anchor);
        const layer = active.layer;

        switch (layer.kind) {
          case 'particles':
            return (
              <group key={active.id} position={pos}>
                <ParticleEffect config={layer.config} context={context} />
              </group>
            );
          case 'ring':
            return (
              <RingEffect
                key={active.id}
                config={layer.config}
                context={{ ...context, target: pos }}
              />
            );
          case 'beam':
            return (
              <group key={active.id} position={context.origin}>
                <BeamEffect config={layer.config} context={context} />
              </group>
            );
          case 'flash':
            return (
              <FlashEffect
                key={active.id}
                color={layer.config.color}
                duration={layer.config.duration}
                intensity={layer.config.intensity ?? 0.3}
              />
            );
          case 'flipbook':
            return (
              <group key={active.id} position={pos}>
                <FlipbookEffect sheet={layer.sheet} config={layer.config} context={context} />
              </group>
            );
          case 'camera':
            return null;
          case 'projectile':
            return (
              <ProjectileEffect
                key={active.id}
                config={layer.config}
                context={context}
                onArrive={() => {
                  const targetPhaseIdx = layer.config.onArrive;
                  if (targetPhaseIdx !== undefined && !spawnedPhasesRef.current.has(targetPhaseIdx)) {
                    spawnedPhasesRef.current.add(targetPhaseIdx);
                    const targetPhase = timeline.phases[targetPhaseIdx];
                    if (targetPhase) {
                      if (targetPhase.layer.kind === 'camera') {
                        cameraFeedback.trigger(targetPhase.layer.config);
                      }
                      setActiveLayers((prev) => [
                        ...prev,
                        {
                          id: `phase-arrive-${targetPhaseIdx}-${Math.random()}`,
                          phaseIndex: targetPhaseIdx,
                          layer: targetPhase.layer,
                          anchor: targetPhase.anchor,
                          spawnTime: elapsedRef.current,
                        },
                      ]);
                    }
                  }
                }}
              />
            );
          default:
            return null;
        }
      })}
    </group>
  );
};
