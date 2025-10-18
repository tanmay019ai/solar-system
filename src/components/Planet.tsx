import React, { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader, Texture, Color, Group } from "three";
import { Text } from "@react-three/drei";

interface PlanetProps {
  name: string;
  texture: string;
  size: number;
  distance: number;
  rotationSpeed: number;
  orbitSpeed?: number;
  onClick: (name: string) => void;
  refGroup?: React.RefObject<Group>;
}

export default function Planet({
  name,
  texture,
  size,
  distance,
  rotationSpeed,
  orbitSpeed = 0.2,
  onClick,
  refGroup,
}: PlanetProps) {
  // Always create a local ref
  const mesh = useRef<Group>(null);

  // Load planet texture
  const loadedTexture: Texture = useLoader(TextureLoader, texture);

  useFrame(({ clock }) => {
    const current = refGroup?.current || mesh.current;
    if (current) {
      // Self rotation
      current.rotation.y += rotationSpeed;

      // Orbit around Sun
      const t = clock.getElapsedTime() * orbitSpeed;
      current.position.x = distance * Math.cos(t);
      current.position.z = distance * Math.sin(t);
      current.position.y = 0;
    }
  });

  return (
    <group ref={refGroup || mesh} onClick={() => onClick(name)}>
      {/* Planet mesh */}
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          map={loadedTexture}
          metalness={0.3}
          roughness={0.4}
          emissive={new Color("#111111")}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Optional planet light */}
      <pointLight color="white" intensity={0.3} distance={size * 8} decay={2} />

      {/* Dynamic moving label */}
      <Text
        position={[0, size + 0.6, 0]}
        fontSize={0.6}
        color="white"
        anchorX="center"
        anchorY="bottom"
      >
        {name}
      </Text>
    </group>
  );
}
