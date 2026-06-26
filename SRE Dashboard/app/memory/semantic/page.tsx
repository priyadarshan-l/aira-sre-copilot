"use client";

import DashboardPageLayout from "@/components/dashboard/layout";
import { DashboardCard } from "@/components/dashboard/card";
import { MemoryIcon } from "@/components/icons/agents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";

// Mock semantic memory data (VectorDB - ChromaDB)
const semanticMemoryData = {
  stats: {
    totalEmbeddings: 2847,
    collections: 8,
    avgQueryTime: "23ms",
    lastSync: "2 min ago",
    dimensions: 1536,
    indexType: "HNSW",
  },
  recentQueries: [
    {
      id: "q1",
      query: "MySQL connection timeout patterns",
      results: 12,
      topMatch: { similarity: 0.94, pattern: "INC-2024-0892", title: "Connection pool exhaustion" },
      timestamp: "30s ago",
    },
    {
      id: "q2",
      query: "Kubernetes pod eviction memory pressure",
      results: 8,
      topMatch: { similarity: 0.89, pattern: "INC-2024-0756", title: "OOM killer triggered" },
      timestamp: "2m ago",
    },
    {
      id: "q3",
      query: "Redis cache miss spike detection",
      results: 15,
      topMatch: { similarity: 0.91, pattern: "INC-2024-0634", title: "Cache invalidation storm" },
      timestamp: "5m ago",
    },
  ],
  memoryEntries: [
    {
      id: "mem-001",
      incidentType: "database",
      pattern: "Connection pool exhaustion due to long-running queries",
      solution: "Identify and terminate stale connections, scale connection pool",
      successRate: 94,
      usageCount: 47,
      embedding: [0.12, 0.84, 0.32, 0.67, 0.91, 0.45, 0.23, 0.78, 0.56, 0.34, 0.89, 0.15],
      sourceIncidents: ["INC-2024-0892", "INC-2024-0445", "INC-2024-0221"],
      clusterPosition: { x: 25, y: 30 },
    },
    {
      id: "mem-002",
      incidentType: "server",
      pattern: "Memory leak in application container causing OOM kills",
      solution: "Rolling restart of affected pods, memory limit adjustment",
      successRate: 89,
      usageCount: 32,
      embedding: [0.45, 0.23, 0.78, 0.56, 0.34, 0.12, 0.84, 0.32, 0.67, 0.91, 0.55, 0.72],
      sourceIncidents: ["INC-2024-0756", "INC-2024-0512"],
      clusterPosition: { x: 65, y: 45 },
    },
    {
      id: "mem-003",
      incidentType: "network",
      pattern: "DNS resolution failures causing service mesh timeout",
      solution: "Restart CoreDNS pods, clear DNS cache",
      successRate: 97,
      usageCount: 28,
      embedding: [0.67, 0.91, 0.12, 0.45, 0.78, 0.89, 0.34, 0.56, 0.23, 0.67, 0.41, 0.88],
      sourceIncidents: ["INC-2024-0634", "INC-2024-0398"],
      clusterPosition: { x: 40, y: 70 },
    },
    {
      id: "mem-004",
      incidentType: "api",
      pattern: "Rate limiting triggered by burst traffic from partner API",
      solution: "Implement request queuing, adjust rate limit thresholds",
      successRate: 86,
      usageCount: 19,
      embedding: [0.23, 0.56, 0.89, 0.34, 0.67, 0.78, 0.12, 0.45, 0.91, 0.32, 0.65, 0.48],
      sourceIncidents: ["INC-2024-0521"],
      clusterPosition: { x: 75, y: 25 },
    },
    {
      id: "mem-005",
      incidentType: "security",
      pattern: "Failed authentication attempts exceeding threshold",
      solution: "Enable IP blocking, notify security team, audit logs",
      successRate: 92,
      usageCount: 15,
      embedding: [0.78, 0.34, 0.56, 0.12, 0.91, 0.67, 0.45, 0.23, 0.84, 0.32, 0.73, 0.29],
      sourceIncidents: ["INC-2024-0287", "INC-2024-0156"],
      clusterPosition: { x: 55, y: 60 },
    },
    {
      id: "mem-006",
      incidentType: "database",
      pattern: "Deadlock detected in transaction processing",
      solution: "Kill blocking session, optimize query order, add retry logic",
      successRate: 91,
      usageCount: 23,
      embedding: [0.34, 0.78, 0.45, 0.91, 0.23, 0.56, 0.67, 0.12, 0.89, 0.34, 0.52, 0.81],
      sourceIncidents: ["INC-2024-0678", "INC-2024-0432"],
      clusterPosition: { x: 30, y: 40 },
    },
    {
      id: "mem-007",
      incidentType: "server",
      pattern: "High CPU utilization from runaway process",
      solution: "Identify and kill process, implement resource limits",
      successRate: 95,
      usageCount: 41,
      embedding: [0.56, 0.12, 0.89, 0.34, 0.78, 0.45, 0.91, 0.67, 0.23, 0.56, 0.38, 0.94],
      sourceIncidents: ["INC-2024-0589", "INC-2024-0341", "INC-2024-0198"],
      clusterPosition: { x: 70, y: 55 },
    },
  ],
  collections: [
    { name: "incident_patterns", count: 892, color: "bg-primary", description: "Historical incident patterns" },
    { name: "resolution_steps", count: 1247, color: "bg-success", description: "Successful remediation steps" },
    { name: "system_metrics", count: 456, color: "bg-chart-3", description: "System state snapshots" },
    { name: "error_signatures", count: 252, color: "bg-destructive", description: "Error log signatures" },
    { name: "runbook_embeddings", count: 128, color: "bg-chart-5", description: "Operational runbooks" },
    { name: "alert_context", count: 341, color: "bg-warning", description: "Alert correlation data" },
  ],
};

const categoryColors: Record<string, string> = {
  database: "text-chart-3 bg-chart-3/10 border-chart-3/30",
  server: "text-destructive bg-destructive/10 border-destructive/30",
  network: "text-primary bg-primary/10 border-primary/30",
  api: "text-chart-5 bg-chart-5/10 border-chart-5/30",
  security: "text-warning bg-warning/10 border-warning/30",
};

const categoryDotColors: Record<string, string> = {
  database: "bg-chart-3",
  server: "bg-destructive",
  network: "bg-primary",
  api: "bg-chart-5",
  security: "bg-warning",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SemanticMemoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [queryFlow, setQueryFlow] = useState<{
    stage: "idle" | "embedding" | "searching" | "ranking" | "complete";
    progress: number;
  }>({ stage: "idle", progress: 0 });

  const [entries, setEntries] = useState<typeof semanticMemoryData.memoryEntries>(semanticMemoryData.memoryEntries);
  const [stats, setStats] = useState(semanticMemoryData.stats);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [searchResults, setSearchResults] = useState<typeof semanticMemoryData.memoryEntries | null>(null);

  useEffect(() => {
    async function fetchMemories() {
      try {
        const res = await fetch(`${API_URL}/memory/recent?limit=20`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        
        if (data.memories && data.memories.length > 0) {
          const mapped = data.memories.map((raw: any) => {
            const metadata = raw.metadata || {};
            const idNum = parseInt(raw.id) || 0;
            const hashX = (idNum * 17) % 70 + 15; // 15% to 85%
            const hashY = (idNum * 31) % 70 + 15;
            
            const mockEmbedding = Array.from({ length: 12 }, (_, i) => {
              const val = Math.abs(Math.sin(idNum + i));
              return parseFloat((val * 0.8 + 0.1).toFixed(2));
            });

            const rootCause = metadata.root_cause || "unknown";
            let category = "server";
            if (rootCause.includes("db") || rootCause.includes("database") || rootCause.includes("pool")) {
              category = "database";
            } else if (rootCause.includes("network") || rootCause.includes("latency")) {
              category = "network";
            } else if (rootCause.includes("api") || rootCause.includes("timeout")) {
              category = "api";
            } else if (rootCause.includes("sec") || rootCause.includes("cert")) {
              category = "security";
            }

            const confidence = parseFloat(metadata.confidence) || 0.90;
            const successRate = Math.round(confidence * 100);

            return {
              id: `mem-${raw.id.padStart(3, "0")}`,
              incidentType: category,
              pattern: raw.document || "System Incident Triggered",
              solution: `Apply remediation action: ${metadata.fix_strategy || "manual_investigation"} (in ${metadata.cycles || 1} cycles)`,
              successRate: successRate,
              usageCount: 1,
              embedding: mockEmbedding,
              sourceIncidents: [raw.id ? `INC-${raw.id.padStart(4, "0")}` : "INC-UNKNOWN"],
              clusterPosition: { x: hashX, y: hashY }
            };
          });
          
          setEntries(mapped);
          setIsBackendConnected(true);
          
          setStats(prev => ({
            ...prev,
            totalEmbeddings: data.memories.length,
            lastSync: "just now"
          }));
        }
      } catch (err) {
        console.warn("Failed to fetch live memories, using mock:", err);
      }
    }
    fetchMemories();
  }, []);

  // Simulate vector search
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults(null);
    setQueryFlow({ stage: "embedding", progress: 0 });

    // Stage 1: Embedding
    setTimeout(() => {
      setQueryFlow({ stage: "embedding", progress: 100 });
    }, 300);

    // Stage 2: Searching
    setTimeout(() => {
      setQueryFlow({ stage: "searching", progress: 50 });
    }, 600);

    setTimeout(() => {
      setQueryFlow({ stage: "searching", progress: 100 });
    }, 1000);

    // Stage 3: Ranking
    setTimeout(() => {
      setQueryFlow({ stage: "ranking", progress: 100 });
    }, 1400);

    // Stage 4: Complete
    setTimeout(() => {
      setQueryFlow({ stage: "complete", progress: 100 });
      // Filter results based on query (mock similarity)
      const results = entries
        .map((entry) => ({
          ...entry,
          similarity: Math.random() * 0.3 + 0.7, // Mock similarity 0.7-1.0
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
      setSearchResults(results as typeof entries);
      setIsSearching(false);
    }, 1800);
  }, [searchQuery, entries]);

  // Reset query flow when search input changes
  useEffect(() => {
    if (queryFlow.stage !== "idle") {
      setQueryFlow({ stage: "idle", progress: 0 });
      setSearchResults(null);
    }
  }, [searchQuery]);

  return (
    <DashboardPageLayout
      header={{
        title: "SEMANTIC MEMORY",
        description: "ChromaDB Vector Store",
        icon: MemoryIcon,
      }}
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Embeddings", value: stats.totalEmbeddings.toLocaleString(), color: "text-primary" },
          { label: "Collections", value: stats.collections, color: "text-foreground" },
          { label: "Dimensions", value: stats.dimensions.toLocaleString(), color: "text-foreground" },
          { label: "Index Type", value: stats.indexType, color: "text-success" },
          { label: "Avg Query", value: stats.avgQueryTime, color: "text-success" },
          { label: "Last Sync", value: stats.lastSync, color: "text-muted-foreground" },
        ].map((stat) => (
          <div key={stat.label} className="p-3 rounded-lg bg-card border border-border">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{stat.label}</div>
            <div className={cn("text-lg font-bold", stat.color)}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-8 space-y-6">
          {/* Query Interface with Flow Visualization */}
          <DashboardCard title="Vector Search Query">
            <div className="space-y-4">
              {/* Search Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Search semantic memory (e.g., 'database connection timeout')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 bg-background/50 font-mono text-sm"
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[100px]"
                >
                  {isSearching ? "SEARCHING..." : "SEARCH"}
                </Button>
              </div>

              {/* Query Flow Pipeline */}
              {queryFlow.stage !== "idle" && (
                <div className="p-4 rounded-lg bg-background/50 border border-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Query Pipeline</div>
                  <div className="flex items-center gap-2">
                    {[
                      { id: "embedding", label: "EMBED", desc: "Vectorizing query" },
                      { id: "searching", label: "SEARCH", desc: "HNSW index scan" },
                      { id: "ranking", label: "RANK", desc: "Cosine similarity" },
                      { id: "complete", label: "DONE", desc: "Results ready" },
                    ].map((stage, index) => {
                      const isActive = queryFlow.stage === stage.id;
                      const isPast =
                        ["embedding", "searching", "ranking", "complete"].indexOf(queryFlow.stage) >
                        ["embedding", "searching", "ranking", "complete"].indexOf(stage.id);
                      const isComplete = queryFlow.stage === "complete";

                      return (
                        <div key={stage.id} className="flex items-center flex-1">
                          <div className="flex flex-col items-center flex-1">
                            <div
                              className={cn(
                                "size-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300",
                                isActive && "bg-primary text-primary-foreground animate-pulse",
                                isPast && "bg-success text-success-foreground",
                                !isActive && !isPast && "bg-muted text-muted-foreground"
                              )}
                            >
                              {isPast || isComplete ? "✓" : index + 1}
                            </div>
                            <div className={cn("text-[10px] mt-1 transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>
                              {stage.label}
                            </div>
                            <div className="text-[9px] text-muted-foreground/60">{stage.desc}</div>
                          </div>
                          {index < 3 && (
                            <div
                              className={cn(
                                "h-0.5 flex-1 mx-1 transition-colors duration-300",
                                isPast ? "bg-success" : "bg-border"
                              )}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Search Results */}
              {searchResults && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      Found {searchResults.length} similar patterns
                    </div>
                    <div className="text-xs text-primary">Query time: 23ms</div>
                  </div>
                  {searchResults.map((result: any, index) => (
                    <div
                      key={result.id}
                      className={cn(
                        "p-3 rounded-lg border transition-all cursor-pointer",
                        index === 0
                          ? "bg-primary/10 border-primary"
                          : "bg-card border-border hover:border-primary/50"
                      )}
                      onClick={() => setSelectedEntry(result.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-[10px] uppercase", categoryColors[result.incidentType])}>
                            {result.incidentType}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">{result.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground">Similarity:</div>
                          <div
                            className={cn(
                              "text-sm font-bold",
                              result.similarity > 0.9 ? "text-success" : result.similarity > 0.8 ? "text-primary" : "text-warning"
                            )}
                          >
                            {(result.similarity * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="text-sm">{result.pattern}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Queries (when not searching) */}
              {!searchResults && queryFlow.stage === "idle" && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Recent Queries</div>
                  {semanticMemoryData.recentQueries.map((query) => (
                    <div
                      key={query.id}
                      onClick={() => setSearchQuery(query.query)}
                      className="p-3 rounded-lg bg-accent/30 border border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium font-mono">{query.query}</span>
                        <span className="text-xs text-muted-foreground">{query.timestamp}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-muted-foreground">{query.results} results</span>
                        <span className="text-primary">
                          Best: {query.topMatch.title} ({(query.topMatch.similarity * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DashboardCard>

          {/* Embedding Space Visualization */}
          <DashboardCard title="Embedding Space">
            <div className="relative h-[300px] bg-background/30 rounded-lg border border-border overflow-hidden">
              {/* Grid background */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Cluster labels */}
              <div className="absolute top-3 left-3 text-[10px] text-muted-foreground uppercase tracking-wide">
                2D t-SNE Projection
              </div>

              {/* Cluster regions */}
              <div className="absolute top-[20%] left-[15%] w-24 h-20 rounded-full bg-chart-3/10 border border-chart-3/20" />
              <div className="absolute top-[35%] left-[55%] w-28 h-24 rounded-full bg-destructive/10 border border-destructive/20" />
              <div className="absolute top-[55%] left-[30%] w-20 h-16 rounded-full bg-primary/10 border border-primary/20" />

              {/* Memory nodes */}
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    "absolute transition-all duration-300 cursor-pointer",
                    hoveredNode === entry.id && "z-10"
                  )}
                  style={{
                    left: `${entry.clusterPosition.x}%`,
                    top: `${entry.clusterPosition.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onMouseEnter={() => setHoveredNode(entry.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedEntry(entry.id)}
                >
                  <div
                    className={cn(
                      "size-4 rounded-full transition-all duration-300",
                      categoryDotColors[entry.incidentType],
                      hoveredNode === entry.id && "scale-150 ring-2 ring-white/50",
                      selectedEntry === entry.id && "ring-2 ring-primary"
                    )}
                  />

                  {/* Tooltip on hover */}
                  {hoveredNode === entry.id && (
                    <div className="absolute left-6 top-0 w-48 p-2 rounded bg-popover border border-border shadow-lg z-20">
                      <div className="text-[10px] text-muted-foreground font-mono mb-1">{entry.id}</div>
                      <div className="text-xs font-medium line-clamp-2">{entry.pattern}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn("text-[8px]", categoryColors[entry.incidentType])}>
                          {entry.incidentType}
                        </Badge>
                        <span className="text-[10px] text-success">{entry.successRate}%</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Legend */}
              <div className="absolute bottom-3 right-3 flex flex-wrap gap-2">
                {Object.entries(categoryDotColors).map(([cat, color]) => (
                  <div key={cat} className="flex items-center gap-1">
                    <div className={cn("size-2 rounded-full", color)} />
                    <span className="text-[9px] text-muted-foreground capitalize">{cat}</span>
                  </div>
                ))}
              </div>
            </div>
          </DashboardCard>

          {/* Stored Patterns */}
          <DashboardCard title="Stored Patterns">
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(selectedEntry === entry.id ? null : entry.id)}
                  className={cn(
                    "p-4 rounded-lg border transition-all cursor-pointer",
                    selectedEntry === entry.id
                      ? "bg-primary/10 border-primary"
                      : "bg-card border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-[10px] uppercase", categoryColors[entry.incidentType])}>
                        {entry.incidentType}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">{entry.id}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-success">{entry.successRate}%</div>
                      <div className="text-[10px] text-muted-foreground">success</div>
                    </div>
                  </div>

                  <div className="text-sm font-medium mb-2">{entry.pattern}</div>

                  {selectedEntry === entry.id && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase mb-1">Remediation</div>
                        <div className="text-sm text-foreground/80">{entry.solution}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground uppercase mb-1">Usage Count</div>
                          <div className="text-sm font-medium">{entry.usageCount} times</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground uppercase mb-1">Source Incidents</div>
                          <div className="flex gap-1 flex-wrap">
                            {entry.sourceIncidents.map((inc) => (
                              <Badge key={inc} variant="outline" className="text-[10px] font-mono">
                                {inc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Embedding Visualization */}
                      <div>
                        <div className="text-xs text-muted-foreground uppercase mb-2">
                          Embedding Vector (first 12 dims)
                        </div>
                        <div className="flex gap-1 items-end h-10">
                          {entry.embedding.map((val, i) => (
                            <div
                              key={i}
                              className="flex-1 rounded-t bg-primary/60 transition-all hover:bg-primary"
                              style={{ height: `${val * 100}%` }}
                              title={`dim[${i}]: ${val.toFixed(3)}`}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[9px] text-muted-foreground">0</span>
                          <span className="text-[9px] text-muted-foreground">11</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="text-xs bg-transparent">
                          VIEW FULL VECTOR
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs bg-transparent">
                          FIND SIMILAR
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs text-destructive hover:text-destructive bg-transparent">
                          DELETE
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>

        {/* Sidebar - Right Side */}
        <div className="lg:col-span-4 space-y-6">
          {/* Collections */}
          <DashboardCard title="Collections">
            <div className="space-y-2">
              {semanticMemoryData.collections.map((collection) => (
                <div
                  key={collection.name}
                  className="p-3 rounded-lg bg-accent/30 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={cn("size-2 rounded-full", collection.color)} />
                      <span className="text-sm font-mono">{collection.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{collection.count.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground ml-4">{collection.description}</div>
                </div>
              ))}
            </div>
          </DashboardCard>

          {/* Index Health */}
          <DashboardCard title="Index Health">
            <div className="space-y-3">
              {[
                { metric: "Index Fragmentation", value: "2.3%", status: "healthy" },
                { metric: "Write Queue", value: "0", status: "healthy" },
                { metric: "Compaction Status", value: "IDLE", status: "healthy" },
                { metric: "Memory Usage", value: "847MB", status: "healthy" },
                { metric: "Disk Usage", value: "12.4GB", status: "warning" },
              ].map((item) => (
                <div key={item.metric} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item.metric}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{item.value}</span>
                    <div
                      className={cn(
                        "size-2 rounded-full",
                        item.status === "healthy" ? "bg-success" : item.status === "warning" ? "bg-warning" : "bg-destructive"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>

          {/* Actions */}
          <DashboardCard title="Operations">
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-xs bg-transparent">
                <span className="size-2 rounded-full bg-success mr-2" />
                SYNC FROM BACKEND
              </Button>
              <Button variant="outline" className="w-full justify-start text-xs bg-transparent">
                <span className="size-2 rounded-full bg-primary mr-2" />
                REBUILD INDEX
              </Button>
              <Button variant="outline" className="w-full justify-start text-xs bg-transparent">
                <span className="size-2 rounded-full bg-chart-3 mr-2" />
                EXPORT EMBEDDINGS
              </Button>
              <Button variant="outline" className="w-full justify-start text-xs bg-transparent">
                <span className="size-2 rounded-full bg-warning mr-2" />
                COMPACT DATABASE
              </Button>
              <Button variant="outline" className="w-full justify-start text-xs text-destructive hover:text-destructive bg-transparent">
                <span className="size-2 rounded-full bg-destructive mr-2" />
                PURGE OLD ENTRIES
              </Button>
            </div>
          </DashboardCard>

          {/* Connection Info */}
          <DashboardCard title="Connection">
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Host</span>
                <span>{isBackendConnected ? "localhost:8000" : "chromadb.internal:8000 (Mock)"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={isBackendConnected ? "text-success" : "text-warning"}>
                  {isBackendConnected ? "CONNECTED" : "DISCONNECTED"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latency</span>
                <span>{isBackendConnected ? "3ms" : "2ms"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span>0.4.22</span>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
