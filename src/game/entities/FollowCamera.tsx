import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../state/gameStore';
import { gridToWorld } from '../../utils/gridUtils';
import { CAMERA_LERP } from '../../utils/constants';

export function FollowCamera() {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useFrame((_, delta) => {
    const player = useGameStore.getState().player;
    const wp = gridToWorld(player.x, player.y);

    const desiredPos = new THREE.Vector3(wp[0], 4.5, wp[2] + 4.0);
    const desiredLook = new THREE.Vector3(wp[0], 0, wp[2] - 0.2);

    if (!initialized.current) {
      targetPos.current.copy(desiredPos);
      targetLook.current.copy(desiredLook);
      camera.position.copy(desiredPos);
      camera.lookAt(desiredLook);
      initialized.current = true;
      return;
    }

    const lerp = Math.min(1, CAMERA_LERP * delta);
    targetPos.current.lerp(desiredPos, lerp);
    targetLook.current.lerp(desiredLook, lerp);

    camera.position.copy(targetPos.current);
    camera.lookAt(targetLook.current);
  });

  return null;
}
