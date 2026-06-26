"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Activity, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAIRA } from "@/lib/aira-provider";

interface RightPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RightPanel({ isOpen, onClose }: RightPanelProps) {
    const { incidents, agents, logs } = useAIRA();

    // Get recent activity from logs
    const recentLogs = logs.slice(-10).reverse();

    // Get active alerts
    const activeAlerts = incidents.filter(i => i.status !== "resolved");

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop for mobile */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        className={cn(
                            "fixed right-0 top-0 h-full w-full sm:w-96 bg-background border-l border-border z-50",
                            "flex flex-col shadow-2xl"
                        )}
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
                            <h2 className="text-lg font-display text-primary uppercase tracking-wide">
                                Activity Monitor
                            </h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-8 w-8"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* System Alerts Section */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        Active Alerts
                                    </h3>
                                    <Badge variant="destructive" className="ml-auto text-xs">
                                        {activeAlerts.length}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    {activeAlerts.length === 0 ? (
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/30">
                                            <CheckCircle2 className="h-4 w-4 text-success" />
                                            <span className="text-xs text-muted-foreground">
                                                All systems operational
                                            </span>
                                        </div>
                                    ) : (
                                        activeAlerts.map((incident) => (
                                            <motion.div
                                                key={incident.id}
                                                className={cn(
                                                    "p-3 rounded-lg border backdrop-blur-sm",
                                                    incident.severity === "critical" && "bg-destructive/10 border-destructive/50",
                                                    incident.severity === "high" && "bg-warning/10 border-warning/50",
                                                    incident.severity === "medium" && "bg-primary/10 border-primary/50"
                                                )}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <span className="text-xs font-medium line-clamp-2">
                                                        {incident.title}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "text-[10px] h-5",
                                                            incident.severity === "critical" && "border-destructive text-destructive",
                                                            incident.severity === "high" && "border-warning text-warning"
                                                        )}
                                                    >
                                                        {incident.severity}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        incident.status === "detected" && "bg-destructive animate-pulse",
                                                        incident.status === "analyzing" && "bg-primary animate-pulse",
                                                        incident.status === "remediating" && "bg-warning animate-pulse",
                                                        incident.status === "validating" && "bg-success"
                                                    )} />
                                                    <span className="text-[10px] text-muted-foreground uppercase">
                                                        {incident.status}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Live Activity Feed */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Activity className="h-4 w-4 text-primary" />
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        Live Activity
                                    </h3>
                                </div>

                                <div className="space-y-2">
                                    {recentLogs.length === 0 ? (
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">
                                                No recent activity
                                            </span>
                                        </div>
                                    ) : (
                                        recentLogs.map((log, idx) => (
                                            <motion.div
                                                key={`${log.timestamp}-${idx}`}
                                                className="p-2.5 rounded-lg bg-card/50 border border-border/50"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <div className={cn(
                                                        "w-1 h-1 rounded-full mt-1.5",
                                                        log.level === "error" && "bg-destructive",
                                                        log.level === "warn" && "bg-warning",
                                                        log.level === "info" && "bg-primary",
                                                        log.level === "success" && "bg-success"
                                                    )} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-foreground line-clamp-2 font-mono">
                                                            {log.message}
                                                        </p>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {new Date(log.timestamp).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Agent Status */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Activity className="h-4 w-4 text-success" />
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                        Agent Status
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {agents.map((agent) => (
                                        <div
                                            key={agent.id}
                                            className={cn(
                                                "p-2 rounded-lg border text-center",
                                                agent.status === "active" && "bg-primary/10 border-primary/50",
                                                agent.status === "completed" && "bg-success/10 border-success/50",
                                                agent.status === "idle" && "bg-muted/50 border-border"
                                            )}
                                        >
                                            <div className="text-xs font-medium uppercase mb-1">
                                                {agent.name}
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[10px] h-4",
                                                    agent.status === "active" && "border-primary text-primary",
                                                    agent.status === "completed" && "border-success text-success"
                                                )}
                                            >
                                                {agent.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
