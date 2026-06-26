"use client";

import { useState } from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import { useAIRA } from "@/lib/aira-provider";
import ProcessorIcon from "@/components/icons/proccesor";

// Training Mode Components
import EpisodeTimeline from "@/components/simulation/training/EpisodeTimeline";
import LearningCurve from "@/components/simulation/training/LearningCurve";
import AgentCoreGrid from "@/components/simulation/training/AgentCoreGrid";
import TrainingNarrator from "@/components/simulation/training/TrainingNarrator";
import SimulationToolbar from "@/components/simulation/SimulationToolbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SimulationPage() {
    const [rlMode, setRlMode] = useState("q_learning");
    const [speed] = useState(10); // Default speed multiplier
    const [actionStatus, setActionStatus] = useState<string | null>(null);

    const {
        isConnected,
        startTraining,
        stopTraining,
        isTraining,
        currentEpisode
    } = useAIRA();

    const showStatus = (msg: string) => {
        setActionStatus(msg);
        setTimeout(() => setActionStatus(null), 4000);
    };

    const handleStart = async () => {
        await startTraining(rlMode);
    };

    const handleStop = async () => {
        await stopTraining();
    };

    const handleLoadCheckpoint = async () => {
        try {
            showStatus("Loading checkpoint...");
            const res = await fetch(`${API_URL}/rl/load_checkpoint`, { method: "POST" });
            if (res.ok) {
                showStatus("Checkpoint loaded successfully!");
            } else {
                const data = await res.json();
                showStatus(`Load failed: ${data.detail || "Error"}`);
            }
        } catch (err) {
            showStatus("Connection error.");
        }
    };

    const handleSaveModel = async () => {
        try {
            showStatus("Saving model...");
            const res = await fetch(`${API_URL}/rl/save_checkpoint`, { method: "POST" });
            if (res.ok) {
                showStatus("Model checkpoint saved!");
            } else {
                const data = await res.json();
                showStatus(`Save failed: ${data.detail || "Error"}`);
            }
        } catch (err) {
            showStatus("Connection error.");
        }
    };

    const handleExportONNX = async () => {
        try {
            showStatus("Compiling to ONNX format...");
            const res = await fetch(`${API_URL}/rl/export_onnx`, { method: "POST" });
            if (!res.ok) {
                const data = await res.json();
                showStatus(`Export failed: ${data.detail || "Error"}`);
                return;
            }
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const fileMode = rlMode.toLowerCase().includes("q-learning") ? "q_learning" : rlMode.toLowerCase().includes("dqn") ? "dqn" : "ppo";
            a.download = `aira_${fileMode}_policy.onnx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            showStatus("ONNX exported & downloaded!");
        } catch (err) {
            showStatus("Export failed.");
        }
    };

    const handleResetWeights = async () => {
        if (!confirm("Are you sure you want to reset weights and Q-table? This will revert learning to baseline expert rules.")) return;
        try {
            showStatus("Resetting weights...");
            const res = await fetch(`${API_URL}/rl/reset_weights`, { method: "POST" });
            if (res.ok) {
                showStatus("Weights & Q-table reset complete!");
            } else {
                const data = await res.json();
                showStatus(`Reset failed: ${data.detail || "Error"}`);
            }
        } catch (err) {
            showStatus("Connection error.");
        }
    };

    return (
        <DashboardPageLayout
            header={{
                title: "SIMULATION ENVIRONMENT",
                description: `Training Mode — Episode #${currentEpisode}`,
                icon: <ProcessorIcon className="ml-1 lg:ml-0 text-primary size-4 md:size-5" />,
            }}
        >
            {/* Simulation Toolbar */}
            <SimulationToolbar
                mode="training"
                onModeChange={() => {}}
                rlMode={rlMode}
                onRlModeChange={setRlMode}
                isConnected={isConnected}
                isTraining={isTraining}
                onStart={handleStart}
                onStop={handleStop}
                isCinematic={false}
                onCinematicToggle={() => {}}
                onLoadCheckpoint={handleLoadCheckpoint}
                onSaveModel={handleSaveModel}
                onExportONNX={handleExportONNX}
                onResetWeights={handleResetWeights}
            />

            {actionStatus && (
                <div className="p-3 text-xs font-mono rounded bg-primary/10 text-primary border border-primary/20 text-center animate-pulse">
                    {actionStatus}
                </div>
            )}

            {/* Training Mode Content */}
            <div className="space-y-6">
                {/* Narrator - What's happening */}
                <TrainingNarrator isRunning={isTraining} />

                {/* Agent Core Grid - Abstract representation */}
                <AgentCoreGrid isRunning={isTraining} />

                {/* Episode Timeline + Learning Curve */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <EpisodeTimeline isRunning={isTraining} speed={speed} />
                    <LearningCurve isRunning={isTraining} />
                </div>
            </div>
        </DashboardPageLayout>
    );
}
