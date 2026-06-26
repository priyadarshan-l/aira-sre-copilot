"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardCard } from "@/components/dashboard/card";
import { cn } from "@/lib/utils";
import ProcessorIcon from "@/components/icons/proccesor";
import { useAIRA } from "@/lib/aira-provider";

interface LearningCurveProps {
    isRunning: boolean;
}

export default function LearningCurve({ isRunning }: LearningCurveProps) {
    const { kpi } = useAIRA();

    // Dynamically calculate the moving average success rate from the real KPI history
    const dataPoints = useMemo(() => {
        const history = kpi?.history || [];
        if (history.length === 0) return [];

        const points: number[] = [];
        let resolvedCount = 0;

        for (let i = 0; i < history.length; i++) {
            if (history[i].resolved) {
                resolvedCount++;
            }
            points.push((resolvedCount / (i + 1)) * 100);
        }

        // Keep last 50 data points for a clear, high-resolution chart
        return points.slice(-50);
    }, [kpi?.history]);

    // Generate SVG path
    const { path, currentValue } = useMemo(() => {
        if (dataPoints.length === 0) return { path: "", currentValue: 0 };
        if (dataPoints.length === 1) {
            // For a single point, draw a flat line across the chart
            const yVal = 120 - 10 - (dataPoints[0] / 100) * 100;
            return {
                path: `M 10,${yVal} L 390,${yVal}`,
                currentValue: dataPoints[0]
            };
        }

        const width = 400;
        const height = 120;
        const padding = 10;

        const points = dataPoints.map((value, i) => ({
            x: padding + (i / (dataPoints.length - 1)) * (width - padding * 2),
            y: height - padding - (value / 100) * (height - padding * 2)
        }));

        const pathData = points.reduce((acc, point, i) => {
            if (i === 0) return `M ${point.x},${point.y}`;
            return `${acc} L ${point.x},${point.y}`;
        }, "");

        return {
            path: pathData,
            currentValue: dataPoints[dataPoints.length - 1] || 0
        };
    }, [dataPoints]);

    return (
        <DashboardCard
            header={{ title: "LEARNING CURVE", icon: ProcessorIcon }}
            addon={
                <span className={cn(
                    "text-sm font-mono",
                    currentValue > 70 ? "text-success" : currentValue > 40 ? "text-primary" : "text-warning"
                )}>
                    {currentValue.toFixed(1)}%
                </span>
            }
        >
            <div className="space-y-4">
                {/* Chart */}
                <div className="relative h-32 bg-muted/20 rounded-lg overflow-hidden">
                    {/* Grid */}
                    <div className="absolute inset-0">
                        {[25, 50, 75].map(y => (
                            <div
                                key={y}
                                className="absolute w-full border-t border-dashed border-border/30"
                                style={{ top: `${100 - y}%` }}
                            >
                                <span className="absolute left-1 text-[8px] text-muted-foreground">{y}%</span>
                            </div>
                        ))}
                    </div>

                    {/* SVG Chart */}
                    <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="none">
                        {/* Gradient fill */}
                        <defs>
                            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgb(0, 240, 255)" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="rgb(0, 240, 255)" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        {/* Area fill */}
                        {path && (
                            <path
                                d={`${path} L 400,120 L 0,120 Z`}
                                fill="url(#curveGradient)"
                            />
                        )}

                        {/* Line */}
                        {path && (
                            <path
                                d={path}
                                fill="none"
                                stroke="rgb(0, 240, 255)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={isRunning ? "animate-pulse" : ""}
                            />
                        )}

                        {/* Current point */}
                        {dataPoints.length > 0 && (
                            <circle
                                cx={400 - 10}
                                cy={120 - 10 - (currentValue / 100) * 100}
                                r="4"
                                fill="rgb(0, 240, 255)"
                                className={cn(
                                    isRunning && "animate-ping"
                                )}
                            />
                        )}
                    </svg>

                    {/* No data state */}
                    {dataPoints.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                            {isRunning ? "Collecting data..." : "Start training to see learning curve"}
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="size-3 rounded-full bg-primary" />
                        <span>Agent Performance</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-3 rounded-full bg-success/50" />
                        <span>Target: 70%+</span>
                    </div>
                </div>
            </div>
        </DashboardCard>
    );
}
