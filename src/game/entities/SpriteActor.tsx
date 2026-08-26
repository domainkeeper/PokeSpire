import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Billboard } from '@react-three/drei';
import { contactShadowTexture } from '../pixel/textureLib';

/**
 * SpriteActor - a pixel-art sprite with genuine presence in the 3D world.
 *
 * This is the shared renderer for the player, NPCs and Pokemon. It is the
 * HD-2D answer to "make the sprites 3D": the art stays 2D pixel art (matching
 * the reference images), but the sprite behaves like a real object in the scene:
 *
 *  1. EXTRUSION - the sprite is drawn as N stacked layers offset along the
 *     camera-facing normal, with the rear layers darkened. That gives the sprite
 *     actual measurable thickness. Because every layer is camera-facing, the
 *     thickness reads correctly from any angle, unlike crossed cards which go
 *     edge-on under a yaw billboard.
 *  2. REAL CAST SHADOWS - alpha-tested layers write into the shadow map, so the
 *     sprite's actual silhouette is cast onto the terrain, not a generic blob.
 *  3. OPAQUE-PASS DEPTH - alphaTest + depthWrite means the Z-buffer resolves
 *     occlusion against terrain, cliffs, houses and other actors correctly from
 *     any camera position.
 *  4. YAW-ONLY BILLBOARDING - lockX/lockZ keeps the sprite standing upright
 *     instead of tipping back to match the camera pitch and floating off its
 *     own shadow.
 *  5. TERRAIN GROUNDING - callers pass the terrain surface height, so actors sit
 *     correctly on terraces and banks.
 */

export interface SpriteActorHandle {
  group: THREE.Group | null;
}

export interface SpriteActorProps {
  texture: THREE.Texture | undefined;
  /**
   * Optional live texture holder. When provided, the actor swaps its materials'
   * map imperatively each frame if the ref's value changed. This lets an
   * animating actor (the player) change direction sheets without triggering a
   * React re-render every time.
   */
  textureRef?: { current: THREE.Texture | undefined };
  /** Quad size in world units. Keep the source aspect ratio. */
  width: number;
  height: number;
  /** Number of extrusion layers. 1 = flat card, 3-4 reads as solid. */
  layers?: number;
  /** Gap between layers, world units. */
  layerGap?: number;
  /** How dark the rearmost layer is (0 = black, 1 = unshaded). */
  rearShade?: number;
  /** Tint multiplied over the front layer. */
  tint?: THREE.Color | string;
  /** Soft blob under the actor; 0 disables. */
  contactShadow?: number;
  contactShadowOpacity?: number;
  /** Idle bob amplitude in world units. */
  bob?: number;
  bobSpeed?: number;
  /** Deterministic phase offset so a crowd doesn't bob in lockstep. */
  phase?: number;
  castShadow?: boolean;
}

const MAX_LAYERS = 5;

export function SpriteActor({
  texture,
  textureRef,
  width,
  height,
  layers = 3,
  layerGap = 0.022,
  rearShade = 0.42,
  tint,
  contactShadow = 0,
  contactShadowOpacity = 0.3,
  bob = 0,
  bobSpeed = 1.6,
  phase = 0,
  castShadow = true,
}: SpriteActorProps) {
  const inner = useRef<THREE.Group>(null);
  const shadowTex = useMemo(() => contactShadowTexture(), []);
  const count = Math.max(1, Math.min(MAX_LAYERS, layers));
  const appliedTexture = useRef<THREE.Texture | undefined>(undefined);

  /*
   * One material per layer. Rear layers are progressively darkened, producing
   * the extruded-thickness read. Front layer carries the tint.
   */
  const materials = useMemo(() => {
    const base = new THREE.Color(tint ?? 0xffffff);
    return Array.from({ length: count }, (_, i) => {
      // i = 0 is frontmost.
      const t = count === 1 ? 0 : i / (count - 1);
      const c = base.clone().multiplyScalar(1 - t * (1 - rearShade));
      return new THREE.MeshBasicMaterial({
        map: texture ?? null,
        color: c,
        alphaTest: 0.5,
        transparent: false,
        depthWrite: true,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
    });
  }, [count, rearShade, tint, texture]);

  useEffect(() => {
    const owned = materials;
    return () => {
      for (const m of owned) m.dispose();
    };
  }, [materials]);

  useFrame((state) => {
    // Imperative texture swap: no re-render when the actor changes direction.
    const wanted = textureRef ? textureRef.current : texture;
    if (wanted && wanted !== appliedTexture.current) {
      appliedTexture.current = wanted;
      for (const m of materials) {
        m.map = wanted;
        m.needsUpdate = true;
      }
    }

    if (inner.current && bob > 0) {
      inner.current.position.y =
        height * 0.5 + Math.abs(Math.sin(state.clock.elapsedTime * bobSpeed + phase)) * bob;
    }
  });

  return (
    <>
      <Billboard follow lockX lockZ>
        <group ref={inner} position={[0, height * 0.5, 0]}>
          {materials.map((mat, i) => (
            <mesh
              key={i}
              material={mat}
              // Layers stack toward the viewer along local +Z, which the
              // billboard keeps pointed at the camera.
              position={[0, 0, -i * layerGap]}
              // Only the frontmost layer casts, so the shadow silhouette stays
              // crisp and the shadow pass cost stays flat.
              castShadow={castShadow && i === 0}
            >
              <planeGeometry args={[width, height]} />
            </mesh>
          ))}
        </group>
      </Billboard>

      {contactShadow > 0 && (
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
          <planeGeometry args={[contactShadow * 2, contactShadow * 1.3]} />
          <meshBasicMaterial
            map={shadowTex}
            transparent
            opacity={contactShadowOpacity}
            depthWrite={false}
          />
        </mesh>
      )}
    </>
  );
}
