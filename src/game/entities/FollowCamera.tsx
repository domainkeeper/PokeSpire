import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../state/gameStore';
import { gridToWorld } from '../../utils/gridUtils';
import { CAMERA_LERP } from '../../utils/constants';

export function FollowCamera() {
  const { camera } = useThree();
  const currentPos = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useFrame((_, delta) => {
    const player = useGameStore.getState().player;
    const wp = gridToWorld(player.x, player.y);

    // Camera: behind and above player, looking down at ~45 degrees
    // wp[0] = world X of player, wp[2] = world Z of player
    const targetPos = new THREE.Vector3(wp[0], 10, wp[2] + 8);
    const targetLook = new THREE.Vector3(wp[0], 0, wp[2]);

    if (!initialized.current) {
      currentPos.current.copy(targetPos);
      lookTarget.current.copy(targetLook);
      initialized.current = true;
      // Snap camera immediately on first frame
      camera.position.copy(currentPos.current);
      camera.lookAt(lookTarget.current);
      return;
    }

    const lerp = Math.min(1, CAMERA_LERP * delta);
    currentPos.current.lerp(targetPos, lerp);
    lookTarget.current.lerp(targetLook, lerp);

    camera.position.copy(currentPos.current);
    camera.lookAt(lookTarget.current);
  });

  return null;
}
