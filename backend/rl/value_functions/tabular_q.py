# backend/rl/value_functions/tabular_q.py

import pickle
import os
from collections import defaultdict
from backend.rl.state.abstractor import abstract_state

class TabularQValueFunction:
    def __init__(
        self,
        alpha=0.1,
        gamma=0.95,
        save_path="data/q_table.pkl"
    ):
        self.alpha = alpha
        self.gamma = gamma
        self.save_path = save_path

        # (abstract_state, action) -> value
        self.q_table = defaultdict(float)

        self._load()

    def get(self, state: dict, action: str) -> float:
        """
        state: raw RL state dict
        """
        s = abstract_state(state)   # ✅ convert dict → tuple
        return self.q_table[(s, action)]

    def best_action(self, state: dict, actions: list[str]) -> str:
        """
        Return the action with the highest Q-value for a given state.
        If multiple actions have the same Q-value, choose randomly among them.
        """
        import random
        
        s = abstract_state(state)

        best_a = []
        best_q = float("-inf")

        for a in actions:
            q = self.q_table[(s, a)]
            if q > best_q:
                best_q = q
                best_a = [a]
            elif q == best_q:
                best_a.append(a)

        # Return random choice among best actions (handles ties)
        return random.choice(best_a) if best_a else actions[0]

    def update(self, state, action, reward, next_state, next_actions):
        s = abstract_state(state)
        s_next = abstract_state(next_state)

        current_q = self.q_table[(s, action)]

        future_q = 0.0
        if next_actions:
            future_q = max(
                self.q_table[(s_next, a)] for a in next_actions
            )

        updated_q = current_q + self.alpha * (
            reward + self.gamma * future_q - current_q
        )

        self.q_table[(s, action)] = updated_q

    # -------------------------
    # Persistence
    # -------------------------
    def save(self):
        os.makedirs(os.path.dirname(self.save_path), exist_ok=True)
        with open(self.save_path, "wb") as f:
            pickle.dump(dict(self.q_table), f)

    def _load(self):
        if os.path.exists(self.save_path):
            with open(self.save_path, "rb") as f:
                data = pickle.load(f)
                self.q_table = defaultdict(float, data)
