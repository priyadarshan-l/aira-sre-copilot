"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAIRA } from "@/lib/aira-provider";

interface TrainingNarratorProps {
    isRunning: boolean;
}

// Narration messages that explain what's happening
const narratorMessages = [
    { text: "Initializing training environment...", type: "system" },
    { text: "Planner agent exploring action space", type: "info" },
    { text: "RCA agent learning root cause patterns", type: "info" },
    { text: "Fixer agent optimizing remediation strategies", type: "info" },
    { text: "Validator agent calibrating success metrics", type: "info" },
    { text: "Episode completed — reward calculated", type: "success" },
    { text: "Policy gradient update applied", type: "update" },
    { text: "Experience replay: sampling past episodes", type: "info" },
    { text: "Agent misclassified root cause — learning...", type: "warning" },
    { text: "Improved resolution path discovered", type: "success" },
    { text: "Q-value convergence improving", type: "update" },
    { text: "Exploration rate annealing: 0.15 → 0.10", type: "system" },
    { text: "Memory buffer optimized — 10,000 experiences", type: "system" },
    { text: "Cross-agent coordination pattern emerging", type: "success" },
];

const typeStyles: Record<string, string> = {
    system: "text-muted-foreground border-border/50",
    info: "text-primary border-primary/30",
    success: "text-success border-success/30",
    update: "text-warning border-warning/30",
    warning: "text-destructive border-destructive/30",
};

export default function TrainingNarrator({ isRunning }: TrainingNarratorProps) {
    const { logs } = useAIRA();

    // Map live WebSocket logs to narrator message structure
    const messages = logs
        .slice(-5)
        .reverse()
        .map((log) => ({
            id: log.id,
            text: log.agent ? `[${log.agent}] ${log.message}` : log.message,
            type: log.level === "info" ? "info" : log.level === "warn" ? "update" : log.level === "error" ? "warning" : log.level === "success" ? "success" : "system"
        }));

    return (
        <div className="relative p-4 rounded-lg bg-card/30 border border-border/30 overflow-hidden">
            {/* Background effect */}
            <div className="absolute inset-0 cyber-grid opacity-20" />

            {/* Header */}
            <div className="relative flex items-center gap-2 mb-3">
                <div className={cn(
                    "size-2 rounded-full",
                    isRunning ? "bg-success animate-pulse" : "bg-muted-foreground"
                )} />
                <span className="text-xs uppercase text-muted-foreground tracking-wider">
                    Training Narrator
                </span>
            </div>

            {/* Messages */}
            <div className="relative min-h-[80px] space-y-2">
                <AnimatePresence mode="popLayout">
                    {messages.map((msg, i) => (
                        <motion.div
                            key={msg.id}
                            layout
                            initial={{ opacity: 0, x: -20, height: 0 }}
                            animate={{ opacity: 1 - (i * 0.2), x: 0, height: "auto" }}
                            exit={{ opacity: 0, x: 20, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className={cn(
                                "text-sm font-mono px-3 py-1.5 rounded border-l-2",
                                typeStyles[msg.type]
                            )}
                        >
                            <span className="opacity-50 mr-2">▸</span>
                            {msg.text}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Empty state */}
                {messages.length === 0 && (
                    <div className="text-sm text-muted-foreground font-mono opacity-50">
                        <span className="opacity-50 mr-2">▸</span>
                        {isRunning ? "Waiting for events..." : "Start training to see narrator"}
                    </div>
                )}
            </div>
        </div>
    );
}
