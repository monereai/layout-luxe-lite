import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Facing → Y rotation. The model faces the camera (+Z) when heading South. */
const YAW: Record<string, number> = { south: 0, east: Math.PI / 2, north: Math.PI, west: -Math.PI / 2 };
const FUR = "#d9a24a", MANE = "#8a4a1c", HOODIE = "#22305a", SHIRT = "#f0931e", DARK = "#2a1a10";

function Lion({ host }: { host: HTMLElement | null }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Mesh>(null), legR = useRef<THREE.Mesh>(null), armL = useRef<THREE.Group>(null), armR = useRef<THREE.Group>(null), tail = useRef<THREE.Group>(null);
  const t = useRef(0), stride = useRef(0);
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const facing = host?.dataset["facing"] ?? "south";
    const moving = host?.dataset["moving"] === "true";
    const g = root.current; if (!g) return;
    // Shortest-path, frame-rate independent turn toward the target yaw.
    const target = YAW[facing] ?? 0;
    let diff = target - g.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    g.rotation.y += diff * (1 - Math.exp(-12 * dt));
    stride.current += ((moving ? 1 : 0) - stride.current) * (1 - Math.exp(-10 * dt));
    t.current += dt * (moving ? 11 : 2.2);
    const s = stride.current, hop = Math.abs(Math.sin(t.current));
    if (body.current) {
      body.current.position.y = hop * 0.35 * s + Math.sin(t.current) * 0.02 * (1 - s);
      const squash = (hop - 0.5) * 0.16 * s;
      body.current.scale.set(1 - squash * 0.5, 1 + squash + Math.sin(t.current) * 0.015 * (1 - s), 1 - squash * 0.5);
    }
    const swing = Math.sin(t.current) * 0.7 * s;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (armL.current) armL.current.rotation.x = -swing * 0.8;
    if (armR.current) armR.current.rotation.x = swing * 0.8;
    if (tail.current) tail.current.rotation.z = Math.sin(t.current * 0.8) * 0.4;
  });
  const mat = (color: string, rough = 0.75) => <meshStandardMaterial color={color} roughness={rough} />;
  return (
    <group ref={root}>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}><circleGeometry args={[0.7, 24]} /><meshBasicMaterial color="#000" transparent opacity={0.22} /></mesh>
      <group ref={body}>
        {/* legs + feet */}
        <mesh ref={legL} position={[-0.22, 0.55, 0]}><capsuleGeometry args={[0.15, 0.5, 4, 10]} />{mat(HOODIE)}</mesh>
        <mesh ref={legR} position={[0.22, 0.55, 0]}><capsuleGeometry args={[0.15, 0.5, 4, 10]} />{mat(HOODIE)}</mesh>
        <mesh position={[-0.22, 0.14, 0.1]} scale={[1, 0.6, 1.4]}><sphereGeometry args={[0.16, 14, 10]} />{mat(FUR)}</mesh>
        <mesh position={[0.22, 0.14, 0.1]} scale={[1, 0.6, 1.4]}><sphereGeometry args={[0.16, 14, 10]} />{mat(FUR)}</mesh>
        {/* hoodie torso + shirt */}
        <mesh position={[0, 1.2, 0]}><capsuleGeometry args={[0.42, 0.55, 6, 16]} />{mat(HOODIE)}</mesh>
        <mesh position={[0, 1.2, 0.36]} scale={[0.5, 1, 0.3]}><capsuleGeometry args={[0.28, 0.4, 4, 10]} />{mat(SHIRT)}</mesh>
        {/* arms */}
        <group ref={armL} position={[-0.55, 1.5, 0]}><mesh position={[0, -0.35, 0]}><capsuleGeometry args={[0.12, 0.5, 4, 10]} />{mat(HOODIE)}</mesh><mesh position={[0, -0.72, 0]}><sphereGeometry args={[0.13, 12, 10]} />{mat(FUR)}</mesh></group>
        <group ref={armR} position={[0.55, 1.5, 0]}><mesh position={[0, -0.35, 0]}><capsuleGeometry args={[0.12, 0.5, 4, 10]} />{mat(HOODIE)}</mesh><mesh position={[0, -0.72, 0]}><sphereGeometry args={[0.13, 12, 10]} />{mat(FUR)}</mesh></group>
        {/* tail */}
        <group ref={tail} position={[0, 0.85, -0.38]} rotation-x={0.9}><mesh position={[0, -0.3, 0]}><cylinderGeometry args={[0.04, 0.05, 0.6, 8]} />{mat(FUR)}</mesh><mesh position={[0, -0.62, 0]}><sphereGeometry args={[0.1, 10, 8]} />{mat(MANE)}</mesh></group>
        {/* head */}
        <group position={[0, 2.05, 0.02]}>
          <mesh position={[0, 0, -0.08]}><sphereGeometry args={[0.62, 20, 16]} />{mat(MANE, 0.95)}</mesh>
          <mesh position={[0, 0, 0.12]}><sphereGeometry args={[0.44, 20, 16]} />{mat(FUR)}</mesh>
          <mesh position={[-0.32, 0.36, 0.05]}><sphereGeometry args={[0.13, 12, 10]} />{mat(FUR)}</mesh>
          <mesh position={[0.32, 0.36, 0.05]}><sphereGeometry args={[0.13, 12, 10]} />{mat(FUR)}</mesh>
          <mesh position={[0, -0.12, 0.46]} scale={[1.2, 0.8, 0.9]}><sphereGeometry args={[0.18, 14, 10]} />{mat("#f1cf8f")}</mesh>
          <mesh position={[0, -0.03, 0.6]} scale={[1.3, 0.8, 0.8]}><sphereGeometry args={[0.06, 10, 8]} />{mat(DARK, 0.4)}</mesh>
          <mesh position={[-0.16, 0.1, 0.5]}><sphereGeometry args={[0.055, 10, 8]} />{mat(DARK, 0.3)}</mesh>
          <mesh position={[0.16, 0.1, 0.5]}><sphereGeometry args={[0.055, 10, 8]} />{mat(DARK, 0.3)}</mesh>
        </group>
      </group>
    </group>
  );
}

/** True 3D Monere for the treasure map; reads facing/moving from the host's data attributes each frame. */
export default function Monere3D({ host }: { host: HTMLElement | null }) {
  return (
    <Canvas dpr={[1, 2]} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 2.6, 6.2], fov: 30 }} onCreated={({ camera }) => camera.lookAt(0, 1.25, 0)} style={{ pointerEvents: "none" }}>
      <hemisphereLight args={["#fff6e0", "#5a7a3a", 1.4]} />
      <directionalLight position={[3, 6, 5]} intensity={1.8} />
      <Lion host={host} />
    </Canvas>
  );
}
