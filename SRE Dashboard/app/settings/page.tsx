"use client";

import DashboardPageLayout from "@/components/dashboard/layout";
import { DashboardCard } from "@/components/dashboard/card";
import GearIcon from "@/components/icons/gear";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General" },
    { id: "agents", label: "Agent Config" },
    { id: "thresholds", label: "Thresholds" },
    { id: "integrations", label: "Integrations" },
    { id: "notifications", label: "Notifications" },
  ];

  return (
    <DashboardPageLayout
      header={{
        title: "SETTINGS",
        description: "System Configuration",
        icon: GearIcon,
      }}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 shrink-0">
          <DashboardCard title="Configuration">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded text-sm transition-colors",
                    activeTab === tab.id
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-accent/50 text-foreground/70"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </DashboardCard>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {activeTab === "general" && (
            <>
              <DashboardCard title="Environment">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase mb-2 block">
                        Environment Name
                      </label>
                      <Input defaultValue="PRODUCTION" className="bg-background/50" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase mb-2 block">
                        Region
                      </label>
                      <Input defaultValue="US-EAST-1" className="bg-background/50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase mb-2 block">
                      Backend API Endpoint
                    </label>
                    <Input defaultValue="https://api.aira.internal/v1" className="bg-background/50" />
                  </div>
                </div>
              </DashboardCard>

              <DashboardCard title="Simulation Mode">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded bg-accent/30 border border-border/50">
                    <div>
                      <div className="text-sm font-medium">Enable Simulation Mode</div>
                      <div className="text-xs text-muted-foreground">
                        Run AIRA with simulated incidents for demos
                      </div>
                    </div>
                    <Button variant="outline" size="sm">ENABLE</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded bg-accent/30 border border-border/50">
                    <div>
                      <div className="text-sm font-medium">Auto-Generate Incidents</div>
                      <div className="text-xs text-muted-foreground">
                        Periodically create fake incidents in simulation mode
                      </div>
                    </div>
                    <Button variant="outline" size="sm">CONFIGURE</Button>
                  </div>
                </div>
              </DashboardCard>
            </>
          )}

          {activeTab === "agents" && (
            <>
              <DashboardCard title="Agent Behavior">
                <div className="space-y-4">
                  {[
                    { name: "Planner", desc: "Incident classification and planning", enabled: true },
                    { name: "RCA Agent", desc: "Root cause analysis", enabled: true },
                    { name: "Fixer", desc: "Automated remediation", enabled: true },
                    { name: "Validator", desc: "Post-fix validation", enabled: true },
                  ].map((agent) => (
                    <div key={agent.name} className="flex items-center justify-between p-3 rounded bg-accent/30 border border-border/50">
                      <div>
                        <div className="text-sm font-medium">{agent.name}</div>
                        <div className="text-xs text-muted-foreground">{agent.desc}</div>
                      </div>
                      <Badge className={cn(
                        "text-[10px]",
                        agent.enabled ? "bg-success/20 text-success border-success/30" : "bg-muted text-muted-foreground"
                      )}>
                        {agent.enabled ? "ENABLED" : "DISABLED"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </DashboardCard>

              <DashboardCard title="Guardrails">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded bg-accent/30 border border-border/50">
                    <div>
                      <div className="text-sm font-medium">Require Human Approval</div>
                      <div className="text-xs text-muted-foreground">
                        Require manual approval before executing critical fixes
                      </div>
                    </div>
                    <Button variant="outline" size="sm">ENABLED</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded bg-accent/30 border border-border/50">
                    <div>
                      <div className="text-sm font-medium">Auto-Rollback</div>
                      <div className="text-xs text-muted-foreground">
                        Automatically rollback if validation fails
                      </div>
                    </div>
                    <Button variant="outline" size="sm">ENABLED</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded bg-accent/30 border border-border/50">
                    <div>
                      <div className="text-sm font-medium">Confidence Threshold</div>
                      <div className="text-xs text-muted-foreground">
                        Minimum confidence to auto-execute (currently 85%)
                      </div>
                    </div>
                    <Input defaultValue="85" className="w-20 text-center bg-background/50" />
                  </div>
                </div>
              </DashboardCard>
            </>
          )}

          {activeTab === "thresholds" && (
            <DashboardCard title="Alert Thresholds">
              <div className="space-y-4">
                {[
                  { metric: "CPU Usage", warning: 70, critical: 90, unit: "%" },
                  { metric: "Memory Usage", warning: 75, critical: 95, unit: "%" },
                  { metric: "Disk Usage", warning: 80, critical: 95, unit: "%" },
                  { metric: "Error Rate", warning: 1, critical: 5, unit: "%" },
                  { metric: "Latency P99", warning: 500, critical: 1000, unit: "ms" },
                ].map((threshold) => (
                  <div key={threshold.metric} className="grid grid-cols-3 gap-4 items-center p-3 rounded bg-accent/30 border border-border/50">
                    <div>
                      <div className="text-sm font-medium">{threshold.metric}</div>
                    </div>
                    <div>
                      <label className="text-[10px] text-warning uppercase mb-1 block">Warning</label>
                      <div className="flex items-center gap-1">
                        <Input defaultValue={threshold.warning} className="w-20 bg-background/50" />
                        <span className="text-xs text-muted-foreground">{threshold.unit}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-destructive uppercase mb-1 block">Critical</label>
                      <div className="flex items-center gap-1">
                        <Input defaultValue={threshold.critical} className="w-20 bg-background/50" />
                        <span className="text-xs text-muted-foreground">{threshold.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}

          {activeTab === "integrations" && (
            <DashboardCard title="External Integrations">
              <div className="space-y-4">
                {[
                  { name: "Prometheus", status: "connected", desc: "Metrics collection" },
                  { name: "Grafana", status: "connected", desc: "Visualization" },
                  { name: "PagerDuty", status: "connected", desc: "Alerting" },
                  { name: "Slack", status: "not_configured", desc: "Notifications" },
                  { name: "Jira", status: "not_configured", desc: "Ticket creation" },
                ].map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between p-3 rounded bg-accent/30 border border-border/50">
                    <div>
                      <div className="text-sm font-medium">{integration.name}</div>
                      <div className="text-xs text-muted-foreground">{integration.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "text-[10px]",
                        integration.status === "connected" 
                          ? "bg-success/20 text-success border-success/30" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {integration.status === "connected" ? "CONNECTED" : "NOT CONFIGURED"}
                      </Badge>
                      <Button variant="outline" size="sm">
                        {integration.status === "connected" ? "CONFIGURE" : "CONNECT"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}

          {activeTab === "notifications" && (
            <DashboardCard title="Notification Preferences">
              <div className="space-y-4">
                {[
                  { event: "Critical Incident Created", email: true, slack: true, push: true },
                  { event: "Incident Auto-Resolved", email: true, slack: true, push: false },
                  { event: "Agent Error", email: true, slack: false, push: true },
                  { event: "RL Model Retrained", email: false, slack: true, push: false },
                  { event: "System Health Warning", email: true, slack: true, push: true },
                ].map((pref) => (
                  <div key={pref.event} className="flex items-center justify-between p-3 rounded bg-accent/30 border border-border/50">
                    <div className="text-sm font-medium">{pref.event}</div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" defaultChecked={pref.email} className="rounded" />
                        Email
                      </label>
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" defaultChecked={pref.slack} className="rounded" />
                        Slack
                      </label>
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" defaultChecked={pref.push} className="rounded" />
                        Push
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline">RESET TO DEFAULTS</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              SAVE CHANGES
            </Button>
          </div>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
