from backend.agents.agent_base import BaseAgent
from backend.llm.llm_factory import get_llm
from backend.memory.memory_manager import MemoryManager


class RCAAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="rca",
            description="Analyzes incidents to find root cause",
            version="2.0"
        )
        self.llm = get_llm()
        self.memory = None

    # -------------------------
    # Rule-based fallback (Enhanced for RL Env)
    # -------------------------
    def rule_based_rca(self, text: str) -> dict:
        text = text.lower()
        
        # 1. CPU
        if any(w in text for w in ["cpu", "load average"]):
            if "spike" in text or "high" in text:
                return {"root_cause": "cpu_spike", "confidence": 0.95}
            return {"root_cause": "cpu", "confidence": 0.9}
            
        # 2. Memory
        if any(w in text for w in ["memory", "oom", "out of memory"]):
            if "leak" in text:
                return {"root_cause": "memory_leak", "confidence": 0.95}
            return {"root_cause": "memory", "confidence": 0.9}
            
        # 3. Disk
        if any(w in text for w in ["disk", "storage", "space"]):
            return {"root_cause": "disk_full", "confidence": 0.95}
            
        # 4. Network
        if any(w in text for w in ["network", "latency", "lag"]):
            return {"root_cause": "network_latency", "confidence": 0.95}
            
        # 5. DB Pool
        if "connection pool" in text:
            return {"root_cause": "database_connection_pool", "confidence": 0.95}
            
        # 6. DB Deadlock
        if "deadlock" in text:
            return {"root_cause": "database_deadlock", "confidence": 0.95}
            
        # 7. Service Crash
        if "crashed" in text or "crashloopbackoff" in text:
            return {"root_cause": "service_crash", "confidence": 0.95}
            
        # 8. API Timeout
        if "timeout" in text or "timed out" in text:
            return {"root_cause": "api_timeout", "confidence": 0.95}
            
        # 9. Certificate
        if "certificate" in text or "ssl" in text:
            return {"root_cause": "certificate_expired", "confidence": 1.0}
            
        # 10. Unknown
        return {"root_cause": "unknown", "confidence": 0.5}
        
    # -------------------------
    # Reasoning: LLM first, rule fallback
    # -------------------------
    def reason(self, observation: dict) -> dict:
        self.log("REASON | RCA with recalled memory")
        raw_text = str(observation.get("raw", "") or observation.get("incident", "")).lower()
        
        # DEBUG: Print what RCA sees
        print(f"[DEBUG RCA] Analyzing text: '{raw_text}'")

        # 1. Try Memory Recall (RAG)
        past = self.memory.recall(raw_text, k=1)
        
        # 2. Try Rule-based (Fast & Accurate for known patterns)
        rule_output = self.rule_based_rca(raw_text)
        print(f"[DEBUG RCA] Rule Match: {rule_output}")
        
        if rule_output["root_cause"] != "unknown":
            return {
                "root_cause": rule_output["root_cause"],
                "evidence": [f"Matched pattern for {rule_output['root_cause']}"],
                "confidence": rule_output["confidence"],
                "next_agent": "fixer"
            }

        # 3. Fallback to LLM (if configured)
        try:
            prompt = f"Analyze incident: {raw_text}. Return valid JSON with root_cause."
            output = self.llm.generate(prompt)
            if output.get("root_cause"):
                return output
        except Exception:
            pass

        return {
            "root_cause": "unknown",
            "evidence": ["No matching patterns found"],
            "confidence": 0.1,
            "next_agent": "fixer"
        }

    # -------------------------
    # Action
    # -------------------------
    def act(self, thought: dict) -> dict:
        self.log("ACT | Root cause analysis completed")

        output = {
            "agent": self.name,
            "analysis": thought,
            "confidence": thought.get("confidence", 0.5)
        }

        self.last_output = output
        self.history.append({
            "step": self.step_count,
            "event": "act",
            "data": output
        })

        self.step_count += 1
        return output
    


        