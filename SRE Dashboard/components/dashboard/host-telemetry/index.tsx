"use client";

import React, { useState } from "react";
import { useAIRA } from "@/lib/aira-provider";
import DashboardCard from "@/components/dashboard/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bullet } from "@/components/ui/bullet";
import { Cpu, Database, Activity, Loader2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, YAxis, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export default function HostTelemetry() {
  const { hostMetrics, triggerHostSpike } = useAIRA();
  const [triggeringCpu, setTriggeringCpu] = useState(false);
  const [triggeringRam, setTriggeringRam] = useState(false);

  if (!hostMetrics) {
    return (
      <DashboardCard title="HOST TELEMETRY" intent="info">
        <div className="flex items-center justify-center h-[280px] text-muted-foreground gap-2 font-mono text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Establishing host metrics connection...
        </div>
      </DashboardCard>
    );
  }

  const { current, history, cpu_cores } = hostMetrics;

  const handleCpuSpike = async () => {
    setTriggeringCpu(true);
    await triggerHostSpike("cpu", 15);
    setTriggeringCpu(false);
  };

  const handleRamSpike = async () => {
    setTriggeringRam(true);
    await triggerHostSpike("ram", 15, 1.2);
    setTriggeringRam(false);
  };

  // Format chart history data: map timestamp to index or string
  const chartData = history.map((dp, idx) => ({
    ...dp,
    name: idx.toString(),
  }));

  const chartConfig = {
    cpu: { label: "CPU Usage (%)", color: "var(--primary)" },
    ram: { label: "RAM Usage (%)", color: "var(--success)" },
  };

  return (
    <DashboardCard
      title="LOCAL HOST TELEMETRY (MAC)"
      intent={current.cpu_spike_active || current.ram_spike_active ? "destructive" : "default"}
      addon={
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[10px] uppercase font-mono px-2 py-0.5 border-border/50 text-muted-foreground">
            {cpu_cores} Cores
          </Badge>
          <div className="flex items-center gap-1.5 text-xs">
            <Bullet className={current.cpu_spike_active || current.ram_spike_active ? "bg-destructive" : "bg-success"} />
            <span className={current.cpu_spike_active || current.ram_spike_active ? "text-destructive font-semibold" : "text-success"}>
              {current.cpu_spike_active || current.ram_spike_active ? "SIMULATION ACTIVE" : "NORMAL"}
            </span>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Metrics & Simulation Actions */}
        <div className="xl:col-span-1 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* CPU Stats */}
            <div className="p-3.5 rounded-lg bg-accent/40 border border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Cpu className="size-4.5" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">Host CPU Usage</div>
                  <div className="text-xl font-bold font-mono tracking-tight mt-0.5">
                    {current.cpu_percent.toFixed(1)}%
                  </div>
                </div>
              </div>
              {current.cpu_spike_active && (
                <Badge variant="destructive" className="text-[9px] uppercase font-mono px-1.5 animate-pulse">
                  Busy Loop Active
                </Badge>
              )}
            </div>

            {/* RAM Stats */}
            <div className="p-3.5 rounded-lg bg-accent/40 border border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center text-success">
                  <Database className="size-4.5" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">Host Memory (RAM)</div>
                  <div className="text-xl font-bold font-mono tracking-tight mt-0.5">
                    {current.ram_percent.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground font-mono">
                  {current.ram_used_gb.toFixed(1)} / {current.ram_total_gb.toFixed(0)} GB
                </div>
                {current.ram_spike_active && (
                  <Badge variant="destructive" className="text-[9px] uppercase font-mono px-1.5 mt-1 animate-pulse">
                    RAM Spiked
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="grid grid-cols-2 xl:grid-cols-1 gap-3 pt-2">
            <Button
              variant={current.cpu_spike_active ? "destructive" : "outline"}
              onClick={handleCpuSpike}
              disabled={current.cpu_spike_active || current.ram_spike_active || triggeringCpu}
              className="w-full text-xs uppercase h-9 bg-transparent"
            >
              {triggeringCpu ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                  Spiking...
                </>
              ) : current.cpu_spike_active ? (
                "CPU Spike Running"
              ) : (
                "Spike CPU"
              )}
            </Button>
            <Button
              variant={current.ram_spike_active ? "destructive" : "outline"}
              onClick={handleRamSpike}
              disabled={current.cpu_spike_active || current.ram_spike_active || triggeringRam}
              className="w-full text-xs uppercase h-9 bg-transparent"
            >
              {triggeringRam ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                  Spiking...
                </>
              ) : current.ram_spike_active ? (
                "RAM Spike Running"
              ) : (
                "Spike RAM"
              )}
            </Button>
          </div>
        </div>

        {/* Right: Recharts Observability AreaChart */}
        <div className="xl:col-span-2 min-h-[180px] bg-accent/20 border border-border/40 rounded-lg p-3 relative">
          <div className="absolute top-2 left-3 flex gap-4 text-[10px] font-mono uppercase text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Bullet className="bg-primary size-1.5" />
              <span>CPU Usage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bullet className="bg-success size-1.5" />
              <span>RAM Usage</span>
            </div>
          </div>

          <ChartContainer config={chartConfig} className="w-full h-[180px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="hostCpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="hostRamGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="name" hide />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} className="text-[10px] font-mono fill-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent className="font-mono text-xs" />} />
                <Area
                  type="monotone"
                  dataKey="cpu_percent"
                  name="CPU %"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#hostCpuGrad)"
                  dot={false}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="ram_percent"
                  name="RAM %"
                  stroke="var(--success)"
                  strokeWidth={2}
                  fill="url(#hostRamGrad)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
    </DashboardCard>
  );
}
