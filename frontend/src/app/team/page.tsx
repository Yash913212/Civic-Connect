import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import Team from "@/components/sections/Team";
import Footer from "@/components/sections/Footer";

export default function TeamPage() {
  return (
    <main className="bg-transparent text-foreground relative w-full min-h-screen">
      <div className="sticky top-20 z-30 max-w-7xl mx-auto px-6 pt-6 pb-2">
        <Link
          href="/citizen/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary shadow-lg shadow-black/10 backdrop-blur-md hover:bg-primary/20 hover:border-primary/50 transition-all duration-300"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Dashboard
        </Link>
      </div>
      <Team />
      <Footer />
    </main>
  );
}