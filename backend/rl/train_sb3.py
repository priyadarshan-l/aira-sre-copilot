"""
AIRA RL Training with Stable Baselines3
Supports: DQN, PPO, A2C
"""

from stable_baselines3 import DQN, PPO, A2C
from stable_baselines3.common.env_checker import check_env
from stable_baselines3.common.evaluation import evaluate_policy
from stable_baselines3.common.callbacks import EvalCallback
import numpy as np
import os

from backend.rl.env.aira_env import AIRAEnv


def test_environment():
    """Test if environment is SB3 compatible."""
    print("\n" + "="*60)
    print("Testing AIRA Environment")
    print("="*60)
    
    env = AIRAEnv(max_cycles=3, random_incidents=True)
    
    # Run SB3 environment checker
    print("\nRunning SB3 environment check...")
    check_env(env, warn=True)
    print("[OK] Environment passed SB3 compatibility check!")
    
    # Quick manual test
    print("\nManual test run:")
    obs, info = env.reset()
    print(f"Initial obs: {obs}, info: {info}")
    
    for i in range(5):
        action = env.action_space.sample()
        obs, reward, terminated, truncated, info = env.step(action)
        print(f"Step {i+1}: action={action}, reward={reward:.2f}, done={terminated or truncated}")
        if terminated or truncated:
            break
    
    env.close()
    print("\n[OK] Environment test complete!")
    return True


def train_dqn(total_timesteps=10000, save_path="models/dqn_aira"):
    """Train DQN agent on AIRA environment."""
    print("\n" + "="*60)
    print("Training DQN Agent")
    print("="*60)
    
    env = AIRAEnv(max_cycles=3, random_incidents=True)
    
    model = DQN(
        "MlpPolicy",
        env,
        learning_rate=1e-4,
        buffer_size=10000,
        learning_starts=1000,
        batch_size=32,
        tau=0.1,
        gamma=0.99,
        train_freq=4,
        target_update_interval=100,
        exploration_fraction=0.3,
        exploration_initial_eps=1.0,
        exploration_final_eps=0.05,
        verbose=1
    )
    
    print(f"\nTraining for {total_timesteps} timesteps...")
    model.learn(total_timesteps=total_timesteps)
    
    # Save model
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    model.save(save_path)
    print(f"[OK] Model saved to {save_path}")
    
    # Evaluate
    mean_reward, std_reward = evaluate_policy(model, env, n_eval_episodes=20)
    print(f"\nDQN Evaluation: {mean_reward:.2f} +/- {std_reward:.2f}")
    
    env.close()
    return model, mean_reward


def train_ppo(total_timesteps=10000, save_path="models/ppo_aira"):
    """Train PPO agent on AIRA environment."""
    print("\n" + "="*60)
    print("Training PPO Agent")
    print("="*60)
    
    env = AIRAEnv(max_cycles=3, random_incidents=True)
    
    model = PPO(
        "MlpPolicy",
        env,
        learning_rate=3e-4,
        n_steps=128,
        batch_size=64,
        n_epochs=10,
        gamma=0.99,
        gae_lambda=0.95,
        clip_range=0.2,
        ent_coef=0.01,
        verbose=1
    )
    
    print(f"\nTraining for {total_timesteps} timesteps...")
    model.learn(total_timesteps=total_timesteps)
    
    # Save model
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    model.save(save_path)
    print(f"[OK] Model saved to {save_path}")
    
    # Evaluate
    mean_reward, std_reward = evaluate_policy(model, env, n_eval_episodes=20)
    print(f"\nPPO Evaluation: {mean_reward:.2f} +/- {std_reward:.2f}")
    
    env.close()
    return model, mean_reward


def compare_algorithms(timesteps=5000):
    """Compare all RL algorithms."""
    print("\n" + "="*60)
    print("AIRA RL Algorithm Comparison")
    print("="*60)
    
    results = {}
    
    # Random baseline
    print("\n--- Random Agent ---")
    env = AIRAEnv(max_cycles=3, random_incidents=True)
    rewards = []
    for _ in range(100):
        obs, _ = env.reset()
        episode_reward = 0
        done = False
        while not done:
            action = env.action_space.sample()
            obs, reward, terminated, truncated, _ = env.step(action)
            episode_reward += reward
            done = terminated or truncated
        rewards.append(episode_reward)
    results["Random"] = (np.mean(rewards), np.std(rewards))
    print(f"Random: {results['Random'][0]:.2f} +/- {results['Random'][1]:.2f}")
    env.close()
    
    # DQN
    print("\n--- DQN ---")
    _, dqn_reward = train_dqn(total_timesteps=timesteps)
    results["DQN"] = (dqn_reward, 0)
    
    # PPO
    print("\n--- PPO ---")
    _, ppo_reward = train_ppo(total_timesteps=timesteps)
    results["PPO"] = (ppo_reward, 0)
    
    # Summary
    print("\n" + "="*60)
    print("RESULTS SUMMARY")
    print("="*60)
    for algo, (mean, std) in results.items():
        print(f"{algo:10s}: {mean:+.2f}")
    
    best = max(results.items(), key=lambda x: x[1][0])
    print(f"\nBest Algorithm: {best[0]} ({best[1][0]:.2f})")
    
    return results


if __name__ == "__main__":
    # Test environment first
    test_environment()
    
    # Compare algorithms
    results = compare_algorithms(timesteps=5000)
