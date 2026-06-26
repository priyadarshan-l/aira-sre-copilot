"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import { DashboardCard } from "@/components/dashboard/card";
import ProcessorIcon from "@/components/icons/proccesor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAIRA } from "@/lib/aira-provider";
import { airaMockData } from "@/data/aira-mock";
import type { SystemHealth, IncidentCategory } from "@/types/aira";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// Category icons and colors
const categoryConfig: Record<IncidentCategory, { icon: string; color: string }> = {
  database: { icon: "DB", color: "text-chart-1 bg-chart-1/20 border-chart-1/30" },
  server: { icon: "SRV", color: "text-chart-2 bg-chart-2/20 border-chart-2/30" },
  network: { icon: "NET", color: "text-chart-5 bg-chart-5/20 border-chart-5/30" },
  memory: { icon: "MEM", color: "text-warning bg-warning/20 border-warning/30" },
  cpu: { icon: "CPU", color: "text-primary bg-primary/20 border-primary/30" },
  storage: { icon: "STG", color: "text-chart-3 bg-chart-3/20 border-chart-3/30" },
  api: { icon: "API", color: "text-info bg-info/20 border-info/30" },
  security: { icon: "SEC", color: "text-destructive bg-destructive/20 border-destructive/30" },
};

// Status colors
const statusColors = {
  healthy: "bg-success/20 text-success border-success/30",
  degraded: "bg-warning/20 text-warning border-warning/30",
  critical: "bg-destructive/20 text-destructive border-destructive/30",
};

const statusIndicatorColors = {
  healthy: "bg-success",
  degraded: "bg-warning",
  critical: "bg-destructive animate-pulse",
};

// Extended system data
const extendedSystemData: Record<string, {
  pods: { id: string; cpu: number; memory: number; status: string; region: string }[];
  metrics: { requests: number; errors: number; latency: number; throughput: number };
  connections: string[];
  recentMetrics: number[];
  alerts: { message: string; severity: "warning" | "critical" }[];
}> = {
  "PostgreSQL Cluster": {
    pods: [
      { id: "pg-primary-0", cpu: 78, memory: 82, status: "running", region: "us-east-1a" },
      { id: "pg-replica-1", cpu: 45, memory: 67, status: "running", region: "us-east-1b" },
      { id: "pg-replica-2", cpu: 52, memory: 71, status: "running", region: "us-west-2a" },
    ],
    metrics: { requests: 12450, errors: 23, latency: 4.2, throughput: 890 },
    connections: ["Application Servers", "Cache Layer", "API Gateway"],
    recentMetrics: [45, 52, 48, 61, 78, 72, 65, 58, 62, 55],
    alerts: [{ message: "Connection pool at 85% capacity", severity: "warning" }],
  },
  "Application Servers": {
    pods: [
      { id: "app-east-1a", cpu: 34, memory: 56, status: "running", region: "us-east-1a" },
      { id: "app-east-1b", cpu: 41, memory: 62, status: "running", region: "us-east-1b" },
      { id: "app-east-1c", cpu: 38, memory: 58, status: "running", region: "us-east-1c" },
      { id: "app-west-2a", cpu: 29, memory: 51, status: "running", region: "us-west-2a" },
    ],
    metrics: { requests: 89230, errors: 12, latency: 45, throughput: 4500 },
    connections: ["PostgreSQL Cluster", "Cache Layer", "Core Network", "API Gateway"],
    recentMetrics: [32, 38, 41, 35, 42, 38, 34, 37, 40, 36],
    alerts: [],
  },
  "Core Network": {
    pods: [
      { id: "router-east", cpu: 12, memory: 28, status: "running", region: "us-east-1" },
      { id: "router-west", cpu: 15, memory: 31, status: "running", region: "us-west-2" },
      { id: "lb-primary", cpu: 67, memory: 45, status: "running", region: "global" },
    ],
    metrics: { requests: 245000, errors: 0, latency: 0.8, throughput: 12000 },
    connections: ["Application Servers", "API Gateway", "WAF / Firewall"],
    recentMetrics: [12, 15, 11, 18, 14, 16, 13, 17, 15, 14],
    alerts: [],
  },
  "Cache Layer": {
    pods: [
      { id: "redis-master", cpu: 89, memory: 94, status: "warning", region: "us-east-1a" },
      { id: "redis-replica-1", cpu: 45, memory: 67, status: "running", region: "us-east-1b" },
      { id: "redis-replica-2", cpu: 48, memory: 69, status: "running", region: "us-west-2a" },
    ],
    metrics: { requests: 156000, errors: 89, latency: 1.2, throughput: 8900 },
    connections: ["PostgreSQL Cluster", "Application Servers"],
    recentMetrics: [78, 82, 85, 89, 92, 94, 91, 88, 90, 89],
    alerts: [
      { message: "Master node memory at 94%", severity: "critical" },
      { message: "Eviction rate above threshold", severity: "warning" },
    ],
  },
  "API Gateway": {
    pods: [
      { id: "gateway-1", cpu: 56, memory: 62, status: "running", region: "us-east-1" },
      { id: "gateway-2", cpu: 61, memory: 58, status: "running", region: "us-west-2" },
    ],
    metrics: { requests: 78500, errors: 34, latency: 23, throughput: 5200 },
    connections: ["Core Network", "Application Servers", "WAF / Firewall"],
    recentMetrics: [52, 58, 55, 61, 56, 59, 54, 57, 60, 58],
    alerts: [],
  },
  "Object Storage": {
    pods: [
      { id: "s3-proxy-1", cpu: 8, memory: 12, status: "running", region: "us-east-1" },
      { id: "s3-proxy-2", cpu: 11, memory: 15, status: "running", region: "us-west-2" },
    ],
    metrics: { requests: 34200, errors: 0, latency: 120, throughput: 2100 },
    connections: ["Application Servers"],
    recentMetrics: [8, 9, 11, 8, 10, 9, 11, 8, 10, 9],
    alerts: [],
  },
  "Compute Cluster": {
    pods: [
      { id: "worker-1", cpu: 72, memory: 68, status: "running", region: "us-east-1a" },
      { id: "worker-2", cpu: 68, memory: 71, status: "running", region: "us-east-1b" },
      { id: "worker-3", cpu: 45, memory: 52, status: "running", region: "us-east-1c" },
      { id: "worker-4", cpu: 81, memory: 79, status: "running", region: "us-west-2a" },
    ],
    metrics: { requests: 5600, errors: 2, latency: 890, throughput: 340 },
    connections: ["Application Servers", "Object Storage"],
    recentMetrics: [68, 72, 75, 71, 78, 81, 76, 73, 79, 74],
    alerts: [{ message: "Worker-4 approaching CPU limit", severity: "warning" }],
  },
  "WAF / Firewall": {
    pods: [
      { id: "waf-edge-1", cpu: 23, memory: 34, status: "running", region: "edge-global" },
      { id: "waf-edge-2", cpu: 19, memory: 31, status: "running", region: "edge-global" },
    ],
    metrics: { requests: 890000, errors: 0, latency: 0.3, throughput: 45000 },
    connections: ["Core Network", "API Gateway"],
    recentMetrics: [21, 23, 19, 25, 22, 20, 24, 21, 23, 22],
    alerts: [],
  },
};

// Sparkline component
function Sparkline({ data, color = "primary" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 30;
  const width = 100;
  const stepX = width / (data.length - 1);

  const points = data
    .map((val, i) => {
      const x = i * stepX;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const colorClass = {
    primary: "stroke-primary",
    success: "stroke-success",
    warning: "stroke-warning",
    destructive: "stroke-destructive",
  }[color] || "stroke-primary";

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        className={cn(colorClass, "stroke-2")}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current value dot */}
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        className={cn(colorClass.replace("stroke-", "fill-"))}
      />
    </svg>
  );
}

// Animated resource bar
function ResourceBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const percentage = (value / max) * 100;
  const barColor = percentage > 80 ? "bg-destructive" : percentage > 60 ? "bg-warning" : "bg-success";

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-bold">{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500 rounded-full", barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function SystemCard({
  system,
  extended,
  isSelected,
  onClick,
}: {
  system: SystemHealth;
  extended: typeof extendedSystemData[string] | undefined;
  isSelected: boolean;
  onClick: () => void;
}) {
  const config = categoryConfig[system.category];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-lg border transition-all group",
        "hover:bg-accent/50 hover:border-primary/30",
        isSelected ? "bg-primary/10 border-primary ring-1 ring-primary" : "bg-card/50 border-border/50"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "size-10 rounded-lg flex items-center justify-center font-mono text-xs font-bold border",
            config.color
          )}>
            {config.icon}
          </div>
          <div>
            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
              {system.name}
            </h3>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {system.category}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={cn("size-2.5 rounded-full", statusIndicatorColors[system.status])} />
          <span className={cn(
            "text-[10px] font-bold uppercase",
            system.status === "healthy" && "text-success",
            system.status === "degraded" && "text-warning",
            system.status === "critical" && "text-destructive"
          )}>
            {system.status}
          </span>
        </div>
      </div>

      {/* Sparkline */}
      {extended && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">CPU Load</span>
          <Sparkline
            data={extended.recentMetrics}
            color={system.status === "critical" ? "destructive" : system.status === "degraded" ? "warning" : "primary"}
          />
        </div>
      )}

      {/* Uptime */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Uptime</span>
          <span className={cn(
            "font-mono font-bold",
            system.uptime >= 99.9 ? "text-success" : system.uptime >= 99 ? "text-warning" : "text-destructive"
          )}>
            {system.uptime}%
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all rounded-full",
              system.uptime >= 99.9 ? "bg-success" : system.uptime >= 99 ? "bg-warning" : "bg-destructive"
            )}
            style={{ width: `${system.uptime}%` }}
          />
        </div>
      </div>

      {/* Alerts badge */}
      {extended && extended.alerts.length > 0 && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
          <Badge
            variant="outline"
            className={cn(
              "text-[9px]",
              extended.alerts.some(a => a.severity === "critical")
                ? "bg-destructive/20 text-destructive border-destructive/30"
                : "bg-warning/20 text-warning border-warning/30"
            )}
          >
            {extended.alerts.length} ALERT{extended.alerts.length > 1 ? "S" : ""}
          </Badge>
        </div>
      )}
    </button>
  );
}

// System topology visualization
function TopologyView({ systems, selected }: { systems: SystemHealth[]; selected: SystemHealth | null }) {
  const selectedExtended = selected ? extendedSystemData[selected.name] : null;

  return (
    <div className="relative h-[200px] bg-background/50 rounded-lg overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 cyber-grid opacity-30" />

      {/* Systems as nodes */}
      <div className="relative h-full flex items-center justify-around px-8">
        {systems.slice(0, 5).map((system, i) => {
          const config = categoryConfig[system.category];
          const isSelected = selected?.name === system.name;
          const isConnected = selectedExtended?.connections.includes(system.name);

          return (
            <div
              key={system.name}
              className={cn(
                "relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                isSelected && "bg-primary/20 border-primary shadow-lg shadow-primary/30 scale-110 z-10",
                isConnected && !isSelected && "bg-accent/50 border-primary/50",
                !isSelected && !isConnected && "bg-card/50 border-border/30"
              )}
            >
              {/* Connection pulse for connected nodes */}
              {isConnected && !isSelected && (
                <div className="absolute inset-0 rounded-lg border-2 border-primary animate-ping opacity-30" />
              )}

              <div className={cn(
                "size-10 rounded-lg flex items-center justify-center font-mono text-xs font-bold border",
                config.color
              )}>
                {config.icon}
              </div>
              <span className="text-[10px] font-semibold text-center max-w-[80px] truncate">
                {system.name}
              </span>
              <div className={cn("size-2 rounded-full", statusIndicatorColors[system.status])} />
            </div>
          );
        })}
      </div>

      {/* Connection hint */}
      {selected && selectedExtended && (
        <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground">
          Connected to: {selectedExtended.connections.length} systems
        </div>
      )}
    </div>
  );
}

export default function SystemsPage() {
  // Get real data from backend
  const { systemHealth: liveSystemHealth, isConnected } = useAIRA();

  // Fallback to mock data if backend not connected
  const systemHealth = isConnected && liveSystemHealth.length > 0 ? liveSystemHealth : airaMockData.systemHealth;

  const [selectedSystem, setSelectedSystem] = useState<SystemHealth | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal and interactions state
  const [modalType, setModalType] = useState<"metrics" | "logs" | "trace" | "diagnostics" | "pod-logs" | null>(null);
  const [selectedPodId, setSelectedPodId] = useState<string | null>(null);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnosticsResults, setDiagnosticsResults] = useState<any>(null);
  const [restartingPods, setRestartingPods] = useState<Record<string, boolean>>({});

  // Sync with active incidents from backend
  const { incidents } = useAIRA();
  const activeIncidents = useMemo(() => incidents.filter(inc => inc.status !== "resolved"), [incidents]);

  const dynamicSystemData = useMemo(() => {
    const data = JSON.parse(JSON.stringify(extendedSystemData));

    activeIncidents.forEach(incident => {
      const systemNameMap: Record<string, string> = {
        database: "PostgreSQL Cluster",
        server: "Application Servers",
        network: "Core Network",
        memory: "Cache Layer",
        api: "API Gateway",
        storage: "Object Storage",
        cpu: "Compute Cluster",
        security: "WAF / Firewall"
      };
      
      const sysName = systemNameMap[incident.category];
      if (sysName && data[sysName]) {
        const sys = data[sysName];
        sys.alerts = [{
          message: `${incident.title}: Connection limits or load threshold breached.`,
          severity: incident.severity === "critical" ? "critical" : "warning"
        }];
        
        if (sys.pods && sys.pods.length > 0) {
          sys.pods[0].status = incident.severity === "critical" ? "error" : "warning";
          if (incident.category === "cpu") {
            sys.pods[0].cpu = 98;
          } else if (incident.category === "memory") {
            sys.pods[0].memory = 97;
          } else {
            sys.pods[0].cpu = 92;
            sys.pods[0].memory = 89;
          }
        }
        
        sys.metrics.requests = Math.round(sys.metrics.requests * 1.3);
        sys.metrics.errors = Math.round(sys.metrics.errors + 85);
        sys.metrics.latency = Math.round(sys.metrics.latency * 2.5);
        sys.metrics.throughput = Math.round(sys.metrics.throughput * 0.7);
      }
    });

    Object.keys(restartingPods).forEach(podId => {
      for (const sysName in data) {
        const sys = data[sysName];
        const pod = sys.pods.find((p: any) => p.id === podId);
        if (pod) {
          pod.status = "restarting";
          pod.cpu = 0;
          pod.memory = 0;
        }
      }
    });

    return data;
  }, [activeIncidents, restartingPods]);

  // Restart pod logic
  const handleRestartPod = (podId: string) => {
    setRestartingPods(prev => ({ ...prev, [podId]: true }));
    setTimeout(() => {
      setRestartingPods(prev => {
        const next = { ...prev };
        delete next[podId];
        return next;
      });
    }, 4000);
  };

  // Run diagnostics logic
  const runDiagnostics = () => {
    setDiagnosticsRunning(true);
    setDiagnosticsResults(null);
    setModalType("diagnostics");
    
    setTimeout(() => {
      setDiagnosticsRunning(false);
      const activeIncident = activeIncidents.find(inc => {
        const systemNameMap: Record<string, string> = {
          database: "PostgreSQL Cluster",
          server: "Application Servers",
          network: "Core Network",
          memory: "Cache Layer",
          api: "API Gateway",
          storage: "Object Storage",
          cpu: "Compute Cluster",
          security: "WAF / Firewall"
        };
        return systemNameMap[inc.category] === selectedSystem?.name;
      });

      if (activeIncident) {
        setDiagnosticsResults({
          status: "CRITICAL",
          checks: [
            { name: "Pod runtime environments check", passed: true },
            { name: "Container file system health verify", passed: true },
            { name: "Network routing table verification", passed: false, detail: "Core API Latency spike detected" },
            { name: "Service health probe ping", passed: false, detail: `${activeIncident.title} active` }
          ],
          recommendation: `Remediation action required: ${activeIncident.title} in progress. Please review Agent Pipeline.`
        });
      } else {
        setDiagnosticsResults({
          status: "HEALTHY",
          checks: [
            { name: "Pod runtime environments check", passed: true },
            { name: "Container file system health verify", passed: true },
            { name: "Network routing table verification", passed: true },
            { name: "Service health probe ping", passed: true }
          ],
          recommendation: "All pods operational. System fully optimized."
        });
      }
    }, 3000);
  };

  // Helper for generating pod-logs
  const podLogs = useMemo(() => {
    if (!selectedPodId) return [];
    const baseTime = new Date();
    
    if (restartingPods[selectedPodId]) {
      return [
        { time: new Date(baseTime.getTime() - 3000).toLocaleTimeString(), level: "warn", msg: "SIGTERM signal received, shutting down gracefully..." },
        { time: new Date(baseTime.getTime() - 2000).toLocaleTimeString(), level: "info", msg: "Connection pool closed, flushing write buffers." },
        { time: new Date(baseTime.getTime() - 1000).toLocaleTimeString(), level: "info", msg: "Container stopped successfully." },
        { time: new Date().toLocaleTimeString(), level: "success", msg: "Re-bootstrapping pod instance container..." }
      ];
    }

    let templates = [
      "Service started and listening on standard port",
      "Initializing connection pool handshake...",
      "Health check endpoint /health returning 200 OK",
      "Telemetry metrics successfully pushed to local agent"
    ];
    
    if (selectedPodId.startsWith("pg-")) {
      templates = [
        "database system is ready to accept connections",
        "autovacuum: completed vacuuming order_items table",
        "connection pool active: 45 open client sockets",
        "autovacuum: completed vacuuming orders table",
        "lock acquired for transaction ID 24891"
      ];
    } else if (selectedPodId.startsWith("app-")) {
      templates = [
        "Nest application started successfully on port 3000",
        "GET /api/v1/status - 200 OK (8.2ms)",
        "POST /api/v1/auth/login - 200 OK (45.1ms)",
        "GET /api/v1/checkout - 200 OK (112.0ms)",
        "worker thread processed job ID #48291"
      ];
    } else if (selectedPodId.startsWith("redis-")) {
      templates = [
        "Running mode=standalone, port=6379",
        "DB loaded from disk: 2.4 MB in 0.05 seconds",
        "12,450 keys expired in active background cleanup",
        "Client connection pool optimized",
        "Eviction warning: Memory usage exceeded 90% threshold"
      ];
    } else if (selectedPodId.startsWith("waf-")) {
      templates = [
        "Cloud WAF rule engine initialized successfully",
        "Blocked suspicious crawler pattern from 104.22.45.12",
        "Rate limits applied to API endpoint token x98fs",
        "SQL injection attempt blocked for field 'username'",
        "Incoming connection rate: 45k req/sec"
      ];
    }

    const logs = [];
    for (let i = 9; i >= 0; i--) {
      const timeStr = new Date(baseTime.getTime() - i * 15000).toLocaleTimeString();
      const msg = templates[i % templates.length];
      const level = i === 1 && selectedPodId.includes("master") ? "error" : (i === 3 ? "warn" : "info");
      logs.push({ time: timeStr, level, msg });
    }
    return logs;
  }, [selectedPodId, restartingPods]);

  // Helper for generating system logs
  const systemLogs = useMemo(() => {
    if (!selectedSystem) return [];
    const baseTime = new Date();
    const logs = [];
    const events = [
      `System ${selectedSystem.name} cluster state synchronized`,
      `DNS resolution for service endpoints refreshed`,
      `Health checks passed for all configured backend pods`,
      `Auto-scaling policy checked: replicas inside threshold limit`,
      `Network connections established from downstream services`
    ];
    for (let i = 14; i >= 0; i--) {
      const timeStr = new Date(baseTime.getTime() - i * 30000).toLocaleTimeString();
      const msg = events[i % events.length];
      const level = i === 2 ? "warn" : "info";
      logs.push({ time: timeStr, level, msg });
    }
    return logs;
  }, [selectedSystem]);

  // Simulate data refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 500);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Calculate overview stats
  const healthyCount = systemHealth.filter((s) => s.status === "healthy").length;
  const degradedCount = systemHealth.filter((s) => s.status === "degraded").length;
  const criticalCount = systemHealth.filter((s) => s.status === "critical").length;
  const avgUptime = (systemHealth.reduce((acc, s) => acc + s.uptime, 0) / systemHealth.length).toFixed(2);
  const totalAlerts = Object.values(dynamicSystemData).reduce((acc: any, s: any) => acc + s.alerts.length, 0);

  // Get extended data for selected system
  const selectedExtended = selectedSystem ? dynamicSystemData[selectedSystem.name] : null;

  return (
    <DashboardPageLayout
      header={{
        title: "SYSTEMS",
        description: `${healthyCount}/${systemHealth.length} Healthy`,
        icon: ProcessorIcon,
      }}
    >
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-lg bg-success/10 border border-success/20">
          <span className="text-[10px] text-success uppercase tracking-wide">Healthy</span>
          <p className="text-3xl font-display text-success">{healthyCount}</p>
        </div>
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
          <span className="text-[10px] text-warning uppercase tracking-wide">Degraded</span>
          <p className="text-3xl font-display text-warning">{degradedCount}</p>
        </div>
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 relative">
          {criticalCount > 0 && (
            <div className="absolute top-2 right-2 size-2 rounded-full bg-destructive animate-pulse" />
          )}
          <span className="text-[10px] text-destructive uppercase tracking-wide">Critical</span>
          <p className="text-3xl font-display text-destructive">{criticalCount}</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border/50">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg Uptime</span>
          <p className="text-3xl font-display text-primary">{avgUptime}%</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border/50 relative">
          {totalAlerts > 0 && (
            <div className="absolute top-2 right-2 size-2 rounded-full bg-warning animate-pulse" />
          )}
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Active Alerts</span>
          <p className="text-3xl font-display text-warning">{totalAlerts}</p>
        </div>
      </div>

      {/* Topology View */}
      <DashboardCard header={{ title: "SYSTEM TOPOLOGY", icon: ProcessorIcon }}>
        <TopologyView systems={systemHealth} selected={selectedSystem} />
      </DashboardCard>

      {/* Systems Grid + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Systems List */}
        <div className="lg:col-span-1">
          <DashboardCard
            header={{ title: "INFRASTRUCTURE", icon: ProcessorIcon }}
            addon={
              <div className={cn(
                "size-2 rounded-full",
                isRefreshing ? "bg-primary animate-ping" : "bg-success"
              )} />
            }
          >
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {systemHealth.map((system) => (
                <SystemCard
                  key={system.name}
                  system={system}
                  extended={dynamicSystemData[system.name]}
                  isSelected={selectedSystem?.name === system.name}
                  onClick={() => setSelectedSystem(system)}
                />
              ))}
            </div>
          </DashboardCard>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          <DashboardCard
            header={{
              title: selectedSystem ? selectedSystem.name.toUpperCase() : "SELECT SYSTEM",
              icon: ProcessorIcon,
            }}
            className="h-full"
          >
            {selectedSystem && selectedExtended ? (
              <div className="space-y-6">
                {/* System Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "size-16 rounded-xl flex items-center justify-center font-mono text-2xl font-bold border",
                      categoryConfig[selectedSystem.category].color
                    )}>
                      {categoryConfig[selectedSystem.category].icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedSystem.name}</h2>
                      <p className="text-sm text-muted-foreground uppercase tracking-wide">
                        {selectedSystem.category} | {selectedExtended.pods.length} pods
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={cn(statusColors[selectedSystem.status], "mb-1")}>
                      {selectedSystem.status.toUpperCase()}
                    </Badge>
                    <p className="text-2xl font-display text-primary">{selectedSystem.uptime}%</p>
                    <span className="text-[10px] text-muted-foreground">UPTIME</span>
                  </div>
                </div>

                {/* Alerts */}
                {selectedExtended.alerts.length > 0 && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-2">
                    <span className="text-[10px] text-destructive uppercase font-bold">Active Alerts</span>
                    {selectedExtended.alerts.map((alert, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={cn(
                          "size-2 rounded-full",
                          alert.severity === "critical" ? "bg-destructive animate-pulse" : "bg-warning"
                        )} />
                        <span className="text-sm">{alert.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-accent/30 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase">Requests/min</span>
                    <p className="text-xl font-display text-primary">
                      {selectedExtended.metrics.requests.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase">Errors/min</span>
                    <p className={cn(
                      "text-xl font-display",
                      selectedExtended.metrics.errors > 50 ? "text-destructive" : "text-success"
                    )}>
                      {selectedExtended.metrics.errors}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase">Latency (ms)</span>
                    <p className="text-xl font-display">{selectedExtended.metrics.latency}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase">Throughput</span>
                    <p className="text-xl font-display">{selectedExtended.metrics.throughput}/s</p>
                  </div>
                </div>

                {/* Connected Systems */}
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase mb-2 block">
                    Connected Systems ({selectedExtended.connections.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedExtended.connections.map((conn) => (
                      <Badge key={conn} variant="outline" className="text-xs">
                        {conn}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Pods Table */}
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase mb-3 block">
                    Pod Instances ({selectedExtended.pods.length})
                  </span>
                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/30">
                        <tr className="text-[10px] text-muted-foreground uppercase">
                          <th className="text-left p-3">Pod ID</th>
                          <th className="text-left p-3">Region</th>
                          <th className="text-center p-3">CPU</th>
                          <th className="text-center p-3">Memory</th>
                          <th className="text-center p-3">Status</th>
                          <th className="text-right p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedExtended.pods.map((pod) => (
                          <tr key={pod.id} className="border-t border-border/30 hover:bg-accent/20 transition-colors">
                            <td className="p-3 font-mono text-xs">{pod.id}</td>
                            <td className="p-3 text-xs text-muted-foreground">{pod.region}</td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full",
                                      pod.cpu > 80 ? "bg-destructive" : pod.cpu > 60 ? "bg-warning" : "bg-success"
                                    )}
                                    style={{ width: `${pod.cpu}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono w-6">{pod.cpu}%</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full",
                                      pod.memory > 80 ? "bg-destructive" : pod.memory > 60 ? "bg-warning" : "bg-success"
                                    )}
                                    style={{ width: `${pod.memory}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono w-6">{pod.memory}%</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px]",
                                  pod.status === "running"
                                    ? "bg-success/20 text-success border-success/30"
                                    : pod.status === "restarting"
                                    ? "bg-primary/20 text-primary border-primary/30 animate-pulse"
                                    : pod.status === "warning"
                                    ? "bg-warning/20 text-warning border-warning/30"
                                    : "bg-destructive/20 text-destructive border-destructive/30"
                                )}
                              >
                                {pod.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] h-6 px-2"
                                onClick={() => {
                                  setSelectedPodId(pod.id);
                                  setModalType("pod-logs");
                                }}
                                disabled={pod.status === "restarting"}
                              >
                                LOGS
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] h-6 px-2 text-destructive hover:text-destructive"
                                onClick={() => handleRestartPod(pod.id)}
                                disabled={pod.status === "restarting"}
                              >
                                {pod.status === "restarting" ? "..." : "RESTART"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
 
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 min-w-[120px] bg-transparent"
                    onClick={() => setModalType("metrics")}
                  >
                    VIEW METRICS
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 min-w-[120px] bg-transparent"
                    onClick={() => setModalType("logs")}
                  >
                    VIEW LOGS
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 min-w-[120px] bg-transparent"
                    onClick={() => setModalType("trace")}
                  >
                    TRACE REQUESTS
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1 min-w-[120px]"
                    onClick={runDiagnostics}
                  >
                    RUN DIAGNOSTICS
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                <ProcessorIcon className="size-16 mb-4 opacity-30" />
                <p>Select a system from the list to view details</p>
              </div>
            )}
          </DashboardCard>
        </div>
      </div>

      {/* Dialog Modals */}
      <Dialog open={!!modalType} onOpenChange={() => { if (!diagnosticsRunning) setModalType(null); }}>
        <DialogContent className="max-w-2xl bg-card border border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="uppercase font-display tracking-wide text-primary">
              {modalType === "metrics" && `System Telemetry: ${selectedSystem?.name}`}
              {modalType === "logs" && `Aggregate Cluster Logs: ${selectedSystem?.name}`}
              {modalType === "trace" && `Distributed Trace Requests: ${selectedSystem?.name}`}
              {modalType === "diagnostics" && `Deep Diagnostics Probe: ${selectedSystem?.name}`}
              {modalType === "pod-logs" && `Instance Console Logs: ${selectedPodId}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground uppercase">
              {modalType === "metrics" && "Real-time key performance indicators and load metrics"}
              {modalType === "logs" && "Aggregated output from all node/pod daemon processes"}
              {modalType === "trace" && "Microservice hops and response breakdown"}
              {modalType === "diagnostics" && "Container and platform integrity health checks"}
              {modalType === "pod-logs" && "Direct stdout/stderr stream from container runtime"}
            </DialogDescription>
          </DialogHeader>

          {/* Pod Logs Modal */}
          {modalType === "pod-logs" && (
            <div className="bg-accent/40 rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-[400px] border border-border/30 space-y-1.5">
              {podLogs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-muted-foreground shrink-0">[{log.time}]</span>
                  <span className={cn(
                    log.level === "error" && "text-destructive font-bold",
                    log.level === "warn" && "text-warning",
                    log.level === "success" && "text-success",
                    log.level === "info" && "text-primary"
                  )}>
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* System Logs Modal */}
          {modalType === "logs" && (
            <div className="bg-accent/40 rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-[400px] border border-border/30 space-y-1.5">
              {systemLogs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-muted-foreground shrink-0">[{log.time}]</span>
                  <span className={cn(
                    log.level === "error" && "text-destructive font-bold",
                    log.level === "warn" && "text-warning",
                    log.level === "success" && "text-success",
                    log.level === "info" && "text-primary"
                  )}>
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* System Metrics Modal */}
          {modalType === "metrics" && selectedExtended && (
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="p-4 rounded-lg bg-accent/30 border border-border/30 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block mb-1">Peak Requests Rate</span>
                  <p className="text-2xl font-bold font-mono text-primary">
                    {Math.round(selectedExtended.metrics.requests * 1.25).toLocaleString()}/min
                  </p>
                </div>
                <span className="text-[9px] text-muted-foreground mt-2">Aggregated 5m window</span>
              </div>
              <div className="p-4 rounded-lg bg-accent/30 border border-border/30 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block mb-1">P99 Latency SLA</span>
                  <p className="text-2xl font-bold font-mono text-warning">
                    {Math.round(selectedExtended.metrics.latency * 1.8)} ms
                  </p>
                </div>
                <span className="text-[9px] text-muted-foreground mt-2">Target SLA: &lt; 50ms</span>
              </div>
              <div className="p-4 rounded-lg bg-accent/30 border border-border/30 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block mb-1">Average Failure Rate</span>
                  <p className={cn(
                    "text-2xl font-bold font-mono",
                    selectedExtended.metrics.errors > 50 ? "text-destructive" : "text-success"
                  )}>
                    {selectedExtended.metrics.requests > 0 
                      ? ((selectedExtended.metrics.errors / selectedExtended.metrics.requests) * 100).toFixed(3)
                      : "0.000"}%
                  </p>
                </div>
                <span className="text-[9px] text-muted-foreground mt-2">HTTP 5xx status codes</span>
              </div>
              <div className="p-4 rounded-lg bg-accent/30 border border-border/30 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block mb-1">Network Throughput Max</span>
                  <p className="text-2xl font-bold font-mono">
                    {(selectedExtended.metrics.throughput * 1.15).toFixed(0)} req/s
                  </p>
                </div>
                <span className="text-[9px] text-muted-foreground mt-2">Bandwidth load standard</span>
              </div>
            </div>
          )}

          {/* Trace Requests Modal */}
          {modalType === "trace" && selectedExtended && (
            <div className="bg-accent/40 rounded-lg p-6 border border-border/30 space-y-6">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Distributed Trace Map (Top request hops)
              </span>
              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center gap-4">
                  <div className="w-24 text-right text-muted-foreground uppercase">WAF Edge</div>
                  <div className="flex-1 h-3 bg-muted rounded overflow-hidden relative">
                    <div className="absolute left-0 top-0 h-full bg-success w-[15%]" />
                  </div>
                  <div className="w-16 font-bold text-success">0.3 ms</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 text-right text-muted-foreground uppercase">API Gateway</div>
                  <div className="flex-1 h-3 bg-muted rounded overflow-hidden relative">
                    <div className="absolute left-[15%] top-0 h-full bg-info w-[20%]" />
                  </div>
                  <div className="w-16 font-bold text-info">2.1 ms</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 text-right text-muted-foreground uppercase">App Server</div>
                  <div className="flex-1 h-3 bg-muted rounded overflow-hidden relative">
                    <div className="absolute left-[35%] top-0 h-full bg-primary w-[45%]" />
                  </div>
                  <div className="w-16 font-bold text-primary">{selectedExtended.metrics.latency} ms</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 text-right text-muted-foreground uppercase">{selectedSystem?.name.slice(0, 10)}</div>
                  <div className="flex-1 h-3 bg-muted rounded overflow-hidden relative">
                    <div className={cn(
                      "absolute top-0 h-full w-[20%]",
                      selectedSystem?.status === "critical" ? "left-[80%] bg-destructive" : "left-[80%] bg-success"
                    )} />
                  </div>
                  <div className={cn(
                    "w-16 font-bold",
                    selectedSystem?.status === "critical" ? "text-destructive animate-pulse" : "text-success"
                  )}>
                    {(selectedExtended.metrics.latency * 0.18).toFixed(1)} ms
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Diagnostics Modal */}
          {modalType === "diagnostics" && (
            <div className="py-2">
              {diagnosticsRunning ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <Loader2 className="size-12 text-primary animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-semibold">Running Platform Integrity Diagnostics...</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono animate-pulse">Checking status, verifying replicas, pings</p>
                  </div>
                </div>
              ) : diagnosticsResults ? (
                <div className="space-y-4">
                  <div className={cn(
                    "p-4 rounded-lg border flex items-center justify-between",
                    diagnosticsResults.status === "HEALTHY" 
                      ? "bg-success/10 border-success/30 text-success" 
                      : "bg-destructive/10 border-destructive/30 text-destructive"
                  )}>
                    <div>
                      <span className="text-[10px] uppercase font-bold block">Overall Report Status</span>
                      <p className="text-lg font-bold font-display">{diagnosticsResults.status}</p>
                    </div>
                    <Badge variant="outline" className={diagnosticsResults.status === "HEALTHY" ? "border-success text-success" : "border-destructive text-destructive"}>
                      {diagnosticsResults.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-muted-foreground uppercase block font-bold">Checks Summary</span>
                    <div className="rounded-lg border border-border/30 divide-y divide-border/30 overflow-hidden font-mono text-xs">
                      {diagnosticsResults.checks.map((check: any, idx: number) => (
                        <div key={idx} className="p-3 flex items-center justify-between bg-accent/20">
                          <span>{check.name}</span>
                          <div className="flex items-center gap-2">
                            {check.detail && <span className="text-[10px] text-muted-foreground">{check.detail}</span>}
                            <Badge variant="outline" className={check.passed ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30"}>
                              {check.passed ? "PASS" : "FAIL"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-accent/30 border border-border/30 text-xs">
                    <span className="font-bold text-primary block mb-1">Expert Advisor Recommendation:</span>
                    <p className="text-muted-foreground">{diagnosticsResults.recommendation}</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardPageLayout>
  );
}
