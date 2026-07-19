"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Heatmap() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Glowing Holographic Terrain Grid
    const geo = new THREE.PlaneGeometry(30, 30, 40, 40);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x0891b2,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geo, mat);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    // Animated undulating overlay
    const overlayGeo = new THREE.PlaneGeometry(30, 30, 60, 60);
    const overlayMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
    });
    const overlay = new THREE.Mesh(overlayGeo, overlayMat);
    overlay.rotation.x = -Math.PI / 2;
    overlay.position.y = 0.05;
    scene.add(overlay);
    const overlayPos = overlayGeo.attributes.position.array;

    // Municipal Hotspots
    const hotspotsGroup = new THREE.Group();
    scene.add(hotspotsGroup);
    const hotspotData: { mesh: THREE.Mesh; ring: THREE.Mesh; pillar: THREE.Mesh; phase: number; speed: number; baseY: number }[] = [];

    const types = [
      { color: 0x3b82f6, count: 12, radius: 0.2 },
      { color: 0xf59e0b, count: 8, radius: 0.18 },
      { color: 0x06b6d4, count: 10, radius: 0.15 },
    ];

    types.forEach((type) => {
      for (let j = 0; j < type.count; j++) {
        const x = (Math.random() - 0.5) * 24;
        const z = (Math.random() - 0.5) * 24;
        const y = 0.15;

        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(type.radius, 16, 16),
          new THREE.MeshBasicMaterial({ color: type.color, transparent: true, opacity: 0.8 })
        );
        sphere.position.set(x, y, z);
        hotspotsGroup.add(sphere);

        const ring = new THREE.Mesh(
          new THREE.RingGeometry(type.radius * 1.5, type.radius * 2.2, 32),
          new THREE.MeshBasicMaterial({ color: type.color, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false })
        );
        ring.position.set(x, y, z);
        ring.rotation.x = -Math.PI / 2;
        hotspotsGroup.add(ring);

        // Pillar beam from ground to hotspot
        const pillarGeo = new THREE.CylinderGeometry(0.02, 0.04, y, 6);
        const pillarMat = new THREE.MeshBasicMaterial({ color: type.color, transparent: true, opacity: 0.15 });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(x, y / 2, z);
        hotspotsGroup.add(pillar);

        hotspotData.push({
          mesh: sphere,
          ring,
          pillar,
          phase: Math.random() * Math.PI * 2,
          speed: 0.5 + Math.random() * 1.5,
          baseY: y,
        });
      }
    });

    // Connection lines between nearby hotspots
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.06,
    });

    const allPositions = hotspotData.map((h) => h.mesh.position);
    for (let i = 0; i < allPositions.length; i++) {
      for (let j = i + 1; j < allPositions.length; j++) {
        const dist = allPositions[i].distanceTo(allPositions[j]);
        if (dist < 5) {
          const lineGeo = new THREE.BufferGeometry().setFromPoints([
            allPositions[i].clone(),
            allPositions[j].clone(),
          ]);
          const line = new THREE.Line(lineGeo, lineMat);
          hotspotsGroup.add(line);
        }
      }
    }

    // Camera — isometric angled view
    camera.position.set(18, 14, 18);
    camera.lookAt(0, 0, 0);

    let time = 0;
    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.01;

      // Undulate grid
      const pos = geo.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        const x = pos[i];
        const z = pos[i + 1];
        pos[i + 2] = Math.sin(x * 0.5 + time) * 0.3 + Math.cos(z * 0.5 + time * 0.7) * 0.3;
      }
      geo.attributes.position.needsUpdate = true;

      // Undulate overlay
      for (let i = 0; i < overlayPos.length; i += 3) {
        const x = overlayPos[i];
        const z = overlayPos[i + 1];
        overlayPos[i + 2] = Math.sin(x * 0.7 + time * 1.3) * 0.4 + Math.cos(z * 0.6 + time * 0.9) * 0.4;
      }
      overlayGeo.attributes.position.needsUpdate = true;

      // Animate hotspots
      hotspotData.forEach((h) => {
        const pulse = Math.sin(time * h.speed + h.phase) * 0.5 + 0.5;
        (h.mesh.material as THREE.MeshBasicMaterial).opacity = 0.4 + pulse * 0.6;
        h.mesh.position.y = h.baseY + pulse * 0.3;
        h.ring.position.y = h.mesh.position.y;
        h.ring.scale.setScalar(1 + pulse * 0.6);
        (h.ring.material as THREE.MeshBasicMaterial).opacity = 0.1 + pulse * 0.5;
        h.pillar.scale.y = 1 + pulse * 0.5;
        h.pillar.position.y = (h.baseY + pulse * 0.3) / 2;
        (h.pillar.material as THREE.MeshBasicMaterial).opacity = 0.08 + pulse * 0.15;
      });

      // Camera orbits with a gentle tilt — stays close for immersion
      const orbitRadius = 20;
      const speed = 0.06;
      camera.position.x = Math.sin(time * speed) * orbitRadius;
      camera.position.z = Math.cos(time * speed) * orbitRadius;
      camera.position.y = 12 + Math.sin(time * 0.04) * 3;
      camera.lookAt(0, 0, 0);

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
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      geo.dispose();
      mat.dispose();
      overlayGeo.dispose();
      overlayMat.dispose();
      hotspotData.forEach((h) => {
        h.mesh.geometry.dispose();
        (h.mesh.material as THREE.Material).dispose();
        h.ring.geometry.dispose();
        (h.ring.material as THREE.Material).dispose();
        h.pillar.geometry.dispose();
        (h.pillar.material as THREE.Material).dispose();
      });
      hotspotsGroup.traverse((child) => {
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <section
      id="use-cases"
      className="relative w-full min-h-[70vh] md:h-[90vh] bg-transparent overflow-hidden border-y border-white/5"
    >
      <div className="absolute inset-0 z-0" ref={mountRef} />
      <div className="relative z-10 p-6 md:p-16 max-w-7xl mx-auto h-full flex flex-col justify-between gap-6">
        <div className="pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold uppercase tracking-wider mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Live Monitoring
          </div>
          <h2 className="text-3xl md:text-6xl font-heading font-bold text-slate-900 dark:text-white mb-3">
            Smart City{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">
              Heatmap
            </span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
            Real-time 3D visualization of civic anomalies powered by predictive clustering and AI routing intelligence.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 pointer-events-none">
          {[
            { label: "Pothole Hotspots", color: "bg-primary" },
            { label: "Garbage Overflow", color: "bg-yellow-500" },
            { label: "Water Leaks", color: "bg-teal-500" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-black/10 dark:border-white/10 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 shadow-sm"
            >
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
