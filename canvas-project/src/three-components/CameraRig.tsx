import React, { useRef, ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import { useSnapshot } from 'valtio';
import { Group } from 'three';
import { unifiedState } from '../store/unifiedState';

interface CameraRigProps {
  children: ReactNode;
}

export const CameraRig: React.FC<CameraRigProps> = ({ children }) => {
  const group = useRef<Group>(null);
  const snap = useSnapshot(unifiedState);

  useFrame((frameState, delta) => {
    const isBreakpoint = window.innerWidth <= 1260;
    const isMobile = window.innerWidth <= 600;

    // Only control camera position during intro
    if (snap.intro) {
      let targetPosition: [number, number, number] = [-0.4, 0, 2];
      if (isBreakpoint) targetPosition = [0, 0, 2];
      if (isMobile) targetPosition = [0, 0.2, 2.5];
      
      // set model camera position only during intro
      easing.damp3(frameState.camera.position, targetPosition, 0.25, delta);
      
      // set the model rotation smoothly during intro
      if (group.current) {
        easing.dampE(
          group.current.rotation,
          [frameState.pointer.y / 10, -frameState.pointer.x / 5, 0],
          0.25,
          delta
        );
      }
    }
  });

  return <group ref={group}>{children}</group>;
};