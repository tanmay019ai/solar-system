import { useCameraStore } from "./CameraController";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const planets = [
  { name: "Mercury", distance: 8, info: "Smallest planet, closest to the Sun" },
  { name: "Venus", distance: 12, info: "Hottest planet with thick clouds" },
  { name: "Earth", distance: 16, info: "Our home planet" },
  { name: "Mars", distance: 20, info: "The Red Planet" },
];

export default function OverlayInfo() {
  const { targetPlanet } = useCameraStore();
  const [info, setInfo] = useState<string>("");

  useEffect(() => {
    if (targetPlanet) {
      const x = targetPlanet.x;
      const planet = planets.find(p => Math.abs(p.distance - x) < 1); // tolerance of 1 unit
      setInfo(planet ? planet.info : "");
    } else setInfo("");
  }, [targetPlanet]);

  if (!info) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
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
      {info}
    </motion.div>
  );
}
