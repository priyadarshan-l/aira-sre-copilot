"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import DashboardCard from "@/components/dashboard/card";
import { useSimulation } from "@/lib/simulation-context";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "success" | "debug";
  agent?: string;
  message: string;
}

// Simulated log entries for demo
const simulatedLogs: Omit<LogEntry, "id" | "timestamp">[] = [
  { level: "info", agent: "PLANNER", message: "Received incident INC-0847: Database Connection Pool Exhaustion" },
  { level: "info", agent: "PLANNER", message: "Analyzing incident context and severity..." },
  { level: "debug", agent: "PLANNER", message: "Fetching historical patterns from ChromaDB..." },
  { level: "success", agent: "PLANNER", message: "Found 47 similar incidents in semantic memory" },
  { level: "info", agent: "PLANNER", message: "Strategy defined: Investigate connection pool metrics → Identify leak → Apply fix" },
  { level: "info", agent: "RCA", message: "Starting root cause analysis..." },
  { level: "debug", agent: "RCA", message: "Querying PostgreSQL metrics: pg_stat_activity" },
  { level: "warn", agent: "RCA", message: "DETECTED: 98% connection pool utilization" },
  { level: "debug", agent: "RCA", message: "Analyzing connection states..." },
  { level: "error", agent: "RCA", message: "CRITICAL: 847 idle connections found (expected: <100)" },
  { level: "info", agent: "RCA", message: "Correlating with application logs..." },
  { level: "success", agent: "RCA", message: "ROOT CAUSE: Connection leak in user-service v2.4.1 (commit abc123)" },
  { level: "info", agent: "FIXER", message: "Initiating remediation sequence..." },
  { level: "debug", agent: "FIXER", message: "Executing: pg_terminate_backend() for idle connections" },
  { level: "info", agent: "FIXER", message: "Terminated 742 idle connections" },
  { level: "debug", agent: "FIXER", message: "Restarting user-service pods (3 replicas)" },
  { level: "success", agent: "FIXER", message: "Fix applied: Connection pool reset to 12% utilization" },
  { level: "info", agent: "VALIDATOR", message: "Starting validation checks..." },
  { level: "debug", agent: "VALIDATOR", message: "Monitoring connection pool for 60s..." },
  { level: "info", agent: "VALIDATOR", message: "Query response times: 45ms (baseline: 42ms)" },
  { level: "success", agent: "VALIDATOR", message: "VALIDATED: System stable. MTTR: 4.2 minutes" },
  { level: "info", message: "Incident INC-0847 resolved. Updating semantic memory..." },
];

// Production mode logs (static)
const productionLogs: LogEntry[] = [
  { id: "1", timestamp: "14:32:15", level: "error", message: "INC-0847: Database Connection Pool Exhaustion detected" },
  { id: "2", timestamp: "14:32:16", level: "info", agent: "PLANNER", message: "Incident assigned to agent pipeline" },
  { id: "3", timestamp: "14:32:18", level: "info", agent: "RCA", message: "Root cause analysis in progress..." },
  { id: "4", timestamp: "14:33:22", level: "warn", message: "Connection pool at 98% capacity" },
  { id: "5", timestamp: "14:34:01", level: "success", agent: "RCA", message: "Root cause identified: Connection leak" },
];

const levelColors: Record<LogEntry["level"], string> = {
  info: "text-primary",
  warn: "text-warning",
  error: "text-destructive",
  success: "text-success",
  debug: "text-muted-foreground",
};

const levelLabels: Record<LogEntry["level"], string> = {
  info: "INFO",
  warn: "WARN",
  error: "ERRO",
  success: "DONE",
  debug: "DEBG",
};

export default function LiveTerminal() {
  const { isSimulation } = useSimulation();
  const [logs, setLogs] = useState<LogEntry[]>(productionLogs);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const terminalRef = useRef<HTMLDivElement>(null);

  // Simulation mode: Type out logs one by one
  useEffect(() => {
    if (!isSimulation) {
      setLogs(productionLogs);
      setCurrentIndex(0);
      return;
    }

    // Reset for simulation
    setLogs([]);
    setCurrentIndex(0);

    const addNextLog = (index: number) => {
      if (index >= simulatedLogs.length) {
        // Loop back after delay
        setTimeout(() => {
          setLogs([]);
          setCurrentIndex(0);
          addNextLog(0);
        }, 5000);
        return;
      }

      const log = simulatedLogs[index];
      const newLog: LogEntry = {
        ...log,
        id: `sim-${index}-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
      };

      // Typing effect
      setIsTyping(true);
      setCurrentText("");
      
      const fullText = log.message;
      let charIndex = 0;
      
      const typeInterval = setInterval(() => {
        if (charIndex < fullText.length) {
          setCurrentText(fullText.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
          setLogs((prev) => [...prev.slice(-15), newLog]); // Keep last 15 logs
          setCurrentText("");
          
          // Schedule next log
          const delay = log.level === "error" ? 1500 : log.level === "success" ? 1200 : 800;
          setTimeout(() => addNextLog(index + 1), delay);
        }
      }, 25);

      setCurrentIndex(index);
    };

    addNextLog(0);

    return () => {
      setIsTyping(false);
      setCurrentText("");
    };
  }, [isSimulation]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, currentText]);

  const currentLog = isSimulation && currentIndex < simulatedLogs.length ? simulatedLogs[currentIndex] : null;

  return (
    <DashboardCard
      title="LIVE TERMINAL"
      intent="default"
      addon={
        <div className="flex items-center gap-2">
          <span className={cn(
            "size-2 rounded-full",
            isSimulation ? "bg-warning animate-pulse" : "bg-success"
          )} />
          <span className="text-xs text-muted-foreground uppercase">
            {isSimulation ? "SIMULATION" : "LIVE"}
          </span>
        </div>
      }
    >
      <div
        ref={terminalRef}
        className="bg-background/50 rounded-lg border border-border p-4 font-mono text-xs h-64 overflow-y-auto space-y-1"
      >
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

        {/* Currently Typing Line */}
        {isTyping && currentLog && (
          <div className="flex gap-2">
            <span className="text-muted-foreground/50 shrink-0">
              {new Date().toLocaleTimeString("en-US", { hour12: false })}
            </span>
            <span className={cn("shrink-0 font-bold", levelColors[currentLog.level])}>
              [{levelLabels[currentLog.level]}]
            </span>
            {currentLog.agent && (
              <span className="text-primary shrink-0">
                [{currentLog.agent}]
              </span>
            )}
            <span className="text-foreground/90">
              {currentText}
              <span className="terminal-cursor text-primary">|</span>
            </span>
          </div>
        )}

        {/* Empty state cursor */}
        {logs.length === 0 && !isTyping && (
          <div className="flex gap-2 text-muted-foreground">
            <span>&gt;</span>
            <span className="terminal-cursor">_</span>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
