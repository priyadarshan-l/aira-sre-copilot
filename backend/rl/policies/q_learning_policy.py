import random
from backend.rl.value_functions.tabular_q import TabularQValueFunction


class QLearningPolicy:
    """
    Epsilon-greedy Q-learning policy.
    Owns the Q-value function.
    """

    def __init__(
        self,
        epsilon: float = 1.0,
        epsilon_min: float = 0.1,
        epsilon_decay: float = 0.9,
        alpha: float = 0.1,
        gamma: float = 0.95,
    ):
        self.epsilon = epsilon
        self.epsilon_min = epsilon_min
        self.epsilon_decay = epsilon_decay

        # 🔑 RL Brain
        self.value_fn = TabularQValueFunction(
            alpha=alpha,
            gamma=gamma
        )
        
        # 🧠 Knowledge Injection (Bootstrap)
        self._inject_expert_knowledge()

    def _inject_expert_knowledge(self):
        """
        Pre-populates the Q-table with known optimal SRE actions.
        This gives the agent a 'head start' (Imitation Learning).
        """
        expert_rules = {
            "cpu": "scale_cpu", "cpu_spike": "scale_cpu",
            "memory": "restart_service", "memory_leak": "restart_service",
            "disk": "clear_disk_space", "disk_full": "clear_disk_space",
            "network": "restart_network", "network_latency": "restart_network",
            "database_connection_pool": "reset_db_connections",
            "database_deadlock": "kill_db_deadlock",
            "service_crash": "restart_service",
            "api_timeout": "increase_timeout",
            "certificate_expired": "renew_certificate",
            "unknown": "manual_investigation"
        }
        
        # We can't set Q-values directly without state IDs, which are dynamic in TabularQ.
        # However, TabularQ manages state keys as strings: f"{root_cause}_{cycle}_{candidates_str}"
        # Since we can't predict exact candidate strings, we will fallback to a smart
        # heuristic in select_action if the Q-table is empty for that state.
        self.expert_rules = expert_rules

    # --------------------------------------------------
    # Action selection (epsilon-greedy)
    # --------------------------------------------------
    def select_action(self, state: dict) -> str:
        candidates = state.get("candidates", [])

        if not candidates:
            return "manual_investigation"

        actions = [c["fix_strategy"] for c in candidates]

        # Exploration (unless expert rule overrides)
        # We allow exploration, but if we have an expert rule and Q-values are 0, we guide it.
        
        root_cause = state.get("root_cause")
        expert_action = self.expert_rules.get(root_cause)
        
        # Check if we should use expert guidance instead of random exploration
        # (Only if Q-values are fresh/zero)
        q_values = [self.value_fn.get(state, a) for a in actions]
        is_untrained = all(v == 0.0 for v in q_values)
        
        if is_untrained and expert_action in actions:
            return expert_action

        if random.random() < self.epsilon:
            return random.choice(actions)

        # Exploitation
        return self.value_fn.best_action(state, actions)

    # --------------------------------------------------
    # Learning update
    # --------------------------------------------------
    def update(self, transition: dict):
        """
        transition = {
            state,
            action,
            reward,
            next_state,
            done
        }
        """
        state = transition["state"]
        action = transition["action"]
        reward = transition["reward"]
        next_state = transition["next_state"]

        next_candidates = next_state.get("candidates", [])
        next_actions = [c["fix_strategy"] for c in next_candidates]

        self.value_fn.update(
            state=state,
            action=action,
            reward=reward,
            next_state=next_state,
            next_actions=next_actions
        )

        self._decay_epsilon()
        self.value_fn.save()


    # --------------------------------------------------
    # Helpers
    # --------------------------------------------------
    def _decay_epsilon(self):
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay
