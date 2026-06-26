from backend.agents.agent_base import BaseAgent
from backend.llm.llm_factory import get_llm


class PlannerAgent(BaseAgent):
    """
    PlannerAgent — Entry point of the AIRA multi-agent pipeline.
    Uses Gemini to analyze incidents and produce a structured triage plan.
    Falls back to keyword-based routing if LLM is unavailable.
    """

    def __init__(self):
        super().__init__(
            name="planner",
            description="Plans incident resolution flow and routes agents",
            version="2.0"
        )
        self.memory = None
        self.llm = get_llm()

    # ─────────────────────────────────────────────────────────────────
    # Reasoning: LLM triage → keyword fallback
    # ─────────────────────────────────────────────────────────────────
    def reason(self, observation: dict) -> dict:
        self.log("REASON | Planning incident workflow")

        incident_text = str(observation.get("raw", "")).strip()

        # 1. Try Gemini LLM for intelligent triage
        thought = self._llm_plan(incident_text)

        # 2. Fallback to rule-based routing
        if not thought or thought.get("error"):
            thought = self._rule_based_plan(incident_text)

        self.last_thought = thought
        self.history.append({
            "step": self.step_count,
            "event": "reason",
            "data": thought
        })

        return thought

    def _llm_plan(self, incident_text: str) -> dict:
        """Ask Gemini to produce a structured incident triage plan."""
        prompt = f"""You are an expert SRE (Site Reliability Engineer) AI named AIRA.
Analyze the following production incident and produce a structured triage plan.

Incident: {incident_text}

Return a JSON object with EXACTLY these keys:
{{
  "next_agent": "rca",
  "reason": "<one sentence explanation of why RCA is needed>",
  "category": "<one of: cpu|memory|disk|network|database|security|api|unknown>",
  "severity": "<one of: critical|high|medium|low>",
  "summary": "<concise 10-word summary of the incident>"
}}"""

        try:
            output = self.llm.generate(prompt)
            if output and output.get("next_agent"):
                print(f"[PlannerAgent] [OK] Gemini triage: {output.get('category')} / {output.get('severity')}")
                return output
        except Exception as e:
            print(f"[PlannerAgent] LLM error: {e}")

        return {}

    def _rule_based_plan(self, incident_text: str) -> dict:
        """Keyword-based fallback routing."""
        text = incident_text.lower()
        if any(k in text for k in ["cpu", "load average", "compute"]):
            category, severity = "cpu", "high"
        elif any(k in text for k in ["memory", "oom", "out of memory", "heap"]):
            category, severity = "memory", "high"
        elif any(k in text for k in ["disk", "storage", "space"]):
            category, severity = "disk", "medium"
        elif any(k in text for k in ["network", "latency", "timeout", "lag"]):
            category, severity = "network", "high"
        elif any(k in text for k in ["database", "db", "sql", "deadlock", "connection pool"]):
            category, severity = "database", "critical"
        elif any(k in text for k in ["ssl", "certificate", "cert"]):
            category, severity = "security", "critical"
        elif any(k in text for k in ["api", "service", "crash", "pod"]):
            category, severity = "api", "high"
        else:
            category, severity = "unknown", "medium"

        return {
            "next_agent": "rca",
            "reason": f"Detected {category} incident patterns requiring root cause analysis",
            "category": category,
            "severity": severity,
            "summary": incident_text[:60]
        }

    # ─────────────────────────────────────────────────────────────────
    # Action
    # ─────────────────────────────────────────────────────────────────
    def act(self, thought: dict) -> dict:
        self.log("ACT | Planning decision finalized")

        output = {
            "agent": self.name,
            "action": "plan",
            "thought": f"[PLANNER] {thought.get('summary', 'Incident triaged')} → Routing to {thought.get('next_agent', 'rca').upper()}",
            "decision": thought
        }

        self.last_output = output
        self.history.append({
            "step": self.step_count,
            "event": "act",
            "data": output
        })

        self.step_count += 1
        return output
