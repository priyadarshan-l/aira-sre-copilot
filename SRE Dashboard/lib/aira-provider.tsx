"use client";

/**
 * AIRA Global State Provider
 * Provides real-time data from backend to all dashboard components
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { useAiraSocket, AIRALog, AIRAStatus, AgentPipelineState } from "@/hooks/use-aira-socket";
import { useAiraApi, KPIData, RLStatus, ChaosStatus, SystemStatus } from "@/hooks/use-aira-api";
import { useSimulation } from "@/lib/simulation-context";
import type { Agent, Incident, SystemHealth, AIRAMetrics, AgentType } from "@/types/aira";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─────────────────────────────────────────────────────────────────
// Context Type
// ─────────────────────────────────────────────────────────────────

interface AIRAContextType {
    // Real-time WebSocket data
    logs: AIRALog[];
    wsStatus: AIRAStatus;
    agentPipeline: AgentPipelineState;

    // Polled API data
    kpi: KPIData | null;
    rlStatus: RLStatus | null;
    chaosStatus: ChaosStatus | null;
    systemStatus: SystemStatus | null;

    // Computed data for components
    metrics: AIRAMetrics;
    agents: Agent[];
    incidents: Incident[];
    systemHealth: SystemHealth[];

    // Actions
    triggerIncident: (text: string, rlMode?: string, incidentId?: string) => void;
    startSimulation: () => Promise<void>;
    stopSimulation: () => Promise<void>;
    triggerRandomIncident: () => Promise<void>;
    refreshData: () => Promise<void>;
    resetKPI: () => Promise<void>;

    // Grounded Corpus
    corpus: any[];
    hdfsCorpus: any[];
    openstackCorpus: any[];
    triggerCorpusIncident: (text: string, type: string, severity: string) => Promise<void>;



    // Training Actions
    startTraining: (mode: string) => Promise<void>;
    stopTraining: () => Promise<void>;
    pretrainModel: () => Promise<void>;

    // Training State
    isTraining: boolean;
    currentEpisode: number;

    // State
    isLoading: boolean;
    isConnected: boolean;
    error: string | null;

    // Host Telemetry & Simulation
    hostMetrics: {
        current: {
            cpu_percent: number;
            ram_percent: number;
            ram_used_gb: number;
            ram_total_gb: number;
            cpu_spike_active: boolean;
            ram_spike_active: boolean;
        };
        history: {
            timestamp: number;
            cpu_percent: number;
            ram_percent: number;
            ram_used_gb: number;
            ram_total_gb: number;
            cpu_spike_active: boolean;
            ram_spike_active: boolean;
        }[];
        cpu_cores: number;
    } | null;
    triggerHostSpike: (metric: "cpu" | "ram", duration?: number, valueGb?: number) => Promise<boolean>;
}

const AIRAContext = createContext<AIRAContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────────────────────────

export function AIRAProvider({ children }: { children: ReactNode }) {
    const socket = useAiraSocket();
    const api = useAiraApi();
    const { setMode } = useSimulation();
    const isMounted = useRef(true);

    // API Data State
    const [kpi, setKpi] = useState<KPIData | null>(null);
    const [rlStatus, setRlStatus] = useState<RLStatus | null>(null);
    const [chaosStatus, setChaosStatus] = useState<ChaosStatus | null>(null);
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [corpus, setCorpus] = useState<any[]>([]);
    const [hdfsCorpus, setHdfsCorpus] = useState<any[]>([]);
    const [openstackCorpus, setOpenstackCorpus] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hostMetrics, setHostMetrics] = useState<AIRAContextType["hostMetrics"]>(null);

    // Training State
    const [isTraining, setIsTraining] = useState(false);
    const [currentEpisode, setCurrentEpisode] = useState(0);

    // Fetch all data - using direct fetch to avoid dependency issues
    const refreshData = useCallback(async () => {
        if (!isMounted.current) return;

        try {
            const [kpiRes, rlRes, chaosRes, statusRes, trainingRes, corpusRes, hdfsRes, openstackRes] = await Promise.all([
                fetch(`${API_URL}/kpi`).catch(() => null),
                fetch(`${API_URL}/rl/status`).catch(() => null),
                fetch(`${API_URL}/chaos/status`).catch(() => null),
                fetch(`${API_URL}/status`).catch(() => null),
                fetch(`${API_URL}/training/status`).catch(() => null),
                fetch(`${API_URL}/chaos/corpus`).catch(() => null),
                fetch(`${API_URL}/chaos/hdfs`).catch(() => null),
                fetch(`${API_URL}/chaos/openstack`).catch(() => null),
            ]);



            if (!isMounted.current) return;

            if (kpiRes?.ok) {
                const kpiData = await kpiRes.json();
                setKpi(kpiData);
            }
            if (rlRes?.ok) {
                const rlData = await rlRes.json();
                setRlStatus(rlData);
            }
            if (chaosRes?.ok) {
                const chaosData = await chaosRes.json();
                setChaosStatus(chaosData);
                if (chaosData?.mode === "auto") {
                    setMode("simulation");
                } else {
                    setMode("production");
                }

                // Build incidents from chaos history
                if (chaosData?.stats?.history) {
                    const newIncidents: Incident[] = chaosData.stats.history.slice(-10).map((h: any, i: number) => {
                        // Determine status dynamically based on socket state
                        let status: any = "resolved"; // Default for history

                        // Check if this is the currently active incident
                        if (h.id === socket.status.currentIncidentId) {
                            if (socket.status.mode === "complete") {
                                status = "resolved";
                            } else {
                                // Granular status based on active agent
                                if (socket.agentPipeline.validator === "active") status = "validating";
                                else if (socket.agentPipeline.validator === "completed") status = "resolved";
                                else if (socket.agentPipeline.fixer === "active") status = "remediating";
                                else status = "analyzing";
                            }
                        }
                        // Check if this was just completed
                        else if (h.id === socket.status.lastCompletedId) {
                            status = "resolved";
                        }
                        // Fallback for simulation/demo behavior (old logic but safer)
                        else if (i === 0 && !socket.status.currentIncidentId) {
                            // Only default to detected if we aren't tracking a real incident and it's the latest
                            status = "detected";
                        }

                        return {
                            id: h.id,
                            title: `${h.type.toUpperCase()} Incident`,
                            description: h.id,
                            category: h.type as any,
                            severity: h.severity as any,
                            status: status,
                            detectedAt: h.timestamp,
                            affectedSystems: ["system-1"],
                            agentProgress: {
                                planner: status === "detected" ? "idle" : "completed",
                                rca: status === "analyzing" ? "active" : (status === "detected" ? "idle" : "completed"),
                                fixer: status === "remediating" ? "active" : (status === "analyzing" || status === "detected" ? "idle" : "completed"),
                                validator: status === "validating" ? "active" : (status === "resolved" ? "completed" : "idle"),
                            },
                            metrics: { confidence: 85 },
                            resolution: status === "resolved"
                                ? (
                                    h.type === "database" ? "Optimized connection pool configuration and cleared idle connections" :
                                        h.type === "memory" ? "Performed garbage collection and optimized cache eviction policy" :
                                            h.type === "network" ? "Rerouted traffic through healthy redundant path" :
                                                h.type === "storage" ? "Provisioned additional IOPS capacity from cloud provider" :
                                                    h.type === "cpu" ? "Auto-scaled worker nodes to handle load spike" :
                                                        h.type === "security" ? "Blocked malicious IP source and updated WAF rules" :
                                                            h.type === "api" ? "Scaled API gateway replicas and cleared local cache" :
                                                                "Automated remediation applied successfully"
                                )
                                : undefined,
                        };
                    });

                    setIncidents(newIncidents);
                }
            }
            if (corpusRes?.ok) {
                const corpusData = await corpusRes.json();
                setCorpus(corpusData.corpus || []);
            }
            if (hdfsRes?.ok) {
                const hdfsData = await hdfsRes.json();
                setHdfsCorpus(hdfsData.hdfs || []);
            }
            if (openstackRes?.ok) {
                const openstackData = await openstackRes.json();
                setOpenstackCorpus(openstackData.openstack || []);
            }


            if (statusRes?.ok) {
                const statusData = await statusRes.json();
                setSystemStatus(statusData);
            }

            if (trainingRes?.ok) {
                const trainingData = await trainingRes.json();
                setIsTraining(trainingData.is_training);
                setCurrentEpisode(trainingData.current_episode);
            }

            setError(null);
        } catch (err) {
            if (isMounted.current) {
                setError(err instanceof Error ? err.message : "Failed to fetch data");
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, []); // Empty dependency array - no dependencies that change

    // Auto-refresh every 60 seconds (optimized for performance)
    useEffect(() => {
        isMounted.current = true;
        refreshData();
        const interval = setInterval(refreshData, 60000); // 60 seconds for better performance
        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, [refreshData]);

    // Handle Socket Completion Updates
    useEffect(() => {
        if (socket.status.lastCompletedId) {
            setIncidents(prev => prev.map(incident => {
                if (incident.id === socket.status.lastCompletedId) {
                    return {
                        ...incident,
                        status: "resolved",
                        agentProgress: {
                            planner: "completed",
                            rca: "completed",
                            fixer: "completed",
                            validator: "completed"
                        }
                    };
                }
                return incident;
            }));

            // Also refresh data to get backend persistence
            refreshData();
        }
    }, [socket.status.lastCompletedId, refreshData]);

    // Computed metrics for components
    const metrics: AIRAMetrics = {
        totalIncidents: kpi?.total_incidents || 0,
        resolvedToday: kpi?.resolved || 0,
        avgMTTR: kpi?.mttr_ms ? kpi.mttr_ms / 60000 : 4.2, // Convert ms to minutes
        successRate: kpi?.success_rate || 0,
        activeAgents: 4,
    };

    // Computed agents from pipeline state
    const agents: Agent[] = [
        {
            id: "planner",
            name: "PLANNER",
            description: "Analyzes incident context and creates remediation strategy",
            status: socket.agentPipeline.planner,
            progress: socket.agentPipeline.progress.planner,
            currentTask: socket.agentPipeline.planner === "active" ? socket.agentPipeline.currentTask || "Planning..." : undefined,
            lastActive: socket.agentPipeline.planner === "active" ? "Active now" : "Ready",
        },
        {
            id: "rca",
            name: "ROOT CAUSE",
            description: "Deep analysis to identify the source of the issue",
            status: socket.agentPipeline.rca,
            progress: socket.agentPipeline.progress.rca,
            currentTask: socket.agentPipeline.rca === "active" ? socket.agentPipeline.currentTask || "Analyzing..." : undefined,
            lastActive: socket.agentPipeline.rca === "active" ? "Active now" : "Ready",
        },
        {
            id: "fixer",
            name: "FIXER",
            description: "Executes remediation actions based on RCA findings",
            status: socket.agentPipeline.fixer,
            progress: socket.agentPipeline.progress.fixer,
            currentTask: socket.agentPipeline.fixer === "active" ? socket.agentPipeline.currentTask || "Fixing..." : undefined,
            lastActive: socket.agentPipeline.fixer === "active" ? "Active now" : "Ready",
        },
        {
            id: "validator",
            name: "VALIDATOR",
            description: "Verifies fix effectiveness and system stability",
            status: socket.agentPipeline.validator,
            progress: socket.agentPipeline.progress.validator,
            currentTask: socket.agentPipeline.validator === "active" ? socket.agentPipeline.currentTask || "Validating..." : undefined,
            lastActive: socket.agentPipeline.validator === "active" ? "Active now" : "Ready",
        },
    ];

    // Computed system health based on active incidents
    const systemHealth: SystemHealth[] = [
        { category: "database", name: "PostgreSQL Cluster", status: "healthy", uptime: 99.9 },
        { category: "server", name: "Application Servers", status: "healthy", uptime: 99.9 },
        { category: "network", name: "Core Network", status: "healthy", uptime: 99.8 },
        { category: "memory", name: "Cache Layer", status: "healthy", uptime: 98.5 },
        { category: "api", name: "API Gateway", status: "healthy", uptime: 99.7 },
        { category: "storage", name: "Object Storage", status: "healthy", uptime: 99.99 },
        { category: "cpu", name: "Compute Cluster", status: "healthy", uptime: 99.6 },
        { category: "security", name: "WAF / Firewall", status: "healthy", uptime: 100 },
    ].map(sys => {
        const activeIncident = incidents.find(inc => inc.category === sys.category && inc.status !== "resolved");
        if (activeIncident) {
            return {
                ...sys,
                status: activeIncident.severity === "critical" || activeIncident.severity === "high" ? "critical" : "degraded",
                uptime: parseFloat((sys.uptime - 1.5).toFixed(2))
            };
        }
        return sys;
    });

    // Actions
    const startSimulation = useCallback(async () => {
        const result = await api.startChaos();
        if (result) {
            await refreshData();
        }
    }, [api, refreshData]);

    const stopSimulation = useCallback(async () => {
        const result = await api.stopChaos();
        if (result) {
            await refreshData();
        }
    }, [api, refreshData]);

    const triggerRandomIncident = useCallback(async () => {
        const incident = await api.triggerRandomIncident();
        if (incident) {
            // Trigger the incident through WebSocket for processing
            socket.triggerIncident(incident.text, rlStatus?.mode || "q_learning");
            await refreshData();
        }
    }, [api, socket, rlStatus, refreshData]);

    const triggerCorpusIncident = useCallback(async (text: string, type: string, severity: string) => {
        const incident = await api.triggerManualIncident(text, type, severity);
        if (incident) {
            socket.triggerIncident(incident.text, rlStatus?.mode || "q_learning");
            await refreshData();
        }
    }, [api, socket, rlStatus, refreshData]);

    const handleResetKPI = useCallback(async () => {
        await api.resetKPI();
        await refreshData();
    }, [api, refreshData]);

    // Training Actions
    const startTraining = useCallback(async (mode: string) => {
        setIsTraining(true);
        const result = await api.startTraining(mode);
        if (result) {
            await refreshData();
        }
    }, [api, refreshData]);

    const stopTraining = useCallback(async () => {
        const result = await api.stopTraining();
        setIsTraining(false);
        if (result) {
            await refreshData();
        }
    }, [api, refreshData]);

    const pretrainModel = useCallback(async () => {
        setIsLoading(true);
        const result = await api.pretrainModel();
        if (result) {
            await refreshData();
        }
        setIsLoading(false);
    }, [api, refreshData]);

    // Host Telemetry Polling Effect
    useEffect(() => {
        let active = true;
        const fetchHostMetrics = async () => {
            try {
                const res = await fetch(`${API_URL}/host/metrics`);
                if (res.ok && active) {
                    const data = await res.json();
                    setHostMetrics(data);
                }
            } catch (err) {
                // Fail silently
            }
        };
        fetchHostMetrics();
        const interval = setInterval(fetchHostMetrics, 1500);
        return () => {
            active = false;
            clearInterval(interval);
        };
    }, []);

    // Host Telemetry Spike Trigger
    const triggerHostSpike = useCallback(async (metric: "cpu" | "ram", duration: number = 15, valueGb: number = 1.0) => {
        try {
            const res = await fetch(`${API_URL}/host/simulate-spike`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ metric, duration, value_gb: valueGb })
            });
            if (res.ok) {
                const data = await res.json();
                const text = data.incident.text;
                // Trigger locally to kick off Agent Pipeline
                socket.triggerIncident(text, rlStatus?.mode || "q_learning");
                return true;
            }
        } catch (err) {
            console.error("Failed to trigger host spike:", err);
        }
        return false;
    }, [socket, rlStatus]);

    return (
        <AIRAContext.Provider
            value={{
                // WebSocket data
                logs: socket.logs,
                wsStatus: socket.status,
                agentPipeline: socket.agentPipeline,

                // API data
                kpi,
                rlStatus,
                chaosStatus,
                systemStatus,

                // Computed data
                metrics,
                agents,
                incidents,
                systemHealth,

                // Host Telemetry
                hostMetrics,
                triggerHostSpike,

                // Actions
                triggerIncident: socket.triggerIncident,
                startSimulation,
                stopSimulation,
                triggerRandomIncident,
                triggerCorpusIncident,
                refreshData,
                resetKPI: handleResetKPI,

                // Corpus data
                corpus,
                hdfsCorpus,
                openstackCorpus,



                // Training
                startTraining,
                stopTraining,
                pretrainModel,
                isTraining,
                currentEpisode,

                // State
                isLoading,
                isConnected: socket.isConnected,
                error: error || api.error,
            }}
        >
            {children}
        </AIRAContext.Provider>
    );
}

// ─────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────

export function useAIRA() {
    const context = useContext(AIRAContext);
    if (context === undefined) {
        throw new Error("useAIRA must be used within an AIRAProvider");
    }
    return context;
}
