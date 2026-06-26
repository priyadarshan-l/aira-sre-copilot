// AIRA - Autonomous Incident Remediation Agent Types

export type AgentType = "planner" | "rca" | "fixer" | "validator";

export type AgentStatus = "idle" | "active" | "completed" | "failed";

export type IncidentSeverity = "critical" | "high" | "medium" | "low";

export type IncidentCategory =
  | "database"
  | "server"
  | "network"
  | "memory"
  | "cpu"
  | "storage"
  | "api"
  | "security";

export type IncidentStatus =
  | "detected"
  | "analyzing"
  | "remediating"
  | "validating"
  | "resolved"
  | "failed";

export interface Agent {
  id: AgentType;
  name: string;
  description: string;
  status: AgentStatus;
  progress: number;
  currentTask?: string;
  lastActive?: string;
}

export interface AgentStep {
  agent: string;
  action: string;
  thought: string;
  output: string;
  timestamp?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  detectedAt: string;
  resolvedAt?: string;
  affectedSystems: string[];
  currentAgent?: AgentType;
  agentProgress: {
    planner: AgentStatus;
    rca: AgentStatus;
    fixer: AgentStatus;
    validator: AgentStatus;
  };
  rootCause?: string;
  resolution?: string;
  metrics: {
    mttr?: number; // Mean Time To Resolve (minutes)
    confidence: number; // AI confidence score (0-100)
  };
}

export interface SystemHealth {
  category: IncidentCategory;
  name: string;
  status: "healthy" | "degraded" | "critical";
  uptime: number;
  lastIncident?: string;
}

export interface AIRAMetrics {
  totalIncidents: number;
  resolvedToday: number;
  avgMTTR: number;
  successRate: number;
  activeAgents: number;
}

// Semantic Memory - VectorDB Brain (ChromaDB)
export interface SemanticMemoryEntry {
  id: string;
  incidentType: IncidentCategory;
  pattern: string;
  solution: string;
  successRate: number;
  usageCount: number;
  lastUsed: string;
  embedding?: number[]; // Vector embedding
  similarityScore?: number; // When queried
  sourceIncidents: string[]; // Reference incident IDs
}

// Prescriptive Memory - RL Brain (Q-Learning/PPO/DQN)
export interface PrescriptiveMemoryEntry {
  id: string;
  state: string; // Current system state representation
  action: string; // Action taken
  qValue: number; // Q-value for this state-action pair
  reward: number; // Reward received
  nextState: string;
  episodeId: string;
  timestamp: string;
}

export interface RLModelMetrics {
  algorithm: "q-learning" | "ppo" | "dqn";
  epsilon: number; // Exploration rate
  learningRate: number;
  discountFactor: number;
  totalEpisodes: number;
  avgReward: number;
  explorationMode: "exploring" | "exploiting";
  lastTrainingTime: string;
}

export interface RLPolicyDecision {
  state: string;
  recommendedAction: string;
  confidence: number;
  alternativeActions: { action: string; qValue: number }[];
  reasoning: string;
}

// Legacy alias for backwards compatibility
export interface MemoryEntry extends SemanticMemoryEntry { }

export interface ChartDataPoint {
  date: string;
  incidents: number;
  resolved: number;
  mttr: number;
}

export interface AIRAChartData {
  week: ChartDataPoint[];
  month: ChartDataPoint[];
  year: ChartDataPoint[];
}

export interface AIRAMockData {
  metrics: AIRAMetrics;
  recentMemory?: any[]; // Using any[] for now as the type isn't fully defined yet, can be refined later
  agents: Agent[];
  incidents: Incident[];
  systemHealth: SystemHealth[];
  semanticMemory: SemanticMemoryEntry[];
  prescriptiveMemory: {
    entries: PrescriptiveMemoryEntry[];
    modelMetrics: RLModelMetrics;
    recentDecisions: RLPolicyDecision[];
  };
  chartData: AIRAChartData;
  notifications: AIRANotification[];
  widgetData: WidgetData;
}

// Simulation Mode Types
export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  incident: Omit<Incident, "id">;
  steps: SimulationStep[];
  estimatedDuration: number; // seconds
}

export interface SimulationStep {
  agent: AgentType;
  action: string;
  narration: string;
  duration: number; // seconds
  memoryAccess?: {
    type: "semantic" | "prescriptive";
    query: string;
    result: string;
  };
  terminalOutput: string[];
}

export interface SimulationState {
  isRunning: boolean;
  currentScenario?: SimulationScenario;
  currentStepIndex: number;
  elapsedTime: number;
  status: "idle" | "running" | "paused" | "completed";
}

export interface AIRANotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "incident" | "resolution" | "alert" | "system";
  severity?: IncidentSeverity;
  read: boolean;
}

export interface WidgetData {
  environment: string;
  region: string;
  activeIncidents: number;
  systemStatus: "operational" | "degraded" | "outage";
  timestamp: string;
}

export type TimePeriod = "week" | "month" | "year";
