import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA_HEIGHT, CAMERA_DISTANCE, CAMERA_LERP } from '../../utils/constants';
import { playerTransform } from '../playerTransform';

export function FollowCamera() {
  const { camera } = useThree();
  const smoothed = useRef(new THREE.Vector3());
  const desiredPos = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());
  const initializedFor = useRef<string | null>(null);

  useFrame((_, delta) => {
    // Read the continuous world position, not the grid cell from the store.
    // Following the rounded grid cell made the camera judder one tile at a time.
    if (!playerTransform.ready) return;

    const { x, z, mapId } = playerTransform;
    desiredPos.current.set(x, CAMERA_HEIGHT, z + CAMERA_DISTANCE);

    // Snap (no lerp) on first frame and across map transitions, otherwise the
    // camera would sail across the whole world.
    if (initializedFor.current !== mapId) {
      initializedFor.current = mapId;
      smoothed.current.copy(desiredPos.current);
    } else {
      // Frame-rate independent exponential smoothing.
      const alpha = 1 - Math.exp(-CAMERA_LERP * delta);
      smoothed.current.lerp(desiredPos.current, alpha);
    }

    camera.position.copy(smoothed.current);
    lookAt.current.set(smoothed.current.x, 0, smoothed.current.z - CAMERA_DISTANCE);
    camera.lookAt(lookAt.current);
  });

  return null;
}
