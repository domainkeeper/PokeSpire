import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  AnimatedSprite,
  loadPokemonAnimData,
  pokemonSpriteSheetPath,
  type PokemonAnimData,
} from '../../game/pixel/AnimatedSprite';
import { pokemonSprite } from '../../assets/pokemonAssets';
import { battleClock } from './battleClock';
import { onRigCue, onRigState, type RigCommand, type RigStateCue } from './fx/rigBus';

/**
 * CombatantRig — the animated Pokemon sprite plus all procedural battle motion.
 *
 * FIXES B11/B12/A5: the legacy BattleScreen rendered two untextured boxGeometry meshes
 * with zero lunge, recoil, flinch, squash, tint or scale response, while 993 animated
 * atlases and a working AnimatedSprite player sat unreferenced.
 *
 * There are no per-move sprite animations in the source data (the atlases are
 * front-facing idle loops), so attack motion is procedural: additive channels for
 * translation, squash/stretch, rotation, tint and opacity, driven by rig cues from the
 * animation director. Everything freezes during hit-stop except nothing - hit-stop is
 * what makes contact land.
 */

interface MotionInstance {
  cmd: RigCommand;
  elapsed: number;
  duration: number;
}

export interface CombatantRigProps {
  combatantId: string;
  speciesId: number;
  /** Ground position. */
  position: [number, number, number];
  /** +1 if this combatant faces right (toward +x), -1 otherwise. */
  facing: 1 | -1;
  /** World height of the sprite before species scaling. */
  baseHeight?: number;
  /** 0-1. Drives the low-health idle change. */
  hpFraction: number;
  /** Deterministic idle phase offset so the two sides never bob in lockstep. */
  phase?: number;
  onSpriteReady?: (height: number) => void;
}

const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const easeOutBack = (t: number) => {
  const c = 1.6;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};
/** Fast rise, hold, then return. Used for lunges. */
const strikeCurve = (t: number) => {
  if (t < 0.28) return easeOut(t / 0.28);
  if (t < 0.62) return 1;
  return 1 - easeOut((t - 0.62) / 0.38);
};
const decayOsc = (t: number, cycles = 2.4) =>
  Math.sin(t * Math.PI * cycles) * Math.pow(1 - t, 2);

export function CombatantRig({
  combatantId,
  speciesId,
  position,
  facing,
  baseHeight = 1.55,
  hpFraction,
  phase = 0,
  onSpriteReady,
}: CombatantRigProps) {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const [animData, setAnimData] = useState<PokemonAnimData | null>(null);
  const [missing, setMissing] = useState(false);

  const motions = useRef<MotionInstance[]>([]);
  const flash = useRef(0);
  const tint = useRef<string | null>(null);
  const staggered = useRef(false);
  const fainted = useRef(false);
  const faintTime = useRef(0);
  const hpRef = useRef(hpFraction);
  hpRef.current = hpFraction;

  const spriteColor = useMemo(() => new THREE.Color(), []);
  const tintColor = useMemo(() => new THREE.Color(), []);

  // ── Load the atlas metadata ──
  useEffect(() => {
    let cancelled = false;
    setAnimData(null);
    setMissing(false);
    loadPokemonAnimData(speciesId).then((data) => {
      if (cancelled) return;
      if (data) setAnimData(data);
      else setMissing(true);
    });
    return () => {
      cancelled = true;
    };
  }, [speciesId]);

  // Bigger species read bigger, but within a bounded range so layout stays stable.
  const scaleFactor = useMemo(() => {
    if (!animData) return 1;
    return Math.max(0.82, Math.min(1.6, animData.frameHeight / 70));
  }, [animData]);

  const displayHeight = baseHeight * scaleFactor;

  useEffect(() => {
    if (animData) onSpriteReady?.(displayHeight);
  }, [animData, displayHeight, onSpriteReady]);

  // ── Cue subscriptions ──
  useEffect(() => {
    const offCue = onRigCue(combatantId, (cmd) => {
      // A settle cue clears any lingering held motion.
      if (cmd.motion === 'settle') {
        motions.current = motions.current.filter(
          (m) => m.cmd.motion === 'staggerDrop' || m.cmd.motion === 'guardBrace',
        );
        return;
      }
      motions.current.push({ cmd, elapsed: 0, duration: Math.max(0.016, cmd.durationMs / 1000) });
      // Bound the list; a stuck cue can never accumulate.
      if (motions.current.length > 12) motions.current.shift();
    });

    const offState = onRigState(combatantId, (cue: RigStateCue) => {
      if (cue.flash !== undefined) flash.current = Math.max(flash.current, cue.flash);
      if (cue.tint !== undefined) tint.current = cue.tint;
      if (cue.staggered !== undefined) staggered.current = cue.staggered;
      if (cue.fainted !== undefined && cue.fainted && !fainted.current) {
        fainted.current = true;
        faintTime.current = 0;
      }
      if (cue.fainted === false) {
        fainted.current = false;
        faintTime.current = 0;
      }
    });

    return () => {
      offCue();
      offState();
    };
  }, [combatantId]);

  // ── Per-frame composition ──
  useFrame((state, rawDelta) => {
    if (!outer.current || !inner.current) return;

    const delta = rawDelta * battleClock.timeScale;
    const t = state.clock.elapsedTime;

    // Idle baseline: passive danger read below 25% HP.
    const low = hpRef.current > 0 && hpRef.current < 0.25;
    const idleHz = low ? 0.35 : 0.5;
    const idleBob = fainted.current ? 0 : Math.sin(t * Math.PI * 2 * idleHz + phase) * 0.02;

    let offX = 0;
    let offY = idleBob;
    let rot = 0;
    let scaleX = 1;
    let scaleY = 1;

    // Additive motion channels.
    const live: MotionInstance[] = [];
    for (const m of motions.current) {
      m.elapsed += delta;
      const p = Math.min(1, m.elapsed / m.duration);
      const held = m.cmd.motion === 'staggerDrop' || m.cmd.motion === 'guardBrace';
      if (p < 1 || held) live.push(m);

      const a = m.cmd.amount;
      switch (m.cmd.motion) {
        case 'windup':
          // Pull away from the target and compress vertically.
          offX -= facing * a * easeOutBack(Math.min(1, p * 1.4));
          scaleX *= 1 - 0.06 * p;
          scaleY *= 1 + 0.08 * p;
          break;
        case 'lunge': {
          const c = strikeCurve(p);
          offX += facing * a * c;
          scaleX *= 1 + 0.09 * c;
          scaleY *= 1 - 0.07 * c;
          break;
        }
        case 'dashThrough': {
          // Drive past the target, then slide back.
          const c = p < 0.5 ? easeOut(p / 0.5) * 1.22 : 1.22 * (1 - easeOut((p - 0.5) / 0.5));
          offX += facing * a * c;
          scaleX *= 1 + 0.12 * Math.min(1, c);
          scaleY *= 1 - 0.09 * Math.min(1, c);
          rot += facing * 0.06 * Math.min(1, c);
          break;
        }
        case 'recoil':
          // Knocked back, oscillating home.
          offX -= facing * a * (Math.pow(1 - p, 1.4) + decayOsc(p, 1.6) * 0.25);
          scaleX *= 1 - 0.05 * (1 - p);
          scaleY *= 1 + 0.04 * (1 - p);
          break;
        case 'flinch':
          offX += decayOsc(p, 4) * a;
          offY += Math.abs(decayOsc(p, 5)) * a * 0.3;
          break;
        case 'shudder':
          offX += Math.sin(p * Math.PI * 9) * a * (1 - p);
          break;
        case 'rise':
          offY += a * easeOut(p) * (p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1);
          break;
        case 'sink':
          offY -= a * easeOut(p);
          break;
        case 'hop':
          offY += Math.abs(Math.sin(p * Math.PI * 2)) * a;
          break;
        case 'guardBrace':
          offX -= facing * 0.09;
          scaleX *= 1.06;
          scaleY *= 0.95;
          break;
        case 'staggerDrop':
          offY -= 0.1;
          rot += facing * 0.14;
          scaleY *= 0.9;
          scaleX *= 1.06;
          break;
        default:
          break;
      }
    }
    motions.current = live;

    // Stagger pose is a persistent state, not a cue, so apply it here too.
    if (staggered.current && !fainted.current) {
      offY -= 0.07;
      rot += facing * 0.1;
      scaleY *= 0.94;
    }

    // KO sequence: sink, rotate, fade. Uses raw delta so it completes even if a
    // hit-stop is somehow still pending.
    let opacity = 1;
    let desaturate = 0;
    if (fainted.current) {
      faintTime.current += rawDelta;
      const k = faintTime.current;
      // 0-0.45 hold, 0.45-1.0 desaturate, 1.0-1.45 sink and fade.
      desaturate = Math.min(1, Math.max(0, (k - 0.45) / 0.55));
      if (k > 1.0) {
        const s = Math.min(1, (k - 1.0) / 0.45);
        offY -= s * 0.55;
        rot += facing * s * 0.5;
        opacity = 1 - s;
      }
    }

    outer.current.position.set(position[0] + offX, position[1] + offY, position[2]);
    inner.current.rotation.z = rot;
    inner.current.scale.set(scaleX, scaleY, 1);

    // Tint composition: base -> status tint -> low-HP red -> desaturate -> hit flash.
    spriteColor.setRGB(1, 1, 1);
    if (tint.current) {
      tintColor.set(tint.current);
      spriteColor.lerp(tintColor, 0.45);
    }
    if (low && !fainted.current) {
      tintColor.setRGB(1, 0.82, 0.82);
      spriteColor.lerp(tintColor, 0.08);
    }
    if (desaturate > 0) {
      const grey = 0.55;
      spriteColor.lerp(tintColor.setRGB(grey, grey, grey), desaturate * 0.85);
    }
    if (flash.current > 0) {
      flash.current = Math.max(0, flash.current - rawDelta * 6);
      spriteColor.lerp(tintColor.setRGB(3, 3, 3), Math.min(1, flash.current));
    }

    const mesh = inner.current.children[0] as THREE.Mesh | undefined;
    const mat = mesh?.material as THREE.MeshBasicMaterial | undefined;
    if (mat) {
      mat.color.copy(spriteColor);
      mat.opacity = opacity;
    }
  });

  const fallbackTexture = useMemo(() => {
    if (!missing) return null;
    const tex = new THREE.TextureLoader().load(pokemonSprite(speciesId));
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [missing, speciesId]);

  return (
    <group ref={outer} position={position}>
      <group ref={inner}>
        {animData ? (
          <AnimatedSprite
            sheetPath={pokemonSpriteSheetPath(speciesId)}
            animData={animData}
            width={displayHeight * (animData.frameWidth / animData.frameHeight)}
            height={displayHeight}
            anchorY={0}
            loop
            // Read imperatively so idle playback actually freezes during hit-stop; a
            // boolean prop could only change on re-render, which is too late.
            getSpeed={() => battleClock.timeScale}
            renderOrder={20}
          />
        ) : fallbackTexture ? (
          <mesh position={[0, baseHeight * 0.5, 0]} renderOrder={20}>
            <planeGeometry args={[baseHeight, baseHeight]} />
            <meshBasicMaterial
              map={fallbackTexture}
              transparent
              alphaTest={0.05}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ) : null}
      </group>

      {/* Contact shadow, grounds the sprite in the arena. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} renderOrder={2}>
        <circleGeometry args={[displayHeight * 0.34, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
}
