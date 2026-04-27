import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GridProps {
  gridSize?: [number, number];
  cellCount?: number;
  color?: string;
  scanSpeed?: number;
}

function Grid({ gridSize = [10, 10], cellCount = 20, color = "#00ff00", scanSpeed = 1 }: GridProps) {
  const meshRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const points = [];
    const sizeX = gridSize[0];
    const sizeZ = gridSize[1];
    const stepX = sizeX / cellCount;
    const stepZ = sizeZ / cellCount;

    for (let i = 0; i <= cellCount; i++) {
      points.push(new THREE.Vector3(-sizeX / 2 + i * stepX, 0, -sizeZ / 2));
      points.push(new THREE.Vector3(-sizeX / 2 + i * stepX, 0, sizeZ / 2));
      points.push(new THREE.Vector3(-sizeX / 2, 0, -sizeZ / 2 + i * stepZ));
      points.push(new THREE.Vector3(sizeX / 2, 0, -sizeZ / 2 + i * stepZ));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [gridSize, cellCount]);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime() * scanSpeed;
      // Subtle tilt animation
      meshRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;
      meshRef.current.rotation.z = Math.cos(t * 0.1) * 0.1;
    }
  });

  return (
    <lineSegments ref={meshRef} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.3} />
    </lineSegments>
  );
}

function ScanLine({ gridSize = [10, 10], color = "#00ff00", scanSpeed = 2 }: GridProps) {
  const lineRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (lineRef.current) {
      const t = state.clock.getElapsedTime() * scanSpeed;
      const sizeZ = gridSize[1];
      lineRef.current.position.z = (Math.sin(t) * sizeZ) / 2;
    }
  });

  return (
    <mesh ref={lineRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[gridSize[0], 0.05]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
}

export default function GridScan({ color = "#00ff00", scanSpeed = 1 }: { color?: string, scanSpeed?: number }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 0 }}>
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <Grid color={color} scanSpeed={scanSpeed} />
        <ScanLine color={color} scanSpeed={scanSpeed * 2} />
      </Canvas>
    </div>
  );
}
