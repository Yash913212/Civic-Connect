"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Heatmap() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Premium Three.js Dynamic Digital Twin Heatmap
    const scene = new THREE.Scene();
    
    // Set safe dimensions
    const width = mountRef.current.clientWidth || window.innerWidth;
    const height = mountRef.current.clientHeight || 500;
    
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    // Glowing Holographic Terrain Grid
    const geometry = new THREE.PlaneGeometry(30, 30, 40, 40);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x0891b2, // Glowing Cyan
      wireframe: true, 
      transparent: true, 
      opacity: 0.15,
      side: THREE.DoubleSide 
    });
    
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2; // Lie flat
    scene.add(plane);

    // Municipal Hotspots Group
    const hotspotsGroup = new THREE.Group();
    scene.add(hotspotsGroup);

    const hotspotTypes = [
      { color: 0x3b82f6, count: 12, yOffset: 0.25 }, // Pothole Hotspots (blue)
      { color: 0xf59e0b, count: 8, yOffset: 0.3 },   // Garbage Overflow (yellow)
      { color: 0x06b6d4, count: 10, yOffset: 0.25 }  // Water Leaks (cyan)
    ];

    const hotspotMeshes: { mesh: THREE.Mesh; baseScale: number; pulseSpeed: number; rx: number; rz: number }[] = [];

    hotspotTypes.forEach((type) => {
      // Create glowing sphere geometry for hotspots
      const geom = new THREE.SphereGeometry(0.12, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: type.color,
        transparent: true,
        opacity: 0.9,
      });

      for (let i = 0; i < type.count; i++) {
        const mesh = new THREE.Mesh(geom, mat);
        
        // Distribute randomly across the terrain
        const rx = (Math.random() - 0.5) * 22;
        const rz = (Math.random() - 0.5) * 22;
        mesh.position.set(rx, 0, rz);
        
        hotspotsGroup.add(mesh);
        
        // Add concentric pulsing glowing halo ring
        const ringGeom = new THREE.RingGeometry(0.18, 0.28, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: type.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.45,
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI / 2;
        mesh.add(ring);

        hotspotMeshes.push({
          mesh,
          baseScale: 0.7 + Math.random() * 0.6,
          pulseSpeed: 1.5 + Math.random() * 2.0,
          rx,
          rz
        });
      }
    });

    // Setup camera position
    camera.position.set(0, 7, 10);
    camera.lookAt(0, 0, 0);

    const startTime = performance.now();
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      const elapsedTime = (performance.now() - startTime) / 1000;

      // 1. Dynamic Undulating Grid (Topography Simulation)
      const position = plane.geometry.attributes.position;
      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const y = position.getY(i);
        
        // Create an organic waving digital landscape moving towards the viewer
        const waveSpeed = elapsedTime * 1.5;
        const z = Math.sin(x * 0.3 + waveSpeed * 0.8) * Math.cos(y * 0.3 + waveSpeed) * 1.2;
        position.setZ(i, z);
      }
      plane.geometry.attributes.position.needsUpdate = true;

      // 2. Animate Hotspots (Pulse & Follow undulating grid height)
      hotspotMeshes.forEach((item) => {
        const timeFactor = elapsedTime * item.pulseSpeed;
        const scale = item.baseScale * (1.0 + Math.sin(timeFactor) * 0.3);
        item.mesh.scale.set(scale, scale, scale);

        // Track terrain Z height (mapped to Y in scene coordinate rotation)
        const waveSpeed = elapsedTime * 1.5;
        const terrainHeight = Math.sin(item.rx * 0.3 + waveSpeed * 0.8) * Math.cos(item.rz * 0.3 + waveSpeed) * 1.2;
        item.mesh.position.y = terrainHeight + 0.2;

        // Rotate the ring inside the hotspot
        if (item.mesh.children[0]) {
          const ring = item.mesh.children[0] as THREE.Mesh;
          ring.rotation.z += 0.015;
          (ring.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(timeFactor) * 0.25;
        }
      });

      // 3. Cinematic Camera Orbital Sweep & Group Rotation
      hotspotsGroup.rotation.y = elapsedTime * 0.05;
      plane.rotation.z = elapsedTime * 0.02;

      camera.position.x = Math.sin(elapsedTime * 0.1) * 14;
      camera.position.z = Math.cos(elapsedTime * 0.1) * 14;
      camera.position.y = 8 + Math.sin(elapsedTime * 0.2) * 3;
      camera.lookAt(0, -1, 0);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth || window.innerWidth;
      const h = mountRef.current.clientHeight || 500;
      
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (mountRef.current && renderer.domElement.parentNode) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      
      // Dispose hotspots
      hotspotMeshes.forEach((item) => {
        item.mesh.geometry.dispose();
        (item.mesh.material as THREE.Material).dispose();
        if (item.mesh.children[0]) {
          const ring = item.mesh.children[0] as THREE.Mesh;
          ring.geometry.dispose();
          (ring.material as THREE.Material).dispose();
        }
      });
    };
  }, []);

  return (
    <section id="use-cases" className="relative w-full min-h-[60vh] md:h-[80vh] bg-transparent overflow-hidden border-y border-white/5">
      <div className="absolute inset-0 z-0" ref={mountRef} />

      <div className="relative z-10 p-6 md:p-24 max-w-7xl mx-auto h-full flex flex-col justify-between pointer-events-none gap-8">
        <div>
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 dark:text-white mb-4">Smart City Heatmap</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl">Real-time visualization of civic anomalies powered by predictive clustering.</p>
        </div>

        <div className="flex flex-wrap gap-4">
          {['Pothole Hotspots', 'Garbage Overflow', 'Water Leaks'].map((item, i) => (
            <div key={i} className="bg-background/80 backdrop-blur-md border border-black/5 dark:border-white/10 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-yellow-500' : 'bg-cyan-500'}`} />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
