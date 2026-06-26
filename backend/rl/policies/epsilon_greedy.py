import random

class EpsilonGreedyPolicy:
    """
    ε-greedy policy:
    - explore with probability ε
    - exploit with probability (1 - ε)
    """

    def __init__(self, epsilon=1.0, min_epsilon=0.1, decay=0.995):
        self.epsilon = epsilon
        self.min_epsilon = min_epsilon
        self.decay = decay

    def select_action(self, state, actions, value_fn):
        """
        Choose action using ε-greedy strategy.
        """

        # Explore
        if random.random() < self.epsilon:
            return random.choice(actions)
        
        # Exploit
        return value_fn.best_action(state, actions)
    
    def decay_epsilon(self):
        """
        Reduce exploration over time.
        """
        self.epsilon = max(
            self.min_epsilon,
            self.epsilon * self.decay
        )


        