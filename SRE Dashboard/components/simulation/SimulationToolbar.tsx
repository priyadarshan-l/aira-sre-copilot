"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAIRA } from "@/lib/aira-provider";

interface SimulationToolbarProps {
    mode: "training" | "war";
    onModeChange: (mode: "training" | "war") => void;
    rlMode: string;
    onRlModeChange: (mode: string) => void;
    isConnected: boolean;
    isTraining: boolean;
    onStart: () => void;
    onStop: () => void;
    isCinematic: boolean;
    onCinematicToggle: () => void;
    onLoadCheckpoint?: () => void;
    onSaveModel?: () => void;
    onExportONNX?: () => void;
    onResetWeights?: () => void;
}

export default function SimulationToolbar({
    mode,
    rlMode,
    onRlModeChange,
    isConnected,
    isTraining,
    onStart,
    onStop,
    onLoadCheckpoint,
    onSaveModel,
    onExportONNX,
    onResetWeights,
}: SimulationToolbarProps) {
    const { pretrainModel, isLoading } = useAIRA();
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-card/50 border border-border/30">
            {/* Left: Section Title */}
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    🎯 Model Training Workspace
                </span>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-3 flex-wrap">
                {/* RL Mode Selector (Only if not actively training) */}
                {!isTraining && (
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] text-muted-foreground h-7">
                            ALGORITHM
                        </Badge>
                        <Select value={rlMode} onValueChange={onRlModeChange}>
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                <SelectValue placeholder="Select RL" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="q_learning">Q-Learning (Tabular)</SelectItem>
                                <SelectItem value="dqn">Deep Q-Network (DQN)</SelectItem>
                                <SelectItem value="ppo">PPO (Policy Gradient)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Connection Status */}
                <Badge
                    variant="outline"
                    className={cn(
                        "text-xs h-7",
                        isConnected
                            ? "border-success/50 text-success"
                            : "border-warning/50 text-warning"
                    )}
                >
                    {isConnected ? "CONNECTED" : "CONNECTING..."}
                </Badge>

                {/* Start/Stop Controls */}
                {isTraining ? (
                    <Button
                        variant="destructive"
                        onClick={onStop}
                        size="sm"
                        className="uppercase h-8"
                    >
                        ⏹ Stop Training
                    </Button>
                ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                        {onLoadCheckpoint && (
                            <Button
                                variant="outline"
                                onClick={onLoadCheckpoint}
                                size="sm"
                                disabled={!isConnected}
                                className="h-8 border-border/50 hover:bg-accent/20 text-xs uppercase"
                            >
                                Load Checkpoint
                            </Button>
                        )}
                        {onSaveModel && (
                            <Button
                                variant="outline"
                                onClick={onSaveModel}
                                size="sm"
                                disabled={!isConnected}
                                className="h-8 border-border/50 hover:bg-accent/20 text-xs uppercase"
                            >
                                Save Model
                            </Button>
                        )}
                        {onExportONNX && (
                            <Button
                                variant="outline"
                                onClick={onExportONNX}
                                size="sm"
                                disabled={!isConnected}
                                className="h-8 border-border/50 hover:bg-accent/20 text-xs text-primary uppercase"
                            >
                                Export ONNX
                            </Button>
                        )}
                        {onResetWeights && (
                            <Button
                                variant="outline"
                                onClick={onResetWeights}
                                size="sm"
                                disabled={!isConnected}
                                className="h-8 border-destructive/30 hover:bg-destructive/10 text-xs text-destructive uppercase"
                            >
                                Reset Weights
                            </Button>
                        )}
                        <Button
                            onClick={pretrainModel}
                            size="sm"
                            disabled={!isConnected || isLoading}
                            className="uppercase bg-secondary hover:bg-secondary/90 border border-border/50 text-foreground h-8 flex items-center gap-1.5"
                        >
                            {isLoading ? (
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                            ) : (
                                <span>🧠</span>
                            )}
                            {isLoading ? "Pre-training..." : "Pre-Train Model"}
                        </Button>
                        <Button
                            onClick={onStart}
                            size="sm"
                            disabled={!isConnected || isLoading}
                            className="uppercase bg-primary hover:bg-primary/90 h-8"
                        >
                            ▶ Start Training
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
