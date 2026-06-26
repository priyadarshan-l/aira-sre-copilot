# backend/rl/trainers/q_learning_trainer.py

from backend.rl.state.abstractor import abstract_state


class QLearningTrainer:
    """
    Orchestrates Q-learning over episodes.
    """

    def __init__(self, env, value_fn, policy, action_space):
        self.env = env
        self.value_fn = value_fn
        self.policy = policy
        self.action_space = action_space

    def train(self, incidents, episodes=50):
        """
        Train Q-learning agent.
        """

        rewards_history = []

        for episode in range(episodes):
            incident = incidents[episode % len(incidents)]

            self.env.reset(incident)

            episode_reward = 0
            done = False

            while not done:
                # Run AIRA once (one episode step)
                next_state_raw, reward, done, info = self.env.step()

                # Use last transition from orchestrator
                transition = self.env.orchestrator.transitions[-1]

                state = abstract_state(transition)
                action = transition["action"]
                next_state = abstract_state(transition)

                # Update Q-table
                self.value_fn.update(
                    state=state,
                    action=action,
                    reward=reward,
                    next_state=next_state,
                    next_actions=self.action_space
                )

                episode_reward += reward

            # Decay exploration
            self.policy.decay_epsilon()
            rewards_history.append(episode_reward)

            print(
                f"Episode {episode + 1} | "
                f"Reward: {episode_reward:.2f} | "
                f"Epsilon: {self.policy.epsilon:.3f}"
            )

        return rewards_history
