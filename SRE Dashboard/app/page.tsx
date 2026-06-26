"use client";

import { useState } from "react";
import { useAIRA } from "@/lib/aira-provider";
import DashboardPageLayout from "@/components/dashboard/layout";
import AIRAStat from "@/components/dashboard/aira-stat";
import AIRAChart from "@/components/dashboard/aira-chart";
import AgentPipeline from "@/components/dashboard/agent-pipeline";
import IncidentFeed from "@/components/dashboard/incident-feed";
import SystemHealthList from "@/components/dashboard/system-health";
import IncidentTimeline from "@/components/dashboard/incident-timeline";
import HostTelemetry from "@/components/dashboard/host-telemetry";
import AiraIcon from "@/components/icons/aira";
import { IncidentIcon } from "@/components/icons/agents";
import ProcessorIcon from "@/components/icons/proccesor";
import GearIcon from "@/components/icons/gear";
import BoomIcon from "@/components/icons/boom";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { airaMockData } from "@/data/aira-mock";

export default function DashboardOverview() {
  // Get REAL data from backend
  const { metrics, agents, incidents, systemHealth, isLoading, isConnected, wsStatus, triggerHostSpike, hostMetrics } = useAIRA();

  // Use chart data from mock for now (will add chart API endpoint later)
  const { chartData } = airaMockData;

  // Demo button state
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  // Find the current active incident being worked on
  const activeIncident = wsStatus.currentIncident ||
    incidents.find((i) => i.status === "analyzing" || i.status === "remediating" || i.status === "validating")?.id;

  // Is the system currently processing an incident?
  const isProcessing = wsStatus.mode === "running";
  const isSpikeActive = hostMetrics?.current.cpu_spike_active || hostMetrics?.current.ram_spike_active || false;

  const handleRunDemo = async () => {
    setIsDemoRunning(true);
    await triggerHostSpike("cpu", 15);
    // Button stays in loading state until the incident resolves
    // We'll reset it when wsStatus goes to complete
    setTimeout(() => setIsDemoRunning(false), 3000);
  };

  return (
    <DashboardPageLayout
      header={{
        title: "Command Center",
        description: `AIRA v2.4.1 | ${isConnected ? "Connected" : "Connecting..."} | ${metrics.totalIncidents} Total Incidents`,
        icon: <AiraIcon className="ml-1 lg:ml-0 text-primary size-4 md:size-5" />,
      }}
      headerAddon={
        <Button
          onClick={handleRunDemo}
          disabled={isDemoRunning || isProcessing || isSpikeActive}
          className={
            isProcessing
              ? "bg-warning/20 text-warning border border-warning/30 hover:bg-warning/30 gap-2 text-xs uppercase font-bold tracking-wider h-9 px-4"
              : "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 gap-2 text-xs uppercase font-bold tracking-wider h-9 px-4 shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all"
          }
        >
          {isProcessing ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Resolving Incident...
            </>
          ) : isDemoRunning ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Triggering...
            </>
          ) : (
            <>
              <Play className="size-3.5" />
              Run Live Demo
            </>
          )}
        </Button>
      }
    >
      {/* Key Metrics Row - Glass Cards with Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <AIRAStat
          label="ACTIVE INCIDENTS"
          value={String(incidents.filter((i) => i.status !== "resolved").length)}
          description="REQUIRING ATTENTION"
          icon={IncidentIcon}
          intent="negative"
          trend={{
            direction: metrics.resolvedToday > 5 ? "down" : "up",
            value: `${((metrics.resolvedToday / Math.max(metrics.totalIncidents, 1)) * 100).toFixed(0)}%`,
            isGood: metrics.resolvedToday > 5,
          }}
        />
        <AIRAStat
          label="RESOLVED TODAY"
          value={String(metrics.resolvedToday)}
          description="INCIDENTS REMEDIATED"
          icon={GearIcon}
          intent="positive"
          trend={{
            direction: "up",
            value: `${metrics.successRate.toFixed(0)}%`,
            isGood: true,
          }}
        />
        <AIRAStat
          label="AVG MTTR"
          value={`${metrics.avgMTTR.toFixed(1)}m`}
          description="MEAN TIME TO RESOLVE"
          icon={ProcessorIcon}
          intent="info"
          tag={metrics.avgMTTR < 5 ? "FAST" : metrics.avgMTTR < 10 ? "NORMAL" : "SLOW"}
        />
        <AIRAStat
          label="AI ACCURACY"
          value={`${metrics.successRate.toFixed(1)}%`}
          description="REMEDIATION SUCCESS"
          icon={BoomIcon}
          intent={metrics.successRate > 90 ? "positive" : metrics.successRate > 70 ? "info" : "negative"}
        />
      </div>

      {/* Agent Neural Pipeline - The "Brain" - Now with REAL data */}
      <AgentPipeline agents={agents} currentIncident={activeIncident} />

      {/* Real Host Telemetry observing the local Mac */}
      <HostTelemetry />

      {/* Incident Timeline + System Health Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Live Incident Resolution Timeline */}
        <IncidentTimeline />
        <SystemHealthList systems={systemHealth} />
      </div>

      {/* Chart Section */}
      <AIRAChart chartData={chartData} />
    </DashboardPageLayout>
  );
}
