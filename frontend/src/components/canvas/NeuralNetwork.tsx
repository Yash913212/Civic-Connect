"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function NeuralNetwork() {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const particleCount = 200;
  
  const { positions, colors, lines, lineColors } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    
    // Generate random positions and colors (cyan / primary / white)
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;     // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40; // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20; // z

      const colorType = Math.random();
      if (colorType > 0.6) {
        // Cyan
        col[i * 3] = 0.0;
        col[i * 3 + 1] = 0.8;
        col[i * 3 + 2] = 1.0;
      } else if (colorType > 0.3) {
        // Purple / Primary
        col[i * 3] = 0.5;
        col[i * 3 + 1] = 0.2;
        col[i * 3 + 2] = 1.0;
      } else {
        // White-ish
        col[i * 3] = 0.8;
        col[i * 3 + 1] = 0.8;
        col[i * 3 + 2] = 1.0;
      }
    }

    // Connect nodes that are close to each other
    const lineIndices: number[] = [];
    const lineCols: number[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      let connections = 0;
      for (let j = i + 1; j < particleCount; j++) {
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;

        // Threshold for connection
        if (distSq < 25 && connections < 4) {
          lineIndices.push(i, j);
          
          // Use color of first point for the line
          lineCols.push(col[i * 3], col[i * 3 + 1], col[i * 3 + 2]);
          lineCols.push(col[j * 3], col[j * 3 + 1], col[j * 3 + 2]);
          connections++;
        }
      }
    }

    return {
      positions: pos,
      colors: col,
      lines: new Uint16Array(lineIndices),
      lineColors: new Float32Array(lineCols)
    };
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Nodes */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.15}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Connections */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[lineColors, 3]}
          />
          <bufferAttribute
            attach="index"
            args={[lines, 1]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}
