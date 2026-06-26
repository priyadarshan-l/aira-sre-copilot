import datetime
from typing import Any, Dict, Optional

# -------------------------
# Timestamp helper
# -------------------------
def timestamp():
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# -------------------------
# Base Agent Class
# -------------------------
class BaseAgent:
    def __init__(self, name: str, description: str, version: str = "1.0"):
        self.name = name
        self.description = description
        self.version = version

        # Agent internal state
        self.last_input: Optional[Any] = None
        self.last_thought: Optional[Dict] = None
        self.last_output: Optional[Dict] = None

        self.history = []  # list of event dicts
        self.step_count = 0

        # Tools dictionary
        self.tools = {}

        self.log(f"Initialized agent: {self.name} (v{self.version})")

    # -------------------------
    # Logging utility
    # -------------------------
    def log(self, message: str):
        print(f"{timestamp()} | {self.name.upper()} | {message}")

    # -------------------------
    # Observation step
    # -------------------------
    def observe(self, data: Any) -> Dict:
        self.log("OBSERVE | Received input")

        observation = {
            "raw": data,
            "length": len(str(data)) if data is not None else 0
        }

        self.last_input = observation
        self.history.append({"step": self.step_count, "event": "observe", "data": observation})

        return observation

    # -------------------------
    # Reasoning step
    # -------------------------
    def reason(self, observation: Dict) -> Dict:
        self.log("REASON | Processing observation")

        thought = {
            "thought": f"Processed input of length {observation.get('length', 0)}",
            "next_action": "none",
            "tool": None
        }

        self.last_thought = thought
        self.history.append({"step": self.step_count, "event": "reason", "data": thought})

        return thought

    # -------------------------
    # Action step
    # -------------------------
    def act(self, thought: Dict) -> Dict:
        self.log("ACT | Producing output based on reasoning")

        output = {
            "agent": self.name,
            "action": thought.get("next_action"),
            "result": "No-op action (base agent)",
            "confidence": 0.5
        }

        self.last_output = output
        self.history.append({"step": self.step_count, "event": "act", "data": output})

        self.step_count += 1
        return output

    # -------------------------
    # Tool system
    # -------------------------
    def register_tool(self, name: str, tool_obj: Any):
        self.tools[name] = tool_obj
        self.log(f"Tool registered: {name}")

    def use_tool(self, name: str, input_data: Any) -> Any:
        if name not in self.tools:
            self.log(f"ERROR | Tool '{name}' not found")
            return None

        self.log(f"TOOL | Executing tool '{name}'")
        tool = self.tools[name]
        return tool.run(input_data)
