# backend/rl/policies/base_policy.py

class BasePolicy:
    """
    Base class for all RL policies.

    A policy maps:
        state -> action

    Later:
    - RandomPolicy
    - HeuristicPolicy
    - DQNPolicy
    - PPOPolicy
    will inherit from this.
    """

    def select_action(self, state):
        """
        Decide what action to take given the current state.

        Parameters:
        ----------
        state : dict
            Environment state returned by IncidentEnv

        Returns:
        -------
        action : any
            Action to be taken (fix strategy, routing decision, etc.)
        """
        raise NotImplementedError(
            "select_action() must be implemented by subclasses"
        )

