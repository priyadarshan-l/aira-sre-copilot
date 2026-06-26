from backend.agents.fixer.fixer_agent import FixerAgent

fixer = FixerAgent()

rca_output = {
    "root_cause": "CPU saturation",
    "evidence": ["High CPU usage"]
}

obs = fixer.observe(rca_output)
thought = fixer.reason(obs)
output = fixer.act(thought)

print("\nFixer Output:")
print(output)
