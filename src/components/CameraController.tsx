import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { create } from "zustand";

// -------------------- Zustand Store --------------------
interface CameraState {
  isFocusing: boolean;
  setFocusing: (v: boolean) => void;
}
export const useCameraStore = create<CameraState>((set) => ({
  isFocusing: false,
  setFocusing: (v) => set({ isFocusing: v }),
}));

// -------------------- Camera Controller --------------------
interface CameraControllerProps {
  getPlanetPosition: () => THREE.Vector3 | null;
}

export default function CameraController({ getPlanetPosition }: CameraControllerProps) {
  const { camera } = useThree();
  const { isFocusing } = useCameraStore();

  // smooth camera & planet vectors
  const smoothedPlanet = useRef(new THREE.Vector3());
  const smoothedCamera = useRef(new THREE.Vector3(0, 40, 120));
  const lastDir = useRef(new THREE.Vector3(0, 0, -1));
  const isActive = useRef(false);

  useFrame((state, delta) => {
    const target = getPlanetPosition?.();
    const time = state.clock.getElapsedTime();

    if (isFocusing && target) {
      // activate cinematic follow mode
      if (!isActive.current) {
        camera.getWorldDirection(lastDir.current);
        isActive.current = true;
      }

      // --- Smoothly track the planet position ---
      smoothedPlanet.current.lerp(target, 1 - Math.exp(-delta * 4));

      // --- CINEMATIC ORBIT CAMERA MOTION ---
      const orbitRadius = 10; // distance from planet
      const orbitSpeed = 0.2; // how fast camera orbits
      const orbitHeight = 3; // height above planet

      // subtle zoom “breathing” (cosine oscillation)
      const zoomPulse = Math.sin(time * 0.5) * 1.2; // amplitude of zoom
      const currentRadius = orbitRadius + zoomPulse; // apply breathing effect

      // orbit position
      const orbitX = Math.sin(time * orbitSpeed) * currentRadius;
      const orbitZ = Math.cos(time * orbitSpeed) * currentRadius;

      const desired = new THREE.Vector3(
        smoothedPlanet.current.x + orbitX,
        smoothedPlanet.current.y + orbitHeight,
        smoothedPlanet.current.z + orbitZ
      );

      // Smoothly interpolate camera movement
      smoothedCamera.current.lerp(desired, 1 - Math.exp(-delta * 3));

      // Apply camera position + lookAt
      camera.position.copy(smoothedCamera.current);
      camera.lookAt(smoothedPlanet.current);
    } else {
      // reset back to default system view
      if (isActive.current) isActive.current = false;

      const defaultPos = new THREE.Vector3(0, 40, 120);
      smoothedCamera.current.lerp(defaultPos, 0.05);
      smoothedPlanet.current.lerp(new THREE.Vector3(0, 0, 0), 0.05);

      camera.position.copy(smoothedCamera.current);
      camera.lookAt(smoothedPlanet.current);
    }
  });

  return null;
}
