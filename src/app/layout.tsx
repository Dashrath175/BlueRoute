import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BlueRoute | AI-Powered Maritime Intelligence & Route Optimization",
  description: "Evaluate, optimize, and simulate global shipping routes using weather overlays, piracy threat heatmaps, traffic density grids, and carbon analysis in a real-time Maritime Command Center.",
  keywords: ["maritime intelligence", "shipping routes", "route optimization", "weather risk", "piracy risk", "carbon emissions", "marine telemetry"],
  authors: [{ name: "Antigravity Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-brand-bg-darker text-brand-text font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
