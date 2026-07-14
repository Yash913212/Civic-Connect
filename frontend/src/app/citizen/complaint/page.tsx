"use client";

import { withRoleGuard } from "@/middleware/roleGuard";
import dynamic from "next/dynamic";

const ComplaintForm = dynamic(() => import("@/components/map/ComplaintForm"), { ssr: false });

function ComplaintsPage() {
  return (
    <main className="bg-transparent text-foreground relative w-full min-h-screen">
      <div className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-8">
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            Back
          </button>
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
