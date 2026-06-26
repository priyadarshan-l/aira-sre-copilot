"use client";

import { useState, useEffect } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import { IncidentIcon, MemoryIcon } from "@/components/icons/agents";
import { DashboardCard } from "@/components/dashboard/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAIRA } from "@/lib/aira-provider";
import { airaMockData } from "@/data/aira-mock";
import type { Incident, IncidentSeverity, IncidentStatus } from "@/types/aira";
import {
  PlannerIcon,
  RCAIcon,
  FixerIcon,
  ValidatorIcon,
} from "@/components/icons/agents";

// Severity config
const severityConfig: Record<
  IncidentSeverity,
  { color: string; bg: string; glow: string }
> = {
  critical: {
    color: "text-destructive",
    bg: "bg-destructive",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.5)]",
  },
  high: {
    color: "text-warning",
    bg: "bg-warning",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.4)]",
  },
  medium: {
    color: "text-primary",
    bg: "bg-primary",
    glow: "shadow-[0_0_10px_rgba(0,240,255,0.3)]",
  },
  low: {
    color: "text-muted-foreground",
    bg: "bg-muted-foreground",
    glow: "",
  },
};

// Status config
const statusConfig: Record<
  IncidentStatus,
  { color: string; bg: string; label: string }
> = {
  detected: {
    color: "text-destructive",
    bg: "bg-destructive/20 border-destructive/30",
    label: "DETECTED",
  },
  analyzing: {
    color: "text-primary",
    bg: "bg-primary/20 border-primary/30",
    label: "ANALYZING",
  },
  remediating: {
    color: "text-warning",
    bg: "bg-warning/20 border-warning/30",
    label: "REMEDIATING",
  },
  validating: {
    color: "text-success",
    bg: "bg-success/20 border-success/30",
    label: "VALIDATING",
  },
  resolved: {
    color: "text-success",
    bg: "bg-success/10 border-success/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]",
    label: "SOLVED & REMEDIATED",
  },
  failed: {
    color: "text-destructive",
    bg: "bg-destructive/20 border-destructive/30",
    label: "FAILED",
  },
};

const agentIcons = {
  planner: PlannerIcon,
  rca: RCAIcon,
  fixer: FixerIcon,
  validator: ValidatorIcon,
};

// Filter options
type FilterStatus = "all" | "active" | "resolved";
type FilterSeverity = "all" | IncidentSeverity;



// Helper to retrieve dynamically simulated similar incidents from semantic memory based on selected incident type
const getSimilarIncidents = (incident: any) => {
  if (!incident) return [];

  const isHdfs = incident.type === "hdfs" || incident.id?.startsWith("HDFS");
  const isOpenstack = incident.type === "openstack" || incident.id?.startsWith("OPENSTACK");

  if (isHdfs) {
    return [
      {
        id: "HDFS-INC-002",
        title: "DataNode Write Socket Timeout Exception (Event 22)",
        similarity: 94,
        resolution: "Re-construct the write pipeline by removing the unresponsive DataNode from the pipeline list.",
      },
      {
        id: "HDFS-INC-007",
        title: "DataNode Heartbeat Timeout & Death",
        similarity: 81,
        resolution: "NameNode scheduler removes dead node from active list, marks blocks as under-replicated, and triggers replication.",
      },
      {
        id: "HDFS-INC-009",
        title: "DataNode Write Pipeline Recovery Timeout",
        similarity: 68,
        resolution: "Run NTP synchronization across the cluster to align node timestamps and verify target internal connection ports.",
      },
    ];
  }

  if (isOpenstack) {
    return [
      {
        id: "OPENSTACK-INC-005",
        title: "Nova CPU Overcommit Scheduler Rejection",
        similarity: 91,
        resolution: "Adjust cpu_allocation_ratio configuration or migrate idle virtual machine workloads.",
      },
      {
        id: "OPENSTACK-INC-001",
        title: "Nova VM Spawn Instance Disk Failure (Event 12)",
        similarity: 79,
        resolution: "Force Nova to re-download the target image from the Glance registry and verify disk allocation volumes.",
      },
      {
        id: "OPENSTACK-INC-006",
        title: "Cinder Volume Attachment Timeout (ISCSI Target)",
        similarity: 65,
        resolution: "Restart iscsid service on hypervisor node, ping target SAN portals, and execute SCSI bus rescan.",
      },
    ];
  }

  // Default SRE
  return [
    {
      id: "INC-2026-089",
      title: "PostgreSQL connection pool exhausted on billing-service",
      similarity: 95,
      resolution: "Increased max_connections to 300 and applied garbage collection patch to close unreleased transaction connection blocks.",
    },
    {
      id: "INC-2025-045",
      title: "Memory pressure on db-primary",
      similarity: 83,
      resolution: "Optimized queries, added indexes, and scaled database replicas.",
    },
    {
      id: "INC-2025-067",
      title: "API latency spike on checkout endpoint",
      similarity: 70,
      resolution: "Increased pool size, added connection recycling, and cleared local cache.",
    },
  ];
};


export default function IncidentsPage() {
  // Get real data from backend
  const { 
    incidents: liveIncidents, 
    isConnected, 
    triggerIncident, 
    logs, 
    wsStatus, 
    agentPipeline, 
    corpus, 
    hdfsCorpus,
    openstackCorpus,
    triggerCorpusIncident 
  } = useAIRA();

  // Fallback to mock data if backend not connected
  const incidents = isConnected && liveIncidents.length > 0 ? liveIncidents : airaMockData.incidents;

  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [severityFilter, setSeverityFilter] = useState<FilterSeverity>("all");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  
  // Dynamically resolve selected incident from the active array to prevent stale render references
  const selectedIncident = incidents.find(i => i.id === selectedIncidentId) || incidents[0] || null;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRemediating, setIsRemediating] = useState(false);
  const [selectedCorpusIndex, setSelectedCorpusIndex] = useState(0);
  const [selectedHdfsIndex, setSelectedHdfsIndex] = useState(0);
  const [selectedOpenstackIndex, setSelectedOpenstackIndex] = useState(0);
  const [isInjecting, setIsInjecting] = useState(false);
  const [isInjectingHdfs, setIsInjectingHdfs] = useState(false);
  const [isInjectingOpenstack, setIsInjectingOpenstack] = useState(false);
  const [activeDatasetTab, setActiveDatasetTab] = useState<"sre" | "hdfs" | "openstack">("sre");

  // Auto-select latest incident if list changes or first load
  useEffect(() => {
    if (incidents.length > 0 && !selectedIncidentId) {
      setSelectedIncidentId(incidents[0].id);
    }
  }, [incidents, selectedIncidentId]);



  const handleDownloadCorpus = () => {
    if (!corpus || corpus.length === 0) return;
    const blob = new Blob([JSON.stringify(corpus, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aira_sre_incident_corpus.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHdfs = () => {
    if (!hdfsCorpus || hdfsCorpus.length === 0) return;
    const blob = new Blob([JSON.stringify(hdfsCorpus, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aira_hdfs_log_anomaly_corpus.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadOpenstack = () => {
    if (!openstackCorpus || openstackCorpus.length === 0) return;
    const blob = new Blob([JSON.stringify(openstackCorpus, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aira_openstack_log_anomaly_corpus.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleInjectCorpus = async () => {
    const item = corpus[selectedCorpusIndex];
    if (item) {
      setIsInjecting(true);
      await triggerCorpusIncident(item.text, item.type, item.severity || "high");
      setIsInjecting(false);
    }
  };

  const handleInjectHdfs = async () => {
    const item = hdfsCorpus[selectedHdfsIndex];
    if (item) {
      setIsInjectingHdfs(true);
      await triggerCorpusIncident(item.text, item.type, item.severity || "high");
      setIsInjectingHdfs(false);
    }
  };

  const handleInjectOpenstack = async () => {
    const item = openstackCorpus[selectedOpenstackIndex];
    if (item) {
      setIsInjectingOpenstack(true);
      await triggerCorpusIncident(item.text, item.type, item.severity || "high");
      setIsInjectingOpenstack(false);
    }
  };



  // Update time every second for live feel
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Convert logs to agent reasoning format - simple deduplication
  const agentReasoning = logs.slice(0).reverse().filter((log, index, self) =>
    index === self.findIndex((l) => (
      l.message === log.message && l.agent === log.agent
    ))
  ).slice(0, 50).map((log, i) => ({
    agent: log.agent?.toLowerCase() || "planner",
    thought: log.message,
    time: typeof log.timestamp === 'string' ? log.timestamp : new Date(log.timestamp).toLocaleTimeString(),
  }));

  // Filter incidents
  const filteredIncidents = incidents.filter((incident) => {
    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "active" && incident.status !== "resolved") ||
      (statusFilter === "resolved" && incident.status === "resolved") ||
      (statusFilter === "resolved" && incident.status === "failed"); // Include failed in history maybe?
    const severityMatch =
      severityFilter === "all" || incident.severity === severityFilter;
    return statusMatch && severityMatch;
  });

  // Stats
  const stats = {
    total: incidents.length,
    critical: incidents.filter((i) => i.severity === "critical").length,
    active: incidents.filter((i) => i.status !== "resolved").length,
    resolved: incidents.filter((i) => i.status === "resolved").length,
    avgMTTR: Math.round(
      incidents
        .filter((i) => i.metrics.mttr)
        .reduce((acc, i) => acc + (i.metrics.mttr || 0), 0) /
      Math.max(incidents.filter((i) => i.metrics.mttr).length, 1)
    ),
  };

  const handleTriggerRemediation = async () => {
    if (selectedIncident) {
      setIsRemediating(true);
      // Trigger generic remediation action for this incident
      // Pass ID to link updates
      triggerIncident(
        `Manually triggered remediation for ${selectedIncident.title}`,
        "q_learning",
        selectedIncident.id
      );
      setTimeout(() => setIsRemediating(false), 2000);
    }
  };

  return (
    <DashboardPageLayout
      header={{
        title: "WAR ROOM",
        description: currentTime.toLocaleTimeString(),
        icon: <IncidentIcon className="ml-1 lg:ml-0 text-primary size-4 md:size-5" />,
      }}
    >
      {/* Live Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-lg bg-card border border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <div className="relative">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Total Incidents
            </span>
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-card border border-destructive/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent" />
          {stats.critical > 0 && (
            <div className="absolute top-2 right-2 size-2 rounded-full bg-destructive animate-pulse" />
          )}
          <div className="relative">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Critical
            </span>
            <p className="text-2xl font-bold text-destructive">
              {stats.critical}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-card border border-warning/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/10 to-transparent" />
          <div className="relative">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Active
            </span>
            <p className="text-2xl font-bold text-warning">{stats.active}</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-card border border-success/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent" />
          <div className="relative">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Resolved
            </span>
            <p className="text-2xl font-bold text-success">{stats.resolved}</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-card border border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <div className="relative">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Avg MTTR
            </span>
            <p className="text-2xl font-bold">{stats.avgMTTR}m</p>
          </div>
        </div>
      </div>

      {/* Grounded Corpus Benchmark Panels */}
      <div className="flex flex-col gap-4 p-4 rounded-lg bg-card/50 border border-border/30 relative overflow-hidden w-full shadow-[0_0_20px_rgba(0,0,0,0.2)]">

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              ⚖️ GROUNDED LOG BENCHMARKS & CORPUS DATASETS
            </span>
            <p className="text-xs text-muted-foreground">
              Select a benchmark suite to inject historical telemetry anomalies or download raw dataset files for offline review.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex flex-wrap border-b border-border/30 gap-1 mt-1">
            {corpus && corpus.length > 0 && (
              <button
                onClick={() => setActiveDatasetTab("sre")}
                className={cn(
                  "px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200",
                  activeDatasetTab === "sre"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                📚 SRE Postmortem Corpus ({corpus.length})
              </button>
            )}
            {hdfsCorpus && hdfsCorpus.length > 0 && (
              <button
                onClick={() => setActiveDatasetTab("hdfs")}
                className={cn(
                  "px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200",
                  activeDatasetTab === "hdfs"
                    ? "border-success text-success"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                📊 HDFS Loghub ({hdfsCorpus.length})
              </button>
            )}
            {openstackCorpus && openstackCorpus.length > 0 && (
              <button
                onClick={() => setActiveDatasetTab("openstack")}
                className={cn(
                  "px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200",
                  activeDatasetTab === "openstack"
                    ? "border-warning text-warning"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                ☁️ OpenStack Loghub ({openstackCorpus.length})
              </button>
            )}
          </div>

          {/* SRE Tab Content */}
          {activeDatasetTab === "sre" && corpus && corpus.length > 0 && (
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-1 animate-in fade-in duration-200">
              <div className="flex-1 min-w-0 pr-0 md:pr-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Inject real system faults compiled from AWS outages and Google SRE manuals. Evaluates the multi-agent system remediation pipeline on production failures.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                <select
                  value={selectedCorpusIndex}
                  onChange={(e) => setSelectedCorpusIndex(Number(e.target.value))}
                  className="bg-background border border-border/80 rounded px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary/50 font-mono h-9 w-full sm:w-[320px] md:w-[360px]"
                >
                  {corpus.map((item, idx) => (
                    <option key={item.id} value={idx}>
                      {item.id} [{item.type.toUpperCase()}] {item.text.slice(0, 42)}...
                    </option>
                  ))}
                </select>

                <Button
                  onClick={handleInjectCorpus}
                  disabled={isInjecting}
                  size="sm"
                  className="h-9 px-4 uppercase font-bold tracking-wider text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                >
                  {isInjecting ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                  ) : "⚡"}
                  Inject Case
                </Button>

                <Button
                  onClick={handleDownloadCorpus}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 bg-transparent border-border/80 hover:bg-accent/30 text-muted-foreground hover:text-foreground text-xs uppercase"
                  title="Download full benchmark SRE incident corpus as JSON"
                >
                  📥 Dataset
                </Button>
              </div>
            </div>
          )}

          {/* HDFS Tab Content */}
          {activeDatasetTab === "hdfs" && hdfsCorpus && hdfsCorpus.length > 0 && (
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-1 animate-in fade-in duration-200">
              <div className="flex-1 min-w-0 pr-0 md:pr-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Inject parsed HDFS log sequences from Amazon EC2 cluster testbeds. Benchmarks sequence-based log anomaly detection models and name/data node root-cause analysis logic.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                <select
                  value={selectedHdfsIndex}
                  onChange={(e) => setSelectedHdfsIndex(Number(e.target.value))}
                  className="bg-background border border-border/80 rounded px-3 py-1.5 text-xs text-foreground outline-none focus:border-success/50 font-mono h-9 w-full sm:w-[320px] md:w-[360px]"
                >
                  {hdfsCorpus.map((item, idx) => (
                    <option key={item.id} value={idx}>
                      {item.id} [{item.subtype.toUpperCase()}] {item.title.slice(0, 42)}...
                    </option>
                  ))}
                </select>

                <Button
                  onClick={handleInjectHdfs}
                  disabled={isInjectingHdfs}
                  size="sm"
                  className="h-9 px-4 uppercase font-bold tracking-wider text-xs bg-success hover:bg-success/90 text-success-foreground shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                >
                  {isInjectingHdfs ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                  ) : "⚡"}
                  Inject Case
                </Button>

                <Button
                  onClick={handleDownloadHdfs}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 bg-transparent border-border/80 hover:bg-accent/30 text-muted-foreground hover:text-foreground text-xs uppercase"
                  title="Download HDFS Loghub benchmark dataset as JSON"
                >
                  📥 Dataset
                </Button>
              </div>
            </div>
          )}

          {/* OpenStack Tab Content */}
          {activeDatasetTab === "openstack" && openstackCorpus && openstackCorpus.length > 0 && (
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-1 animate-in fade-in duration-200">
              <div className="flex-1 min-w-0 pr-0 md:pr-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Inject virtual machine hypervisor errors and physical interface binding failures from production OpenStack logs. Verifies AI orchestration resilience.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                <select
                  value={selectedOpenstackIndex}
                  onChange={(e) => setSelectedOpenstackIndex(Number(e.target.value))}
                  className="bg-background border border-border/80 rounded px-3 py-1.5 text-xs text-foreground outline-none focus:border-warning/50 font-mono h-9 w-full sm:w-[320px] md:w-[360px]"
                >
                  {openstackCorpus.map((item, idx) => (
                    <option key={item.id} value={idx}>
                      {item.id} [{item.subtype.toUpperCase()}] {item.title.slice(0, 42)}...
                    </option>
                  ))}
                </select>

                <Button
                  onClick={handleInjectOpenstack}
                  disabled={isInjectingOpenstack}
                  size="sm"
                  className="h-9 px-4 uppercase font-bold tracking-wider text-xs bg-warning hover:bg-warning/90 text-warning-foreground shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                >
                  {isInjectingOpenstack ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                  ) : "⚡"}
                  Inject Case
                </Button>

                <Button
                  onClick={handleDownloadOpenstack}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 bg-transparent border-border/80 hover:bg-accent/30 text-muted-foreground hover:text-foreground text-xs uppercase"
                  title="Download OpenStack Loghub benchmark dataset as JSON"
                >
                  📥 Dataset
                </Button>
              </div>
            </div>
          )}
        </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          Status:
        </span>
        <div className="flex gap-1">
          {(["all", "active", "resolved"] as FilterStatus[]).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={cn(
                "text-xs uppercase h-7",
                statusFilter !== status && "bg-transparent"
              )}
            >
              {status}
            </Button>
          ))}
        </div>

        <div className="w-px h-6 bg-border mx-2 hidden md:block" />

        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          Severity:
        </span>
        <div className="flex gap-1 flex-wrap">
          {(
            ["all", "critical", "high", "medium", "low"] as FilterSeverity[]
          ).map((severity) => (
            <Button
              key={severity}
              variant={severityFilter === severity ? "default" : "outline"}
              size="sm"
              onClick={() => setSeverityFilter(severity)}
              className={cn(
                "text-xs uppercase h-7",
                severityFilter !== severity && "bg-transparent",
                severityFilter === severity &&
                severity !== "all" &&
                severityConfig[severity as IncidentSeverity]?.bg
              )}
            >
              {severity}
            </Button>
          ))}
        </div>

        <div className="ml-auto text-xs text-muted-foreground">
          {filteredIncidents.length} incident
          {filteredIncidents.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Incident Queue - Left Column */}
        <DashboardCard
          header={{ title: "INCIDENT QUEUE", icon: IncidentIcon }}
          className="xl:col-span-1"
        >
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {filteredIncidents.map((incident) => {
              const severity = severityConfig[incident.severity];
              const status = statusConfig[incident.status] || statusConfig.detected;

              return (
                <button
                  key={incident.id}
                  onClick={() => setSelectedIncidentId(incident.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all",
                    "hover:border-primary/50",
                    selectedIncident?.id === incident.id
                      ? `bg-primary/10 border-primary/50 ${severity.glow}`
                      : "bg-card/50 border-border/30 hover:bg-accent/30"
                  )}
                >
                  {/* Severity indicator bar */}
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
                      severity.bg
                    )}
                  />

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                          severity.bg,
                          "text-background"
                        )}
                      >
                        {incident.severity}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {incident.id}
                      </span>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px]", status.bg)}>
                      {status.label}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                    {incident.title}
                  </h3>

                  {incident.status === 'resolved' ? (
                    <div className="flex items-center gap-1.5 text-xs text-success font-bold mt-1 mb-2 animate-pulse">
                      <span className="inline-block size-1.5 rounded-full bg-success" />
                      Solved & Remediated by AIRA
                    </div>
                  ) : incident.status === 'failed' ? (
                    <div className="flex items-center gap-1.5 text-xs text-destructive font-bold mt-1 mb-2">
                      <span className="inline-block size-1.5 rounded-full bg-destructive" />
                      Remediation Failed
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                      {incident.description}
                    </p>
                  )}


                  {/* Mini agent progress */}
                  <div className="flex items-center gap-1">
                    {(["planner", "rca", "fixer", "validator"] as const).map(
                      (agent) => {
                        const agentStatus = incident.agentProgress[agent];
                        const Icon = agentIcons[agent];
                        return (
                          <div
                            key={agent}
                            className={cn(
                              "size-5 rounded flex items-center justify-center",
                              agentStatus === "completed" &&
                              "bg-success/20 text-success",
                              agentStatus === "active" &&
                              "bg-primary/20 text-primary animate-pulse",
                              agentStatus === "idle" &&
                              "bg-muted/20 text-muted-foreground",
                              agentStatus === "failed" &&
                              "bg-destructive/20 text-destructive"
                            )}
                          >
                            <Icon className="size-3" />
                          </div>
                        );
                      }
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {new Date(incident.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredIncidents.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <IncidentIcon className="size-8 mx-auto mb-2 opacity-30" />
                <p>No incidents match filters</p>
              </div>
            )}
          </div>
        </DashboardCard>

        {/* Incident Detail - Middle Column */}
        <DashboardCard
          header={{
            title: selectedIncident
              ? `INCIDENT ${selectedIncident.id}`
              : "SELECT INCIDENT",
            icon: IncidentIcon,
          }}
          addon={
            selectedIncident && (
              <Badge
                className={cn(
                  severityConfig[selectedIncident.severity].bg,
                  "text-background"
                )}
              >
                {selectedIncident.severity.toUpperCase()}
              </Badge>
            )
          }
          className="xl:col-span-1"
        >
          {selectedIncident ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {/* Title & Description */}
              <div>
                {selectedIncident.status === "resolved" && (
                  <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/50 text-success flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(34,197,94,0.15)] animate-in fade-in zoom-in duration-300">
                    <div className="p-1 rounded-full bg-success text-background">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-4"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="font-bold tracking-widest text-lg">
                      INCIDENT RESOLVED
                    </span>
                  </div>
                )}
                <h2 className="text-lg font-bold mb-1">
                  {selectedIncident.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedIncident.description}
                </p>
              </div>

              {/* Timeline */}
              <div className="relative pl-4 border-l-2 border-primary/30 space-y-3">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 size-3 rounded-full bg-primary" />
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(selectedIncident.detectedAt).toLocaleString()}
                  </span>
                  <p className="text-sm font-medium">Incident Detected</p>
                </div>

                {selectedIncident.rootCause && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 size-3 rounded-full bg-warning" />
                    <span className="text-[10px] text-muted-foreground">
                      Root Cause
                    </span>
                    <p className="text-sm">{selectedIncident.rootCause}</p>
                  </div>
                )}

                {selectedIncident.resolution && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 size-3 rounded-full bg-success" />
                    <span className="text-[10px] text-muted-foreground">
                      Resolution
                    </span>
                    <p className="text-sm">{selectedIncident.resolution}</p>
                  </div>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded bg-accent/30 border border-border/30">
                  <span className="text-[10px] text-muted-foreground uppercase">
                    Status
                  </span>
                  <p
                    className={cn(
                      "font-bold",
                      statusConfig[selectedIncident.status].color
                    )}
                  >
                    {statusConfig[selectedIncident.status].label}
                  </p>
                </div>
                <div className="p-3 rounded bg-accent/30 border border-border/30">
                  <span className="text-[10px] text-muted-foreground uppercase">
                    Confidence
                  </span>
                  <p className="font-bold text-primary">
                    {selectedIncident.metrics.confidence}%
                  </p>
                </div>
                {selectedIncident.metrics.mttr && (
                  <div className="p-3 rounded bg-accent/30 border border-border/30">
                    <span className="text-[10px] text-muted-foreground uppercase">
                      MTTR
                    </span>
                    <p className="font-bold">
                      {selectedIncident.metrics.mttr} min
                    </p>
                  </div>
                )}
                <div className="p-3 rounded bg-accent/30 border border-border/30">
                  <span className="text-[10px] text-muted-foreground uppercase">
                    Category
                  </span>
                  <p className="font-bold uppercase text-xs">
                    {selectedIncident.category}
                  </p>
                </div>
              </div>

              {/* Affected Systems */}
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block mb-2">
                  Affected Systems
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedIncident.affectedSystems.map((system) => (
                    <Badge
                      key={system}
                      variant="outline"
                      className="font-mono text-xs bg-transparent"
                    >
                      {system}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Agent Pipeline */}
              <div className="py-4">
                <span className="text-[10px] text-muted-foreground uppercase block mb-3 text-center tracking-widest">
                  Remediation Pipeline
                </span>
                <div className="flex items-center justify-center gap-2 relative">
                  {/* Background Line */}
                  <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-border -z-10" />

                  {(["planner", "rca", "fixer", "validator"] as const).map(
                    (agent, i) => {
                      const isCurrentlyActiveIncident = wsStatus?.currentIncidentId === selectedIncident.id;
                      const agentStatus = isCurrentlyActiveIncident
                        ? agentPipeline[agent]
                        : selectedIncident.agentProgress[agent];
                      const Icon = agentIcons[agent];
                      const isActive = agentStatus === "active";
                      const isCompleted = agentStatus === "completed";

                      return (
                        <div key={agent} className="flex flex-col items-center gap-2 bg-card px-2 z-10">
                          <div
                            className={cn(
                              "size-10 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                              isCompleted && "bg-success text-success border-success",
                              isActive && "bg-primary/20 text-primary border-primary shadow-[0_0_20px_rgba(0,240,255,0.4)] scale-110",
                              agentStatus === "idle" && "bg-card border-muted text-muted-foreground",
                              agentStatus === "failed" && "bg-destructive/20 text-destructive border-destructive"
                            )}
                          >
                            <Icon
                              className={cn(
                                "size-5",
                                isActive && "animate-pulse"
                              )}
                            />
                          </div>
                          <span className={cn(
                            "text-[9px] uppercase font-bold tracking-wider",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )}>
                            {agent}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-border/30">
                {selectedIncident.status !== "resolved" ? (
                  <>
                    <Button
                      className={cn(
                        "flex-1",
                        isRemediating && "animate-pulse"
                      )}
                      onClick={handleTriggerRemediation}
                      disabled={isRemediating}
                    >
                      {isRemediating ? "REMEDIATING..." : "TRIGGER REMEDIATION"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent border-destructive/50 text-destructive hover:bg-destructive/10"
                    >
                      ESCALATE
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                    >
                      VIEW POSTMORTEM
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                    >
                      EXPORT REPORT
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
              <IncidentIcon className="size-12 mb-3 opacity-20" />
              <p>Select an incident to view details</p>
            </div>
          )}
        </DashboardCard>

        {/* Right Column - AI Intelligence */}
        <div className="space-y-4 xl:col-span-1">
          {/* Agent Reasoning Feed */}
          <DashboardCard header={{ title: "AGENT REASONING", icon: MemoryIcon }}>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {agentReasoning.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-xs">Waiting for agent activity...</div>
              ) : agentReasoning.map((entry, i) => {
                const Icon = agentIcons[entry.agent as keyof typeof agentIcons] || PlannerIcon;

                // Try to parse thought if it looks like JSON/Dict
                let parsedThought = null;
                if (typeof entry.thought === 'string' && (entry.thought.startsWith('{') || entry.thought.startsWith('['))) {
                  try {
                    // Replace single quotes with double quotes for JSON parsing (basic python dict support)
                    const jsonStr = entry.thought.replace(/'/g, '"').replace(/True/g, 'true').replace(/False/g, 'false').replace(/None/g, 'null');
                    parsedThought = JSON.parse(jsonStr);
                  } catch (e) {
                    // Keep as string if parsing fails
                  }
                }

                return (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-accent/20 border border-border/30 relative overflow-hidden"
                  >
                    {/* Timeline connector visual */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border/50" />

                    <div className="flex items-center gap-2 mb-2 pl-2">
                      <div className="p-1 rounded bg-primary/20">
                        <Icon className="size-3 text-primary" />
                      </div>
                      <span className="text-xs font-bold uppercase text-primary tracking-wider">
                        {entry.agent}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                        {entry.time}
                      </span>
                    </div>

                    <div className="pl-2">
                      {parsedThought ? (
                        <div className="text-xs font-mono space-y-1 bg-black/20 p-2 rounded border border-white/5">
                          {Object.entries(parsedThought).map(([key, value]) => {
                            if (key === 'next_action' || key === 'status' || key === 'root_cause') {
                              return (
                                <div key={key} className="flex gap-2">
                                  <span className="text-muted-foreground">{key}:</span>
                                  <span className={cn(
                                    "font-bold",
                                    key === 'status' && value === 'resolved' ? 'text-success' : 'text-primary'
                                  )}>{String(value)}</span>
                                </div>
                              )
                            }
                            if (key === 'confidence') {
                              return (
                                <div key={key} className="flex gap-2">
                                  <span className="text-muted-foreground">{key}:</span>
                                  <span className="text-warning">{String(value)}</span>
                                </div>
                              )
                            }
                            return (
                              <div key={key} className="flex gap-2 break-all">
                                <span className="text-muted-foreground opacity-70">{key}:</span>
                                <span className="text-foreground/80">{Array.isArray(value) ? `[${value.length} items]` : String(value).slice(0, 100)}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {entry.thought}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </DashboardCard>

          {/* Correlated Incidents from Semantic Memory */}
          <DashboardCard
            header={{ title: "SIMILAR INCIDENTS", icon: MemoryIcon }}
            addon={
              <span className="text-[10px] text-muted-foreground">
                from semantic memory
              </span>
            }
          >
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
              {getSimilarIncidents(selectedIncident).map((incident) => (
                <div
                  key={incident.id}
                  className="p-3 rounded-lg bg-accent/20 border border-border/30 hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {incident.id}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-bold",
                        incident.similarity >= 90
                          ? "text-success"
                          : incident.similarity >= 70
                            ? "text-primary"
                            : "text-muted-foreground"
                      )}
                    >
                      {incident.similarity}% match
                    </span>
                  </div>
                  <h4 className="text-sm font-medium mb-1">{incident.title}</h4>
                  <p className="text-[10px] text-muted-foreground">
                    Resolution: {incident.resolution}
                  </p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
