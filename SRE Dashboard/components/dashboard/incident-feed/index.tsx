"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import DashboardCard from "@/components/dashboard/card";
import { Bullet } from "@/components/ui/bullet";
import {
  DatabaseIcon,
  ServerIcon,
  NetworkIcon,
  MemoryIcon,
  IncidentIcon,
} from "@/components/icons/agents";
import ProcessorIcon from "@/components/icons/proccesor";
import type { Incident, IncidentCategory, IncidentSeverity, IncidentStatus } from "@/types/aira";

const categoryIcons: Partial<Record<IncidentCategory, React.ElementType>> = {
  database: DatabaseIcon,
  server: ServerIcon,
  network: NetworkIcon,
  memory: MemoryIcon,
  cpu: ProcessorIcon,
  api: ServerIcon,
  storage: DatabaseIcon,
  security: ServerIcon,
};

const severityColors: Record<IncidentSeverity, string> = {
  critical: "border-destructive bg-destructive/5 text-destructive",
  high: "border-warning bg-warning/5 text-warning",
  medium: "border-primary bg-primary/5 text-primary",
  low: "border-muted-foreground bg-muted text-muted-foreground",
};

const statusLabels: Record<IncidentStatus, string> = {
  detected: "DETECTED",
  analyzing: "ANALYZING",
  remediating: "REMEDIATING",
  validating: "VALIDATING",
  resolved: "RESOLVED",
  failed: "FAILED",
};

const statusBadgeVariants: Record<IncidentStatus, "default" | "outline" | "secondary" | "destructive" | "outline-success" | "outline-warning"> = {
  detected: "destructive",
  analyzing: "outline-warning",
  remediating: "outline-warning",
  validating: "outline",
  resolved: "outline-success",
  failed: "destructive",
};

interface IncidentItemProps {
  incident: Incident;
  compact?: boolean;
}

function IncidentItem({ incident, compact }: IncidentItemProps) {
  const Icon = categoryIcons[incident.category] || IncidentIcon;
  const isActive = ["detected", "analyzing", "remediating", "validating"].includes(incident.status);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-2 rounded-lg border transition-all hover:bg-accent/50",
          severityColors[incident.severity]
        )}
      >
        <div className="size-8 rounded flex items-center justify-center bg-background/50">
          <Icon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium truncate">{incident.id}</span>
            <Badge variant={statusBadgeVariants[incident.status]} className="text-[9px]">
              {statusLabels[incident.status]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">{incident.title}</p>
        </div>
        <span className="text-[10px] text-muted-foreground">{formatTime(incident.detectedAt)}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative p-4 rounded-lg border transition-all",
        severityColors[incident.severity],
        isActive && "ring-1 ring-current/20"
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-60" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "size-10 rounded-lg flex items-center justify-center",
              isActive ? "bg-current/10" : "bg-background/50"
            )}
          >
            <Icon className={cn("size-5", isActive && "animate-pulse")} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{incident.id}</span>
              <Badge
                variant={
                  incident.severity === "critical"
                    ? "destructive"
                    : incident.severity === "high"
                      ? "outline-warning"
                      : "outline"
                }
                className="text-[10px] uppercase"
              >
                {incident.severity}
              </Badge>
            </div>
            <h3 className="text-sm font-medium mt-0.5">{incident.title}</h3>
          </div>
        </div>
        <Badge variant={statusBadgeVariants[incident.status]} className="text-[10px]">
          {statusLabels[incident.status]}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-3">{incident.description}</p>

      {/* Agent Progress */}
      <div className="flex items-center gap-1 mb-3">
        {(["planner", "rca", "fixer", "validator"] as const).map((agent, index) => {
          const status = incident.agentProgress[agent];
          return (
            <React.Fragment key={agent}>
              <div
                className={cn(
                  "size-6 rounded-full flex items-center justify-center text-[10px] font-bold border",
                  status === "completed" && "bg-success/20 border-success text-success",
                  status === "active" && "bg-primary/20 border-primary text-primary animate-pulse",
                  status === "idle" && "bg-muted border-muted-foreground/30 text-muted-foreground",
                  status === "failed" && "bg-destructive/20 border-destructive text-destructive"
                )}
              >
                {index + 1}
              </div>
              {index < 3 && (
                <div
                  className={cn(
                    "w-4 h-0.5",
                    status === "completed" ? "bg-success" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
        <span className="ml-2 text-[10px] text-muted-foreground">
          {incident.metrics.confidence}% confidence
        </span>
      </div>

      {/* Affected Systems */}
      <div className="flex flex-wrap gap-1">
        {incident.affectedSystems.slice(0, 3).map((system) => (
          <span
            key={system}
            className="text-[10px] px-2 py-0.5 rounded bg-background/50 text-muted-foreground"
          >
            {system}
          </span>
        ))}
        {incident.affectedSystems.length > 3 && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-background/50 text-muted-foreground">
            +{incident.affectedSystems.length - 3} more
          </span>
        )}
      </div>

      {/* Resolution Info (for resolved incidents) */}
      {incident.status === "resolved" && incident.resolution && (
        <div className="mt-3 pt-3 border-t border-current/10">
          <div className="flex items-center gap-2 mb-1">
            <Bullet size="sm" variant="success" />
            <span className="text-[10px] uppercase text-success">Resolution</span>
          </div>
          <p className="text-xs text-muted-foreground">{incident.resolution}</p>
          {incident.metrics.mttr && (
            <p className="text-[10px] text-success mt-1">MTTR: {incident.metrics.mttr} minutes</p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-current/10">
        <span className="text-[10px] text-muted-foreground">
          Detected: {formatTime(incident.detectedAt)}
        </span>
        {incident.resolvedAt && (
          <span className="text-[10px] text-success">
            Resolved: {formatTime(incident.resolvedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

interface IncidentFeedProps {
  incidents: Incident[];
  compact?: boolean;
  maxItems?: number;
}

export default function IncidentFeed({ incidents, compact, maxItems = 6 }: IncidentFeedProps) {
  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const resolvedIncidents = incidents.filter((i) => i.status === "resolved");

  const displayIncidents = incidents.slice(0, maxItems);

  return (
    <DashboardCard
      title="INCIDENT FEED"
      intent={activeIncidents.length > 0 ? "default" : "success"}
      addon={
        <div className="flex items-center gap-2">
          {activeIncidents.length > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {activeIncidents.length} ACTIVE
            </Badge>
          )}
          <Badge variant="outline-success" className="text-[10px]">
            {resolvedIncidents.length} RESOLVED
          </Badge>
        </div>
      }
    >
      <div className={cn("space-y-3", compact && "space-y-2")}>
        {displayIncidents.map((incident) => (
          <IncidentItem key={incident.id} incident={incident} compact={compact} />
        ))}
      </div>
    </DashboardCard>
  );
}
