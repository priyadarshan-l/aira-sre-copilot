from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class IncidentRequest(BaseModel):
    incident_text: str
    rl_mode: str = "q_learning"  # q_learning, dqn, ppo, compare
    max_cycles: int = 5 

class AgentStep(BaseModel):
    agent: str
    action: str
    thought: Optional[str] = None
    output: Optional[Any] = None
    timestamp: Optional[str] = None

class IncidentResponse(BaseModel):
    incident_id: str
    final_status: str  # resolved, unresolved
    total_steps: int
    history: List[AgentStep]
    mttr_ms: float
