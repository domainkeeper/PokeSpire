import { useLayoutEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

/**
 * One sub-mesh of a reusable prop, expressed as geometry + material + a local
 * transform. Geometry and material must be module-level singletons so every
 * instance of the prop shares them.
 */
export interface PropPart {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  position?: readonly [number, number, number];
  rotation?: readonly [number, number, number];
  scale?: readonly [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export interface PropInstance {
  position: readonly [number, number, number];
  scale?: number;
  rotationY?: number;
}

/**
 * Renders N copies of a multi-part prop as one InstancedMesh per part.
 *
 * Before this, each of the ~640 trees per map was its own React component
 * rendering 13 separate meshes and allocating 4 fresh MeshStandardMaterials, for
 * roughly 8-9k draw calls and 2.6k materials per map. Now a whole forest costs
 * one draw call per part (13 for trees).
 */
export function InstancedProps({
  parts,
  instances,
}: {
  parts: readonly PropPart[];
  instances: readonly PropInstance[];
}) {
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);

  // Pre-bake each part's local matrix once.
  const localMatrices = useMemo(
    () =>
      parts.map((part) => {
        const m = new THREE.Matrix4();
        const pos = part.position ?? [0, 0, 0];
        const rot = part.rotation ?? [0, 0, 0];
        const scl = part.scale ?? [1, 1, 1];
        m.compose(
          new THREE.Vector3(pos[0], pos[1], pos[2]),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2])),
          new THREE.Vector3(scl[0], scl[1], scl[2]),
        );
        return m;
      }),
    [parts],
  );

  useLayoutEffect(() => {
    const instanceMatrix = new THREE.Matrix4();
    const out = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const scale = new THREE.Vector3();

    parts.forEach((_, partIdx) => {
      const mesh = refs.current[partIdx];
      if (!mesh) return;
      const local = localMatrices[partIdx];

      for (let i = 0; i < instances.length; i++) {
        const inst = instances[i];
        const s = inst.scale ?? 1;
        pos.set(inst.position[0], inst.position[1], inst.position[2]);
        euler.set(0, inst.rotationY ?? 0, 0);
        quat.setFromEuler(euler);
        scale.set(s, s, s);
        instanceMatrix.compose(pos, quat, scale);
        out.multiplyMatrices(instanceMatrix, local);
        mesh.setMatrixAt(i, out);
      }

      mesh.count = instances.length;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
  }, [parts, instances, localMatrices]);

  if (instances.length === 0) return null;

  return (
    <>
      {parts.map((part, i) => (
        <instancedMesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          args={[part.geometry, part.material, instances.length]}
          castShadow={part.castShadow ?? false}
          receiveShadow={part.receiveShadow ?? false}
          // The bounding sphere spans the whole map, so per-object culling can't
          // help; the win is the single draw call.
          frustumCulled={false}
        />
      ))}
    </>
  );
}
