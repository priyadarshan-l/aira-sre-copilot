# backend/rl/rl_logger.py

def log_transition(transition: dict, episode: int = None, step: int = None):
    """
    Log RL transition for debugging and analysis.
    
    Args:
        transition: Dict with state, action, reward, next_state, done
        episode: Optional episode number
        step: Optional step number within episode
    """
    header = ""
    if episode is not None and step is not None:
        header = f"[Episode {episode}, Step {step}]"
    elif episode is not None:
        header = f"[Episode {episode}]"
    
    if header:
        print(f"\n{header}")
    
    state = transition.get("state", {})
    print(f"  State: root_cause={state.get('root_cause')}, cycle={state.get('cycle')}")
    print(f"  Action: {transition.get('action')}")
    print(f"  Reward: {transition.get('reward')}")
    print(f"  Done: {transition.get('done')}")


def log_q_table(q_table: dict, top_n: int = 10):
    """
    Log Q-table values for inspection.
    
    Args:
        q_table: Dictionary mapping (state, action) -> value
        top_n: Number of top entries to show
    """
    if not q_table:
        print("\n[Q-TABLE] Empty")
        return
    
    print(f"\n[Q-TABLE] Total entries: {len(q_table)}")
    
    # Sort by value (descending)
    sorted_items = sorted(q_table.items(), key=lambda x: x[1], reverse=True)
    
    print(f"\nTop {top_n} Q-values:")
    for (state, action), value in sorted_items[:top_n]:
        print(f"  {state} + {action:25s} = {value:+.4f}")
    
    if len(sorted_items) > top_n:
        print(f"\n... and {len(sorted_items) - top_n} more entries")


def log_episode_summary(episode: int, result: dict, policy):
    """
    Log summary of an episode.
    
    Args:
        episode: Episode number
        result: Orchestrator run result
        policy: RL policy object
    """
    resolved = result.get("final_status") == "resolved"
    cycles = result.get("cycles", 0)
    
    print(f"\n{'='*60}")
    print(f"Episode {episode} Summary")
    print(f"{'='*60}")
    print(f"  Status: {result.get('final_status')}")
    print(f"  Cycles: {cycles}")
    print(f"  Epsilon: {policy.epsilon:.3f}")
    
    # Extract chosen actions
    actions = []
    for h in result.get("history", []):
        if h.get("agent") == "policy":
            actions.append(h.get("chosen_fix"))
    
    if actions:
        print(f"  Actions: {', '.join(actions)}")
    
    print(f"{'='*60}\n")
