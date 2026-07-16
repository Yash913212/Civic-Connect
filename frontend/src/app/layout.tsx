import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/components/Navbar";
import GlobalBackground from "@/components/GlobalBackground";
import { AuthProvider } from "@/auth/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import CivicAI from "@/components/chatbot/CivicAI";
import CommandPalette from "@/components/ui/CommandPalette";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Civic Connect | Smart City Civic Intelligence Platform",
  description: "Transforming Civic Governance Through Artificial Intelligence. Detect issues, route automatically, and predict departments with 96.4% accuracy.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Civic Connect",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
        lang="en"
        className={`${inter.variable} ${sora.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Civic Connect" />
      </head>
      <body className="min-h-full flex flex-col font-sans overflow-x-hidden transition-colors duration-500">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster theme="system" position="top-right" richColors closeButton />
          <AuthProvider>
            <SmoothScroll>
              <GlobalBackground />
              <Navbar />
              {children}
            </SmoothScroll>
          </AuthProvider>
          <CivicAI />
          <CommandPalette />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
