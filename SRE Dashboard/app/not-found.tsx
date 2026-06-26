"use client";

import React from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import CuteRobotIcon from "@/components/icons/cute-robot";

export default function NotFound() {
  return (
    <DashboardPageLayout
      header={{
        title: "Not Found",
        description: "Requested endpoint does not exist",
        icon: CuteRobotIcon,
      }}
    >
      <div className="flex flex-col items-center justify-center gap-6 py-20 flex-1 border border-border/50 rounded-lg bg-card mt-6">
        <div className="text-6xl font-bold text-muted-foreground/30 font-display">404</div>
        <div className="flex flex-col items-center justify-center gap-2">
          <h1 className="text-xl font-bold uppercase text-muted-foreground">
            Endpoint Not Found
          </h1>
          <p className="text-sm max-w-sm text-center text-muted-foreground text-balance">
            The requested SRE dashboard page is not available or is under active development.
          </p>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
