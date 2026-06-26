"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAIRA } from "@/lib/aira-provider";

interface WidgetData {
  environment: string;
  region: string;
  activeIncidents: number;
  systemStatus: "operational" | "degraded" | "outage";
  timestamp: string;
}

interface WidgetProps {
  widgetData: WidgetData;
}

export default function Widget({ widgetData }: WidgetProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get real data from AIRA backend
  const { incidents, isConnected } = useAIRA();

  // Compute real-time widget data
  const activeIncidents = isConnected ? incidents.filter(i => i.status !== "resolved").length : widgetData.activeIncidents;
  const systemStatus = activeIncidents === 0 ? "operational" : activeIncidents > 3 ? "outage" : "degraded";

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    const dayOfWeek = date.toLocaleDateString("en-US", {
      weekday: "long",
    });
    const restOfDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    return { dayOfWeek, restOfDate };
  };

  const dateInfo = formatDate(currentTime);

  const statusColors = {
    operational: "bg-success text-success-foreground",
    degraded: "bg-warning text-warning-foreground",
    outage: "bg-destructive text-destructive-foreground",
  };

  const statusLabels = {
    operational: "ALL SYSTEMS OPERATIONAL",
    degraded: "DEGRADED PERFORMANCE",
    outage: "SYSTEM OUTAGE",
  };

  return (
    <Card className="w-full aspect-[2] relative overflow-hidden border border-border/50 bg-card">
      <CardContent className="flex-1 flex flex-col justify-between p-4 text-sm font-medium uppercase relative z-20">
        {/* Top Row - Date and Environment */}
        <div className="flex justify-between items-center">
          <span className="opacity-50">{dateInfo.dayOfWeek}</span>
          <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
            {widgetData.environment}
          </Badge>
        </div>

        {/* Center - Time and Status */}
        <div className="text-center">
          <div className="text-5xl font-display text-primary" suppressHydrationWarning>
            {formatTime(currentTime)}
          </div>
          <Badge
            className={cn(
              "mt-2 text-[10px]",
              systemStatus === "operational" && "bg-success/20 text-success border-success/30",
              systemStatus === "degraded" && "bg-warning/20 text-warning border-warning/30 animate-pulse",
              systemStatus === "outage" && "bg-destructive/20 text-destructive border-destructive/30 animate-pulse"
            )}
            variant="outline"
          >
            {statusLabels[systemStatus]}
          </Badge>
        </div>

        {/* Bottom Row - Region and Incidents */}
        <div className="flex justify-between items-center">
          <span className="opacity-50 text-xs">{dateInfo.restOfDate}</span>
          <span className="text-xs">{widgetData.region}</span>
          <Badge
            variant={activeIncidents > 0 ? "destructive" : "secondary"}
            className={cn(
              "text-[10px]",
              activeIncidents > 0 && "animate-pulse"
            )}
          >
            {activeIncidents} ACTIVE
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
