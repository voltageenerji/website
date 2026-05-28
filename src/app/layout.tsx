import type { Metadata, Viewport } from "next";
import { Inter_Tight, Geist_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import MarketFeed from "@/components/MarketFeed";
import BackgroundMount from "@/components/background/BackgroundMount";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const SITE = "https://voltage.com.tr";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Voltage — Electricity Markets, Reengineered",
    template: "%s · Voltage Energy",
  },
  description:
    "Voltage runs real-time electricity-market operations on EPİAŞ — prepaid purchasing, deferred sales and aggregation engineered into a live national energy-intelligence platform. Operated by Voltan Elektrik A.Ş. since 2011.",
  keywords: [
    "Voltage Energy",
    "Voltan Elektrik",
    "EPİAŞ",
    "electricity market",
    "energy aggregation",
    "day-ahead market",
    "GÖP",
    "GİP",
    "Türkiye energy",
    "energy intelligence platform",
  ],
  authors: [{ name: "Voltan Elektrik A.Ş." }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Voltage Energy",
    title: "Voltage — Electricity Markets, Reengineered",
    description:
      "A live national energy-intelligence platform. Real-time EPİAŞ market operations, aggregation and optimisation.",
    url: SITE,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Voltage — Electricity Markets, Reengineered",
    description:
      "A live national energy-intelligence platform, wired to the EPİAŞ market in real time.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#05070b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${interTight.variable} ${geistMono.variable}`}>
      <body>
        {/* Living atmosphere (fixed, behind everything) */}
        <BackgroundMount />
        {/* Headless real-time EPİAŞ feed */}
        <MarketFeed />
        {/* Buttery cinematic scrolling */}
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
