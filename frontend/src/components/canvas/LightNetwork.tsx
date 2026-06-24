"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function LightNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Grid size
  const gridSize = 60;
  const spacing = 1.0;
  
  const { positions, colors } = useMemo(() => {
    const particleCount = gridSize * gridSize;
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    
    let i = 0;
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        // Center the grid
        pos[i * 3] = (x - gridSize / 2) * spacing;
        pos[i * 3 + 1] = 0; // y will be animated
        pos[i * 3 + 2] = (z - gridSize / 2) * spacing;
        
        // Create a color gradient based on position
        // Blending from a soft slate to primary blue/cyan
        const progressX = x / gridSize;
        const progressZ = z / gridSize;
        
        // Interpolate colors: slate-400 (#94a3b8) to primary blue (#2563eb)
        const r = THREE.MathUtils.lerp(148, 37, progressX) / 255;
        const g = THREE.MathUtils.lerp(163, 99, Math.max(progressX, progressZ)) / 255;
        const b = THREE.MathUtils.lerp(184, 235, progressZ) / 255;
        
        col[i * 3] = r;
        col[i * 3 + 1] = g;
        col[i * 3 + 2] = b;
        
        i++;
      }
    }
    
    return {
      positions: pos,
      colors: col
    };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime * 0.4;
    
    let i = 0;
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        // Create a smooth flowing topography wave
        const wave1 = Math.sin((x * 0.15) + time) * Math.cos((z * 0.15) + time);
        const wave2 = Math.sin((x * 0.05) - time * 0.8) * Math.cos((z * 0.05) - time * 0.8);
        const wave3 = Math.sin((x * 0.1 + z * 0.1) + time * 1.2);
        
        // Combine waves for organic movement
        positions[i * 3 + 1] = (wave1 * 1.5) + (wave2 * 2.0) + (wave3 * 0.5);
        
        i++;
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Very subtle rotation of the entire grid to give it life
    pointsRef.current.rotation.y = Math.sin(time * 0.05) * 0.05;
  });

  return (
    <group rotation={[Math.PI / 2.8, 0, 0]} position={[0, -8, -15]}>
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
          blending={THREE.NormalBlending}
        />
      </points>
    </group>
  );
}
