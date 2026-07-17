"use client";

import Loader from "@/components/sections/Loader";
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
import Footer from "@/components/sections/Footer";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  
  return (
    <main className="bg-transparent text-foreground relative w-full min-h-screen">
      <Loader />
      <Hero />
      <TheProblem />
      <Solution />
      <Technology />
      <LiveDemo onViewMyComplaints={() => router.push('/citizen/complaints')} />
      <Heatmap />
      <CommandCenter />
      <FutureRoadmap />
      <ImpactMetrics />
      <Team />
      <CTA />
      <Footer />
    </main>
  );
}
