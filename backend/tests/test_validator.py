from backend.agents.validator.validator_agent import ValidatorAgent

validator = ValidatorAgent()

observation = {
    "incident": "CPU spike issue",
    "fix_output": "Service restarted successfully"
}

obs = validator.observe(observation)
thought = validator.reason(obs)
output = validator.act(thought)

print("\nValidator Output:")
print(output)
