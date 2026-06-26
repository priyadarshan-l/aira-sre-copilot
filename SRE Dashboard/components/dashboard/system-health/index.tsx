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
} from "@/components/icons/agents";
import ProcessorIcon from "@/components/icons/proccesor";
import type { SystemHealth, IncidentCategory } from "@/types/aira";

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

const statusVariants = {
  healthy: "success" as const,
  degraded: "warning" as const,
  critical: "destructive" as const,
};

interface SystemHealthItemProps {
  system: SystemHealth;
}

function SystemHealthItem({ system }: SystemHealthItemProps) {
  const Icon = categoryIcons[system.category] || ServerIcon;
  const variant = statusVariants[system.status];

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all",
        system.status === "healthy" && "border-success/20 bg-success/5",
        system.status === "degraded" && "border-warning/20 bg-warning/5",
        system.status === "critical" && "border-destructive/20 bg-destructive/5"
      )}
    >
      <div
        className={cn(
          "size-10 rounded-lg flex items-center justify-center",
          system.status === "healthy" && "bg-success/10 text-success",
          system.status === "degraded" && "bg-warning/10 text-warning",
          system.status === "critical" && "bg-destructive/10 text-destructive"
        )}
      >
        <Icon className="size-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{system.name}</span>
          <Bullet size="sm" variant={variant} className={cn(
            system.status === "critical" && "animate-pulse"
          )} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {system.uptime}% uptime
          </span>
          {system.lastIncident && (
            <span className="text-xs text-muted-foreground">
              | Last incident: {system.lastIncident}
            </span>
          )}
        </div>
      </div>

      <Badge
        variant={
          system.status === "healthy"
            ? "outline-success"
            : system.status === "degraded"
            ? "outline-warning"
            : "destructive"
        }
        className="text-[10px] uppercase"
      >
        {system.status}
      </Badge>
    </div>
  );
}

interface SystemHealthListProps {
  systems: SystemHealth[];
}

export default function SystemHealthList({ systems }: SystemHealthListProps) {
  const healthyCount = systems.filter((s) => s.status === "healthy").length;
  const degradedCount = systems.filter((s) => s.status === "degraded").length;
  const criticalCount = systems.filter((s) => s.status === "critical").length;

  return (
    <DashboardCard
      title="SYSTEM HEALTH"
      intent={criticalCount > 0 ? "default" : "success"}
      addon={
        <div className="flex items-center gap-2 text-xs">
          <span className="text-success">{healthyCount} OK</span>
          {degradedCount > 0 && (
            <span className="text-warning">{degradedCount} DEGRADED</span>
          )}
          {criticalCount > 0 && (
            <span className="text-destructive">{criticalCount} CRITICAL</span>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {systems.map((system, index) => (
          <SystemHealthItem key={index} system={system} />
        ))}
      </div>
    </DashboardCard>
  );
}
