import React, { useRef, useState, useEffect } from "react";
import { Canvas, useLoader, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Stars,
  ContactShadows,
  Text,
} from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import CameraController, { useCameraStore } from "./CameraController";

// ------------------ Textures ------------------
import sunTexture from "../assets/textures/sun.jpg";
import mercuryTexture from "../assets/textures/mercury.jpg";
import venusTexture from "../assets/textures/venus.jpg";
import earthTexture from "../assets/textures/earth.jpg";
import marsTexture from "../assets/textures/mars.jpg";
import jupiterTexture from "../assets/textures/jupiter.jpg";
import saturnTexture from "../assets/textures/saturn.jpg";
import uranusTexture from "../assets/textures/uranus.jpg";
import neptuneTexture from "../assets/textures/neptune.jpg";
import saturnRingTexture from "../assets/textures/saturn_ring.png";

// ------------------ Planet Info ------------------
const planetInfo = {
  Mercury: "Smallest planet, closest to the Sun.",
  Venus: "Hottest planet with dense atmosphere.",
  Earth: "Our home world with oceans and life.",
  Mars: "The Red Planet, target for exploration.",
  Jupiter: "Gas giant with Great Red Spot.",
  Saturn: "Known for its magnificent rings.",
  Uranus: "An ice giant tilted on its side.",
  Neptune: "Cold, windy, and farthest planet.",
};

interface PlanetData {
  name: keyof typeof planetInfo;
  size: number;
  distance: number;
  texture: string;
  rotationSpeed: number;
  orbitSpeed: number;
  ring?: { inner: number; outer: number; texture: string };
}

// ------------------ Responsive Camera ------------------
function ResponsiveCamera() {
  const { camera, size } = useThree();
  const perspectiveCamera = camera as THREE.PerspectiveCamera;

  useEffect(() => {
    // Dynamically adjust camera FOV
    perspectiveCamera.fov = size.width < 480 ? 75 : size.width < 1024 ? 60 : 50;
    perspectiveCamera.updateProjectionMatrix();
  }, [perspectiveCamera, size.width]);

  return null;
}

// ------------------ PlanetGroup ------------------
function PlanetGroup({
  planet,
  planetRef,
  onClick,
}: {
  planet: PlanetData;
  planetRef: React.RefObject<THREE.Group | null>;
  onClick: (name: string) => void;
}) {
  const [planetTexture, ringTexture] = useLoader(THREE.TextureLoader, [
    planet.texture,
    planet.ring ? planet.ring.texture : planet.texture,
  ]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * planet.orbitSpeed;
    const x = planet.distance * Math.cos(t);
    const z = planet.distance * Math.sin(t);
    if (planetRef.current) planetRef.current.position.set(x, 0, z);
  });

  return (
    <group ref={planetRef} onClick={() => onClick(planet.name)}>
      <mesh>
        <sphereGeometry args={[planet.size, 48, 48]} />
        <meshStandardMaterial
          map={planetTexture as THREE.Texture}
          metalness={0.3}
          roughness={0.4}
          emissive={new THREE.Color("#111")}
          emissiveIntensity={0.25}
        />
      </mesh>

      {planet.ring && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry
            args={[planet.ring.inner, planet.ring.outer, 64]}
          />
          <meshBasicMaterial
            map={ringTexture as THREE.Texture}
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      <Text
        position={[0, planet.size + 0.8, 0]}
        fontSize={0.6}
        color="white"
        anchorX="center"
        anchorY="bottom"
      >
        {planet.name}
      </Text>
    </group>
  );
}

// ------------------ Orbit Path ------------------
function Orbit({ distance }: { distance: number }) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * 2 * Math.PI;
    points.push(new THREE.Vector3(Math.cos(a) * distance, 0, Math.sin(a) * distance));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: "#555" });
  return <primitive object={new THREE.Line(geo, mat)} />;
}

// ------------------ Info Panel ------------------
function InfoPanel({ name }: { name: keyof typeof planetInfo }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        right: "clamp(10px, 4vw, 40px)",
        transform: "translateY(-50%)",
        background: "rgba(0,0,0,0.6)",
        padding: "clamp(12px, 2vw, 20px) clamp(20px, 3vw, 30px)",
        borderRadius: "16px",
        color: "white",
        maxWidth: "clamp(180px, 30vw, 260px)",
        fontFamily: "sans-serif",
        boxShadow: "0 0 20px rgba(255,255,255,0.1)",
        backdropFilter: "blur(10px)",
        fontSize: "clamp(12px, 2vw, 16px)",
      }}
    >
      <h3 style={{ marginBottom: "10px", fontSize: "clamp(16px, 3vw, 20px)" }}>{name}</h3>
      <p style={{ lineHeight: "1.4" }}>{planetInfo[name]}</p>
    </div>
  );
}

// ------------------ Sun ------------------
function Sun() {
  const texture = useLoader(THREE.TextureLoader, sunTexture);
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.1;
  });
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshStandardMaterial
          emissive="#ffdca3"
          emissiveIntensity={3}
          map={texture}
          toneMapped={false}
        />
      </mesh>
      <pointLight intensity={4} distance={300} decay={2} color="#fff2d6" />
    </group>
  );
}

// ------------------ Main SolarSystem ------------------
export default function SolarSystem() {
  const { setFocusing } = useCameraStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const planetRefs: Record<string, React.RefObject<THREE.Group | null>> = {
    Mercury: useRef(null),
    Venus: useRef(null),
    Earth: useRef(null),
    Mars: useRef(null),
    Jupiter: useRef(null),
    Saturn: useRef(null),
    Uranus: useRef(null),
    Neptune: useRef(null),
  };

  // 🪐 Responsive scaling
  const width = window.innerWidth;
  const scaleFactor = width < 480 ? 0.9 : width < 1024 ? 0.8 : 1;
  const cameraPos = width < 480 ? [0, 25, 80] : width < 1024 ? [0, 35, 110] : [0, 40, 120];

  const planets: PlanetData[] = [
    { name: "Mercury", size: 0.8 * scaleFactor, distance: 10 * scaleFactor, texture: mercuryTexture, rotationSpeed: 0.02, orbitSpeed: 1.0 },
    { name: "Venus", size: 1.2 * scaleFactor, distance: 14 * scaleFactor, texture: venusTexture, rotationSpeed: 0.015, orbitSpeed: 0.8 },
    { name: "Earth", size: 1.3 * scaleFactor, distance: 18 * scaleFactor, texture: earthTexture, rotationSpeed: 0.02, orbitSpeed: 0.6 },
    { name: "Mars", size: 1.0 * scaleFactor, distance: 23 * scaleFactor, texture: marsTexture, rotationSpeed: 0.018, orbitSpeed: 0.5 },
    { name: "Jupiter", size: 3.5 * scaleFactor, distance: 32 * scaleFactor, texture: jupiterTexture, rotationSpeed: 0.04, orbitSpeed: 0.25 },
    {
      name: "Saturn",
      size: 3.0 * scaleFactor,
      distance: 42 * scaleFactor,
      texture: saturnTexture,
      rotationSpeed: 0.038,
      orbitSpeed: 0.18,
      ring: { inner: 3.5 * scaleFactor, outer: 5.5 * scaleFactor, texture: saturnRingTexture },
    },
    { name: "Uranus", size: 2.3 * scaleFactor, distance: 50 * scaleFactor, texture: uranusTexture, rotationSpeed: 0.03, orbitSpeed: 0.12 },
    { name: "Neptune", size: 2.2 * scaleFactor, distance: 58 * scaleFactor, texture: neptuneTexture, rotationSpeed: 0.028, orbitSpeed: 0.1 },
  ];

  const handleClick = (name: string) => {
    setSelected(name);
    setFocusing(true);
  };

  const handleBack = () => {
    setSelected(null);
    setFocusing(false);
  };

  const smoothedTarget = useRef(new THREE.Vector3()).current;

  const getPlanetPosition = () => {
    if (!selected) return null;
    const ref = planetRefs[selected];
    if (!ref?.current) return smoothedTarget;

    const localPos = new THREE.Vector3(0, 0, 0);
    ref.current.localToWorld(localPos);
    smoothedTarget.lerp(localPos, 0.2);
    return smoothedTarget;
  };

  return (
    <>
      {!selected && showHint && (
        <div
          style={{
            position: "absolute",
            top: "5%",
            left: "50%",
            transform: "translateX(-50%)",
            color: "#ffffff",
            fontSize: "clamp(14px, 2vw, 22px)",
            textAlign: "center",
            textShadow: "0 0 10px rgba(255,255,255,0.6)",
            padding: "10px 20px",
            borderRadius: "12px",
            backdropFilter: "blur(4px)",
            animation: "fadeBlink 2s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          ✨ Tap on any planet to explore it!
        </div>
      )}

      <Canvas
        camera={{ position: cameraPos as [number, number, number], fov: 50 }}
        style={{ width: "100vw", height: "100vh", touchAction: "none" }}
      >
        <ResponsiveCamera />
        <fog attach="fog" args={["#020317", 40, 350]} />
        <ambientLight intensity={0.3} />
        <hemisphereLight args={["#bfe9ff", "#2b2540", 0.25]} />
        <Stars radius={300} depth={100} count={4000} factor={6} fade />

        <Sun />

        {planets.map((p) => (
          <React.Fragment key={p.name}>
            <Orbit distance={p.distance} />
            <PlanetGroup planet={p} planetRef={planetRefs[p.name]} onClick={handleClick} />
          </React.Fragment>
        ))}

        <ContactShadows position={[0, -6, 0]} opacity={0.4} scale={300} blur={4} far={40} />
        <OrbitControls
          enabled={!useCameraStore.getState().isFocusing}
          enablePan={false}
          enableZoom
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
        />
        <EffectComposer>
          <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={1.4} />
        </EffectComposer>

        <CameraController getPlanetPosition={getPlanetPosition} />
      </Canvas>

      {selected && <InfoPanel name={selected as keyof typeof planetInfo} />}

      {selected && (
        <div
          style={{
            position: "absolute",
            top: "clamp(10px, 3vh, 30px)",
            left: "clamp(10px, 4vw, 40px)",
          }}
        >
          <button
            onClick={handleBack}
            style={{
              padding: "clamp(8px, 1.5vw, 12px) clamp(16px, 3vw, 24px)",
              borderRadius: "8px",
              border: "none",
              background: "#ffdd99",
              color: "#000",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "clamp(12px, 2vw, 18px)",
            }}
          >
            Back
          </button>
        </div>
      )}
    </>
  );
}
