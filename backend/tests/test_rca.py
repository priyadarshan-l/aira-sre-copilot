from backend.agents.rca.rca_agent import RCAAgent

rca = RCAAgent()

incident = "Service crashed due to high CPU load and memory spike"

obs = rca.observe(incident)
thought = rca.reason(obs)
output = rca.act(thought)

print("\nRCA Output:")
print(output)
