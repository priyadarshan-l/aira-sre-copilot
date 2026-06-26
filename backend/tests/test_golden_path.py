"""
Golden Path Verification Test
Forces correct actions to verify the Orchestrator -> Agent pipeline works.
"""

from backend.orchestrator.orchestrator import AIRAOrchestrator
import json

def test_golden_path():
    print("="*60)
    print("GOLDEN PATH VERIFICATION")
    print("="*60)
    
    # 1. Setup Orchestrator (Q-learning mode)
    orchestrator = AIRAOrchestrator(max_cycles=3, rl_mode="q_learning", enable_memory=False)
    
    # 2. Define a "Golden" Incident (Certificate Expired -> Renew Certificate)
    incident = "SSL certificate expired for api.example.com"
    print(f"\n1. Injecting Incident: '{incident}'")
    
    # 3. FORCE the Fixer to ALWAYS choose 'renew_certificate' if it's a candidate
    # We do this by intercepting the run loop logic or ensuring RL picks it.
    # For this test, we will trust the agents but verify the Fixer action space logic.
    
    print("2. Running Orchestrator (with Forced Action Injection)...")
    
    # CRITICAL: We monkey-patch the policy to force the correct action
    # This proves the PIPELINE works, even if the brain isn't trained yet.
    original_select = orchestrator.policy.select_action
    orchestrator.policy.select_action = lambda state: "renew_certificate"
    
    result = orchestrator.run(incident)
    
    # Restore policy
    orchestrator.policy.select_action = original_select
    
    # 4. Analyze Results
    print("\n3. Analysis:")
    
    history = result["history"]
    rca_out = next((h for h in history if h.get("agent") == "rca"), None)
    policy_out = next((h for h in history if h.get("agent") == "policy"), None)
    fixer_out = next((h for h in history if h.get("agent") == "fixer"), None)
    val_out = next((h for h in history if h.get("agent") == "validator"), None)
    
    # RCA Check
    print(f"  RCA Output: {json.dumps(rca_out.get('analysis', {}).get('root_cause'), indent=2)}")
    
    # Policy Check
    print(f"  Policy Action: {policy_out.get('chosen_fix')}")
    
    # Fixer Check
    print(f"  Fixer Execution: {fixer_out.get('execution', {}).get('status')}")
    print(f"  Fixer Rate Used: {fixer_out.get('execution', {}).get('message')}") # Indirect check
    
    # Validator Check
    print(f"  Validator Status: {val_out.get('validation', {}).get('status')}")
    
    # Final Result
    print(f"\n4. Final Status: {result['final_status']}")
    
    if result['final_status'] == "resolved":
        print("\n[SUCCESS] Pipeline is working correctly!")
        return True
    else:
        print("\n[FAIL] Pipeline broken.")
        return False

if __name__ == "__main__":
    test_golden_path()
