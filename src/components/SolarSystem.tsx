import React, { useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, ContactShadows, Text } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { create } from "zustand";

// Textures
import sunTexture from "../assets/textures/sun.jpg";
import mercuryTexture from "../assets/textures/mercury.jpg";
import venusTexture from "../assets/textures/venus.jpg";
import earthTexture from "../assets/textures/earth.jpg";
import marsTexture from "../assets/textures/mars.jpg";

// ---------------- Camera Store ----------------
interface CameraState {
  targetPlanetName: string | null;
  setTarget: (name: string | null) => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  targetPlanetName: null,
  setTarget: (name: string | null) => set({ targetPlanetName: name }),
}));

// ---------------- Camera Controller ----------------
function CameraController({
  planetRefs,
}: {
  planetRefs: Record<string, React.RefObject<THREE.Group | null>>;
}) {
  const { camera, mouse } = useThree();
  const { targetPlanetName } = useCameraStore();

  const radius = 60;
  const height = 20;
  const rotationSpeed = 0.001;
  let angle = 0;

  useFrame(() => {
    if (targetPlanetName) {
      const ref = planetRefs[targetPlanetName];
      if (ref?.current) {
        const planetPos = ref.current.position.clone();
        const desiredPos = planetPos.clone().add(new THREE.Vector3(0, 5, 15));
        camera.position.lerp(desiredPos, 0.08);
        camera.lookAt(planetPos.clone().add(new THREE.Vector3(0, 2, 0)));
      }
    } else {
      angle += rotationSpeed;
      const x = radius * Math.cos(angle) + mouse.x * 5;
      const z = radius * Math.sin(angle) + mouse.y * 5;
      const y = height + Math.sin(performance.now() * 0.002) * 5;
      camera.position.lerp(new THREE.Vector3(x, y, z), 0.05);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
  });

  return null;
}

// ---------------- Planet Component ----------------
interface PlanetProps {
  name: string;
  texture: string;
  size: number;
  distance: number;
  rotationSpeed: number;
  orbitSpeed?: number;
  onClick: (name: string) => void;
}

function Planet({
  name,
  texture,
  size,
  distance,
  rotationSpeed,
  orbitSpeed = 0.2,
  onClick,
}: PlanetProps) {
  const mesh = useRef<THREE.Group | null>(null);
  const loadedTexture = useLoader(THREE.TextureLoader, texture);

  useFrame(({ clock }) => {
    if (mesh.current) {
      // Self rotation
      mesh.current.rotation.y += rotationSpeed;
      // Orbit around Sun
      const t = clock.elapsedTime * orbitSpeed;
      mesh.current.position.x = distance * Math.cos(t);
      mesh.current.position.z = distance * Math.sin(t);
      mesh.current.position.y = 0;
    }
  });

  return (
    <group ref={mesh} onClick={() => onClick(name)}>
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          map={loadedTexture}
          metalness={0.3}
          roughness={0.4}
          emissive={new THREE.Color("#111111")}
          emissiveIntensity={0.2}
        />
      </mesh>

      <pointLight color="white" intensity={0.3} distance={size * 8} decay={2} />

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

// ---------------- Orbit Component ----------------
function Orbit({ distance }: { distance: number }) {
  const ref = useRef<THREE.Line | null>(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.001;
  });

  const points: THREE.Vector3[] = [];
  const segments = 128;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * 2 * Math.PI;
    points.push(new THREE.Vector3(Math.cos(theta) * distance, 0, Math.sin(theta) * distance));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: "white" });

  return <primitive object={new THREE.Line(geometry, material)} ref={ref} />;
}

// ---------------- Info Overlay ----------------
const planetInfo: Record<string, string> = {
  Mercury: "Smallest planet, closest to the Sun",
  Venus: "Hottest planet with thick clouds",
  Earth: "Our home planet with abundant life",
  Mars: "The Red Planet, potential for future colonies",
};

function InfoOverlay() {
  const { targetPlanetName } = useCameraStore();
  if (!targetPlanetName) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "30px",
        left: "50%",
        transform: "translateX(-50%)",
        color: "white",
        background: "rgba(0,0,0,0.6)",
        padding: "12px 24px",
        borderRadius: "15px",
        fontSize: "16px",
        fontWeight: "500",
        pointerEvents: "none",
      }}
    >
      {planetInfo[targetPlanetName]}
    </div>
  );
}

// ---------------- Solar System ----------------
export default function SolarSystem() {
  const { setTarget } = useCameraStore();

  // Planet refs declared at top-level
  const planetRefs: Record<string, React.RefObject<THREE.Group | null>> = {
    Mercury: useRef<THREE.Group | null>(null),
    Venus: useRef<THREE.Group | null>(null),
    Earth: useRef<THREE.Group | null>(null),
    Mars: useRef<THREE.Group | null>(null),
  };

  const planets = [
    { name: "Mercury", size: 1, distance: 8, texture: mercuryTexture, rotationSpeed: 0.02 },
    { name: "Venus", size: 1.5, distance: 12, texture: venusTexture, rotationSpeed: 0.015 },
    { name: "Earth", size: 2, distance: 16, texture: earthTexture, rotationSpeed: 0.02 },
    { name: "Mars", size: 1.2, distance: 20, texture: marsTexture, rotationSpeed: 0.018 },
  ];

  const handleClick = (name: string) => setTarget(name);
  const sunTex = useLoader(THREE.TextureLoader, sunTexture);

  function Sun() {
    const ref = useRef<THREE.Mesh | null>(null);
    useFrame(({ clock }) => {
      if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.08;
    });

    return (
      <group>
        <mesh ref={ref}>
          <sphereGeometry args={[5, 64, 64]} />
          <meshStandardMaterial
            emissive="#ffdca3"
            emissiveIntensity={2.5}
            map={sunTex}
            toneMapped={false}
          />
        </mesh>
        <sprite>
          <spriteMaterial
            color="#ffdd99"
            blending={THREE.AdditiveBlending}
            opacity={0.8}
            transparent
          />
        </sprite>
        <pointLight intensity={4} distance={150} decay={2} color="#fff2d6" />
      </group>
    );
  }

  return (
    <>
      <Canvas camera={{ position: [0, 30, 70], fov: 50 }}>
        <fog attach="fog" args={["#020317", 30, 150]} />
        <ambientLight intensity={0.3} />
        <hemisphereLight args={["#bfe9ff", "#2b2540", 0.25]} />
        <Stars radius={150} depth={60} count={3000} factor={5} saturation={0} fade />
        <Sun />
        {planets.map((p) => (
          <group ref={planetRefs[p.name]} key={p.name}>
            <Orbit distance={p.distance} />
            <Planet {...p} onClick={handleClick} />
          </group>
        ))}
        <ContactShadows position={[0, -6, 0]} opacity={0.4} scale={200} blur={4} far={30} />
        <OrbitControls enablePan={false} enableZoom enableDamping dampingFactor={0.08} rotateSpeed={0.6} />
        <EffectComposer>
          <Bloom kernelSize={5} luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={1.5} />
        </EffectComposer>
        <CameraController planetRefs={planetRefs} />
      </Canvas>

      <InfoOverlay />

      {/* Back button */}
      <div style={{ position: "absolute", top: 20, left: 20 }}>
        <button
          onClick={() => setTarget(null)}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            background: "#ffdd99",
            color: "#000",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Back
        </button>
      </div>
    </>
  );
}
