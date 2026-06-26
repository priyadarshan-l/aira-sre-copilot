from backend.agents.agent_base import BaseAgent
from backend.tools.echo_tool import EchoTool

agent = BaseAgent(name="planner", description="Test agent")

# Register tool
agent.register_tool("echo", EchoTool())

# Run agent cycle manually
obs = agent.observe("Hello AIRA")
thought = agent.reason(obs)
output = agent.act(thought)

# Test tool call
tool_output = agent.use_tool("echo", "Tool is working")

print("\nFinal Output:", output)
print("Tool Output:", tool_output)
