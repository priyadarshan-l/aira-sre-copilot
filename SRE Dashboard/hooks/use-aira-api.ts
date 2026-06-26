"use client";

/**
 * AIRA API Client Hook
 * Fetches data from AIRA REST API endpoints
 */

import { useState, useEffect, useCallback, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface KPIData {
    total_incidents: number;
    resolved: number;
    unresolved: number;
    success_rate: number;
    avg_cycles: number;
    mttr_ms: number;
    rl_mode: string;
    epsilon: number;
    by_root_cause: Record<string, { total: number; resolved: number }>;
    by_action: Record<string, { total: number; success: number }>;
    history: Array<{
        timestamp: string;
        resolved: boolean;
        cycles: number;
        time_ms: number;
        root_cause: string;
        action: string;
    }>;
}

export interface RLStatus {
    mode: string;
    epsilon: number;
    policy_stats: {
        episode_count: number;
        total_rewards: number;
        q_table_size: number;
    };
    kpi: KPIData;
}

export interface ChaosStatus {
    mode: "stopped" | "auto" | "manual";
    interval_range: [number, number];
    stats: {
        total_generated: number;
        auto_generated: number;
        manual_generated: number;
        by_type: Record<string, number>;
        history: Array<{
            id: string;
            type: string;
            severity: string;
            source: string;
            timestamp: string;
        }>;
    };
}

export interface SystemStatus {
    system: string;
    version: string;
    orchestrator: {
        rl_mode: string;
        max_cycles: number;
        policy_stats: object;
        kpi_summary: {
            total: number;
            resolved: number;
            success_rate: number;
        };
    };
    chaos_engine: ChaosStatus;
    available_modes: string[];
}

export interface MemoryEntry {
    text: string;
    metadata: {
        root_cause: string;
        fix_strategy: string;
        confidence: number;
        cycles: number;
        verdict: string;
    };
    distance: number;
}

// ─────────────────────────────────────────────────────────────────
// API Client Hook
// ─────────────────────────────────────────────────────────────────

export function useAiraApi() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generic fetch wrapper
    const fetchApi = useCallback(async <T>(
        endpoint: string,
        options?: RequestInit
    ): Promise<T | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...options?.headers,
                },
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data as T;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
            console.error(`[AIRA API] ${endpoint} failed:`, message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────
    // KPI & Status
    // ─────────────────────────────────────────────────────────────────

    const getKPI = useCallback(() => fetchApi<KPIData>("/kpi"), [fetchApi]);

    const getStatus = useCallback(() => fetchApi<SystemStatus>("/status"), [fetchApi]);

    const getRLStatus = useCallback(() => fetchApi<RLStatus>("/rl/status"), [fetchApi]);

    const resetKPI = useCallback(() =>
        fetchApi<{ status: string }>("/kpi/reset", { method: "POST" }),
        [fetchApi]
    );

    // ─────────────────────────────────────────────────────────────────
    // Chaos Engine
    // ─────────────────────────────────────────────────────────────────

    const getChaosStatus = useCallback(() =>
        fetchApi<ChaosStatus>("/chaos/status"),
        [fetchApi]
    );

    const startChaos = useCallback(() =>
        fetchApi<{ status: string; mode: string }>("/chaos/start", { method: "POST" }),
        [fetchApi]
    );

    const stopChaos = useCallback(() =>
        fetchApi<{ status: string; mode: string }>("/chaos/stop", { method: "POST" }),
        [fetchApi]
    );

    const triggerRandomIncident = useCallback(() =>
        fetchApi<{ id: string; text: string; type: string }>("/chaos/random", { method: "POST" }),
        [fetchApi]
    );

    const triggerManualIncident = useCallback((
        incidentText?: string,
        incidentType?: string,
        severity: string = "high"
    ) =>
        fetchApi<{ id: string; text: string }>("/chaos/trigger", {
            method: "POST",
            body: JSON.stringify({
                incident_text: incidentText,
                incident_type: incidentType,
                severity,
            }),
        }),
        [fetchApi]
    );

    const getIncidentTypes = useCallback(() =>
        fetchApi<{ types: string[] }>("/chaos/types"),
        [fetchApi]
    );

    // ─────────────────────────────────────────────────────────────────
    // Memory
    // ─────────────────────────────────────────────────────────────────

    const getRecentMemories = useCallback(() =>
        fetchApi<{ memories: MemoryEntry[] }>("/memory/recent"),
        [fetchApi]
    );

    const getCorpus = useCallback(() =>
        fetchApi<{ corpus: any[] }>("/chaos/corpus"),
        [fetchApi]
    );

    return {
        isLoading,
        error,
        // KPI & Status
        getKPI,
        getStatus,
        getRLStatus,
        resetKPI,
        // Chaos Engine
        getChaosStatus,
        startChaos,
        stopChaos,
        triggerRandomIncident,
        triggerManualIncident,
        getIncidentTypes,
        getCorpus,
        // Memory
        getRecentMemories,
        // Training
        startTraining: useCallback((mode: string) =>
            fetchApi<{ status: string; mode: string }>("/training/start", {
                method: "POST",
                body: JSON.stringify({ mode })
            }),
            [fetchApi]
        ),
        stopTraining: useCallback(() =>
            fetchApi<{ status: string; episodes_completed: number }>("/training/stop", { method: "POST" }),
            [fetchApi]
        ),
        getTrainingStatus: useCallback(() =>
            fetchApi<{ is_training: boolean; current_episode: number; rl_mode: string }>("/training/status"),
            [fetchApi]
        ),
        pretrainModel: useCallback(() =>
            fetchApi<{ status: string; message: string; episodes: number; success_rate: number }>("/rl/pretrain", { method: "POST" }),
            [fetchApi]
        ),
    };
}

// ─────────────────────────────────────────────────────────────────
// Auto-Refresh Hook
// ─────────────────────────────────────────────────────────────────

export function useAutoRefreshKPI(intervalMs: number = 5000) {
    const [kpi, setKpi] = useState<KPIData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isMounted = useRef(true);

    const refresh = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/kpi`);
            if (response.ok && isMounted.current) {
                const data = await response.json();
                setKpi(data);
            }
        } catch (err) {
            console.error("[AIRA API] KPI fetch failed:", err);
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        refresh();
        const interval = setInterval(refresh, intervalMs);
        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, [refresh, intervalMs]);

    return { kpi, isLoading, refresh };
}

export function useAutoRefreshStatus(intervalMs: number = 10000) {
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isMounted = useRef(true);

    const refresh = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/status`);
            if (response.ok && isMounted.current) {
                const data = await response.json();
                setStatus(data);
            }
        } catch (err) {
            console.error("[AIRA API] Status fetch failed:", err);
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        refresh();
        const interval = setInterval(refresh, intervalMs);
        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, [refresh, intervalMs]);

    return { status, isLoading, refresh };
}
