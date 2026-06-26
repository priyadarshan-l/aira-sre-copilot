"use client";

import React from "react"

import DashboardPageLayout from "@/components/dashboard/layout";
import { DashboardCard } from "@/components/dashboard/card";
import { NetworkIcon } from "@/components/icons/agents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

// Simulated terminal logs
const initialLogs = [
  { timestamp: "14:32:01", level: "INFO", agent: "SYSTEM", message: "AIRA Console initialized" },
  { timestamp: "14:32:01", level: "INFO", agent: "SYSTEM", message: "Connected to backend services" },
  { timestamp: "14:32:02", level: "INFO", agent: "PLANNER", message: "Agent online - Ready for incident assignment" },
  { timestamp: "14:32:02", level: "INFO", agent: "RCA", message: "Agent online - Diagnostic engine loaded" },
  { timestamp: "14:32:02", level: "INFO", agent: "FIXER", message: "Agent online - Remediation playbooks loaded (47)" },
  { timestamp: "14:32:02", level: "INFO", agent: "VALIDATOR", message: "Agent online - Health check routines ready" },
  { timestamp: "14:32:05", level: "INFO", agent: "SYSTEM", message: "All agents operational - System ready" },
];

const simulatedNewLogs = [
  { level: "WARN", agent: "MONITOR", message: "Elevated CPU usage detected on prod-api-3" },
  { level: "INFO", agent: "PLANNER", message: "Analyzing incident pattern..." },
  { level: "INFO", agent: "PLANNER", message: "Incident classified: PERFORMANCE_DEGRADATION" },
  { level: "INFO", agent: "RCA", message: "Querying semantic memory for similar patterns..." },
  { level: "INFO", agent: "RCA", message: "Found 3 similar incidents with 89% avg match" },
  { level: "INFO", agent: "RCA", message: "Root cause identified: Memory leak in auth-service" },
  { level: "INFO", agent: "FIXER", message: "Consulting prescriptive memory for optimal action..." },
  { level: "INFO", agent: "FIXER", message: "Selected action: ROLLING_RESTART (confidence: 94%)" },
  { level: "INFO", agent: "FIXER", message: "Executing remediation playbook #23..." },
  { level: "INFO", agent: "FIXER", message: "Pod auth-service-7d4f8 restarting..." },
  { level: "INFO", agent: "FIXER", message: "Pod auth-service-9b2c1 restarting..." },
  { level: "SUCCESS", agent: "VALIDATOR", message: "Health check passed - CPU normalized" },
  { level: "SUCCESS", agent: "VALIDATOR", message: "Latency within acceptable range" },
  { level: "SUCCESS", agent: "SYSTEM", message: "Incident INC-2024-1847 resolved successfully" },
];

const levelColors: Record<string, string> = {
  INFO: "text-foreground/70",
  WARN: "text-warning",
  ERROR: "text-destructive",
  SUCCESS: "text-success",
  DEBUG: "text-muted-foreground",
};

const agentColors: Record<string, string> = {
  SYSTEM: "text-muted-foreground",
  PLANNER: "text-primary",
  RCA: "text-chart-5",
  FIXER: "text-chart-3",
  VALIDATOR: "text-success",
  MONITOR: "text-warning",
};

export default function ConsolePage() {
  const [logs, setLogs] = useState(initialLogs);
  const [isStreaming, setIsStreaming] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [commandInput, setCommandInput] = useState("");
  const terminalRef = useRef<HTMLDivElement>(null);
  const logIndexRef = useRef(0);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Simulate streaming logs
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      if (logIndexRef.current >= simulatedNewLogs.length) {
        logIndexRef.current = 0;
      }

      const newLog = simulatedNewLogs[logIndexRef.current];
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

      setLogs((prev) => [...prev.slice(-100), { ...newLog, timestamp }]);
      logIndexRef.current++;
    }, 1500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && commandInput.trim()) {
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      
      setLogs((prev) => [
        ...prev,
        { timestamp, level: "DEBUG", agent: "USER", message: `$ ${commandInput}` },
        { timestamp, level: "INFO", agent: "SYSTEM", message: `Command "${commandInput}" sent to backend` },
      ]);
      setCommandInput("");
    }
  };

  const filteredLogs = filter ? logs.filter((log) => log.agent === filter) : logs;

  return (
    <DashboardPageLayout
      header={{
        title: "LIVE CONSOLE",
        description: "Agent Communication Terminal",
        icon: NetworkIcon,
      }}
    >
      <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Main Terminal */}
        <div className="lg:col-span-3 flex flex-col">
          <DashboardCard title="Terminal Output" className="flex-1 flex flex-col">
            {/* Terminal Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "size-3 rounded-full",
                  isStreaming ? "bg-success animate-pulse" : "bg-muted"
                )} />
                <span className="text-xs text-muted-foreground uppercase">
                  {isStreaming ? "Live Stream" : "Paused"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={isStreaming ? "destructive" : "default"}
                  onClick={() => setIsStreaming(!isStreaming)}
                  className="text-xs"
                >
                  {isStreaming ? "PAUSE" : "START STREAM"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLogs(initialLogs)}
                  className="text-xs"
                >
                  CLEAR
                </Button>
              </div>
            </div>

            {/* Terminal Body */}
            <div
              ref={terminalRef}
              className="flex-1 overflow-y-auto bg-background/50 rounded-lg p-4 font-mono text-sm space-y-1"
              style={{ minHeight: "400px" }}
            >
              {filteredLogs.map((log, i) => (
                <div key={i} className="flex gap-3 hover:bg-accent/30 px-2 py-0.5 rounded">
                  <span className="text-muted-foreground shrink-0">{log.timestamp}</span>
                  <span className={cn("shrink-0 w-16", levelColors[log.level])}>[{log.level}]</span>
                  <span className={cn("shrink-0 w-20", agentColors[log.agent] || "text-foreground/70")}>{log.agent}</span>
                  <span className="text-foreground">{log.message}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2">
                <span className="text-primary">$</span>
                <span className="w-2 h-4 bg-primary animate-pulse" />
              </div>
            </div>

            {/* Command Input */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-primary font-mono">$</span>
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={handleCommand}
                placeholder="Enter command..."
                className="flex-1 bg-transparent border-none outline-none font-mono text-sm"
              />
            </div>
          </DashboardCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Agent Filter */}
          <DashboardCard title="Filter by Agent">
            <div className="space-y-2">
              <Button
                variant={filter === null ? "default" : "outline"}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setFilter(null)}
              >
                ALL AGENTS
              </Button>
              {["PLANNER", "RCA", "FIXER", "VALIDATOR", "SYSTEM"].map((agent) => (
                <Button
                  key={agent}
                  variant={filter === agent ? "default" : "outline"}
                  size="sm"
                  className={cn("w-full justify-start text-xs", agentColors[agent])}
                  onClick={() => setFilter(agent)}
                >
                  {agent}
                </Button>
              ))}
            </div>
          </DashboardCard>

          {/* Quick Commands */}
          <DashboardCard title="Quick Commands">
            <div className="space-y-2">
              {[
                { cmd: "status", desc: "Check system status" },
                { cmd: "agents list", desc: "List all agents" },
                { cmd: "incidents active", desc: "Show active incidents" },
                { cmd: "memory query", desc: "Query semantic memory" },
                { cmd: "rl status", desc: "RL model status" },
              ].map((item) => (
                <button
                  key={item.cmd}
                  onClick={() => setCommandInput(item.cmd)}
                  className="w-full text-left p-2 rounded bg-accent/30 hover:bg-accent/50 transition-colors"
                >
                  <div className="font-mono text-xs text-primary">{item.cmd}</div>
                  <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                </button>
              ))}
            </div>
          </DashboardCard>

          {/* Connection Status */}
          <DashboardCard title="Connection">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Backend</span>
                <Badge className="bg-success/20 text-success border-success/30 text-[10px]">
                  CONNECTED
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">WebSocket</span>
                <Badge className="bg-success/20 text-success border-success/30 text-[10px]">
                  ACTIVE
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Latency</span>
                <span className="text-xs font-mono">23ms</span>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
