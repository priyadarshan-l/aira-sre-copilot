"use client";

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import DashboardCard from "@/components/dashboard/card";
import { PlannerIcon, RCAIcon, FixerIcon, ValidatorIcon } from "@/components/icons/agents";
import type { Agent, AgentStatus, AgentType } from "@/types/aira";

const agentIcons: Record<AgentType, React.ElementType> = {
  planner: PlannerIcon,
  rca: RCAIcon,
  fixer: FixerIcon,
  validator: ValidatorIcon,
};

const statusLabels: Record<AgentStatus, string> = {
  idle: "STANDBY",
  active: "ACTIVE",
  completed: "DONE",
  failed: "FAILED",
};

interface AgentNodeProps {
  agent: Agent;
  isLast?: boolean;
  index: number;
}

const AgentNode = React.memo(function AgentNode({ agent, isLast, index }: AgentNodeProps) {
  const Icon = agentIcons[agent.id];
  const isActive = agent.status === "active";
  const isCompleted = agent.status === "completed";
  const isFailed = agent.status === "failed";

  return (
    <div className="flex items-center">
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        {/* Agent Circle - Enhanced with dramatic glow */}
        <div className="relative">
          {/* Outer glow rings for active state */}
          {isActive && (
            <>
              <motion.span
                className="absolute inset-[-8px] rounded-full bg-primary/10"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.2, 0.1, 0.2],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.span
                className="absolute inset-[-4px] rounded-full border border-primary/40"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.6, 0.3, 0.6],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </>
          )}

          {/* Main Node Circle */}
          <motion.div
            className={cn(
              "relative size-16 md:size-20 rounded-full border-2 flex items-center justify-center transition-all duration-500",
              isActive && "border-primary bg-primary/20 shadow-[0_0_30px_rgba(0,240,255,0.4)]",
              isCompleted && "border-success bg-success/10",
              isFailed && "border-destructive bg-destructive/10",
              agent.status === "idle" && "border-muted-foreground/30 bg-muted/30"
            )}
            animate={isActive ? {
              boxShadow: [
                "0 0 20px rgba(0,240,255,0.3)",
                "0 0 40px rgba(0,240,255,0.5)",
                "0 0 20px rgba(0,240,255,0.3)",
              ],
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Icon */}
            <Icon
              className={cn(
                "size-6 md:size-8 transition-all duration-300 relative z-10",
                isActive && "text-primary glow-pulse",
                isCompleted && "text-success",
                isFailed && "text-destructive",
                agent.status === "idle" && "text-muted-foreground"
              )}
            />

            {/* Progress ring for active agent */}
            {isActive && (
              <svg className="absolute inset-0 -rotate-90 size-full">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${agent.progress * 2.83} 283`}
                  className="text-primary transition-all duration-500"
                  style={{
                    filter: "drop-shadow(0 0 6px currentColor)",
                  }}
                />
              </svg>
            )}

            {/* Checkmark for completed */}
            {isCompleted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 size-5 rounded-full bg-success flex items-center justify-center"
              >
                <svg className="size-3 text-background" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Agent Name */}
        <span
          className={cn(
            "mt-3 text-xs md:text-sm font-bold tracking-wide",
            isActive && "text-primary",
            isCompleted && "text-success",
            agent.status === "idle" && "text-muted-foreground"
          )}
        >
          {agent.name}
        </span>

        {/* Status Badge */}
        <Badge
          variant="outline"
          className={cn(
            "mt-1 text-[10px] md:text-xs",
            isActive && "border-primary text-primary bg-primary/10",
            isCompleted && "border-success text-success bg-success/10",
            isFailed && "border-destructive text-destructive bg-destructive/10"
          )}
        >
          {statusLabels[agent.status]}
          {isActive && ` ${agent.progress}%`}
        </Badge>
      </motion.div>

      {/* Animated Connector Line */}
      {!isLast && (
        <div className="flex-1 h-[3px] mx-2 md:mx-4 min-w-[30px] md:min-w-[50px] relative overflow-hidden">
          {/* Base line */}
          <div className="absolute inset-0 bg-muted-foreground/20 rounded-full" />

          {/* Completed progress */}
          <motion.div
            className="absolute inset-y-0 left-0 bg-success rounded-full"
            initial={{ width: 0 }}
            animate={{ width: isCompleted ? "100%" : "0%" }}
            transition={{ duration: 0.5 }}
          />

          {/* Active progress with animated glow */}
          {isActive && (
            <motion.div
              className="absolute inset-y-0 left-0 bg-primary rounded-full"
              style={{ width: `${agent.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          )}

          {/* Flowing data particles (Always show flow to active/completed nodes) */}
          {(isActive || isCompleted) && (
            <>
              <div className={cn(
                "absolute h-full w-4 rounded-full top-0",
                isCompleted ? "bg-success" : "bg-primary",
                "animate-[data-flow_1.5s_ease-in-out_infinite]"
              )} />
              <div className={cn(
                "absolute h-full w-4 rounded-full top-0 delay-500",
                isCompleted ? "bg-success" : "bg-primary",
                "animate-[data-flow_1.5s_ease-in-out_infinite_0.5s]"
              )} />
            </>
          )}
        </div>
      )}
    </div>
  );
});

interface AgentPipelineProps {
  agents: Agent[];
  currentIncident?: string;
}

const AgentPipeline = React.memo(function AgentPipeline({ agents, currentIncident }: AgentPipelineProps) {
  const activeAgent = agents.find((a) => a.status === "active");

  return (
    <DashboardCard
      title="NEURAL AGENT PIPELINE"
      intent="default"
      addon={
        activeAgent ? (
          <Badge variant="default" className="bg-primary/20 text-primary border border-primary/30 animate-pulse">
            {activeAgent.name} PROCESSING
          </Badge>
        ) : (
          <Badge variant="outline" className="border-success text-success">
            ALL AGENTS READY
          </Badge>
        )
      }
    >
      <div className="flex flex-col gap-6">
        {/* Pipeline Header */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-primary animate-pulse" />
          <span>PLANNER</span>
          <span className="text-muted-foreground/50">→</span>
          <span>ROOT CAUSE</span>
          <span className="text-muted-foreground/50">→</span>
          <span>FIXER</span>
          <span className="text-muted-foreground/50">→</span>
          <span>VALIDATOR</span>
        </div>

        {/* Pipeline Visualization */}
        <div className="flex items-center justify-between px-2 py-6 overflow-x-auto">
          {agents.map((agent, index) => (
            <AgentNode
              key={agent.id}
              agent={agent}
              isLast={index === agents.length - 1}
              index={index}
            />
          ))}
        </div>

        {/* Current Task Display */}
        {activeAgent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/5 rounded-lg p-4 border border-primary/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <motion.span
                className="size-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-xs text-primary uppercase tracking-wider font-bold">
                Current Task
              </span>
            </div>
            <p className="text-sm font-medium text-foreground">{activeAgent.currentTask}</p>
            {currentIncident && (
              <p className="text-xs text-muted-foreground mt-1">
                Processing Incident: <span className="text-primary font-mono">{currentIncident}</span>
              </p>
            )}
          </motion.div>
        )}
      </div>
    </DashboardCard>
  );
});

export default AgentPipeline;
