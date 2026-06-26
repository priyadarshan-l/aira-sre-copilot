from backend.rl.env.aira_env import AIRAEnv

env = AIRAEnv()
obs, info = env.reset()
print("Initial obs:", obs)

done = False
while not done:
    action = env.action_space.sample()
    obs, reward, terminated, truncated, info = env.step(action)
    done = terminated or truncated

    print("Obs:", obs, "Reward:", reward, "Done:", done, info)
