import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface HolographicPitchProps {
  selectedCount: number;
  totalCount: number;
}

const FloatingNode = ({ position, active }: { position: [number, number, number], active: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.2;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh position={position} ref={meshRef}>
      <octahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial 
        color={active ? "#10b981" : "#3f3f46"} 
        emissive={active ? "#10b981" : "#000000"} 
        emissiveIntensity={active ? 2 : 0}
        wireframe={!active}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};

const PitchScene = ({ selectedCount, totalCount }: HolographicPitchProps) => {
  // Generate random positions for the nodes to form a tactical formation
  const nodes = useMemo(() => {
    const pts = [];
    for (let i = 0; i < totalCount; i++) {
      const x = (Math.random() - 0.5) * 15;
      const z = (Math.random() - 0.5) * 10;
      pts.push([x, 0.5, z] as [number, number, number]);
    }
    return pts;
  }, [totalCount]);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 10, 0]} intensity={1} color="#10b981" />
      
      {/* Tactical Grid Floor */}
      <Grid 
        renderOrder={-1} 
        position={[0, -0.5, 0]} 
        infiniteGrid 
        fadeDistance={30} 
        fadeStrength={5} 
        cellSize={1} 
        sectionSize={5} 
        sectionColor="#10b981" 
        cellColor="#10b981" 
        cellThickness={0.5} 
        sectionThickness={1} 
      />

      {/* Nodes representing teams */}
      {nodes.map((pos, i) => (
        <FloatingNode key={i} position={pos} active={i < selectedCount} />
      ))}

      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        autoRotate 
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2.2} 
        minPolarAngle={Math.PI / 3}
      />
      <Environment preset="city" />
    </>
  );
};

export const HolographicPitch: React.FC<HolographicPitchProps> = ({ selectedCount, totalCount }) => {
  return (
    <div className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-screen">
      <Canvas camera={{ position: [0, 5, 12], fov: 45 }}>
        <PitchScene selectedCount={selectedCount} totalCount={totalCount} />
      </Canvas>
    </div>
  );
};
