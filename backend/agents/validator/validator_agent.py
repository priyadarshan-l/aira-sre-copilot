from backend.agents.agent_base import BaseAgent
import psutil

class ValidatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="validator",
            description="Validates whether an incident has been resolved",
            version="1.1"
        )
    
    # -------------------------
    # Reasoning: validation logic + reward
    # -------------------------
    def reason(self, observation: dict) -> dict:
        self.log("REASON | Validating incident resolution")

        # UNWRAP OBSERVATION (BaseAgent wraps input in 'raw')
        input_data = observation.get("raw", {})
        if not isinstance(input_data, dict):
            # Fallback if raw is not dict (unlikely in orchestrator usage)
            input_data = observation

        incident_text = str(input_data.get("incident","")).lower()
        fix_output = input_data.get("fix_output", {})
        cycle = input_data.get("cycle", 1)
        max_cycles = input_data.get("max_cycles", 3)
        
        # Check execution results
        execution = fix_output.get("execution", {})
        execution_status = execution.get("status", "unknown")
        
        checks = []
        resolved = False

        # Check if it is a host metric validation
        is_host_cpu = "host-machine" in incident_text or "cpu spike" in incident_text or "host cpu" in incident_text
        is_host_ram = "host-machine" in incident_text and ("memory" in incident_text or "ram" in incident_text or "oom" in incident_text)

        if is_host_cpu:
            cpu_val = psutil.cpu_percent(interval=0.2)
            if cpu_val < 50.0:
                resolved = True
                checks.append(f"Host CPU metrics normalized: {cpu_val}% (Target: <50.0%)")
            else:
                resolved = False
                checks.append(f"Host CPU metrics still high: {cpu_val}% (Target: <50.0%)")
        elif is_host_ram:
            ram_val = psutil.virtual_memory().percent
            if ram_val < 85.0:
                resolved = True
                checks.append(f"Host RAM metrics normalized: {ram_val}% (Target: <85.0%)")
            else:
                resolved = False
                checks.append(f"Host RAM metrics still high: {ram_val}% (Target: <85.0%)")
        else:
            # Check if fix execution was successful
            if execution_status == "success":
                checks.append("Fix executed successfully")
                checks.append(execution.get("message", "No details"))
                resolved = True
            elif execution_status == "failed":
                checks.append("Fix execution failed")
                checks.append(execution.get("message", "No details"))
                resolved = False
            else:
                checks.append("No execution results available")
                resolved = False

        # -------------------------
        # Reward logic (RL signal)
        # -------------------------
        if resolved:
            reward = +1.0
        elif cycle >= max_cycles:
            reward = -1.0
        else:
            reward = -0.1

        thought = {
            "status": "resolved" if resolved else "unresolved",
            "checks": checks,
            "confidence": 0.8 if resolved else 0.4,
            "reward": reward,
            "next_action": "close_incident" if resolved else "retry_fix",
        }

        self.last_thought = thought
        self.history.append({
            "step": self.step_count,
            "event": "reason",
            "data": thought
        })

        return thought
    
    # -------------------------
    # Action: validation result
    # -------------------------
    def act(self, thought: dict) -> dict:
        self.log("ACT | Validation completed")

        output = {
            "agent": self.name,
            "validation": thought
        }

        self.last_output = output
        self.history.append({
            "step": self.step_count,
            "event": "act",
            "data": output
        })

        self.step_count += 1
        return output