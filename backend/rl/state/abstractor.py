# backend/rl/state/abstractor.py

def abstract_state(state: dict) -> tuple:
    """
    Convert raw RL state into a compact, hashable representation.

    Expected state format:
    {
        "root_cause": str,
        "cycle": int,
        "candidates": list
    }

    Returns:
        (root_cause, cycle_bucket)
    """

    root_cause = state.get("root_cause", "unknown")
    cycle = state.get("cycle", 0)

    # Bucket cycles to avoid state explosion
    if cycle <= 0:
        cycle_bucket = 0
    elif cycle == 1:
        cycle_bucket = 1
    else:
        cycle_bucket = 2

    return (root_cause, cycle_bucket)

