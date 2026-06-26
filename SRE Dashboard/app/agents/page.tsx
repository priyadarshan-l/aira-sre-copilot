"use client";
import React, { useState, useEffect } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import { DashboardCard } from "@/components/dashboard/card";
import CuteRobotIcon from "@/components/icons/cute-robot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAIRA } from "@/lib/aira-provider";
import { airaMockData } from "@/data/aira-mock";
import {
  PlannerIcon,
  RCAIcon,
  FixerIcon,
  ValidatorIcon,
} from "@/components/icons/agents";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Agent, AgentType } from "@/types/aira";

// Agent icons mapping
const agentIcons: Record<AgentType, React.ElementType> = {
  planner: PlannerIcon,
  rca: RCAIcon,
  fixer: FixerIcon,
  validator: ValidatorIcon,
};

// Agent colors
const agentColors: Record<AgentType, { bg: string; text: string; border: string; glow: string }> = {
  planner: {
    bg: "bg-chart-1/10",
    text: "text-chart-1",
    border: "border-chart-1/30",
    glow: "shadow-chart-1/30",
  },
  rca: {
    bg: "bg-chart-2/10",
    text: "text-chart-2",
    border: "border-chart-2/30",
    glow: "shadow-chart-2/30",
  },
  fixer: {
    bg: "bg-chart-3/10",
    text: "text-chart-3",
    border: "border-chart-3/30",
    glow: "shadow-chart-3/30",
  },
  validator: {
    bg: "bg-chart-5/10",
    text: "text-chart-5",
    border: "border-chart-5/30",
    glow: "shadow-chart-5/30",
  },
};

// Status colors
const statusColors = {
  idle: "bg-muted text-muted-foreground",
  paused: "bg-warning/20 text-warning border border-warning/30 hover:bg-warning/30",
  active: "bg-primary text-primary-foreground",
  completed: "bg-success text-success-foreground",
  failed: "bg-destructive text-destructive-foreground",
};

// Agent descriptions for SRE context
const agentDescriptions: Record<AgentType, {
  role: string;
  capabilities: string[];
  metrics: { successRate: number; avgTime: string; tasksCompleted: number };
}> = {
  planner: {
    role: "Strategic Coordinator",
    capabilities: [
      "Analyzes incident context and severity",
      "Creates step-by-step remediation strategy",
      "Prioritizes actions based on impact",
      "Coordinates with other agents",
    ],
    metrics: { successRate: 98.2, avgTime: "1.2s", tasksCompleted: 1247 },
  },
  rca: {
    role: "Root Cause Analyst",
    capabilities: [
      "Deep log analysis and pattern matching",
      "Queries semantic memory for similar incidents",
      "Correlates metrics across systems",
      "Identifies underlying cause vs symptoms",
    ],
    metrics: { successRate: 94.7, avgTime: "3.8s", tasksCompleted: 1189 },
  },
  fixer: {
    role: "Remediation Executor",
    capabilities: [
      "Executes automated fixes with guardrails",
      "Applies learned solutions from memory",
      "Supports rollback if fix fails",
      "Updates runbooks with new patterns",
    ],
    metrics: { successRate: 91.3, avgTime: "12.4s", tasksCompleted: 1056 },
  },
  validator: {
    role: "Verification Specialist",
    capabilities: [
      "Monitors system health post-fix",
      "Runs automated test suites",
      "Validates metrics return to baseline",
      "Confirms incident resolution",
    ],
    metrics: { successRate: 99.1, avgTime: "5.2s", tasksCompleted: 1198 },
  },
};

// Mock activity feed
const activityFeed = [
  { agent: "planner" as AgentType, action: "Initiated remediation plan for INC-2024-001", time: "2s ago", type: "info" },
  { agent: "rca" as AgentType, action: "Found 3 similar incidents in semantic memory", time: "5s ago", type: "success" },
  { agent: "rca" as AgentType, action: "Root cause identified: Connection pool exhaustion", time: "8s ago", type: "success" },
  { agent: "fixer" as AgentType, action: "Executing fix: Increase pool size to 200", time: "12s ago", type: "warning" },
  { agent: "planner" as AgentType, action: "Escalation threshold check: PASSED", time: "15s ago", type: "info" },
  { agent: "validator" as AgentType, action: "Health check scheduled for T+30s", time: "18s ago", type: "info" },
  { agent: "fixer" as AgentType, action: "Rollback point created: SNAP-847291", time: "22s ago", type: "info" },
  { agent: "rca" as AgentType, action: "Querying prescriptive memory for optimal action", time: "25s ago", type: "info" },
];

// Mock inter-agent messages
const agentMessages = [
  { from: "planner", to: "rca", message: "Analyze incident INC-2024-001", status: "delivered" },
  { from: "rca", to: "planner", message: "Root cause: DB connection pool exhausted", status: "delivered" },
  { from: "planner", to: "fixer", message: "Execute fix: pool_size=200", status: "delivered" },
  { from: "fixer", to: "validator", message: "Fix applied, ready for validation", status: "pending" },
];

function NeuralActivityIndicator({ isActive }: { isActive: boolean }) {
  const [nodes, setNodes] = useState<{ x: number; y: number; active: boolean }[]>([]);

  useEffect(() => {
    // Generate random neural nodes
    const newNodes = Array.from({ length: 12 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      active: Math.random() > 0.5,
    }));
    setNodes(newNodes);

    if (isActive) {
      const interval = setInterval(() => {
        setNodes(prev => prev.map(node => ({
          ...node,
          active: Math.random() > 0.4,
        })));
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  return (
    <div className="relative w-full h-16 bg-background/50 rounded overflow-hidden">
      <svg className="absolute inset-0 w-full h-full">
        {/* Connection lines */}
        {nodes.map((node, i) =>
          nodes.slice(i + 1).map((target, j) => (
            <line
              key={`${i}-${j}`}
              x1={`${node.x}%`}
              y1={`${node.y}%`}
              x2={`${target.x}%`}
              y2={`${target.y}%`}
              className={cn(
                "stroke-border/30 transition-all duration-300",
                node.active && target.active && isActive && "stroke-primary/50"
              )}
              strokeWidth="1"
            />
          ))
        )}
        {/* Nodes */}
        {nodes.map((node, i) => (
          <circle
            key={i}
            cx={`${node.x}%`}
            cy={`${node.y}%`}
            r="3"
            className={cn(
              "transition-all duration-200",
              node.active && isActive ? "fill-primary" : "fill-muted-foreground/30"
            )}
          />
        ))}
      </svg>
      {/* Scanning line */}
      {isActive && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute h-full w-1 bg-gradient-to-b from-transparent via-primary/50 to-transparent animate-[scan-line_2s_linear_infinite]" />
        </div>
      )}
    </div>
  );
}

function AgentCard({
  agent,
  isPaused,
  onTogglePause,
  onViewLogs,
  onViewMetrics,
}: {
  agent: Agent;
  isPaused: boolean;
  onTogglePause: () => void;
  onViewLogs: () => void;
  onViewMetrics: () => void;
}) {
  const IconComponent = agentIcons[agent.id] || CuteRobotIcon;
  const colors = agentColors[agent.id] || {
    bg: "bg-muted/10",
    text: "text-muted-foreground",
    border: "border-muted/30",
    glow: "shadow-muted/30",
  };
  const description = agentDescriptions[agent.id] || {
    role: "Support Agent",
    capabilities: ["Autonomous SRE diagnostics", "Remediation workflows"],
    metrics: { successRate: 100.0, avgTime: "1.0s", tasksCompleted: 100 }
  };
  const status = isPaused ? "paused" : agent.status;
  const isActive = status === "active";

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card overflow-hidden transition-all duration-300",
        isActive && `ring-2 ring-primary shadow-lg ${colors.glow}`,
        !isActive && "border-border/50"
      )}
    >
      {/* Header with status bar */}
      <div className={cn(
        "h-1 w-full",
        isActive ? "bg-primary" : status === "completed" ? "bg-success" : isPaused ? "bg-warning" : "bg-muted"
      )} />

      <div className="p-4 space-y-4">
        {/* Title Row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg border",
              colors.bg, colors.border,
              isActive && "animate-pulse"
            )}>
              <IconComponent className={cn("size-6", colors.text)} />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wide">{agent.name}</h3>
              <span className="text-xs text-muted-foreground">{description.role}</span>
            </div>
          </div>
          <Badge className={cn(statusColors[status as keyof typeof statusColors] || statusColors.idle, "text-[10px]")}>
            {status.toUpperCase()}
          </Badge>
        </div>

        {/* Neural Activity */}
        <div>
          <span className="text-[10px] text-muted-foreground uppercase mb-1 block">
            Neural Activity
          </span>
          <NeuralActivityIndicator isActive={isActive} />
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Task Progress</span>
            <span className="font-mono font-bold">{agent.progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500 rounded-full",
                status === "completed" ? "bg-success" : "bg-primary",
                isActive && "animate-pulse"
              )}
              style={{ width: `${agent.progress}%` }}
            />
          </div>
        </div>

        {/* Current Task */}
        <div className="p-3 rounded bg-accent/30 border border-border/50">
          <span className="text-[10px] text-muted-foreground uppercase block mb-1">
            Current Task
          </span>
          <p className="text-sm font-medium line-clamp-2">
            {agent.currentTask || "Standby mode"}
          </p>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded bg-background/50">
            <span className="text-lg font-bold text-success">{description.metrics.successRate}%</span>
            <span className="text-[9px] text-muted-foreground block">Success</span>
          </div>
          <div className="text-center p-2 rounded bg-background/50">
            <span className="text-lg font-bold text-primary">{description.metrics.avgTime}</span>
            <span className="text-[9px] text-muted-foreground block">Avg Time</span>
          </div>
          <div className="text-center p-2 rounded bg-background/50">
            <span className="text-lg font-bold">{description.metrics.tasksCompleted}</span>
            <span className="text-[9px] text-muted-foreground block">Tasks</span>
          </div>
        </div>

        {/* Capabilities (collapsible) */}
        <details className="group">
          <summary className="text-[10px] text-muted-foreground uppercase cursor-pointer hover:text-foreground flex items-center gap-1">
            <span>Capabilities</span>
            <svg className="size-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </summary>
          <ul className="mt-2 space-y-1">
            {description.capabilities.map((cap, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className={cn("mt-0.5", colors.text)}>•</span>
                {cap}
              </li>
            ))}
          </ul>
        </details>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-border/30">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-[10px] h-8 bg-transparent hover:bg-accent"
            onClick={onViewLogs}
          >
            VIEW LOGS
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-[10px] h-8 bg-transparent hover:bg-accent"
            onClick={onViewMetrics}
          >
            METRICS
          </Button>
          <Button
            variant={isActive ? "destructive" : "default"}
            size="sm"
            className="flex-1 text-[10px] h-8"
            onClick={onTogglePause}
          >
            {isActive ? "PAUSE" : "ACTIVATE"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Generate tailored mock logs for each SRE Agent when no WebSocket logs exist
const getMockLogsForAgent = (agentId: string) => {
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });
  switch (agentId) {
    case "planner":
      return [
        { time: "13:50:02", level: "info", msg: "Initialized Planner Coordinator context..." },
        { time: "13:50:05", level: "info", msg: "Loading system topology map and dependencies..." },
        { time: "13:51:12", level: "info", msg: "Awaiting incoming incident trigger..." },
        { time: "13:51:15", level: "success", msg: "Planner standby heartbeat verified. Ready." }
      ];
    case "rca":
      return [
        { time: "13:50:03", level: "info", msg: "RCA Engine initialized." },
        { time: "13:50:06", level: "info", msg: "Correlating event logs with vector memory vault..." },
        { time: "13:50:10", level: "info", msg: "Standby mode activated. Pattern matching index: active." }
      ];
    case "fixer":
      return [
        { time: "13:50:04", level: "info", msg: "Fixer Executor thread started." },
        { time: "13:50:08", level: "info", msg: "Verifying Ansible runbooks and Kubernetes API permissions..." },
        { time: "13:50:12", level: "success", msg: "RBAC authentication verified. Awaiting fix instructions." }
      ];
    case "validator":
      return [
        { time: "13:50:04", level: "info", msg: "Validator check engine online." },
        { time: "13:50:09", level: "info", msg: "Connecting to Prometheus metrics server at localhost:9090..." },
        { time: "13:50:14", level: "success", msg: "Metrics scraper connected. Baseline health score: 100%." }
      ];
    default:
      return [
        { time: "13:50:00", level: "info", msg: "System thread started." }
      ];
  }
};

export default function AgentsPage() {
  // Get real data from backend
  const { agents: liveAgents, metrics: liveMetrics, isConnected, isLoading, logs, wsStatus } = useAIRA();

  // Fallback to mock data if backend not connected
  const agents = isConnected && liveAgents.length > 0 ? liveAgents : airaMockData.agents;
  const metrics = isConnected && liveMetrics ? liveMetrics : airaMockData.metrics;

  // Real-time interactivity states
  const [pausedAgentIds, setPausedAgentIds] = useState<string[]>([]);
  const [simulatedActiveAgentIds, setSimulatedActiveAgentIds] = useState<string[]>([]);
  const [agentProgresses, setAgentProgresses] = useState<Record<string, number>>({});

  // Synchronize local states with incoming backend/mock data updates when a live incident starts
  useEffect(() => {
    const isLiveRunning = wsStatus?.mode === "running";
    if (isLiveRunning) {
      // Clear local simulated states during a live backend run so that the real workflow is visualized
      setSimulatedActiveAgentIds([]);
      setPausedAgentIds([]);
    }
  }, [wsStatus?.mode]);

  // Simulate progress for active simulated agents
  useEffect(() => {
    const activeSimulatedIds = simulatedActiveAgentIds.filter(
      (id) => !pausedAgentIds.includes(id)
    );

    if (activeSimulatedIds.length === 0) return;

    const timer = setInterval(() => {
      setAgentProgresses((prev) => {
        const next = { ...prev };
        let updated = false;

        activeSimulatedIds.forEach((id) => {
          const currentProgress = next[id] !== undefined ? next[id] : 0;
          if (currentProgress < 100) {
            next[id] = Math.min(currentProgress + Math.floor(Math.random() * 8) + 4, 100);
            updated = true;

            // When simulated progress reaches 100, remove from simulated active (becomes completed)
            if (next[id] === 100) {
              setTimeout(() => {
                setSimulatedActiveAgentIds((prevActive) =>
                  prevActive.filter((activeId) => activeId !== id)
                );
              }, 1000);
            }
          }
        });

        return updated ? next : prev;
      });
    }, 800);

    return () => clearInterval(timer);
  }, [simulatedActiveAgentIds, pausedAgentIds]);

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"logs" | "metrics" | null>(null);

  const handleTogglePause = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;

    const isActive = (agent.status === "active" || simulatedActiveAgentIds.includes(agentId)) && !pausedAgentIds.includes(agentId);

    if (isActive) {
      // Pause it: add to pausedAgentIds
      setPausedAgentIds((prev) => [...prev, agentId]);
    } else {
      // Activate it:
      if (pausedAgentIds.includes(agentId)) {
        // If it was paused, unpause it
        setPausedAgentIds((prev) => prev.filter((id) => id !== agentId));
      } else {
        // If it was idle/completed, start simulated active
        setSimulatedActiveAgentIds((prev) => [...prev, agentId]);
        setAgentProgresses((prev) => ({ ...prev, [agentId]: 0 }));
      }
    }
  };

  const handleViewLogs = (agentId: string) => {
    setSelectedAgentId(agentId);
    setModalType("logs");
  };

  const handleViewMetrics = (agentId: string) => {
    setSelectedAgentId(agentId);
    setModalType("metrics");
  };

  // Resolve final state for rendering (combining backend/mock data with local interactive overrides)
  const resolvedAgents = agents.map((agent) => {
    const isPaused = pausedAgentIds.includes(agent.id);
    const isSimulatedActive = simulatedActiveAgentIds.includes(agent.id);
    
    // Determine resolved status
    let status: any = agent.status;
    if (isPaused) {
      status = "paused";
    } else if (isSimulatedActive) {
      status = "active";
    }

    // Determine resolved progress
    let progress = agent.progress;
    if (isPaused) {
      progress = agentProgresses[agent.id] !== undefined ? agentProgresses[agent.id] : agent.progress;
    } else if (isSimulatedActive) {
      progress = agentProgresses[agent.id] !== undefined ? agentProgresses[agent.id] : 0;
    } else if (status === "completed") {
      progress = 100;
    } else if (status === "idle") {
      progress = 0;
    }

    // Resolve current task description dynamically
    let currentTask = agent.currentTask;
    if (isPaused) {
      currentTask = "Agent paused by administrator";
    } else if (isSimulatedActive) {
      const tasksMap: Record<string, string> = {
        planner: "Analyzing SRE alert payload and coordinating remediation path...",
        rca: "Performing semantic search on memory vault and parsing database connection logs...",
        fixer: "Executing runbook fix: adjusting connection pool parameters...",
        validator: "Polling health metrics and validating TCP socket availability...",
      };
      currentTask = tasksMap[agent.id] || "Processing...";
    } else if (status === "idle") {
      currentTask = "Standby mode - Awaiting incident signal";
    } else if (status === "completed") {
      currentTask = "Remediation sequence component completed successfully.";
    }

    return {
      ...agent,
      status,
      progress,
      currentTask,
    };
  });

  const activeAgents = resolvedAgents.filter((a) => a.status === "active").length;
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);

  // Convert logs to activity feed format
  const activityFeed = logs.slice(-8).reverse().map((log, i) => ({
    agent: (log.agent?.toLowerCase() || "planner") as AgentType,
    action: log.message,
    time: log.timestamp,
    type: log.level === "success" ? "success" : log.level === "warn" ? "warning" : "info" as "success" | "warning" | "info",
  }));

  return (
    <DashboardPageLayout
      header={{
        title: "AGENT TEAMS",
        description: `${activeAgents}/${resolvedAgents.length} Agents Active`,
        icon: CuteRobotIcon,
      }}
    >
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Agents", value: resolvedAgents.length, color: "text-foreground" },
          { label: "Active Now", value: activeAgents, color: "text-success" },
          { label: "Success Rate", value: `${Number(metrics.successRate).toFixed(1)}%`, color: "text-primary" },
          { label: "Avg MTTR", value: `${Number(metrics.avgMTTR).toFixed(2)}m`, color: "text-chart-3" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-lg bg-card border border-border/50">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</span>
            <p className={cn("text-3xl font-display", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Agent Cards - Takes 2 columns */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {resolvedAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isPaused={pausedAgentIds.includes(agent.id)}
              onTogglePause={() => handleTogglePause(agent.id)}
              onViewLogs={() => handleViewLogs(agent.id)}
              onViewMetrics={() => handleViewMetrics(agent.id)}
            />
          ))}
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Live Activity Feed */}
          <DashboardCard header={{ title: "LIVE ACTIVITY", icon: CuteRobotIcon }}>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {activityFeed.map((activity, i) => {
                const IconComponent = agentIcons[activity.agent] || CuteRobotIcon;
                const colors = agentColors[activity.agent] || {
                  bg: "bg-muted/10",
                  text: "text-muted-foreground",
                  border: "border-muted/30",
                  glow: "shadow-muted/30",
                };
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-3 p-2 rounded-lg border border-border/30 bg-background/50",
                      i === 0 && "ring-1 ring-primary/30 bg-primary/5"
                    )}
                  >
                    <div className={cn("p-1.5 rounded", colors.bg)}>
                      <IconComponent className={cn("size-4", colors.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs line-clamp-2">{activity.action}</p>
                      <span className="text-[10px] text-muted-foreground">{activity.time}</span>
                    </div>
                    <div className={cn(
                      "size-2 rounded-full mt-1.5",
                      activity.type === "success" && "bg-success",
                      activity.type === "warning" && "bg-warning",
                      activity.type === "info" && "bg-primary",
                    )} />
                  </div>
                );
              })}
            </div>
          </DashboardCard>

          {/* Inter-Agent Communication */}
          <DashboardCard header={{ title: "AGENT PROTOCOL", icon: CuteRobotIcon }}>
            <div className="space-y-3">
              {agentMessages.map((msg, i) => {
                const FromIcon = agentIcons[msg.from as AgentType] || CuteRobotIcon;
                const ToIcon = agentIcons[msg.to as AgentType] || CuteRobotIcon;
                const fromColors = agentColors[msg.from as AgentType] || {
                  bg: "bg-muted/10",
                  text: "text-muted-foreground",
                  border: "border-muted/30",
                  glow: "shadow-muted/30",
                };
                const toColors = agentColors[msg.to as AgentType] || {
                  bg: "bg-muted/10",
                  text: "text-muted-foreground",
                  border: "border-muted/30",
                  glow: "shadow-muted/30",
                };

                return (
                  <div
                    key={i}
                    className={cn(
                      "p-3 rounded-lg border border-border/30 bg-background/50 cursor-pointer transition-all hover:border-primary/30",
                      selectedMessage === i && "ring-1 ring-primary"
                    )}
                    onClick={() => setSelectedMessage(selectedMessage === i ? null : i)}
                  >
                    {/* Message Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn("p-1 rounded", fromColors.bg)}>
                        <FromIcon className={cn("size-3", fromColors.text)} />
                      </div>
                      <svg className="size-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <div className={cn("p-1 rounded", toColors.bg)}>
                        <ToIcon className={cn("size-3", toColors.text)} />
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "ml-auto text-[9px]",
                          msg.status === "delivered" ? "border-success/30 text-success" : "border-warning/30 text-warning"
                        )}
                      >
                        {msg.status.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Message Content */}
                    <p className="text-xs font-mono bg-accent/30 p-2 rounded">{msg.message}</p>
                  </div>
                );
              })}
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* Pipeline Flow Visualization */}
      <DashboardCard header={{ title: "NEURAL AGENT PIPELINE", icon: CuteRobotIcon }}>
        <div className="relative py-8">
          {/* Background grid */}
          <div className="absolute inset-0 cyber-grid opacity-30" />

          {/* Pipeline */}
          <div className="relative flex items-center justify-between max-w-4xl mx-auto">
            {resolvedAgents.map((agent, index) => {
              const IconComponent = agentIcons[agent.id] || CuteRobotIcon;
              const colors = agentColors[agent.id] || {
                bg: "bg-muted/10",
                text: "text-muted-foreground",
                border: "border-muted/30",
                glow: "shadow-muted/30",
              };
              const isActive = agent.status === "active";
              const isCompleted = agent.status === "completed";

              return (
                <React.Fragment key={agent.id}>
                  {/* Agent Node */}
                  <div className="relative flex flex-col items-center">
                    {/* Glow effect for active */}
                    {isActive && (
                      <div className="absolute inset-0 -m-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
                    )}

                    <div
                      className={cn(
                        "relative flex flex-col items-center gap-3 p-4 md:p-6 rounded-xl border-2 transition-all duration-300 bg-card",
                        isActive && "border-primary shadow-lg shadow-primary/30 scale-110 z-10",
                        isCompleted && "border-success/50",
                        !isActive && !isCompleted && "border-border/30"
                      )}
                    >
                      <div className={cn(
                        "p-3 rounded-lg border",
                        isActive ? "bg-primary/20 border-primary/50" : colors.bg + " " + colors.border
                      )}>
                        <IconComponent
                          className={cn(
                            "size-8 md:size-10",
                            isActive ? "text-primary" : isCompleted ? "text-success" : colors.text
                          )}
                        />
                      </div>
                      <span className="text-xs md:text-sm font-bold uppercase tracking-wide">
                        {agent.name}
                      </span>
                      <Badge
                        className={cn(
                          statusColors[agent.status as keyof typeof statusColors] || statusColors.idle,
                          "text-[9px] md:text-[10px]",
                          isActive && "animate-pulse"
                        )}
                      >
                        {agent.status.toUpperCase()}
                      </Badge>

                      {/* Progress ring for active */}
                      {isActive && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                          <div className="text-[10px] font-mono text-primary font-bold bg-background px-2 py-0.5 rounded-full border border-primary/30">
                            {agent.progress}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connector */}
                  {index < resolvedAgents.length - 1 && (
                    <div className="flex-1 flex items-center justify-center mx-2 md:mx-4">
                      <div className="relative w-full h-8 flex items-center">
                        {/* Base line */}
                        <div className={cn(
                          "absolute inset-x-0 h-0.5 top-1/2 -translate-y-1/2",
                          isCompleted ? "bg-success" : "bg-border"
                        )} />

                        {/* Animated flow particles */}
                        {(isActive || isCompleted) && (
                          <>
                            <div className={cn(
                              "absolute h-1.5 w-4 rounded-full top-1/2 -translate-y-1/2",
                              isCompleted ? "bg-success" : "bg-primary",
                              "animate-[data-flow_1.5s_ease-in-out_infinite]"
                            )} />
                            <div className={cn(
                              "absolute h-1.5 w-4 rounded-full top-1/2 -translate-y-1/2 delay-500",
                              isCompleted ? "bg-success" : "bg-primary",
                              "animate-[data-flow_1.5s_ease-in-out_infinite_0.5s]"
                            )} />
                          </>
                        )}

                        {/* Arrow */}
                        <div
                          className={cn(
                            "absolute right-0 w-0 h-0 border-t-[6px] border-b-[6px] border-l-[10px] border-transparent",
                            isCompleted ? "border-l-success" : isActive ? "border-l-primary" : "border-l-border"
                          )}
                        />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </DashboardCard>

      {/* Dialog Modals */}
      <Dialog open={!!modalType} onOpenChange={() => setModalType(null)}>
        <DialogContent className="max-w-2xl bg-card border border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="uppercase font-display tracking-wide text-primary">
              {modalType === "logs" ? `Live Logs: ${selectedAgentId?.toUpperCase()}` : `Telemetry Metrics: ${selectedAgentId?.toUpperCase()}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground uppercase">
              {modalType === "logs" ? "Real-time telemetry and task history logs" : "Core agent performance indexes"}
            </DialogDescription>
          </DialogHeader>

          {modalType === "logs" ? (
            <div className="bg-accent/40 rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-[400px] border border-border/30 space-y-1">
              {logs.filter(l => l.agent?.toLowerCase() === selectedAgentId?.toLowerCase()).length > 0 ? (
                logs
                  .filter(l => l.agent?.toLowerCase() === selectedAgentId?.toLowerCase())
                  .map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-muted-foreground shrink-0">[{log.timestamp}]</span>
                      <span className={cn(
                        log.level === "error" && "text-destructive",
                        log.level === "warn" && "text-warning",
                        log.level === "success" && "text-success",
                        log.level === "info" && "text-primary"
                      )}>
                        {log.message}
                      </span>
                    </div>
                  ))
              ) : selectedAgentId ? (
                getMockLogsForAgent(selectedAgentId).map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-muted-foreground shrink-0">[{log.time}]</span>
                    <span className={cn(
                      log.level === "error" && "text-destructive",
                      log.level === "warn" && "text-warning",
                      log.level === "success" && "text-success",
                      log.level === "info" && "text-primary"
                    )}>
                      {log.msg}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground">No logs available</div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="p-4 rounded-lg bg-accent/30 border border-border/30">
                <span className="text-[10px] text-muted-foreground uppercase block mb-1">Execution Accuracy</span>
                <p className="text-2xl font-bold font-mono text-success">
                  {selectedAgentId === "planner" ? "98.2%" : selectedAgentId === "rca" ? "94.7%" : selectedAgentId === "fixer" ? "91.3%" : "99.1%"}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/30 border border-border/30">
                <span className="text-[10px] text-muted-foreground uppercase block mb-1">Average Response Time</span>
                <p className="text-2xl font-bold font-mono text-primary">
                  {selectedAgentId === "planner" ? "1.2s" : selectedAgentId === "rca" ? "3.8s" : selectedAgentId === "fixer" ? "12.4s" : "5.2s"}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/30 border border-border/30">
                <span className="text-[10px] text-muted-foreground uppercase block mb-1">Decisions / Episodes</span>
                <p className="text-2xl font-bold font-mono">
                  {selectedAgentId === "planner" ? "1,247" : selectedAgentId === "rca" ? "1,189" : selectedAgentId === "fixer" ? "1,056" : "1,198"}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/30 border border-border/30">
                <span className="text-[10px] text-muted-foreground uppercase block mb-1">SRE Model Mode</span>
                <p className="text-sm font-semibold uppercase text-primary mt-1">
                  {selectedAgentId === "fixer" ? "Tabular Q-Learning + DQN + PPO" : "Groq Llama-3.3-70b"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardPageLayout>
  );
}
