from backend.orchestrator.orchestrator import AIRAOrchestrator
from backend.rl.rl_logger import log_episode_summary, log_q_table
from collections import defaultdict


def run_learning_test():
    orchestrator = AIRAOrchestrator(max_cycles=3)

    incident = "CPU spike detected in payment service"

    results = []
    fix_counts = defaultdict(int)
    reward_history = []

    EPISODES = 20  # Increased for better learning

    print("\n" + "="*60)
    print("AIRA RL LEARNING TEST")
    print("="*60)

    for episode in range(EPISODES):
        outcome = orchestrator.run(incident)

        # Extract chosen fix and rewards
        episode_rewards = []
        for h in outcome["history"]:
            if h.get("agent") == "policy":
                fix = h["chosen_fix"]
                fix_counts[fix] += 1
        
        # Get rewards from transitions
        for transition in orchestrator.transitions:
            episode_rewards.append(transition["reward"])
        
        reward_history.extend(episode_rewards)

        resolved = outcome["final_status"] == "resolved"
        results.append(resolved)

        # Log episode summary
        print(
            f"Episode {episode+1:02d} | "
            f"Resolved: {'✓' if resolved else '✗'} | "
            f"Cycles: {outcome['cycles']} | "
            f"Epsilon: {orchestrator.policy.epsilon:.3f} | "
            f"Avg Reward: {sum(episode_rewards)/len(episode_rewards) if episode_rewards else 0:.2f}"
        )

    print("\n" + "="*60)
    print("LEARNING RESULTS")
    print("="*60)
    
    print("\n--- FIX STRATEGY DISTRIBUTION ---")
    for fix, count in sorted(fix_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {fix:30s}: {count:3d} times")

    print("\n--- RESOLUTION RATE ---")
    resolved_count = sum(results)
    print(f"  Resolved: {resolved_count} / {EPISODES} ({100*resolved_count/EPISODES:.1f}%)")
    
    # Show improvement over time
    first_half = sum(results[:EPISODES//2])
    second_half = sum(results[EPISODES//2:])
    print(f"  First half:  {first_half}/{EPISODES//2} ({100*first_half/(EPISODES//2):.1f}%)")
    print(f"  Second half: {second_half}/{EPISODES//2} ({100*second_half/(EPISODES//2):.1f}%)")

    print("\n--- LEARNED Q VALUES ---")
    if hasattr(orchestrator.policy, "q_learning") and orchestrator.policy.q_learning:
        log_q_table(orchestrator.policy.q_learning.value_fn.q_table, top_n=15)

    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60 + "\n")


if __name__ == "__main__":
    run_learning_test()
