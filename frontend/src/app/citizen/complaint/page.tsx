"use client";

import { withRoleGuard } from "@/middleware/roleGuard";
import dynamic from "next/dynamic";

const ComplaintForm = dynamic(() => import("@/components/map/ComplaintForm"), { ssr: false });

function ComplaintsPage() {
  return (
    <main className="bg-transparent text-foreground relative w-full min-h-screen">
      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Register a Complaint</h1>
          <p className="text-muted-foreground">
            Review the AI analysis, pin the exact location on the map, and submit.
          </p>
        </div>
        <ComplaintForm />
      </div>
    </main>
  );
}

export default withRoleGuard(ComplaintsPage, ["CITIZEN", "ADMIN"]);
