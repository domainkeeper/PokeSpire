import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { cameraFeedback } from './cameraBus';
import * as THREE from 'three';

export const CameraFeedback: React.FC = () => {
  const { camera } = useThree();
  const initialPosRef = useRef(new THREE.Vector3());
  const shakeIntensityRef = useRef(0);
  const shakeTimerRef = useRef(0);
  const punchTimerRef = useRef(0);
  const punchIntensityRef = useRef(0);

  useEffect(() => {
    initialPosRef.current.copy(camera.position);

    const unsubscribe = cameraFeedback.subscribe((config) => {
      if (config.shake) {
        shakeIntensityRef.current = config.shake;
        shakeTimerRef.current = 0.2; // 200ms
      }
      if (config.punch) {
        punchIntensityRef.current = config.punch;
        punchTimerRef.current = 0.1; // 100ms
      }
    });

    return () => {
      unsubscribe();
    };
  }, [camera]);

  useFrame((_, delta) => {
    if (shakeTimerRef.current > 0) {
      shakeTimerRef.current -= delta;
      const x = (Math.random() - 0.5) * shakeIntensityRef.current;
      const y = (Math.random() - 0.5) * shakeIntensityRef.current;
      camera.position.x = initialPosRef.current.x + x;
      camera.position.y = initialPosRef.current.y + y;
      if (shakeTimerRef.current <= 0) {
        camera.position.x = initialPosRef.current.x;
        camera.position.y = initialPosRef.current.y;
      }
    }

    if (punchTimerRef.current > 0) {
      punchTimerRef.current -= delta;
      const p = punchIntensityRef.current * (punchTimerRef.current / 0.1);
      camera.position.z = initialPosRef.current.z - p;
      if (punchTimerRef.current <= 0) {
        camera.position.z = initialPosRef.current.z;
      }
    }
  });

  return null;
};
