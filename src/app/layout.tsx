import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/components/Navbar";
import GlobalBackground from "@/components/GlobalBackground";

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
      className={`${inter.variable} ${sora.variable} dark antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans overflow-x-hidden">
        <SmoothScroll>
          <GlobalBackground />
          <Navbar />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
