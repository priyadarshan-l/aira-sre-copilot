"use client";

import { motion } from "framer-motion";
import { useAIRA } from "@/lib/aira-provider";
import { cn } from "@/lib/utils";

interface ServiceNode {
    id: string;
    label: string;
    type: "database" | "service" | "gateway" | "client";
    x: number;
    y: number;
}

const services: ServiceNode[] = [
    { id: "client", label: "Client Apps", type: "client", x: 400, y: 50 },
    { id: "gateway", label: "API Gateway", type: "gateway", x: 400, y: 150 },
    { id: "auth", label: "Auth Service", type: "service", x: 200, y: 300 },
    { id: "user", label: "User Service", type: "service", x: 400, y: 300 },
    { id: "payment", label: "Payment Service", type: "service", x: 600, y: 300 },
    { id: "db-primary", label: "Primary DB", type: "database", x: 300, y: 450 },
    { id: "db-analytics", label: "Analytics DB", type: "database", x: 500, y: 450 },
];

const connections = [
    { from: "client", to: "gateway" },
    { from: "gateway", to: "auth" },
    { from: "gateway", to: "user" },
    { from: "gateway", to: "payment" },
    { from: "auth", to: "db-primary" },
    { from: "user", to: "db-primary" },
    { from: "payment", to: "db-primary" },
    { from: "payment", to: "db-analytics" },
];

export default function ServiceTopology() {
    const { systemStatus, incidents } = useAIRA();

    // Determine node status based on active incidents
    const getNodeStatus = (id: string) => {
        // If there are incidents, simulate impact on random nodes for visual effect
        // In real app, this would map incident.affectedSystems
        if (incidents.length > 0 && incidents.some(i => i.status !== "resolved")) {
            // Mock logic: randomly affect some nodes for the "War" effect
            if (id === "db-primary" || id === "payment") return "critical";
            if (id === "gateway") return "warning";
        }
        return "healthy";
    };

    return (
        <div className="relative w-full h-[500px] bg-grid-black/[0.2] dark:bg-grid-white/[0.05] rounded-xl overflow-hidden border border-border/50">
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px]" />

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {connections.map((conn, i) => {
                    const start = services.find((s) => s.id === conn.from)!;
                    const end = services.find((s) => s.id === conn.to)!;
                    const isActive = getNodeStatus(conn.to) !== "healthy";

                    return (
                        <motion.path
                            key={i}
                            d={`M ${start.x} ${start.y} C ${start.x} ${(start.y + end.y) / 2}, ${end.x} ${(start.y + end.y) / 2}, ${end.x} ${end.y}`}
                            fill="none"
                            strokeWidth="2"
                            className={cn(
                                "stroke-muted-foreground/20",
                                isActive && "stroke-destructive/50"
                            )}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5, delay: i * 0.1 }}
                        />
                    );
                })}

                {/* Traffic particles */}
                {connections.map((conn, i) => {
                    const start = services.find((s) => s.id === conn.from)!;
                    const end = services.find((s) => s.id === conn.to)!;
                    return (
                        <motion.circle
                            key={`p-${i}`}
                            r="3"
                            className="fill-primary"
                            initial={{ offsetDistance: "0%" }}
                            animate={{
                                cx: [start.x, end.x], // Simply linear for now roughly
                                cy: [start.y, end.y],
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                                delay: i * 0.2
                            }}
                        >
                            {/* Note: Real SVG path motion needs <animateMotion> or complex logic, simpler linear approx for prototype */}
                        </motion.circle>
                    )
                })}
            </svg>

            {services.map((service) => {
                const status = getNodeStatus(service.id);
                return (
                    <motion.div
                        key={service.id}
                        className={cn(
                            "absolute w-32 h-16 -ml-16 -mt-8",
                            "flex items-center justify-center flex-col",
                            "bg-card border rounded-lg shadow-sm backdrop-blur-md",
                            "transition-colors duration-500",
                            status === "healthy" && "border-border",
                            status === "warning" && "border-warning bg-warning/10",
                            status === "critical" && "border-destructive bg-destructive/10 animate-pulse"
                        )}
                        style={{ left: service.x, top: service.y }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className={cn(
                            "w-2 h-2 rounded-full mb-1",
                            status === "healthy" && "bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]",
                            status === "warning" && "bg-warning shadow-[0_0_8px_rgba(234,179,8,0.6)]",
                            status === "critical" && "bg-destructive shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                        )} />
                        <span className="text-[10px] font-medium text-foreground">{service.label}</span>
                        <span className="text-[8px] text-muted-foreground uppercase">{service.type}</span>
                    </motion.div>
                );
            })}

            {/* Legend or Title */}
            <div className="absolute top-4 left-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Service Topology</h3>
            </div>
        </div>
    );
}
