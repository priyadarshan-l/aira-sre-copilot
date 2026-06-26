# Quick diagnostic to see what's happening with action selection
from backend.orchestrator.orchestrator import AIRAOrchestrator
import random

random.seed(42)  # For reproducibility

orchestrator = AIRAOrchestrator(max_cycles=3)
incident = "CPU spike detected in payment service"

print("\n" + "="*60)
print("DIAGNOSTIC: Action Selection Test")
print("="*60 + "\n")

# Run 5 episodes with detailed logging
for episode in range(5):
    print(f"\n--- Episode {episode+1} ---")
    outcome = orchestrator.run(incident)
    
    # Check what actions were available and which was chosen
    for h in outcome["history"]:
        if h.get("agent") == "fixer" and "candidates" in h.get("data", {}):
            candidates = h["data"]["candidates"]
            print(f"Available actions: {[c['fix_strategy'] for c in candidates]}")
        
        if h.get("agent") == "policy":
            chosen = h["chosen_fix"]
            print(f"Chosen action: {chosen}")
        
        if h.get("agent") == "fixer" and "execution" in h.get("data", {}):
            execution = h["data"]["execution"]
            print(f"Execution result: {execution['status']} - {execution['message']}")
        
        if h.get("agent") == "validator":
            validation = h["data"]["validation"]
            print(f"Validation: {validation['status']} (reward={validation['reward']})")
    
    print(f"Final status: {outcome['final_status']}")
    print(f"Epsilon: {orchestrator.policy.epsilon:.3f}")

print("\n" + "="*60)
print("Q-TABLE CONTENTS")
print("="*60)
for (state, action), value in orchestrator.policy.value_fn.q_table.items():
    print(f"  {state} + {action:25s} = {value:+.4f}")
print()
