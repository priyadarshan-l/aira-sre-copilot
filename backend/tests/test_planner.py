from backend.agents.planner.planner_agent import PlannerAgent

planner = PlannerAgent()

incident = "CPU usage is very high and the system is almost down"

obs = planner.observe(incident)
thought = planner.reason(obs)
output = planner.act(thought)

print("\nPlanner Output:")
print(output)
