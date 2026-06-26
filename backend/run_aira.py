"""
AIRA Master Training & Testing Script
Train and compare all RL algorithms, generate KPIs
"""

from backend.orchestrator.orchestrator import AIRAOrchestrator
import json
import os
from datetime import datetime


# Sample incidents for testing
SAMPLE_INCIDENTS = [
    "CPU spike on prod-server-01, load average 95%",
    "Memory exhaustion on api-gateway, OOM killed",
    "Disk full on database server, only 2% free",
    "Network latency to payment service, P99 > 5000ms",
    "Database connection pool exhausted on postgres-main",
    "Deadlock detected in MySQL orders database",
    "Auth service crashed after deployment",
    "API timeout to notification service",
    "SSL certificate expired for api.example.com",
    "Unknown error on monitoring server",
    "High CPU on worker nodes causing job delays",
    "Redis cache memory leak detected",
    "Kubernetes pod CrashLoopBackOff on order-service",
    "Database replication lag > 10 seconds",
    "Load balancer health checks failing",
]


def train_all_models(timesteps=10000):
    """Train DQN and PPO models."""
    # Lazy import to avoid loading PyTorch on startup
    from backend.rl.train_sb3 import train_dqn, train_ppo, test_environment
    print("\n" + "="*60)
    print("TRAINING ALL RL MODELS")
    print("="*60)
    
    # Test environment first
    test_environment()
    
    # Train DQN
    print("\n--- Training DQN ---")
    train_dqn(total_timesteps=timesteps)
    
    # Train PPO
    print("\n--- Training PPO ---")
    train_ppo(total_timesteps=timesteps)
    
    print("\n[OK] All models trained!")


def run_comparison(episodes=50):
    """Compare all RL modes on same incidents."""
    print("\n" + "="*60)
    print("AIRA RL ALGORITHM COMPARISON")
    print("="*60)
    
    modes = ["q_learning", "dqn", "ppo"]
    results = {}
    
    for mode in modes:
        print(f"\n--- Testing {mode.upper()} ---")
        
        orchestrator = AIRAOrchestrator(max_cycles=3, rl_mode=mode, enable_memory=False)
        
        for i in range(episodes):
            incident = SAMPLE_INCIDENTS[i % len(SAMPLE_INCIDENTS)]
            result = orchestrator.run(incident)
            
            # Progress indicator
            if (i + 1) % 10 == 0:
                kpi = orchestrator.get_kpi()
                print(f"  Episode {i+1}/{episodes}: Success Rate = {kpi['success_rate']:.1f}%")
        
        # Store results
        kpi = orchestrator.get_kpi()
        results[mode] = kpi
        
        print(f"\n  {mode.upper()} Results:")
        print(f"    Success Rate: {kpi['success_rate']:.1f}%")
        print(f"    Avg Cycles:   {kpi['avg_cycles']:.2f}")
        print(f"    MTTR:         {kpi['mttr_ms']:.0f}ms")
    
    return results


def generate_kpi_report(results: dict, save_path="reports/kpi_report.json"):
    """Generate KPI report for dashboard."""
    print("\n" + "="*60)
    print("KPI REPORT")
    print("="*60)
    
    report = {
        "generated_at": datetime.now().isoformat(),
        "algorithms": {}
    }
    
    print("\n{:15s} {:>12s} {:>12s} {:>12s}".format(
        "Algorithm", "Success %", "Avg Cycles", "MTTR (ms)"
    ))
    print("-" * 55)
    
    for mode, kpi in results.items():
        report["algorithms"][mode] = {
            "success_rate": kpi["success_rate"],
            "avg_cycles": kpi["avg_cycles"],
            "mttr_ms": kpi["mttr_ms"],
            "total_incidents": kpi["total_incidents"],
            "resolved": kpi["resolved"],
            "unresolved": kpi["unresolved"],
            "by_root_cause": kpi["by_root_cause"],
            "by_action": kpi["by_action"]
        }
        
        print("{:15s} {:>11.1f}% {:>12.2f} {:>12.0f}".format(
            mode.upper(),
            kpi["success_rate"],
            kpi["avg_cycles"],
            kpi["mttr_ms"]
        ))
    
    # Find best algorithm
    best = max(results.items(), key=lambda x: x[1]["success_rate"])
    report["best_algorithm"] = best[0]
    report["best_success_rate"] = best[1]["success_rate"]
    
    print(f"\n[BEST] {best[0].upper()} with {best[1]['success_rate']:.1f}% success rate")
    
    # Save report
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    with open(save_path, "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\n[OK] Report saved to {save_path}")
    
    return report


def run_single_demo(mode="q_learning", episodes=10):
    """Run a quick demo with verbose output."""
    print("\n" + "="*60)
    print(f"AIRA DEMO - {mode.upper()} MODE")
    print("="*60)
    
    orchestrator = AIRAOrchestrator(max_cycles=3, rl_mode=mode, enable_memory=False)
    
    for i in range(episodes):
        incident = SAMPLE_INCIDENTS[i % len(SAMPLE_INCIDENTS)]
        
        print(f"\n--- Episode {i+1} ---")
        print(f"Incident: {incident[:60]}...")
        
        result = orchestrator.run(incident)
        
        # Extract key info
        root_cause = "unknown"
        action = "unknown"
        for h in result["history"]:
            if h.get("agent") == "rca":
                root_cause = h.get("analysis", {}).get("root_cause", "unknown")
            if h.get("agent") == "policy":
                action = h.get("chosen_fix", "unknown")
        
        status = "[OK]" if result["final_status"] == "resolved" else "[FAIL]"
        print(f"  RCA: {root_cause}")
        print(f"  Action: {action}")
        print(f"  Result: {status} in {result['cycles']} cycles ({result['elapsed_ms']:.0f}ms)")
    
    kpi = orchestrator.get_kpi()
    print(f"\n--- Summary ---")
    print(f"Success Rate: {kpi['success_rate']:.1f}%")
    print(f"Avg Cycles: {kpi['avg_cycles']:.2f}")
    print(f"MTTR: {kpi['mttr_ms']:.0f}ms")
    
    return kpi


def main():
    """Main entry point."""
    import sys
    
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        
        if cmd == "train":
            timesteps = int(sys.argv[2]) if len(sys.argv) > 2 else 10000
            train_all_models(timesteps=timesteps)
            
        elif cmd == "compare":
            episodes = int(sys.argv[2]) if len(sys.argv) > 2 else 50
            results = run_comparison(episodes=episodes)
            generate_kpi_report(results)
            
        elif cmd == "demo":
            mode = sys.argv[2] if len(sys.argv) > 2 else "q_learning"
            run_single_demo(mode=mode, episodes=10)
            
        elif cmd == "full":
            # Full pipeline
            train_all_models(timesteps=10000)
            results = run_comparison(episodes=100)
            generate_kpi_report(results)
            
        else:
            print("Usage: python -m backend.run_aira [train|compare|demo|full]")
    else:
        # Default: quick demo
        run_single_demo(mode="q_learning", episodes=5)


if __name__ == "__main__":
    main()
