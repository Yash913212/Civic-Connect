"use client";

import { AnimatePresence } from "framer-motion";
import { Role } from "@/config/roles";
import { CitizenDashboardPreview } from "./dashboard/CitizenDashboardPreview";
import { OfficerDashboardPreview } from "./dashboard/OfficerDashboardPreview";
import { AdminDashboardPreview } from "./dashboard/AdminDashboardPreview";

interface DashboardPreviewProps {
  role: Role;
}

export function DashboardPreview({ role }: DashboardPreviewProps) {
  return (
    <div className="relative w-full h-full p-8 flex flex-col items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {role === "CITIZEN" && <CitizenDashboardPreview />}
        {role === "OFFICER" && <OfficerDashboardPreview />}
        {role === "ADMIN" && <AdminDashboardPreview />}
      </AnimatePresence>
    </div>
  );
}
