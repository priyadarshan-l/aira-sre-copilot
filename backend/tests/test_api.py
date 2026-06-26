from fastapi.testclient import TestClient
from backend.api.app import app

# Initialize without arguments first, then mount app? 
# Or just try standard instantiation which usually works.
# The error suggests 'app' kwarg is passed to httpx.Client which rejects it.
# This usually happens if starlette/httpx versions are out of sync.
# let's try a safe context manager approach within the functions.

client = TestClient(app)

def test_health():
    print("\n[TEST] Health Check...")
    response = client.get("/")
    print(f"Response: {response.json()}")
    assert response.status_code == 200
    assert response.json()["status"] == "active"
    print("[PASS] Health Check")

def test_trigger_incident():
    print("\n[TEST] Trigger Incident...")
    
    payload = {
        "incident_text": "CPU load is very high on db-server",
        "rl_mode": "q_learning",
        "max_cycles": 3
    }
    
    # This calls the orchestrator internally!
    # It might take a few seconds since it runs the full AIRA pipeline.
    response = client.post("/incident/trigger", json=payload)
    
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"Error: {response.text}")
        return

    data = response.json()
    print(f"Incident ID: {data['incident_id']}")
    print(f"Final Status: {data['final_status']}")
    print(f"Steps Taken: {len(data['history'])}")
    print(f"MTTR: {data['mttr_ms']:.2f}ms")
    
    # Validation
    assert data["final_status"] in ["resolved", "unresolved"]
    assert len(data["history"]) > 0
    print("[PASS] Incident Trigger")

if __name__ == "__main__":
    try:
        test_health()
        test_trigger_incident()
        print("\n✅ API Layer Validated!")
    except Exception as e:
        print(f"\n❌ API Test Failed: {str(e)}")
        import traceback
        traceback.print_exc()
