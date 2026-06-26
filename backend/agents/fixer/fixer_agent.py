import random
from backend.agents.agent_base import BaseAgent
from backend.services.prometheus import stop_cpu_spike, stop_ram_spike


class FixerAgent(BaseAgent):
    """
    FixerAgent (RL-SAFE)
    - Proposes ALL valid actions for a given root cause
    - Does NOT decide - RL policy decides
    - Does NOT learn directly
    """

    def __init__(self):
        super().__init__(
            name="fixer",
            description="Proposes fix actions (RL-controlled)",
            version="3.0"
        )
        self.memory = None

    # --------------------------------------------------
    # Observe: receive RCA analysis
    # --------------------------------------------------
    def observe(self, observation: dict) -> dict:
        self.log("OBSERVE | Received input")
        return observation

    # --------------------------------------------------
    # Reason: propose action candidates ONLY
    # --------------------------------------------------
    def reason(self, observation: dict) -> dict:
        self.log("REASON | Proposing fix candidates")

        root_cause = observation.get("root_cause", "unknown")
        candidates = self._action_space(root_cause)

        thought = {
            "root_cause": root_cause,
            "candidates": candidates,
            "next_agent": "validator"
        }

        self.last_thought = thought
        self.history.append({
            "step": self.step_count,
            "event": "reason",
            "data": thought
        })

        return thought

    # --------------------------------------------------
    # Action: execute chosen fix
    # --------------------------------------------------
    def act(self, thought: dict) -> dict:
        self.log("ACT | Executing chosen fix")

        chosen_fix = thought["chosen_fix"]
        root_cause = thought.get("root_cause", "unknown")
        
        # Simulate fix execution
        execution_result = self._simulate_execution(
            chosen_fix["fix_strategy"],
            root_cause
        )

        output = {
            "agent": self.name,
            "fix_plan": chosen_fix,
            "execution": execution_result
        }

        self.last_output = output
        self.history.append({
            "step": self.step_count,
            "event": "act",
            "data": output
        })

        self.step_count += 1
        return output

    # --------------------------------------------------
    # Fixed Action Space - ALL 10 ACTIONS
    # --------------------------------------------------
    def _action_space(self, root_cause: str) -> list:
        """
        Returns valid actions for the given root cause.
        Includes optimal action + fallback options.
        """
        # All available fix strategies
        ALL_ACTIONS = {
            "cpu": [
                {"fix_strategy": "scale_cpu", "steps": ["Increase CPU limits", "Monitor"]},
                {"fix_strategy": "restart_service", "steps": ["Restart service", "Monitor"]},
                {"fix_strategy": "manual_investigation", "steps": ["Collect logs", "Escalate"]}
            ],
            "cpu_spike": [
                {"fix_strategy": "scale_cpu", "steps": ["Increase CPU limits", "Monitor"]},
                {"fix_strategy": "restart_service", "steps": ["Restart service", "Monitor"]},
                {"fix_strategy": "manual_investigation", "steps": ["Collect logs", "Escalate"]}
            ],
            "memory": [
                {"fix_strategy": "restart_service", "steps": ["Restart service", "Monitor memory"]},
                {"fix_strategy": "scale_cpu", "steps": ["Scale resources"]},
                {"fix_strategy": "manual_investigation", "steps": ["Memory profiling", "Escalate"]}
            ],
            "memory_leak": [
                {"fix_strategy": "restart_service", "steps": ["Restart service", "Monitor memory"]},
                {"fix_strategy": "rollback_deployment", "steps": ["Rollback to previous version"]},
                {"fix_strategy": "manual_investigation", "steps": ["Memory profiling", "Escalate"]}
            ],
            "disk": [
                {"fix_strategy": "clear_disk_space", "steps": ["Clean temp files", "Expand disk"]},
                {"fix_strategy": "manual_investigation", "steps": ["Analyze disk usage"]}
            ],
            "disk_full": [
                {"fix_strategy": "clear_disk_space", "steps": ["Clean temp files", "Expand disk"]},
                {"fix_strategy": "manual_investigation", "steps": ["Analyze disk usage"]}
            ],
            "network": [
                {"fix_strategy": "restart_network", "steps": ["Restart network services"]},
                {"fix_strategy": "increase_timeout", "steps": ["Increase timeout settings"]},
                {"fix_strategy": "manual_investigation", "steps": ["Network diagnostics"]}
            ],
            "network_latency": [
                {"fix_strategy": "restart_network", "steps": ["Restart network services"]},
                {"fix_strategy": "increase_timeout", "steps": ["Increase timeout settings"]},
                {"fix_strategy": "manual_investigation", "steps": ["Network diagnostics"]}
            ],
            "database_connection_pool": [
                {"fix_strategy": "reset_db_connections", "steps": ["Reset connection pool"]},
                {"fix_strategy": "restart_service", "steps": ["Restart service"]},
                {"fix_strategy": "manual_investigation", "steps": ["Check DB health"]}
            ],
            "db_pool": [
                {"fix_strategy": "reset_db_connections", "steps": ["Reset connection pool"]},
                {"fix_strategy": "restart_service", "steps": ["Restart service"]},
                {"fix_strategy": "manual_investigation", "steps": ["Check DB health"]}
            ],
            "database_deadlock": [
                {"fix_strategy": "kill_db_deadlock", "steps": ["Kill blocking queries"]},
                {"fix_strategy": "reset_db_connections", "steps": ["Reset connections"]},
                {"fix_strategy": "manual_investigation", "steps": ["Analyze deadlock"]}
            ],
            "db_deadlock": [
                {"fix_strategy": "kill_db_deadlock", "steps": ["Kill blocking queries"]},
                {"fix_strategy": "reset_db_connections", "steps": ["Reset connections"]},
                {"fix_strategy": "manual_investigation", "steps": ["Analyze deadlock"]}
            ],
            "service_crash": [
                {"fix_strategy": "restart_service", "steps": ["Restart crashed service"]},
                {"fix_strategy": "rollback_deployment", "steps": ["Rollback deployment"]},
                {"fix_strategy": "manual_investigation", "steps": ["Analyze crash logs"]}
            ],
            "crash": [
                {"fix_strategy": "restart_service", "steps": ["Restart crashed service"]},
                {"fix_strategy": "rollback_deployment", "steps": ["Rollback deployment"]},
                {"fix_strategy": "manual_investigation", "steps": ["Analyze crash logs"]}
            ],
            "api_timeout": [
                {"fix_strategy": "increase_timeout", "steps": ["Increase timeout limits"]},
                {"fix_strategy": "restart_service", "steps": ["Restart service"]},
                {"fix_strategy": "restart_network", "steps": ["Check network"]},
                {"fix_strategy": "manual_investigation", "steps": ["Profile API"]}
            ],
            "timeout": [
                {"fix_strategy": "increase_timeout", "steps": ["Increase timeout limits"]},
                {"fix_strategy": "restart_service", "steps": ["Restart service"]},
                {"fix_strategy": "manual_investigation", "steps": ["Profile API"]}
            ],
            "certificate_expired": [
                {"fix_strategy": "renew_certificate", "steps": ["Renew SSL certificate"]},
                {"fix_strategy": "manual_investigation", "steps": ["Check cert config"]}
            ],
            "cert": [
                {"fix_strategy": "renew_certificate", "steps": ["Renew SSL certificate"]},
                {"fix_strategy": "manual_investigation", "steps": ["Check cert config"]}
            ],
            "unknown": [
                {"fix_strategy": "manual_investigation", "steps": ["Collect logs", "Escalate"]},
                {"fix_strategy": "restart_service", "steps": ["Try restart"]}
            ]
        }

        return ALL_ACTIONS.get(root_cause, ALL_ACTIONS["unknown"])

    # --------------------------------------------------
    # Fix Execution Simulation
    # --------------------------------------------------
    def _simulate_execution(self, fix_strategy: str, root_cause: str) -> dict:
        """
        Simulate fix execution with realistic success rates.
        """
        # Stop actual host spikes if this is a host-related issue
        if root_cause in ["cpu", "cpu_spike"]:
            stop_cpu_spike()
        elif root_cause in ["memory", "memory_leak"]:
            stop_ram_spike()

        SUCCESS_RATES = {
            # CPU issues
            ("cpu", "scale_cpu"): 0.85,
            ("cpu_spike", "scale_cpu"): 0.85,
            ("cpu", "restart_service"): 0.40,
            ("cpu_spike", "restart_service"): 0.40,
            # Memory issues
            ("memory", "restart_service"): 0.80,
            ("memory_leak", "restart_service"): 0.75,
            ("memory_leak", "rollback_deployment"): 0.70,
            # Disk issues
            ("disk", "clear_disk_space"): 0.85,
            ("disk_full", "clear_disk_space"): 0.85,
            # Network issues
            ("network", "restart_network"): 0.75,
            ("network_latency", "restart_network"): 0.75,
            ("network", "increase_timeout"): 0.50,
            ("network_latency", "increase_timeout"): 0.50,
            # Database issues
            ("database_connection_pool", "reset_db_connections"): 0.80,
            ("db_pool", "reset_db_connections"): 0.80,
            ("database_deadlock", "kill_db_deadlock"): 0.85,
            ("db_deadlock", "kill_db_deadlock"): 0.85,
            # Service issues
            ("service_crash", "restart_service"): 0.70,
            ("crash", "restart_service"): 0.70,
            ("service_crash", "rollback_deployment"): 0.75,
            ("crash", "rollback_deployment"): 0.75,
            # API issues
            ("api_timeout", "increase_timeout"): 0.70,
            ("timeout", "increase_timeout"): 0.70,
            # Certificate issues
            ("certificate_expired", "renew_certificate"): 0.95,
            ("cert", "renew_certificate"): 0.95,
            # Manual always has some chance
            ("unknown", "manual_investigation"): 0.40,
        }
        
        # Get success rate with fallback
        key = (root_cause, fix_strategy)
        success_rate = SUCCESS_RATES.get(key, 0.30)
        
        # DEBUG FIXER
        print(f"[DEBUG FIXER] Execution Key: {key} -> Rate: {success_rate}")
        
        success = random.random() < success_rate
        
        if success:
            return {
                "status": "success",
                "message": f"Fix '{fix_strategy}' executed successfully",
                "output": "Issue resolved. Metrics normalized."
            }
        else:
            return {
                "status": "failed",
                "message": f"Fix '{fix_strategy}' did not resolve the issue",
                "output": "Issue persists. Further investigation needed."
            }
