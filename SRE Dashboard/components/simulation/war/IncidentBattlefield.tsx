"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAIRA } from "@/lib/aira-provider";
import { cn } from "@/lib/utils";
import { ShieldCheck, Crosshair, Zap, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { IncidentStatus } from "@/types/aira";

// Status-specific configurations
const statusConfig: Record<IncidentStatus, {
    color: string;
    borderColor: string;
    glowColor: string;
    label: string;
    icon: typeof Zap;
    healthWidth: string;
}> = {
    detected: {
        color: "text-destructive",
        borderColor: "border-destructive",
        glowColor: "rgba(239,68,68,0.6)",
        label: "INCIDENT DETECTED",
        icon: AlertTriangle,
        healthWidth: "100%"
    },
    analyzing: {
        color: "text-primary",
        borderColor: "border-primary",
        glowColor: "rgba(59,130,246,0.6)",
        label: "ANALYZING THREAT",
        icon: Crosshair,
        healthWidth: "85%"
    },
    remediating: {
        color: "text-warning",
        borderColor: "border-warning",
        glowColor: "rgba(245,158,11,0.6)",
        label: "UNDER ATTACK",
        icon: Zap,
        healthWidth: "50%"
    },
    validating: {
        color: "text-success",
        borderColor: "border-success",
        glowColor: "rgba(34,197,94,0.6)",
        label: "VALIDATING DEFENSE",
        icon: ShieldCheck,
        healthWidth: "20%"
    },
    resolved: {
        color: "text-success",
        borderColor: "border-success",
        glowColor: "rgba(34,197,94,0.8)",
        label: "INCIDENT RESOLVED",
        icon: CheckCircle2,
        healthWidth: "0%"
    },
    failed: {
        color: "text-destructive",
        borderColor: "border-destructive",
        glowColor: "rgba(239,68,68,0.8)",
        label: "DEFENSE FAILED",
        icon: AlertTriangle,
        healthWidth: "100%"
    }
};

export default function IncidentBattlefield() {
    const { agents, incidents } = useAIRA();

    const activeIncident = incidents.find(i => i.status !== "resolved");
    const config = activeIncident ? statusConfig[activeIncident.status] : null;
    const IncidentIcon = config?.icon || AlertTriangle;

    return (
        <div className="relative w-full h-[400px] bg-black/90 rounded-xl overflow-hidden border border-border/50 flex items-center justify-center">
            {/* Background Grid Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            <AnimatePresence mode="wait">
                {activeIncident && config ? (
                    <motion.div
                        key={`battle-${activeIncident.status}`}
                        className="relative w-full h-full flex items-center justify-between px-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* THE ENEMY (Incident) */}
                        <motion.div className="relative flex flex-col items-center">
                            <motion.div
                                className={cn(
                                    "w-24 h-24 rounded-full bg-opacity-20 border-4 flex items-center justify-center relative z-10",
                                    activeIncident.status === "detected" && "bg-destructive/20 border-destructive",
                                    activeIncident.status === "analyzing" && "bg-primary/20 border-primary",
                                    activeIncident.status === "remediating" && "bg-warning/20 border-warning",
                                    activeIncident.status === "validating" && "bg-success/20 border-success"
                                )}
                                animate={{
                                    scale: activeIncident.status === "detected" ? [1, 1.15, 1] : [1, 1.05, 1],
                                    boxShadow: [
                                        `0 0 20px ${config.glowColor}`,
                                        `0 0 50px ${config.glowColor}`,
                                        `0 0 20px ${config.glowColor}`
                                    ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <IncidentIcon className={cn("size-10", config.color)} />
                            </motion.div>

                            <div className="mt-4 text-center">
                                <div className={cn("font-bold text-lg", config.color)}>{config.label}</div>
                                <div className="text-xs text-muted-foreground uppercase mt-1">{activeIncident.title.slice(0, 25)}...</div>
                                <div className={cn("text-[10px] uppercase font-mono mt-1", config.color)}>
                                    {activeIncident.severity} • {activeIncident.id}
                                </div>
                            </div>

                            {/* Health Bar */}
                            <div className="w-32 h-2.5 bg-muted rounded-full mt-3 overflow-hidden border border-border/50">
                                <motion.div
                                    className={cn(
                                        "h-full",
                                        activeIncident.status === "detected" && "bg-destructive",
                                        activeIncident.status === "analyzing" && "bg-primary",
                                        activeIncident.status === "remediating" && "bg-warning",
                                        activeIncident.status === "validating" && "bg-success"
                                    )}
                                    initial={{ width: "100%" }}
                                    animate={{ width: config.healthWidth }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                />
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                                Threat Level
                            </div>
                        </motion.div>

                        {/* VS */}
                        <div className="text-4xl font-black text-muted-foreground/20 italic">VS</div>

                        {/* THE HEROES (Agents) */}
                        <div className="flex flex-col gap-4">
                            {agents.map((agent, i) => (
                                <motion.div
                                    key={agent.id}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg border backdrop-blur-sm w-64 relative",
                                        agent.status === "active" && "bg-primary/10 border-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]",
                                        agent.status === "completed" && "bg-success/10 border-success/50",
                                        agent.status === "idle" && "bg-card/50 border-border opacity-50"
                                    )}
                                    initial={{ x: 50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center",
                                        agent.status === "active" && "bg-primary text-primary-foreground animate-pulse",
                                        agent.status === "completed" && "bg-success text-success-foreground",
                                        agent.status === "idle" && "bg-muted text-muted-foreground"
                                    )}>
                                        {agent.id === "planner" && <Activity className="size-5" />}
                                        {agent.id === "rca" && <Crosshair className="size-5" />}
                                        {agent.id === "fixer" && <Zap className="size-5" />}
                                        {agent.id === "validator" && <ShieldCheck className="size-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm uppercase tracking-wide">{agent.name}</div>
                                        <div className="text-[10px] text-muted-foreground line-clamp-1">
                                            {agent.status === "active" ? (agent.currentTask || "Processing...") : agent.status}
                                        </div>
                                    </div>

                                    {/* Action Beam for Active Agents */}
                                    {agent.status === "active" && (
                                        <>
                                            <motion.div
                                                className="absolute right-full top-1/2 h-0.5 bg-primary w-[100px] origin-right"
                                                initial={{ scaleX: 0, opacity: 0 }}
                                                animate={{ scaleX: 1, opacity: 1 }}
                                                transition={{ duration: 0.5 }}
                                            />
                                            <motion.div
                                                className="absolute right-full top-1/2 size-2 bg-primary rounded-full"
                                                animate={{
                                                    x: [-5, -105],
                                                    opacity: [1, 0]
                                                }}
                                                transition={{
                                                    duration: 1.5,
                                                    repeat: Infinity,
                                                    ease: "linear"
                                                }}
                                            />
                                        </>
                                    )}

                                    {/* Checkmark for Completed Agents */}
                                    {agent.status === "completed" && (
                                        <CheckCircle2 className="size-4 text-success" />
                                    )}
                                </motion.div>
                            ))}
                        </div>

                    </motion.div>
                ) : (
                    <motion.div
                        key="peace"
                        className="flex flex-col items-center justify-center text-muted-foreground"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                                opacity: [0.3, 0.5, 0.3]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <ShieldCheck className="size-20 mb-4 text-success" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-success/70">SYSTEM SECURE</h2>
                        <p className="text-sm mt-2">No active threats detected. Monitoring systems...</p>
                        <div className="flex items-center gap-2 mt-4">
                            <div className="size-2 rounded-full bg-success animate-pulse" />
                            <span className="text-xs text-muted-foreground uppercase">Active Monitoring</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
