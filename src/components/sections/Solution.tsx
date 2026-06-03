"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sphere, Float, Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  Camera,
  MessageSquareCode,
  AlertOctagon,
  GitMerge,
  UserCheck,
  Activity,
  ShieldCheck,
  ArrowRight
} from "lucide-react";

// Intelligent Modules Data
const modules = [
  { id: "intake", label: "Complaint Intake Layer", icon: UploadCloud, color: "#22d3ee" }, // Cyan
  { id: "vision", label: "Vision Analysis Engine", icon: Camera, color: "#818cf8" }, // Indigo
  { id: "nlp", label: "NLP Understanding Layer", icon: MessageSquareCode, color: "#c084fc" }, // Purple
  { id: "severity", label: "Severity Prediction System", icon: AlertOctagon, color: "#f43f5e" }, // Rose
  { id: "routing", label: "Department Intelligence Router", icon: GitMerge, color: "#3b82f6" }, // Blue
  { id: "officer", label: "Officer Assignment Network", icon: UserCheck, color: "#10b981" }, // Emerald
  { id: "monitoring", label: "Resolution Monitoring System", icon: Activity, color: "#f59e0b" }, // Amber
  { id: "verification", label: "Citizen Verification Layer", icon: ShieldCheck, color: "#a855f7" }, // Violet
];

// Helper to get orbital positions
const getPosition = (index: number, total: number, radius: number) => {
  const angle = (index * Math.PI * 2) / total - Math.PI / 2; // Start from top
  return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
};

// --- 3D Components ---

const CameraAdjust = () => {
  const { camera, size } = useThree();
  useEffect(() => {
    // Dynamically adjust camera Z based on screen aspect ratio to ensure full circle is visible
    const aspect = size.width / size.height;
    if (aspect < 0.8) {
      camera.position.z = 28;
    } else if (aspect < 1.2) {
      camera.position.z = 22;
    } else {
      camera.position.z = 18;
    }
  }, [size, camera]);
  return null;
};

const CentralCore = () => {
  const coreRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.position.y = Math.sin(t * 1.5) * 0.1;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.5;
      ring1Ref.current.rotation.y = t * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = t * 0.4;
      ring2Ref.current.rotation.z = t * 0.2;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = -t * 0.3;
      ring3Ref.current.rotation.z = -t * 0.5;
    }
    if (pulseRef.current) {
      const scale = 1 + (Math.sin(t * 3) + 1) * 0.1; // Pulsing effect
      pulseRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={coreRef}>
      {/* Solid inner core */}
      <Sphere args={[1.2, 64, 64]}>
        <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.9} />
      </Sphere>
      
      {/* Core Energy Glow */}
      <Sphere ref={pulseRef} args={[1.4, 32, 32]}>
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </Sphere>
      <Sphere args={[1.7, 32, 32]}>
        <meshBasicMaterial color="#a855f7" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} />
      </Sphere>

      {/* Wireframe holographic shell */}
      <Sphere args={[1.25, 32, 32]}>
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </Sphere>

      {/* Orbital Data Rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.8, 0.015, 16, 100]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.2, 0.02, 16, 100]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[2.6, 0.01, 16, 100]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

const DataPacket = ({ start, end, color }: { start: THREE.Vector3; end: THREE.Vector3; color: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Continuous flowing data packets (loops from 0 to 1)
    const speed = 1.5;
    const t = (state.clock.getElapsedTime() * speed) % 1;
    
    // Lerp from start (node) to end (core)
    meshRef.current.position.lerpVectors(start, end, t);
    
    // Fade out as it reaches the center
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = Math.max(0, 1 - Math.pow(t, 2));
    
    // Scale down slightly as it reaches center
    const scale = 1 - (t * 0.5);
    meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
};

const EngineScene = () => {
  const groupRef = useRef<THREE.Group>(null);
  const [activeNode, setActiveNode] = useState(0);

  // Auto-progress active node to simulate data flowing through the pipeline
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % modules.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useFrame((state) => {
    // Subtle mouse parallax effect for the entire orbital system
    if (groupRef.current) {
      const targetX = (state.pointer.x * Math.PI) / 12;
      const targetY = (state.pointer.y * Math.PI) / 12;
      
      groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.05;
      groupRef.current.rotation.x += (-targetY - groupRef.current.rotation.x) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, -3.5, 0]}>
      <CameraAdjust />
      <CentralCore />
      
      {modules.map((mod, i) => {
        const pos = getPosition(i, modules.length, 6.5);
        const isActive = activeNode === i;
        const isPast = i < activeNode || (activeNode === 0 && i === modules.length - 1); // Highlight path
        const Icon = mod.icon;
        
        return (
          <group key={mod.id}>
            {/* Connecting line to core */}
            <mesh>
              <tubeGeometry args={[
                new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), pos), 
                20, 
                0.01, 
                8, 
                false
              ]} />
              <meshBasicMaterial 
                color={isActive || isPast ? mod.color : "#ffffff"} 
                transparent 
                opacity={isActive ? 0.8 : (isPast ? 0.3 : 0.05)} 
                blending={THREE.AdditiveBlending} 
              />
            </mesh>

            {/* Firing Data Packets when active */}
            {isActive && (
              <DataPacket start={pos} end={new THREE.Vector3(0,0,0)} color={mod.color} />
            )}

            {/* Floating Glassmorphism Node UI */}
            <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
              <Html 
                position={pos} 
                transform 
                center
                distanceFactor={15}
                zIndexRange={[100, 0]}
              >
                <div 
                  className={`relative flex flex-col items-center justify-center p-4 rounded-[1.5rem] border transition-all duration-700 w-52 md:w-56 cursor-pointer ${
                    isActive 
                      ? "bg-[#050810]/90 backdrop-blur-xl scale-110 shadow-2xl" 
                      : "bg-[#050810]/40 backdrop-blur-sm border-white/5 opacity-50 scale-90 hover:opacity-100 hover:scale-100"
                  }`}
                  style={{
                    borderColor: isActive ? mod.color : undefined,
                    boxShadow: isActive ? `0 0 40px ${mod.color}30` : undefined,
                  }}
                  onClick={() => setActiveNode(i)}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors duration-500 border border-white/10"
                    style={{ 
                      backgroundColor: isActive ? `${mod.color}20` : 'rgba(255,255,255,0.02)',
                      color: isActive ? mod.color : 'rgba(255,255,255,0.4)',
                      boxShadow: isActive ? `0 0 20px ${mod.color}60` : undefined
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-white font-bold text-center text-xs md:text-sm leading-tight tracking-wide">
                    {mod.label}
                  </h3>
                  
                  {/* Active highlight border frame */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div 
                        layoutId="active-node-frame"
                        className="absolute -inset-[1px] rounded-[1.5rem] border pointer-events-none z-0"
                        style={{ borderColor: mod.color, opacity: 0.5 }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </Html>
            </Float>
          </group>
        );
      })}
    </group>
  );
};


// --- Main Section Component ---

export default function Solution() {
  return (
    <section 
      id="engine" 
      className="relative w-full h-[120vh] min-h-[900px] flex flex-col items-center overflow-hidden bg-transparent font-sans"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none z-10" />

      {/* Immersive 3D WebGL Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas dpr={[1, 2]}>
          <ambientLight intensity={0.5} />
          <EngineScene />
        </Canvas>
      </div>

      {/* Overlay Typography Header */}
      <div className="relative z-20 mt-12 md:mt-16 px-6 max-w-4xl mx-auto text-center pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm shadow-xl"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_12px_#22d3ee]" />
          <span className="text-xs font-mono font-bold tracking-[0.2em] text-white/80 uppercase">
            System Architecture
          </span>
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-4xl md:text-5xl lg:text-7xl font-heading font-black mb-6 text-white tracking-tight leading-[1.1]"
        >
          Autonomous <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">Resolution Engine</span>
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light max-w-3xl mx-auto"
        >
          An intelligent governance infrastructure that transforms citizen reports into verified action through AI-driven analysis, routing, monitoring, and resolution.
        </motion.p>
      </div>

      {/* Bottom overlay fade to seamlessly blend with next section */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background/80 to-transparent z-10 pointer-events-none" />
    </section>
  );
}
