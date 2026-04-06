import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/tokens.css";
import "../styles/system.css";
import "../styles/narrative.css";
import "../styles/organism.css";
import "../styles/motion.css";
import AgeGate from "@/components/AgeGate";
import BootScripts from "@/components/BootScripts";
import SiteNav from "@/components/SiteNav";
import ProfitCounter from "@/components/ProfitCounter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: {
    default: "AETHRA — Ideas, businesses & capital into revenue",
    template: "%s — AETHRA",
  },
  description:
    "AETHRA is a self-evolving system that turns ideas, businesses, and capital into revenue.",
  openGraph: {
    title: "AETHRA",
    description:
      "Ideas, businesses, and capital into revenue — continuous execution and optimisation.",
    type: "website",
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
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AgeGate />
        <div className="organism-bg" />
        <div className="organism-fallback" />
        <SiteNav />
        <ProfitCounter />
        {children}
        <BootScripts />
      </body>
    </html>
  );
}
