from backend.agents.rca.rca_agent import RCAAgent

rca = RCAAgent()

incident = "The service went down due to very high CPU usage and repeated crashes"

obs = rca.observe(incident)
thought = rca.reason(obs)
output = rca.act(thought)

print("\nRCA Output:")
print(output)
