"use client";

import Footer from "@/components/sections/Footer";
import Hero from "@/components/sections/Hero";
import TheProblem from "@/components/sections/TheProblem";
import Solution from "@/components/sections/Solution";
import Technology from "@/components/sections/Technology";
import LiveDemo from "@/components/sections/LiveDemo";
import Heatmap from "@/components/sections/Heatmap";
import CommandCenter from "@/components/sections/CommandCenter";
import FutureRoadmap from "@/components/sections/FutureRoadmap";
import ImpactMetrics from "@/components/sections/ImpactMetrics";
import Team from "@/components/sections/Team";
import CTA from "@/components/sections/CTA";
import Navbar from "@/components/Navbar";

export default function CitizenDashboard() {
  return (
    <main className="bg-transparent text-foreground relative w-full min-h-screen select-none">
      <Navbar />
      <div className="relative z-10 w-full">
        <Hero />
        <TheProblem />
        <Solution />
        <Technology />
        <LiveDemo />
        <Heatmap />
        <CommandCenter />
        <FutureRoadmap />
        <ImpactMetrics />
        <Team />
        <CTA />
      </div>
      <Footer />
    </main>
  );
}
