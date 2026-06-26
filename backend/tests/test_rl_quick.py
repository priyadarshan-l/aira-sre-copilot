from backend.orchestrator.orchestrator import AIRAOrchestrator
from backend.rl.rl_logger import log_q_table

# Quick test to see learning in action
orchestrator = AIRAOrchestrator(max_cycles=3)
incident = "CPU spike detected in payment service"

print("\n" + "="*60)
print("QUICK RL TEST - 10 Episodes")
print("="*60 + "\n")

for episode in range(10):
    outcome = orchestrator.run(incident)
    resolved = outcome["final_status"] == "resolved"
    
    # Get action from history
    action = "unknown"
    for h in outcome["history"]:
        if h.get("agent") == "policy":
            action = h["chosen_fix"]
            break
    
    print(
        f"Ep {episode+1:02d}: "
        f"{'[OK] RESOLVED' if resolved else '[X] Failed  '} | "
        f"Action: {action:25s} | "
        f"e={orchestrator.policy.epsilon:.3f}"
    )

print("\n" + "="*60)
print("LEARNED Q-VALUES")
print("="*60)
log_q_table(orchestrator.policy.value_fn.q_table, top_n=10)
print()
