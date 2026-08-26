import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../state/gameStore';
import { gridToWorld } from '../../utils/gridUtils';
import { CAMERA_OFFSET_Y, CAMERA_OFFSET_Z } from '../../utils/constants';

export function FollowCamera() {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  const currentPos = useRef(new THREE.Vector3());

  const player = useGameStore((s) => s.player);
  const wp = gridToWorld(player.x, player.y);
  target.current.set(wp[0] * 0.3, CAMERA_OFFSET_Y, wp[2] * 0.3 + CAMERA_OFFSET_Z);

  useFrame((_, delta) => {
    const lerpFactor = Math.min(1, 3 * delta);
    currentPos.current.lerp(target.current, lerpFactor);
    camera.position.copy(currentPos.current);
    camera.lookAt(new THREE.Vector3(wp[0] * 0.5, 0, wp[2] * 0.5));
  });

  return null;
}
