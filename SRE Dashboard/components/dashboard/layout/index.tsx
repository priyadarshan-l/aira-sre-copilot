"use client";

import React, { useState } from "react";
import { ModeToggle, GlobalSearch } from "@/components/dashboard/command-bar";
import RightPanel from "@/components/dashboard/right-panel";
import { Button } from "@/components/ui/button";
import { PanelRightOpen, PanelRightClose } from "lucide-react";

interface DashboardPageLayoutProps {
  children: React.ReactNode;

  header: {
    title: string;
    description?: string;
    icon: React.ElementType | React.ReactNode;
  };

  // Optional: Custom element rendered in the header bar (e.g. "Run Live Demo" button)
  headerAddon?: React.ReactNode;

  // Optional: Allow pages to disable the right panel
  hideRightPanel?: boolean;
}

export default function DashboardPageLayout({
  children,
  header,
  headerAddon,
  hideRightPanel = false,
}: DashboardPageLayoutProps) {
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  return (
    <div className="flex flex-col relative w-full gap-1 min-h-full">
      {/* Header with Command Bar */}
      <div className="flex items-center gap-2.5 md:gap-4 px-4 md:px-6 py-3 md:pb-4 lg:pt-7 ring-2 ring-pop sticky top-header-mobile lg:top-0 bg-background z-10">
        {/* Left: Icon and Title */}
        <div className="flex items-center gap-2.5 md:gap-4">
          <div className="max-lg:contents rounded bg-primary/20 border border-primary/30 size-7 md:size-9 flex items-center justify-center my-auto">
            {React.isValidElement(header.icon) ? (
              header.icon
            ) : (
              // @ts-ignore - we checked for element above, so this handles the component type case
              <header.icon className="ml-1 lg:ml-0 text-primary size-4 md:size-5" />
            )}
          </div>
          <h1 className="text-xl lg:text-4xl font-display leading-[1] mb-1 text-primary">
            {header.title}
          </h1>
          {headerAddon && <div className="ml-2">{headerAddon}</div>}
        </div>

        {/* Center/Right: Command Bar */}
        <div className="ml-auto flex items-center gap-3">
          <GlobalSearch />
          <ModeToggle />
          {!hideRightPanel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
              className="h-8 w-8"
              title={isRightPanelOpen ? "Close Activity Panel" : "Open Activity Panel"}
            >
              {isRightPanelOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </Button>
          )}
          {header.description && (
            <span className="hidden xl:block text-xs text-muted-foreground border-l border-border pl-3">
              {header.description}
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-full flex-1 flex flex-col gap-8 md:gap-14 px-3 lg:px-6 py-6 md:py-10 ring-2 ring-pop bg-background">
        {children}
      </div>

      {/* Right Panel */}
      {!hideRightPanel && (
        <RightPanel
          isOpen={isRightPanelOpen}
          onClose={() => setIsRightPanelOpen(false)}
        />
      )}
    </div>
  );
}
