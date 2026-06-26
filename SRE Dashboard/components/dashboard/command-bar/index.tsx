"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useSimulation } from "@/lib/simulation-context";
import { useAIRA } from "@/lib/aira-provider";
import { Badge } from "@/components/ui/badge";

// Mode Toggle Component - Controls ChaosEngine
export function ModeToggle() {
  const { mode, toggleMode, isSimulation } = useSimulation();
  const { startSimulation, stopSimulation, chaosStatus, triggerRandomIncident } = useAIRA();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isSimulation) {
        // Turning OFF simulation
        await stopSimulation();
      } else {
        // Turning ON simulation - start ChaosEngine
        await startSimulation();
      }
      toggleMode();
    } catch (error) {
      console.error("Failed to toggle simulation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickTrigger = async () => {
    setIsLoading(true);
    try {
      await triggerRandomIncident();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={cn(
          "relative flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300",
          isSimulation
            ? "border-warning bg-warning/10 text-warning"
            : "border-success bg-success/10 text-success",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        {/* Status Indicator */}
        <span
          className={cn(
            "size-2 rounded-full",
            isSimulation ? "bg-warning animate-pulse" : "bg-success"
          )}
        />

        <span className="text-xs font-bold uppercase tracking-wider">
          {isLoading ? "..." : mode}
        </span>

        {isSimulation && (
          <Badge variant="outline" className="ml-1 text-[10px] border-warning text-warning">
            CHAOS ON
          </Badge>
        )}
      </button>

      {/* Quick Trigger Button */}
      <button
        onClick={handleQuickTrigger}
        disabled={isLoading}
        className="px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors disabled:opacity-50"
      >
        ⚡ Trigger
      </button>
    </div>
  );
}

// Global Search Component (Cmd+K style)
export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const searchResults = [
    { type: "incident", title: "INC-0847: Database Connection Pool", status: "analyzing" },
    { type: "agent", title: "ROOT CAUSE Agent", status: "active" },
    { type: "system", title: "PostgreSQL Cluster", status: "degraded" },
    { type: "command", title: "Trigger Simulation", action: "simulation" },
    { type: "command", title: "View Agent Logs", action: "logs" },
  ].filter(
    (item) =>
      query.length === 0 ||
      item.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-accent/50 hover:bg-accent transition-colors"
      >
        <SearchIcon className="size-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              onClick={() => {
                setIsOpen(false);
                setQuery("");
              }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl z-50"
            >
              <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                  <SearchIcon className="size-5 text-primary" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search incidents, agents, systems, or commands..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    autoFocus
                  />
                  <kbd className="px-2 py-1 text-[10px] font-mono bg-muted rounded border border-border">
                    ESC
                  </kbd>
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto p-2">
                  {searchResults.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.map((result, i) => (
                        <button
                          key={i}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
                          onClick={() => {
                            setIsOpen(false);
                            setQuery("");
                          }}
                        >
                          <ResultIcon type={result.type} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {result.title}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {result.type}
                            </p>
                          </div>
                          {result.status && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px]",
                                result.status === "active" && "border-primary text-primary",
                                result.status === "analyzing" && "border-warning text-warning",
                                result.status === "degraded" && "border-destructive text-destructive"
                              )}
                            >
                              {result.status}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      No results found for &quot;{query}&quot;
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/50 text-xs text-muted-foreground">
                  <span>AIRA Command Center</span>
                  <div className="flex items-center gap-2">
                    <span>Navigate</span>
                    <kbd className="px-1.5 py-0.5 font-mono bg-background rounded border border-border">↑↓</kbd>
                    <span>Select</span>
                    <kbd className="px-1.5 py-0.5 font-mono bg-background rounded border border-border">↵</kbd>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ResultIcon({ type }: { type: string }) {
  const iconClass = "size-4";

  switch (type) {
    case "incident":
      return (
        <div className="size-8 rounded-lg bg-destructive/10 flex items-center justify-center">
          <svg className={cn(iconClass, "text-destructive")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
      );
    case "agent":
      return (
        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg className={cn(iconClass, "text-primary")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <line x1="8" y1="16" x2="8" y2="16" />
            <line x1="16" y1="16" x2="16" y2="16" />
          </svg>
        </div>
      );
    case "system":
      return (
        <div className="size-8 rounded-lg bg-success/10 flex items-center justify-center">
          <svg className={cn(iconClass, "text-success")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
      );
    case "command":
      return (
        <div className="size-8 rounded-lg bg-warning/10 flex items-center justify-center">
          <svg className={cn(iconClass, "text-warning")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
        </div>
      );
    default:
      return null;
  }
}
