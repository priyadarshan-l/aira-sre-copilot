# backend/orchestrator/orchestrator.py

"""
AIRA Orchestrator - Multi-Agent SRE System with LangGraph
Supports: Q-learning, DQN, PPO modes
Converts the procedural loop into a compiled StateGraph.
"""

## AGENT IMPORTS
from backend.agents.planner.planner_agent import PlannerAgent
from backend.agents.rca.rca_agent import RCAAgent
from backend.agents.fixer.fixer_agent import FixerAgent
from backend.agents.validator.validator_agent import ValidatorAgent

## MEMORY
from backend.memory.memory_manager import MemoryManager

## RL
from backend.rl.policies.unified_policy import UnifiedPolicy, RLMode

import time
from datetime import datetime
from typing import Optional, Dict, List, Any, TypedDict

# LangGraph Imports
from langgraph.graph import StateGraph, START, END


class AIRAState(TypedDict):
    """Shared state dictionary representing the graph's memory."""
    incident: str
    max_cycles: int
    rl_mode: str
    step_callback: Any
    cycle: int
    history: List[Dict[str, Any]]
    status: str
    root_cause: str
    candidates: List[Dict[str, Any]]
    chosen_action: str
    last_fix_out: Dict[str, Any]
    last_val_out: Dict[str, Any]
    reward: float


class AIRAOrchestrator:
    """
    AIRA - Autonomous Incident Response Agent
    
    Multi-agent system with LangGraph orchestration and Reinforcement Learning.
    Supports multiple RL algorithms: Q-learning, DQN, PPO
    """
    
    def __init__(
        self, 
        max_cycles: int = 3, 
        rl_mode: str = "q_learning",
        enable_memory: bool = True
    ):
        # -------------------------
        # Agents
        # -------------------------
        self.planner = PlannerAgent()
        self.rca = RCAAgent()
        self.fixer = FixerAgent()
        self.validator = ValidatorAgent()

        # -------------------------
        # Shared Memory
        # -------------------------
        self.memory = MemoryManager(enabled=enable_memory)
        self.planner.memory = self.memory
        self.rca.memory = self.memory
        self.fixer.memory = self.memory
        self.validator.memory = self.memory

        # -------------------------
        # RL Brain (Unified Policy)
        # -------------------------
        mode_map = {
            "q_learning": RLMode.Q_LEARNING,
            "dqn": RLMode.DQN,
            "ppo": RLMode.PPO
        }
        self.policy = UnifiedPolicy(mode=mode_map.get(rl_mode, RLMode.Q_LEARNING))
        self.rl_mode = rl_mode

        # -------------------------
        # Meta
        # -------------------------
        self.max_cycles = max_cycles
        self.transitions = []
        
        # -------------------------
        # KPI Tracking
        # -------------------------
        self.kpi = {
            "total_incidents": 0,
            "resolved": 0,
            "unresolved": 0,
            "total_cycles": 0,
            "total_time_ms": 0,
            "by_root_cause": {},
            "by_action": {},
            "history": []
        }

        # Build compiled LangGraph workflow
        self._build_graph()

    def set_rl_mode(self, mode: str):
        """Switch RL algorithm mode."""
        self.policy.set_mode(mode)
        self.rl_mode = mode

    # ─────────────────────────────────────────────────────────────────
    # LangGraph Construction
    # ─────────────────────────────────────────────────────────────────

    def _build_graph(self):
        workflow = StateGraph(AIRAState)

        # Add Nodes
        workflow.add_node("planner", self._planner_node)
        workflow.add_node("rca", self._rca_node)
        workflow.add_node("fixer_propose", self._fixer_propose_node)
        workflow.add_node("policy", self._policy_node)
        workflow.add_node("executor", self._executor_node)
        workflow.add_node("validator", self._validator_node)

        # Connect Nodes
        workflow.add_edge(START, "planner")
        workflow.add_edge("planner", "rca")
        workflow.add_edge("rca", "fixer_propose")
        workflow.add_edge("fixer_propose", "policy")
        workflow.add_edge("policy", "executor")
        workflow.add_edge("executor", "validator")

        # Conditional route edge from validator node
        workflow.add_conditional_edges(
            "validator",
            self._route_next,
            {
                "rca": "rca",
                END: END
            }
        )

        self.graph = workflow.compile()

    # ─────────────────────────────────────────────────────────────────
    # Nodes (Class Methods)
    # ─────────────────────────────────────────────────────────────────

    def _emit(self, state: AIRAState, step_data: Dict[str, Any]):
        """Emit step progress to WebSocket step callback helper."""
        if state.get("step_callback"):
            state["step_callback"](step_data)

    def _planner_node(self, state: AIRAState) -> Dict[str, Any]:
        """Runs the Planner agent to coordinate high-level task strategy."""
        plan = self.planner.act(
            self.planner.reason(
                self.planner.observe(state["incident"])
            )
        )
        self._emit(state, plan)
        return {
            "history": state["history"] + [plan],
            "cycle": 1
        }

    def _rca_node(self, state: AIRAState) -> Dict[str, Any]:
        """Runs Root Cause Analysis (RAG + Heuristics). Increments cycles on loopback."""
        current_cycle = state["cycle"]
        if state["root_cause"]:  # Loop back trigger detected
            current_cycle += 1

        rca_out = self.rca.act(
            self.rca.reason(
                self.rca.observe(state["incident"])
            )
        )
        self._emit(state, rca_out)

        return {
            "history": state["history"] + [rca_out],
            "root_cause": rca_out["analysis"].get("root_cause", "unknown"),
            "cycle": current_cycle
        }

    def _fixer_propose_node(self, state: AIRAState) -> Dict[str, Any]:
        """Runs the Fixer agent to propose candidate actions."""
        fix_thought = self.fixer.reason(
            self.fixer.observe({"root_cause": state["root_cause"]})
        )
        return {
            "candidates": fix_thought.get("candidates", [])
        }

    def _policy_node(self, state: AIRAState) -> Dict[str, Any]:
        """Unified Policy selects optimal action based on RL states."""
        rl_state = {
            "root_cause": state["root_cause"],
            "cycle": min(state["cycle"] - 1, 2),
            "candidates": state["candidates"],
            "severity": 1,
            "time_of_day": 1
        }

        chosen_action = self.policy.select_action(rl_state)

        policy_log = {
            "agent": "policy",
            "action": "decision",
            "rl_mode": self.rl_mode,
            "thought": f"Selected action: {chosen_action} based on state {rl_state.get('root_cause')}"
        }
        self._emit(state, policy_log)

        return {
            "chosen_action": chosen_action,
            "history": state["history"] + [{"agent": "policy", "rl_mode": self.rl_mode, "chosen_fix": chosen_action}]
        }

    def _executor_node(self, state: AIRAState) -> Dict[str, Any]:
        """Executes the chosen action, triggering host systems or simulations."""
        chosen_fix = None
        for c in state["candidates"]:
            if c["fix_strategy"] == state["chosen_action"]:
                chosen_fix = c
                break

        if chosen_fix is None:
            chosen_fix = state["candidates"][0] if state["candidates"] else {"fix_strategy": "manual_investigation", "steps": []}

        fix_out = self.fixer.act({
            "chosen_fix": chosen_fix,
            "root_cause": state["root_cause"]
        })
        self._emit(state, fix_out)

        return {
            "last_fix_out": fix_out,
            "history": state["history"] + [fix_out]
        }

    def _validator_node(self, state: AIRAState) -> Dict[str, Any]:
        """Checks telemetry metrics and performs RL value updates."""
        val_out = self.validator.act(
            self.validator.reason(
                self.validator.observe({
                    "incident": state["incident"],
                    "fix_output": state["last_fix_out"],
                    "cycle": state["cycle"],
                    "max_cycles": state["max_cycles"]
                })
            )
        )
        self._emit(state, val_out)

        resolved = val_out["validation"]["status"] == "resolved"
        reward = val_out["validation"]["reward"]

        # Unified Policy Learning update
        rl_state = {
            "root_cause": state["root_cause"],
            "cycle": min(state["cycle"] - 1, 2),
            "candidates": state["candidates"],
            "severity": 1,
            "time_of_day": 1
        }
        next_state = {
            "root_cause": state["root_cause"],
            "cycle": min(state["cycle"], 2),
            "candidates": state["candidates"],
            "severity": 1,
            "time_of_day": 1
        }
        transition = {
            "state": rl_state,
            "action": state["chosen_action"],
            "reward": reward,
            "next_state": next_state,
            "done": resolved
        }
        self.policy.update(transition)
        self.transitions.append(transition)

        return {
            "last_val_out": val_out,
            "reward": reward,
            "status": "resolved" if resolved else "unresolved",
            "history": state["history"] + [val_out]
        }

    # ─────────────────────────────────────────────────────────────────
    # Routing Decisions
    # ─────────────────────────────────────────────────────────────────

    def _route_next(self, state: AIRAState) -> str:
        """Determines whether to loop back to diagnostics or end execution."""
        if state["status"] == "resolved":
            # Save incident into ChromaDB Vector Memory
            if self.memory.enabled:
                self.memory.remember(
                    text=state["incident"],
                    metadata={
                        "root_cause": state["root_cause"],
                        "fix_strategy": state["chosen_action"],
                        "confidence": state["last_val_out"]["validation"]["confidence"],
                        "cycles": state["cycle"],
                        "verdict": "resolved",
                        "rl_mode": self.rl_mode
                    }
                )
            return END

        if state["cycle"] >= state["max_cycles"]:
            return END

        return "rca"

    # ─────────────────────────────────────────────────────────────────
    # Public API
    # ─────────────────────────────────────────────────────────────────

    def run(self, incident: str, step_callback=None) -> dict:
        """
        Run incident resolution workflow using LangGraph.
        
        Args:
            incident: Incident description string
            step_callback: function(step_data) -> void (for WebSocket streaming)
            
        Returns:
            Context dict with history, final_status, and metrics
        """
        start_time = time.time()
        self.transitions = []

        initial_state: AIRAState = {
            "incident": incident,
            "max_cycles": self.max_cycles,
            "rl_mode": self.rl_mode,
            "step_callback": step_callback,
            "cycle": 0,
            "history": [],
            "status": "unresolved",
            "root_cause": "",
            "candidates": [],
            "chosen_action": "",
            "last_fix_out": {},
            "last_val_out": {},
            "reward": 0.0
        }

        # Invoke Compiled Graph
        final_state = self.graph.invoke(initial_state)

        elapsed_ms = (time.time() - start_time) * 1000
        result = {
            "incident": incident,
            "cycles": final_state["cycle"],
            "history": final_state["history"],
            "start_time": datetime.now().isoformat(),
            "rl_mode": self.rl_mode,
            "final_status": final_state["status"],
            "resolution_cycle": final_state["cycle"] if final_state["status"] == "resolved" else None,
            "elapsed_ms": elapsed_ms,
            "end_time": datetime.now().isoformat()
        }

        # Update KPIs
        self._update_kpi(result, final_state["root_cause"], final_state["chosen_action"])

        # Alert if unresolved
        if result["final_status"] != "resolved":
            try:
                from backend.services.notifier import send_slack_alert
                alert_payload = {
                    "incident": incident,
                    "root_cause": final_state["root_cause"] or "unknown",
                    "final_status": result["final_status"],
                    "cycles": result["cycles"],
                    "elapsed_ms": elapsed_ms,
                    "rl_mode": self.rl_mode
                }
                send_slack_alert(alert_payload)
            except Exception as e:
                print(f"[Orchestrator] Failed to send alert: {e}")

        return result

    def _update_kpi(self, context: dict, root_cause: str, action: str):
        """Update KPI metrics after each incident."""
        self.kpi["total_incidents"] += 1
        self.kpi["total_cycles"] += context["cycles"]
        self.kpi["total_time_ms"] += context["elapsed_ms"]
        
        if context["final_status"] == "resolved":
            self.kpi["resolved"] += 1
        else:
            self.kpi["unresolved"] += 1
        
        # By root cause
        if root_cause not in self.kpi["by_root_cause"]:
            self.kpi["by_root_cause"][root_cause] = {"total": 0, "resolved": 0}
        self.kpi["by_root_cause"][root_cause]["total"] += 1
        if context["final_status"] == "resolved":
            self.kpi["by_root_cause"][root_cause]["resolved"] += 1
        
        # By action
        if action not in self.kpi["by_action"]:
            self.kpi["by_action"][action] = {"total": 0, "success": 0}
        self.kpi["by_action"][action]["total"] += 1
        if context["final_status"] == "resolved":
            self.kpi["by_action"][action]["success"] += 1
        
        # History for charts
        self.kpi["history"].append({
            "timestamp": context["end_time"],
            "resolved": context["final_status"] == "resolved",
            "cycles": context["cycles"],
            "time_ms": context["elapsed_ms"],
            "root_cause": root_cause,
            "action": action
        })

    def get_kpi(self) -> dict:
        """Get KPI metrics for dashboard."""
        total = self.kpi["total_incidents"]
        if total == 0:
            return self.kpi
        
        return {
            **self.kpi,
            "success_rate": self.kpi["resolved"] / total * 100,
            "avg_cycles": self.kpi["total_cycles"] / total,
            "mttr_ms": self.kpi["total_time_ms"] / total,
            "rl_mode": self.rl_mode,
            "epsilon": self.policy.epsilon
        }

    def reset_kpi(self):
        """Reset KPI metrics."""
        self.kpi = {
            "total_incidents": 0,
            "resolved": 0,
            "unresolved": 0,
            "total_cycles": 0,
            "total_time_ms": 0,
            "by_root_cause": {},
            "by_action": {},
            "history": []
        }

    def get_status(self) -> dict:
        """Get orchestrator status for dashboard."""
        return {
            "rl_mode": self.rl_mode,
            "max_cycles": self.max_cycles,
            "policy_stats": self.policy.get_stats(),
            "kpi_summary": {
                "total": self.kpi["total_incidents"],
                "resolved": self.kpi["resolved"],
                "success_rate": self.kpi["resolved"] / max(1, self.kpi["total_incidents"]) * 100
            }
        }
