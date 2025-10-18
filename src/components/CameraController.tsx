import { useThree, useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { create } from "zustand";

// ---------------- Camera Store ----------------
interface CameraState {
  targetPlanet: Vector3 | null;
  setTarget: (pos: Vector3 | null) => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  targetPlanet: null,
  setTarget: (pos: Vector3 | null) => set({ targetPlanet: pos }),
}));

// ---------------- Camera Controller ----------------
export default function CameraController({
  getPlanetPosition,
}: {
  getPlanetPosition?: () => Vector3 | null;
}) {
  const { camera, mouse } = useThree();
  const { targetPlanet } = useCameraStore();

  const radius = 60;
  const height = 20;
  const rotationSpeed = 0.001;
  let angle = 0;

  useFrame(({ clock }) => {
    if (targetPlanet && getPlanetPosition) {
      // Get the planet's current position dynamically
      const planetPos = getPlanetPosition();
      if (planetPos) {
        const desiredPosition = planetPos.clone().add(new Vector3(0, 5, 15));
        camera.position.lerp(desiredPosition, 0.08);
        camera.lookAt(planetPos.clone().add(new Vector3(0, 2, 0)));
      }
    } else {
      // Free orbit around the system center
      angle += rotationSpeed;
      const x = radius * Math.cos(angle) + mouse.x * 5;
      const z = radius * Math.sin(angle) + mouse.y * 5;
      const y = height + Math.sin(clock.getElapsedTime() * 0.2) * 5;
      camera.position.lerp(new Vector3(x, y, z), 0.05);
      camera.lookAt(new Vector3(0, 0, 0));
    }
  });

  return null;
}
