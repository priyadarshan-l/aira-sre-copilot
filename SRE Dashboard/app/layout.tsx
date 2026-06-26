import React from "react";
import "./globals.css";
import { Metadata } from "next";
import { V0Provider } from "@/lib/v0-context";
import { SimulationProvider } from "@/lib/simulation-context";
import { AIRAProvider } from "@/lib/aira-provider";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { airaMockData } from "@/data/aira-mock";
import Widget from "@/components/dashboard/widget";
import Notifications from "@/components/dashboard/notifications";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

const isV0 = process.env["VERCEL_URL"]?.includes("vusercontent.net") ?? false;
const mockData = airaMockData;

export const metadata: Metadata = {
  title: {
    template: "%s – AIRA",
    default: "AIRA - Autonomous Incident Remediation Agent",
  },
  description:
    "AI-powered SRE platform for autonomous incident detection, root cause analysis, and automated remediation.",
  generator: 'v0.app'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} antialiased`}
        style={{ "--font-roboto-mono": "'Courier New', Courier, monospace" } as React.CSSProperties}
      >
        <V0Provider isV0={isV0}>
          <SimulationProvider>
            <AIRAProvider>
              <SidebarProvider>
                {/* Mobile Header - only visible on mobile */}
                <MobileHeader mockData={mockData} />

                {/* Desktop Layout */}
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-gap lg:px-sides">
                  <div className="hidden lg:block col-span-2 top-0 relative">
                    <DashboardSidebar />
                  </div>
                  <div className="col-span-1 lg:col-span-7">{children}</div>
                  <div className="col-span-3 hidden lg:block">
                    <div className="space-y-gap py-sides min-h-screen max-h-screen sticky top-0 overflow-clip">
                      <Widget widgetData={mockData.widgetData} />
                      <Notifications initialNotifications={mockData.notifications} />
                    </div>
                  </div>
                </div>
              </SidebarProvider>
            </AIRAProvider>
          </SimulationProvider>
        </V0Provider>
      </body>
    </html>
  );
}
