"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardCard } from "@/components/dashboard/card";
import { cn } from "@/lib/utils";
import {
    PlannerIcon,
    RCAIcon,
    FixerIcon,
    ValidatorIcon
} from "@/components/icons/agents";
import { useAIRA } from "@/lib/aira-provider";

interface AgentCoreGridProps {
    isRunning: boolean;
}

// Agent states during training
type AgentState = "idle" | "learning" | "updated" | "failed";

interface AgentCore {
    id: string;
    name: string;
    icon: React.ElementType;
    state: AgentState;
    reward: number;
    episodes: number;
    color: string;
}

const initialAgents: AgentCore[] = [
    { id: "planner", name: "Planner", icon: PlannerIcon, state: "idle", reward: 0, episodes: 0, color: "cyan" },
    { id: "rca", name: "RCA", icon: RCAIcon, state: "idle", reward: 0, episodes: 0, color: "yellow" },
    { id: "fixer", name: "Fixer", icon: FixerIcon, state: "idle", reward: 0, episodes: 0, color: "green" },
    { id: "validator", name: "Validator", icon: ValidatorIcon, state: "idle", reward: 0, episodes: 0, color: "purple" },
];

// State-based colors
const stateColors: Record<AgentState, string> = {
    idle: "border-border/50 bg-card/30",
    learning: "border-primary/70 bg-primary/10 shadow-[0_0_30px_rgba(0,240,255,0.3)]",
    updated: "border-success/70 bg-success/10 shadow-[0_0_30px_rgba(74,222,128,0.4)]",
    failed: "border-destructive/70 bg-destructive/10 shadow-[0_0_20px_rgba(239,68,68,0.3)]",
};

// State-based energy core animations
const coreAnimations: Record<AgentState, object> = {
    idle: { scale: 1, opacity: 0.5 },
    learning: {
        scale: [1, 1.2, 1],
        opacity: [0.6, 1, 0.6],
        transition: { duration: 0.8, repeat: Infinity }
    },
    updated: {
        scale: [1, 1.5, 1],
        opacity: 1,
        transition: { duration: 0.4 }
    },
    failed: {
        scale: [1, 0.9, 1],
        opacity: [0.5, 0.8, 0.5],
        transition: { duration: 0.3, repeat: 3 }
    },
};

function AgentCoreCard({ agent, isRunning }: { agent: AgentCore; isRunning: boolean }) {
    const Icon = agent.icon;

    return (
        <motion.div
            layout
            className={cn(
                "relative p-6 rounded-xl border-2 transition-all duration-500",
                stateColors[agent.state]
            )}
        >
            {/* Energy Core - The abstract representation */}
            <div className="flex flex-col items-center gap-4">
                {/* Pulsing energy ring */}
                <div className="relative">
                    {/* Outer ring */}
                    <motion.div
                        className={cn(
                            "absolute inset-0 rounded-full border-2",
                            agent.state === "learning" && "border-primary",
                            agent.state === "updated" && "border-success",
                            agent.state === "failed" && "border-destructive",
                            agent.state === "idle" && "border-border/30"
                        )}
                        animate={agent.state !== "idle" ? {
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 0, 0.5]
                        } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />

                    {/* Core icon container */}
                    <motion.div
                        className={cn(
                            "relative size-20 rounded-full flex items-center justify-center",
                            "bg-gradient-to-br",
                            agent.state === "idle" && "from-muted/50 to-muted/30",
                            agent.state === "learning" && "from-primary/30 to-primary/10",
                            agent.state === "updated" && "from-success/30 to-success/10",
                            agent.state === "failed" && "from-destructive/30 to-destructive/10"
                        )}
                        animate={coreAnimations[agent.state]}
                    >
                        <Icon className={cn(
                            "size-10",
                            agent.state === "idle" && "text-muted-foreground",
                            agent.state === "learning" && "text-primary",
                            agent.state === "updated" && "text-success",
                            agent.state === "failed" && "text-destructive"
                        )} />
                    </motion.div>
                </div>

                {/* Agent name */}
                <div className="text-center">
                    <h3 className="font-bold uppercase tracking-wide">{agent.name}</h3>
                    <p className={cn(
                        "text-xs uppercase",
                        agent.state === "idle" && "text-muted-foreground",
                        agent.state === "learning" && "text-primary",
                        agent.state === "updated" && "text-success",
                        agent.state === "failed" && "text-destructive"
                    )}>
                        {agent.state === "idle" && "Standby"}
                        {agent.state === "learning" && "Learning..."}
                        {agent.state === "updated" && "Policy Updated!"}
                        {agent.state === "failed" && "Retry..."}
                    </p>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-xs text-muted-foreground">
                    <div className="text-center">
                        <p className="font-mono text-lg text-foreground">{agent.episodes}</p>
                        <p className="uppercase">Episodes</p>
                    </div>
                    <div className="text-center">
                        <p className={cn(
                            "font-mono text-lg",
                            agent.reward > 0 ? "text-success" : agent.reward < 0 ? "text-destructive" : "text-foreground"
                        )}>
                            {agent.reward > 0 ? "+" : ""}{agent.reward.toFixed(1)}
                        </p>
                        <p className="uppercase">Reward</p>
                    </div>
                </div>
            </div>

            {/* Reward pulse effect */}
            <AnimatePresence>
                {agent.state === "updated" && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 1 }}
                        animate={{ scale: 2, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-xl border-2 border-success"
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function AgentCoreGrid({ isRunning }: AgentCoreGridProps) {
    const { agentPipeline, kpi } = useAIRA();

    // Map pipeline statuses to AgentStates
    const mapPipelineToState = (pipelineState: string): AgentState => {
        if (pipelineState === "active") return "learning";
        if (pipelineState === "completed") return "updated";
        if (pipelineState === "failed") return "failed";
        return "idle";
    };

    const episodesTotal = kpi?.total_incidents || 0;
    const successRate = kpi?.success_rate || 0;

    // Calculate reward values dynamically matching the converged policy success rate
    const calculateReward = (agentId: string) => {
        if (episodesTotal === 0) return 0;
        const base = successRate / 100;
        switch (agentId) {
            case "planner":
                return base * 12.6;
            case "rca":
                return base * 11.6;
            case "fixer":
                return base * 11.6;
            case "validator":
                return base * 16.0;
            default:
                return 0;
        }
    };

    const agents: AgentCore[] = [
        {
            id: "planner",
            name: "Planner",
            icon: PlannerIcon,
            state: mapPipelineToState(agentPipeline.planner),
            reward: calculateReward("planner"),
            episodes: episodesTotal,
            color: "cyan"
        },
        {
            id: "rca",
            name: "RCA",
            icon: RCAIcon,
            state: mapPipelineToState(agentPipeline.rca),
            reward: calculateReward("rca"),
            episodes: episodesTotal,
            color: "yellow"
        },
        {
            id: "fixer",
            name: "Fixer",
            icon: FixerIcon,
            state: mapPipelineToState(agentPipeline.fixer),
            reward: calculateReward("fixer"),
            episodes: episodesTotal,
            color: "green"
        },
        {
            id: "validator",
            name: "Validator",
            icon: ValidatorIcon,
            state: mapPipelineToState(agentPipeline.validator),
            reward: calculateReward("validator"),
            episodes: episodesTotal,
            color: "purple"
        }
    ];

    return (
        <DashboardCard
            header={{
                title: "AGENT CORES",
                icon: PlannerIcon,
            }}
            addon={
                <span className={cn(
                    "text-xs uppercase",
                    isRunning ? "text-success animate-pulse" : "text-muted-foreground"
                )}>
                    {isRunning ? "Training Active" : "Standby"}
                </span>
            }
        >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {agents.map(agent => (
                    <AgentCoreCard
                        key={agent.id}
                        agent={agent}
                        isRunning={isRunning}
                    />
                ))}
            </div>
        </DashboardCard>
    );
}
