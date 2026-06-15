import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/components/Navbar";
import GlobalBackground from "@/components/GlobalBackground";
import { AuthProvider } from "@/auth/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

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
      <body className="min-h-full flex flex-col font-sans overflow-x-hidden transition-colors duration-500 bg-slate-50 dark:bg-[#050816]">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster theme="system" position="top-right" richColors closeButton />
          <AuthProvider>
            <SmoothScroll>
              <GlobalBackground />
              <Navbar />
              {children}
            </SmoothScroll>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
