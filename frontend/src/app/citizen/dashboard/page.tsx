"use client";

import { withRoleGuard } from "@/middleware/roleGuard";
import { useRouter } from "next/navigation";

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

import GamificationWidget from "@/components/widgets/GamificationWidget";

function CitizenDashboard() {
  const router = useRouter();
  return (
    <main className="bg-transparent text-foreground relative w-full min-h-screen select-none">
      <div className="relative z-10 w-full">
        <Hero />
        <GamificationWidget />
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
      </div>
      <Footer />
    </main>
  );
}

export default withRoleGuard(CitizenDashboard, ['CITIZEN', 'ADMIN']);
