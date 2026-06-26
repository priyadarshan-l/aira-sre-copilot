"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import DashboardCard from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { Bullet } from "@/components/ui/bullet";
import { useAIRA } from "@/lib/aira-provider";
import type { AIRALog } from "@/hooks/use-aira-socket";
import {
  Zap,
  Brain,
  Search,
  Wrench,
  ShieldCheck,
  Database,
  GraduationCap,
  Activity,
  CheckCircle2,
  Clock,
  Cpu,
  TrendingDown,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface TimelineEvent {
  id: string;
  timestamp: string;
  icon: React.ElementType;
  iconColor: string;
  glowColor: string;
  label: string;
  message: string;
  detail?: string;
  phase: "detection" | "planner" | "rca" | "fixer" | "validator" | "resolved" | "memory" | "rl";
}

interface ResolutionSummary {
  mttr: number; // milliseconds
  cpuBefore: number;
  cpuAfter: number;
  status: "resolved" | "failed";
  incidentType: string;
}

// ─────────────────────────────────────────────────────────────────
// Phase config
// ─────────────────────────────────────────────────────────────────

const phaseConfig: Record<string, { icon: React.ElementType; color: string; glow: string }> = {
  detection: { icon: Zap, color: "text-destructive", glow: "shadow-[0_0_12px_rgba(239,68,68,0.4)]" },
  planner: { icon: Brain, color: "text-primary", glow: "shadow-[0_0_12px_rgba(0,240,255,0.4)]" },
  rca: { icon: Search, color: "text-warning", glow: "shadow-[0_0_12px_rgba(245,158,11,0.4)]" },
  fixer: { icon: Wrench, color: "text-primary", glow: "shadow-[0_0_12px_rgba(0,240,255,0.4)]" },
  validator: { icon: ShieldCheck, color: "text-success", glow: "shadow-[0_0_12px_rgba(34,197,94,0.4)]" },
  resolved: { icon: CheckCircle2, color: "text-success", glow: "shadow-[0_0_12px_rgba(34,197,94,0.4)]" },
  memory: { icon: Database, color: "text-primary", glow: "shadow-[0_0_12px_rgba(0,240,255,0.3)]" },
  rl: { icon: GraduationCap, color: "text-warning", glow: "shadow-[0_0_12px_rgba(245,158,11,0.3)]" },
};

// ─────────────────────────────────────────────────────────────────
// MTTR Stopwatch
// ─────────────────────────────────────────────────────────────────

function MTTRStopwatch({ startTime, isRunning }: { startTime: number | null; isRunning: boolean }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime || !isRunning) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [startTime, isRunning]);

  // Reset when startTime changes
  useEffect(() => {
    if (startTime) setElapsed(0);
  }, [startTime]);

  const seconds = (elapsed / 1000).toFixed(1);

  return (
    <div className="flex items-center gap-2">
      <Clock className={cn("size-3.5", isRunning ? "text-warning animate-pulse" : "text-success")} />
      <span className={cn(
        "font-mono text-sm font-bold tabular-nums",
        isRunning ? "text-warning" : "text-success"
      )}>
        {seconds}s
      </span>
      <span className="text-[10px] text-muted-foreground uppercase">MTTR</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Typewriter Text
// ─────────────────────────────────────────────────────────────────

function TypewriterText({ text, speed = 15 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      indexRef.current++;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-[2px] h-3.5 bg-primary ml-0.5 animate-pulse align-middle" />
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// Timeline Event Row
// ─────────────────────────────────────────────────────────────────

function TimelineEventRow({ event, index }: { event: TimelineEvent; index: number }) {
  const config = phaseConfig[event.phase];
  const Icon = config?.icon || Activity;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      className="flex gap-3 relative"
    >
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className={cn(
            "size-7 rounded-full border-2 flex items-center justify-center shrink-0",
            config?.color || "text-muted-foreground",
            "border-current bg-current/10",
            config?.glow || ""
          )}
        >
          <Icon className="size-3.5" />
        </motion.div>
        <div className="w-0.5 flex-1 bg-border/40 min-h-[8px]" />
      </div>

      {/* Content */}
      <div className="pb-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn("text-[10px] font-bold uppercase tracking-wider", config?.color || "text-muted-foreground")}>
            {event.label}
          </span>
          <span className="text-[10px] text-muted-foreground/50 font-mono">{event.timestamp}</span>
        </div>
        <p className="text-xs text-foreground/90 leading-relaxed">
          <TypewriterText text={event.message} />
        </p>
        {event.detail && (
          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{event.detail}</p>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Resolution Summary Card
// ─────────────────────────────────────────────────────────────────

function ResolutionCard({ summary }: { summary: ResolutionSummary }) {
  const mttrSeconds = (summary.mttr / 1000).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "rounded-lg border-2 p-4 relative overflow-hidden",
        summary.status === "resolved"
          ? "border-success/50 bg-success/5"
          : "border-destructive/50 bg-destructive/5"
      )}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-success/10 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="size-5 text-success" />
          <span className="text-sm font-bold text-success uppercase tracking-wider">
            Incident Resolved
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* MTTR */}
          <div className="text-center p-2 rounded bg-background/50 border border-border/30">
            <div className="text-[10px] text-muted-foreground uppercase mb-1">MTTR</div>
            <div className="text-lg font-bold font-mono text-success">{mttrSeconds}s</div>
          </div>

          {/* CPU Recovery */}
          <div className="text-center p-2 rounded bg-background/50 border border-border/30">
            <div className="text-[10px] text-muted-foreground uppercase mb-1">CPU Recovery</div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-sm font-bold font-mono text-destructive">{summary.cpuBefore.toFixed(0)}%</span>
              <TrendingDown className="size-3 text-success" />
              <span className="text-sm font-bold font-mono text-success">{summary.cpuAfter.toFixed(0)}%</span>
            </div>
          </div>

          {/* Policy */}
          <div className="text-center p-2 rounded bg-background/50 border border-border/30">
            <div className="text-[10px] text-muted-foreground uppercase mb-1">RL Policy</div>
            <div className="text-sm font-bold font-mono text-primary">Q-Learn</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────

export default function IncidentTimeline() {
  const { logs, wsStatus, agentPipeline, hostMetrics } = useAIRA();

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [cpuAtStart, setCpuAtStart] = useState<number | null>(null);
  const [summary, setSummary] = useState<ResolutionSummary | null>(null);
  const [isActive, setIsActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const processedLogsRef = useRef<Set<string>>(new Set());
  const lastModeRef = useRef<string>("idle");

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, summary]);

  // Detect when incident processing starts
  useEffect(() => {
    if (wsStatus.mode === "running" && lastModeRef.current !== "running") {
      // New incident started
      setEvents([]);
      setSummary(null);
      processedLogsRef.current = new Set();
      setStartTime(Date.now());
      setIsActive(true);
      setCpuAtStart(hostMetrics?.current.cpu_percent ?? null);

      // Add detection event
      const detectionEvent: TimelineEvent = {
        id: `evt-detection-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
        icon: Zap,
        iconColor: "text-destructive",
        glowColor: "",
        label: "DETECTED",
        message: wsStatus.currentIncident
          ? `Incident detected: ${wsStatus.currentIncident}`
          : "Anomaly detected in system telemetry",
        detail: hostMetrics?.current.cpu_percent
          ? `CPU: ${hostMetrics.current.cpu_percent.toFixed(1)}% | RAM: ${hostMetrics.current.ram_percent.toFixed(1)}%`
          : undefined,
        phase: "detection",
      };
      setEvents([detectionEvent]);
    }
    lastModeRef.current = wsStatus.mode;
  }, [wsStatus.mode, wsStatus.currentIncident, hostMetrics]);

  // Convert incoming logs to timeline events
  useEffect(() => {
    if (!isActive) return;

    const newEvents: TimelineEvent[] = [];

    for (const log of logs) {
      if (processedLogsRef.current.has(log.id)) continue;
      processedLogsRef.current.add(log.id);

      // Skip the initial "Connected" and "Incident received" logs
      if (log.message.includes("Connected to AIRA") || log.message.includes("Incident received:")) continue;

      // Map agent to phase
      let phase: TimelineEvent["phase"] = "detection";
      let label = "SYSTEM";
      if (log.agent) {
        const agentLower = log.agent.toLowerCase();
        if (agentLower === "planner") { phase = "planner"; label = "PLANNER"; }
        else if (agentLower === "rca") { phase = "rca"; label = "ROOT CAUSE"; }
        else if (agentLower === "fixer") { phase = "fixer"; label = "FIXER"; }
        else if (agentLower === "validator") { phase = "validator"; label = "VALIDATOR"; }
      }

      // Check for resolution
      if (log.message.includes("Incident resolved") || log.message.includes("Incident failed")) {
        phase = "resolved";
        label = "RESOLVED";
      }

      // Clean up message: remove Python dict syntax, truncate
      let message = log.message;
      if (message.startsWith("{") || message.startsWith("[")) {
        try {
          const jsonStr = message.replace(/'/g, '"').replace(/True/g, 'true').replace(/False/g, 'false').replace(/None/g, 'null');
          const parsed = JSON.parse(jsonStr);
          if (parsed.thought) message = parsed.thought;
          else if (parsed.next_action) message = `Action: ${parsed.next_action}`;
          else if (parsed.root_cause) message = `Root cause identified: ${parsed.root_cause} (confidence: ${parsed.confidence})`;
          else if (parsed.status) message = `Status: ${parsed.status}`;
        } catch {
          // keep original
        }
      }

      // Limit message length
      if (message.length > 150) message = message.slice(0, 147) + "...";

      newEvents.push({
        id: `evt-${log.id}`,
        timestamp: log.timestamp,
        icon: phaseConfig[phase]?.icon || Activity,
        iconColor: phaseConfig[phase]?.color || "text-muted-foreground",
        glowColor: phaseConfig[phase]?.glow || "",
        label,
        message,
        phase,
      });
    }

    if (newEvents.length > 0) {
      setEvents(prev => [...prev, ...newEvents]);
    }
  }, [logs, isActive]);

  // Detect completion
  useEffect(() => {
    if (wsStatus.mode === "complete" && isActive && startTime) {
      setIsActive(false);

      // Add memory and RL events
      const now = new Date().toLocaleTimeString("en-US", { hour12: false });

      setEvents(prev => [
        ...prev,
        {
          id: `evt-memory-${Date.now()}`,
          timestamp: now,
          icon: Database,
          iconColor: "text-primary",
          glowColor: "",
          label: "MEMORY",
          message: "Incident stored in ChromaDB semantic memory for future correlation",
          phase: "memory",
        },
        {
          id: `evt-rl-${Date.now()}`,
          timestamp: now,
          icon: GraduationCap,
          iconColor: "text-warning",
          glowColor: "",
          label: "RL UPDATE",
          message: "Q-table updated with positive reward. Policy improved for similar incidents",
          phase: "rl",
        },
      ]);

      // Build resolution summary
      const cpuAfter = hostMetrics?.current.cpu_percent ?? 0;
      const mttr = wsStatus.mttr || (Date.now() - startTime);

      setSummary({
        mttr,
        cpuBefore: cpuAtStart ?? 0,
        cpuAfter,
        status: "resolved",
        incidentType: wsStatus.currentIncident || "Unknown",
      });
    }
  }, [wsStatus.mode, isActive, startTime, cpuAtStart, hostMetrics, wsStatus.mttr, wsStatus.currentIncident]);

  const isProcessing = wsStatus.mode === "running";

  return (
    <DashboardCard
      title="INCIDENT RESOLUTION TIMELINE"
      intent={isProcessing ? "default" : summary ? "success" : "default"}
      addon={
        <div className="flex items-center gap-3">
          {isProcessing && (
            <MTTRStopwatch startTime={startTime} isRunning={isActive} />
          )}
          {summary && !isProcessing && (
            <MTTRStopwatch startTime={null} isRunning={false} />
          )}
          <div className="flex items-center gap-1.5">
            <Bullet
              className={cn(
                isProcessing ? "bg-warning animate-pulse" :
                summary ? "bg-success" :
                "bg-muted-foreground/30"
              )}
            />
            <span className="text-[10px] text-muted-foreground uppercase font-mono">
              {isProcessing ? "RESOLVING" : summary ? "RESOLVED" : "MONITORING"}
            </span>
          </div>
        </div>
      }
    >
      <div
        ref={scrollRef}
        className="h-64 overflow-y-auto pr-1 space-y-0"
      >
        <AnimatePresence mode="popLayout">
          {events.length > 0 ? (
            <motion.div key="active-events" className="space-y-3">
              {events.map((event, index) => (
                <TimelineEventRow key={event.id} event={event} index={index} />
              ))}

              {/* Resolution Summary */}
              {summary && (
                <div className="pt-2">
                  <ResolutionCard summary={summary} />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="nominal-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-muted-foreground"
            >
              <Activity className="size-8 mb-3 opacity-20" />
              <p className="text-xs font-mono uppercase tracking-wider">System Nominal</p>
              <p className="text-[10px] mt-1 opacity-60">
                Trigger an incident to watch AIRA resolve it autonomously
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing indicator */}
        {isProcessing && events.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 pt-2 pl-10 text-primary"
          >
            <motion.span
              className="size-1.5 rounded-full bg-primary"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-[10px] font-mono uppercase">
              {wsStatus.currentAgent?.toUpperCase() || "AGENT"} processing...
            </span>
          </motion.div>
        )}
      </div>
    </DashboardCard>
  );
}
