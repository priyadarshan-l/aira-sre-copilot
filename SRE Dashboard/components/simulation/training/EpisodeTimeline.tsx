"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardCard } from "@/components/dashboard/card";
import { cn } from "@/lib/utils";
import ProcessorIcon from "@/components/icons/proccesor";
import { useAIRA } from "@/lib/aira-provider";

interface EpisodeTimelineProps {
    isRunning: boolean;
    speed: number;
}

interface Episode {
    id: number;
    status: "completed" | "failed" | "current" | "pending";
    reward: number;
    duration: number;
}

export default function EpisodeTimeline({ isRunning, speed }: EpisodeTimelineProps) {
    const { kpi, isTraining, currentEpisode } = useAIRA();

    const historyEpisodes = (kpi?.history || []).map((h, index) => ({
        id: index + 1,
        status: h.resolved ? ("completed" as const) : ("failed" as const),
        reward: 0,
        duration: h.time_ms || 0
    }));

    const episodes = isTraining
        ? [...historyEpisodes, { id: historyEpisodes.length + 1, status: "current" as const, reward: 0, duration: 0 }]
        : historyEpisodes;

    const currentEpisodeNumber = isTraining ? currentEpisode : (kpi?.total_incidents || 0);
    const visibleEpisodes = episodes.slice(-15);

    return (
        <DashboardCard
            header={{ title: "EPISODE TIMELINE", icon: ProcessorIcon }}
            addon={
                <span className="text-sm font-mono text-primary">
                    EP {currentEpisode.toString().padStart(4, '0')}
                </span>
            }
        >
            <div className="space-y-4">
                {/* Timeline visualization */}
                <div className="relative h-16 bg-muted/20 rounded-lg overflow-hidden">
                    {/* Grid lines */}
                    <div className="absolute inset-0 cyber-grid opacity-30" />

                    {/* Episode markers */}
                    <div className="absolute inset-0 flex items-center px-4 gap-1">
                        {visibleEpisodes.map((episode, i) => (
                            <motion.div
                                key={episode.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={cn(
                                    "flex-1 h-8 rounded transition-all",
                                    episode.status === "current" && "bg-primary animate-pulse shadow-[0_0_15px_rgba(0,240,255,0.5)]",
                                    episode.status === "completed" && "bg-success/60",
                                    episode.status === "failed" && "bg-destructive/60",
                                    episode.status === "pending" && "bg-muted/30"
                                )}
                            />
                        ))}

                        {/* Empty slots */}
                        {Array.from({ length: Math.max(0, 15 - visibleEpisodes.length) }).map((_, i) => (
                            <div
                                key={`empty-${i}`}
                                className="flex-1 h-8 rounded bg-muted/10 border border-dashed border-border/30"
                            />
                        ))}
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-muted/20">
                        <p className="text-2xl font-display text-primary">{currentEpisodeNumber}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                    </div>
                    <div className="p-3 rounded-lg bg-success/10">
                        <p className="text-2xl font-display text-success">
                            {kpi?.resolved || 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">Success</p>
                    </div>
                    <div className="p-3 rounded-lg bg-destructive/10">
                        <p className="text-2xl font-display text-destructive">
                            {kpi?.unresolved || 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">Failed</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/20">
                        <p className="text-2xl font-display">
                            {Math.round(kpi?.success_rate || 0)}%
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">Rate</p>
                    </div>
                </div>
            </div>
        </DashboardCard>
    );
}
