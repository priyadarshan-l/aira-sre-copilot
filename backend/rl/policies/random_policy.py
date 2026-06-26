# backend/rl/policies/random_policy.py

import random
from backend.rl.policies.base_policy import BasePolicy

class RandomPolicy(BasePolicy):
    """
    Random policy for baseline RL testing.
    Chooses actions uniformly at random.
    """

    def __init__(self):
        self.actions = [
            "scale_cpu",
            "restart_service",
            "free_disk_space",
            "manual_investigation"
        ]
    
    def select_action(self, state):
        """
        Select a random action regardless of state.
        """
        candidates = state.get("candidates", [])
        if not candidates:
            return None
        return random.choice(candidates)["fix_strategy"]