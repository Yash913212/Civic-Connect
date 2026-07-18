"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function NeuralNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  
  // High-density grid for a premium "data wave" effect
  const gridSize = 75;
  const particleCount = gridSize * gridSize;
  const spacing = 1.2;
  
  const { positions, colors, initialPositions } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const initPos = new Float32Array(particleCount * 3);
    
    let i = 0;
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const xPos = (x - gridSize / 2) * spacing;
        const zPos = (z - gridSize / 2) * spacing;
        
        pos[i * 3] = xPos;
        pos[i * 3 + 1] = 0; // Y is animated below
        pos[i * 3 + 2] = zPos;
        
        initPos[i * 3] = xPos;
        initPos[i * 3 + 1] = 0;
        initPos[i * 3 + 2] = zPos;

        // Premium Color Distribution (Emerald, Gold, White)
        const colorType = Math.random();
        if (colorType > 0.9) {
          // Champagne Gold Highlight
          col[i * 3] = 0.83; col[i * 3 + 1] = 0.68; col[i * 3 + 2] = 0.21;
        } else if (colorType > 0.4) {
          // Electric Emerald
          col[i * 3] = 0.0; col[i * 3 + 1] = 0.78; col[i * 3 + 2] = 0.55;
        } else {
          // Pale Mint / White
          col[i * 3] = 0.8; col[i * 3 + 1] = 0.95; col[i * 3 + 2] = 0.85;
        }
        
        i++;
      }
    }

    return { positions: pos, colors: col, initialPositions: initPos };
  }, [particleCount]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.elapsedTime;
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < particleCount; i++) {
      const x = initialPositions[i * 3];
      const z = initialPositions[i * 3 + 2];
      
      // Elegant, complex sine wave mathematics for organic fluid motion
      const y = Math.sin(x * 0.05 + time * 0.4) * 2.5 
              + Math.cos(z * 0.08 + time * 0.3) * 2.5
              + Math.sin((x + z) * 0.03 + time * 0.2) * 2.0;
              
      positions[i * 3 + 1] = y;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Ultra-slow luxurious rotation
    pointsRef.current.rotation.y = time * 0.03;
  });

  return (
    <group rotation={[Math.PI / 6, 0, 0]} position={[0, -8, -25]}>
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
          size={0.12}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
