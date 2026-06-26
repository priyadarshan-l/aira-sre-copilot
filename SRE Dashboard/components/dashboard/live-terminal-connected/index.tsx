"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import DashboardCard from "@/components/dashboard/card";
import { useAIRA } from "@/lib/aira-provider";
import { useSimulation } from "@/lib/simulation-context";
import type { AIRALog } from "@/hooks/use-aira-socket";

const levelColors: Record<AIRALog["level"], string> = {
    info: "text-primary",
    warn: "text-warning",
    error: "text-destructive",
    success: "text-success",
    debug: "text-muted-foreground",
};

const levelLabels: Record<AIRALog["level"], string> = {
    info: "INFO",
    warn: "WARN",
    error: "ERRO",
    success: "DONE",
    debug: "DEBG",
};

export default function LiveTerminalConnected() {
    const { logs, wsStatus, isConnected } = useAIRA();
    const { isSimulation } = useSimulation();
    const terminalRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    // Determine status indicator
    const getStatusIndicator = () => {
        if (!isConnected) return { color: "bg-destructive", text: "DISCONNECTED" };
        if (wsStatus.mode === "running") return { color: "bg-warning animate-pulse", text: "PROCESSING" };
        if (wsStatus.mode === "complete") return { color: "bg-success", text: "READY" };
        return { color: "bg-success", text: "LIVE" };
    };

    const status = getStatusIndicator();

    return (
        <DashboardCard
            title="LIVE TERMINAL"
            intent="default"
            addon={
                <div className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", status.color)} />
                    <span className="text-xs text-muted-foreground uppercase">
                        {isSimulation ? "SIMULATION" : status.text}
                    </span>
                </div>
            }
        >
            <div
                ref={terminalRef}
                className="bg-background/50 rounded-lg border border-border p-4 font-mono text-xs h-64 overflow-y-auto space-y-1"
            >
                {/* Connection status */}
                {!isConnected && (
                    <div className="text-center text-muted-foreground py-8">
                        <div className="text-destructive mb-2">● Not Connected</div>
                        <div className="text-xs">Waiting for backend connection...</div>
                    </div>
                )}

                {/* Rendered Logs */}
                <AnimatePresence mode="popLayout">
                    {logs.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex gap-2"
                        >
                            <span className="text-muted-foreground/50 shrink-0">
                                {log.timestamp}
                            </span>
                            <span className={cn("shrink-0 font-bold", levelColors[log.level])}>
                                [{levelLabels[log.level]}]
                            </span>
                            {log.agent && (
                                <span className="text-primary shrink-0">
                                    [{log.agent}]
                                </span>
                            )}
                            <span className="text-foreground/90">
                                {log.message}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Processing indicator */}
                {wsStatus.mode === "running" && (
                    <div className="flex gap-2 text-primary">
                        <span className="animate-pulse">▶</span>
                        <span>{wsStatus.currentAgent?.toUpperCase()} processing...</span>
                        <span className="terminal-cursor">|</span>
                    </div>
                )}

                {/* Empty state cursor */}
                {logs.length === 0 && isConnected && wsStatus.mode !== "running" && (
                    <div className="flex gap-2 text-muted-foreground">
                        <span>&gt;</span>
                        <span>Waiting for incident...</span>
                        <span className="terminal-cursor animate-pulse">_</span>
                    </div>
                )}
            </div>
        </DashboardCard>
    );
}
