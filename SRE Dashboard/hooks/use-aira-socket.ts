"use client";

/**
 * AIRA WebSocket Hook
 * Connects to the AIRA backend for real-time agent updates
 */

import { useState, useRef, useEffect, useCallback } from "react";
import type { AgentStep, Incident, AgentStatus, AgentType } from "@/types/aira";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/aira";

export interface AIRALog {
    id: string;
    timestamp: string;
    level: "info" | "warn" | "error" | "success" | "debug";
    agent?: string;
    message: string;
}

export interface AIRAStatus {
    mode: "idle" | "connecting" | "running" | "complete" | "error";
    currentAgent: AgentType | null;
    currentIncident: string | null;
    currentIncidentId: string | null; // ID of the incident being processed
    lastCompletedId: string | null; // ID of the last completed incident
    mttr: number | null;
}

export interface AgentPipelineState {
    planner: AgentStatus;
    rca: AgentStatus;
    fixer: AgentStatus;
    validator: AgentStatus;
    progress: Record<AgentType, number>;
    currentTask: string | null;
}

export function useAiraSocket() {
    const [logs, setLogs] = useState<AIRALog[]>([]);
    const [status, setStatus] = useState<AIRAStatus>({
        mode: "idle",
        currentAgent: null,
        currentIncident: null,
        currentIncidentId: null,
        lastCompletedId: null,
        mttr: null,
    });
    const [agentPipeline, setAgentPipeline] = useState<AgentPipelineState>({
        planner: "idle",
        rca: "idle",
        fixer: "idle",
        validator: "idle",
        progress: { planner: 0, rca: 0, fixer: 0, validator: 0 },
        currentTask: null,
    });

    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Add a log entry
    const addLog = useCallback((log: Omit<AIRALog, "id" | "timestamp">) => {
        const newLog: AIRALog = {
            ...log,
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
        };
        setLogs((prev) => [...prev.slice(-50), newLog]); // Keep last 50 logs
    }, []);

    // Map agent name to AgentType
    const mapAgentName = (name: string): AgentType | null => {
        const map: Record<string, AgentType> = {
            planner: "planner",
            rca: "rca",
            fixer: "fixer",
            validator: "validator",
            policy: "fixer", // Policy decisions go through fixer
        };
        return map[name?.toLowerCase()] || null;
    };

    // Update agent pipeline state
    const updateAgentState = useCallback((agentName: string, action: string) => {
        const agent = mapAgentName(agentName);
        if (!agent) return;

        setAgentPipeline((prev) => {
            const newState = { ...prev };

            // Reset all to idle first if this is a new agent
            if (action === "observe" || action === "reason") {
                // Mark previous agents as completed
                const agentOrder: AgentType[] = ["planner", "rca", "fixer", "validator"];
                const currentIndex = agentOrder.indexOf(agent);
                agentOrder.forEach((a, i) => {
                    if (i < currentIndex) {
                        newState[a] = "completed";
                        newState.progress[a] = 100;
                    } else if (i === currentIndex) {
                        newState[a] = "active";
                        newState.progress[a] = action === "observe" ? 25 : 50;
                    }
                });
            } else if (action === "act" || action === "decision") {
                newState[agent] = "active";
                newState.progress[agent] = 75;
            }

            return newState;
        });
    }, []);

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        setStatus((prev) => ({ ...prev, mode: "connecting" }));

        try {
            const ws = new WebSocket(WS_URL);
            socketRef.current = ws;

            ws.onopen = () => {
                console.log("[AIRA] WebSocket connected");
                setStatus((prev) => ({ ...prev, mode: "idle" }));
                addLog({ level: "success", message: "Connected to AIRA backend" });
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Completion message - TRIGGER CINEMATIC REPLAY
                    if (data.status === "complete" || data.final_status) {
                        // Don't show completion immediately. Replay the sequence for effect.
                        const totalDuration = 12000; // 12 seconds total cinematic
                        const stepDuration = 3000; // 3 seconds per agent

                        // 1. Start Planner (Immediate)
                        setStatus(prev => ({ ...prev, mode: "running", currentAgent: "planner" }));
                        setAgentPipeline(prev => ({ ...prev, planner: "active", currentTask: "Analyzing system telemetry and logs..." }));
                        addLog({ level: "info", agent: "PLANNER", message: "Analyzing incident scope and impact..." });

                        // 2. Start RCA (3s)
                        setTimeout(() => {
                            setStatus(prev => ({ ...prev, currentAgent: "rca" }));
                            setAgentPipeline(prev => ({ ...prev, planner: "completed", rca: "active", progress: { ...prev.progress, planner: 100 } }));
                            addLog({ level: "info", agent: "RCA", message: "Identified root cause. Correlating with past incidents..." });
                        }, stepDuration);

                        // 3. Start Fixer (6s)
                        setTimeout(() => {
                            setStatus(prev => ({ ...prev, currentAgent: "fixer" }));
                            setAgentPipeline(prev => ({ ...prev, rca: "completed", fixer: "active", progress: { ...prev.progress, rca: 100 } }));
                            addLog({ level: "warn", agent: "FIXER", message: "Applying remediation patch to affected services..." });
                        }, stepDuration * 2);

                        // 4. Start Validator (9s)
                        setTimeout(() => {
                            setStatus(prev => ({ ...prev, currentAgent: "validator" }));
                            setAgentPipeline(prev => ({ ...prev, fixer: "completed", validator: "active", progress: { ...prev.progress, fixer: 100 } }));
                            addLog({ level: "success", agent: "VALIDATOR", message: "Verifying system stability and performance metrics..." });
                        }, stepDuration * 3);

                        // 5. Complete (12s)
                        setTimeout(() => {
                            setStatus((prev) => ({
                                ...prev,
                                mode: "complete",
                                lastCompletedId: prev.currentIncidentId,
                                mttr: data.mttr_ms,
                            }));

                            setAgentPipeline((prev) => ({
                                ...prev,
                                planner: "completed",
                                rca: "completed",
                                fixer: "completed",
                                validator: "completed",
                                progress: { planner: 100, rca: 100, fixer: 100, validator: 100 },
                                currentTask: "Incident Resolved. System Secure.",
                            }));

                            addLog({
                                level: data.final_status === "resolved" ? "success" : "error",
                                message: `Incident ${data.final_status}. MTTR: ${(data.mttr_ms / 1000).toFixed(1)}s`,
                            });
                        }, totalDuration);

                        return;
                    }




                    // Training Event: Episode Start
                    if (data.type === "training_episode_start") {
                        setStatus((prev) => ({
                            ...prev,
                            mode: "running",
                            currentIncident: `TRAINING EPISODE #${data.episode}`,
                        }));
                        // Reset pipeline visually for new episode
                        setAgentPipeline({
                            planner: "active",
                            rca: "idle",
                            fixer: "idle",
                            validator: "idle",
                            progress: { planner: 0, rca: 0, fixer: 0, validator: 0 },
                            currentTask: `Training on incident: ${data.text?.slice(0, 50)}...`,
                        });
                    }

                    // Training Event: Episode Complete
                    if (data.type === "training_episode_complete") {
                        // Don't mark as "complete" mode because training continues
                        // Just flash completion
                        addLog({
                            level: data.status === "resolved" ? "success" : "warn",
                            message: `Episode #${data.episode} ${data.status} (Rew: ${data.reward})`
                        });

                        // We keep running mode, but maybe show a flash of completion
                        return;
                    }

                    // Agent step message
                    if (data.agent) {
                        const agent = mapAgentName(data.agent);
                        const action = data.action || "processing";

                        // Update current agent
                        setStatus((prev) => ({
                            ...prev,
                            mode: "running",
                            currentAgent: agent,
                        }));

                        // Update pipeline
                        updateAgentState(data.agent, action);

                        // Determine log level
                        let level: AIRALog["level"] = "info";
                        if (data.agent === "validator") level = "success";
                        if (action === "error" || data.thought?.includes("ERROR")) level = "error";
                        if (action === "warn" || data.thought?.includes("WARNING")) level = "warn";

                        // Add to logs
                        addLog({
                            level,
                            agent: data.agent?.toUpperCase(),
                            message: data.thought || data.action || "Processing...",
                        });

                        // Update current task
                        if (data.thought) {
                            setAgentPipeline((prev) => ({
                                ...prev,
                                currentTask: data.thought.slice(0, 100),
                            }));
                        }
                    }
                } catch (e) {
                    console.error("[AIRA] Parse error:", e);
                }
            };

            ws.onerror = (e) => {
                console.error("[AIRA] WebSocket error:", e);
                setStatus((prev) => ({ ...prev, mode: "error" }));
                addLog({ level: "error", message: "WebSocket connection error" });
            };

            ws.onclose = () => {
                console.log("[AIRA] WebSocket closed");
                socketRef.current = null;

                if (status.mode === "running") {
                    setStatus((prev) => ({ ...prev, mode: "error" }));
                    addLog({ level: "error", message: "Connection lost during incident processing" });
                } else {
                    setStatus((prev) => ({ ...prev, mode: "idle" }));
                }
            };
        } catch (error) {
            console.error("[AIRA] Connection error:", error);
            setStatus((prev) => ({ ...prev, mode: "error" }));
        }
    }, [addLog, updateAgentState, status.mode]);

    // Disconnect
    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
    }, []);

    // Trigger an incident
    const triggerIncident = useCallback(
        (incidentText: string, rlMode: string = "q_learning", incidentId?: string) => {
            // Connect if not connected
            if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
                connect();
                // Wait for connection
                setTimeout(() => triggerIncident(incidentText, rlMode, incidentId), 500);
                return;
            }

            // Reset state
            setLogs([]);
            setStatus({
                mode: "running",
                currentAgent: "planner",
                currentIncident: incidentText.slice(0, 50),
                currentIncidentId: incidentId || null,
                lastCompletedId: null, // Reset last completed
                mttr: null,
            });
            setAgentPipeline({
                planner: "active",
                rca: "idle",
                fixer: "idle",
                validator: "idle",
                progress: { planner: 10, rca: 0, fixer: 0, validator: 0 },
                currentTask: "Analyzing incident...",
            });

            // Add initial log
            addLog({
                level: "info",
                message: `Incident received: ${incidentText.slice(0, 80)}...`,
            });

            // Send to backend
            const payload = {
                incident_text: incidentText,
                rl_mode: rlMode,
                max_cycles: 5,
            };

            socketRef.current.send(JSON.stringify(payload));
        },
        [connect, addLog]
    );

    // Reset pipeline state
    const resetPipeline = useCallback(() => {
        setAgentPipeline({
            planner: "idle",
            rca: "idle",
            fixer: "idle",
            validator: "idle",
            progress: { planner: 0, rca: 0, fixer: 0, validator: 0 },
            currentTask: null,
        });
        setStatus({
            mode: "idle",
            currentAgent: null,
            currentIncident: null,
            currentIncidentId: null,
            lastCompletedId: null,
            mttr: null,
        });
    }, []);

    // Connect on mount
    useEffect(() => {
        connect();
        return () => disconnect();
    }, []);

    return {
        logs,
        status,
        agentPipeline,
        triggerIncident,
        resetPipeline,
        connect,
        disconnect,
        isConnected: socketRef.current?.readyState === WebSocket.OPEN,
    };
}
