from backend.orchestrator.orchestrator import AIRAOrchestrator

if __name__ == "__main__":
    orchestrator = AIRAOrchestrator(max_cycles=3)

    incident = "CPU spike detected in payment service causing latency"

    result = orchestrator.run(incident)

    print("\nFINAL RESULT")
    print("=" * 40)
    print(result["final_status"])
    print("\nHISTORY")
    for step in result["history"]:
        print(step)
