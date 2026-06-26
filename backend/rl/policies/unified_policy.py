"""
Unified RL Policy Selector for AIRA
Supports: Q-learning (tabular), DQN, PPO
Allows switching between algorithms for comparison.
"""

from enum import Enum
from typing import Optional, Dict, Any
import os
import numpy as np
import torch
import torch.nn as nn

# Import policies
from backend.rl.policies.q_learning_policy import QLearningPolicy


class RLMode(Enum):
    """Available RL algorithms."""
    Q_LEARNING = "q_learning"
    DQN = "dqn"
    PPO = "ppo"


class UnifiedPolicy:
    """
    Unified policy interface for all RL algorithms.
    Allows switching between Q-learning, DQN, and PPO.
    """
    
    # Model paths
    MODEL_DIR = "models"
    DQN_PATH = "models/dqn_aira"
    PPO_PATH = "models/ppo_aira"
    
    def __init__(self, mode: RLMode = RLMode.Q_LEARNING):
        self.mode = mode
        self.q_learning = None
        self.dqn_model = None
        self.ppo_model = None
        self.epsilon = 1.0  # For tracking exploration
        
        # Action mapping (same as environment)
        self.ACTIONS = {
            0: "scale_cpu",
            1: "restart_service",
            2: "clear_disk_space",
            3: "restart_network",
            4: "reset_db_connections",
            5: "kill_db_deadlock",
            6: "rollback_deployment",
            7: "increase_timeout",
            8: "renew_certificate",
            9: "manual_investigation"
        }
        
        # Root cause mapping
        self.ROOT_CAUSES = {
            "cpu": 0, "cpu_spike": 0,
            "memory": 1, "memory_leak": 1,
            "disk": 2, "disk_full": 2,
            "network": 3, "network_latency": 3,
            "database_connection_pool": 4, "db_pool": 4,
            "database_deadlock": 5, "db_deadlock": 5,
            "service_crash": 6, "crash": 6,
            "api_timeout": 7, "timeout": 7,
            "certificate_expired": 8, "cert": 8,
            "unknown": 9
        }
        
        self._load_model()
    
    def _load_model(self):
        """Load the appropriate model based on mode."""
        if self.mode == RLMode.Q_LEARNING:
            self.q_learning = QLearningPolicy()
            self.epsilon = self.q_learning.epsilon
            
        elif self.mode == RLMode.DQN:
            try:
                from stable_baselines3 import DQN
                if os.path.exists(f"{self.DQN_PATH}.zip"):
                    self.dqn_model = DQN.load(self.DQN_PATH)
                    print(f"[OK] Loaded DQN model from {self.DQN_PATH}")
                else:
                    print("[WARN] DQN model not found, will use untrained model")
                    self._train_dqn_quick()
            except ImportError:
                raise ImportError("stable-baselines3 required for DQN mode")
                
        elif self.mode == RLMode.PPO:
            try:
                from stable_baselines3 import PPO
                if os.path.exists(f"{self.PPO_PATH}.zip"):
                    self.ppo_model = PPO.load(self.PPO_PATH)
                    print(f"[OK] Loaded PPO model from {self.PPO_PATH}")
                else:
                    print("[WARN] PPO model not found, will use untrained model")
                    self._train_ppo_quick()
            except ImportError:
                raise ImportError("stable-baselines3 required for PPO mode")
    
    def _train_dqn_quick(self, timesteps=5000):
        """Quick train DQN if no model exists."""
        from stable_baselines3 import DQN
        from backend.rl.env.aira_env import AIRAEnv
        
        env = AIRAEnv(max_cycles=3)
        self.dqn_model = DQN("MlpPolicy", env, verbose=0)
        self.dqn_model.learn(total_timesteps=timesteps)
        os.makedirs(self.MODEL_DIR, exist_ok=True)
        self.dqn_model.save(self.DQN_PATH)
        env.close()
    
    def _train_ppo_quick(self, timesteps=5000):
        """Quick train PPO if no model exists."""
        from stable_baselines3 import PPO
        from backend.rl.env.aira_env import AIRAEnv
        
        env = AIRAEnv(max_cycles=3)
        self.ppo_model = PPO("MlpPolicy", env, verbose=0)
        self.ppo_model.learn(total_timesteps=timesteps)
        os.makedirs(self.MODEL_DIR, exist_ok=True)
        self.ppo_model.save(self.PPO_PATH)
        env.close()
    
    def select_action(self, state: Dict[str, Any]) -> str:
        """
        Select action based on current RL mode.
        
        Args:
            state: Dict with root_cause, cycle, candidates, etc.
            
        Returns:
            Action name (string)
        """
        if self.mode == RLMode.Q_LEARNING:
            return self._select_q_learning(state)
        elif self.mode == RLMode.DQN:
            return self._select_dqn(state)
        elif self.mode == RLMode.PPO:
            return self._select_ppo(state)
        else:
            return "manual_investigation"
    
    def _select_q_learning(self, state: Dict) -> str:
        """Select action using Q-learning."""
        return self.q_learning.select_action(state)
    
    def _select_dqn(self, state: Dict) -> str:
        """Select action using DQN."""
        if self.dqn_model is None:
            return "manual_investigation"
        
        obs = self._state_to_obs(state)
        action, _ = self.dqn_model.predict(obs, deterministic=True)
        return self.ACTIONS.get(int(action), "manual_investigation")
    
    def _select_ppo(self, state: Dict) -> str:
        """Select action using PPO."""
        if self.ppo_model is None:
            return "manual_investigation"
        
        obs = self._state_to_obs(state)
        action, _ = self.ppo_model.predict(obs, deterministic=True)
        return self.ACTIONS.get(int(action), "manual_investigation")
    
    def _state_to_obs(self, state: Dict) -> np.ndarray:
        """Convert state dict to observation array."""
        root_cause = state.get("root_cause", "unknown")
        root_cause_id = self.ROOT_CAUSES.get(root_cause, 9)
        cycle = state.get("cycle", 0)
        severity = state.get("severity", 1)
        time_of_day = state.get("time_of_day", 1)
        
        return np.array([root_cause_id, cycle, severity, time_of_day], dtype=np.float32)
    
    def update(self, transition: Dict):
        """Update policy (only applies to Q-learning in online mode)."""
        if self.mode == RLMode.Q_LEARNING and self.q_learning:
            self.q_learning.update(transition)
            self.epsilon = self.q_learning.epsilon
    
    def save(self):
        """Save current model."""
        if self.mode == RLMode.Q_LEARNING and self.q_learning:
            self.q_learning.value_fn.save()
        elif self.mode == RLMode.DQN and self.dqn_model:
            self.dqn_model.save(self.DQN_PATH)
        elif self.mode == RLMode.PPO and self.ppo_model:
            self.ppo_model.save(self.PPO_PATH)
    
    def get_mode_name(self) -> str:
        """Get current mode as string."""
        return self.mode.value
    
    def set_mode(self, mode: str):
        """Switch RL mode."""
        mode_map = {
            "q_learning": RLMode.Q_LEARNING,
            "dqn": RLMode.DQN,
            "ppo": RLMode.PPO
        }
        if mode in mode_map:
            self.mode = mode_map[mode]
            self._load_model()
        else:
            raise ValueError(f"Unknown mode: {mode}. Use: q_learning, dqn, ppo")
    
    def get_stats(self) -> Dict:
        """Get policy statistics for dashboard."""
        stats = {
            "mode": self.mode.value,
            "epsilon": self.epsilon
        }
        
        if self.mode == RLMode.Q_LEARNING and self.q_learning:
            stats["q_table_size"] = len(self.q_learning.value_fn.q_table)
        
        return stats


class QTableONNXWrapper(nn.Module):
    """
    Wraps the Tabular Q-learning lookup table in a PyTorch module
    so it can be exported as an ONNX model.
    """
    def __init__(self, q_table_dict, root_cause_mapping):
        super().__init__()
        # Table shape: 30 states (10 root causes * 3 cycle buckets) x 10 actions
        self.q_table_tensor = nn.Parameter(torch.zeros(30, 10), requires_grad=False)
        
        # Populate tensor
        for (state_tuple, action), q_val in q_table_dict.items():
            rc, cb = state_tuple
            rc_id = root_cause_mapping.get(rc, 9)
            cb = max(0, min(2, cb))
            state_idx = rc_id * 3 + cb
            
            action_map = {
                "scale_cpu": 0,
                "restart_service": 1,
                "clear_disk_space": 2,
                "restart_network": 3,
                "reset_db_connections": 4,
                "kill_db_deadlock": 5,
                "rollback_deployment": 6,
                "increase_timeout": 7,
                "renew_certificate": 8,
                "manual_investigation": 9
            }
            action_id = action_map.get(action, 9)
            self.q_table_tensor[state_idx, action_id] = q_val

    def forward(self, obs):
        # Input observation: [root_cause_id, cycle, severity, time_of_day]
        rc_id = obs[:, 0].long()
        cycle = obs[:, 1].long()
        
        # Bucket cycle: <=0 -> 0, ==1 -> 1, >1 -> 2
        cb = torch.where(cycle <= 0, 0, torch.where(cycle == 1, 1, 2))
        
        # Clamp root_cause_id to 0-9
        rc_id = torch.clamp(rc_id, 0, 9)
        state_idx = rc_id * 3 + cb
        state_idx = torch.clamp(state_idx, 0, 29)
        
        # Look up corresponding row in Q-table parameter
        return self.q_table_tensor[state_idx]
