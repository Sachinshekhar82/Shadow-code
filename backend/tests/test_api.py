from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_api_root():
    response = client.get("/api/info")
    assert response.status_code == 200
    data = response.json()
    assert data["project"] == "SHADOW CODE"
    assert "Sachin Shekhar" in data["team"][0]

def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_api_status():
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert "scanners_available" in data
    assert data["scanners_available"]["bandit"] is True

def test_api_samples():
    response = client.get("/api/samples")
    assert response.status_code == 200
    data = response.json()
    assert "DB_ADMIN_KEY" in data["vulnerable_code"]
    assert "os.environ" in data["clean_code"]
    assert len(data["vulnerabilities_explained"]) >= 4

def test_api_demo_scan():
    response = client.post("/api/scans/demo-run")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] is not None
    assert data["total_findings"] >= 4
    assert len(data["agent_executions"]) == 8
    assert data["critical_count"] >= 1

    # Check report export
    scan_id = data["id"]
    rep_resp = client.get(f"/api/scans/{scan_id}/report?format=json")
    assert rep_resp.status_code == 200
    assert rep_resp.json()["summary"]["total_findings"] == data["total_findings"]

def test_api_feedback_and_memory():
    # Fetch a finding
    f_resp = client.get("/api/findings")
    assert f_resp.status_code == 200
    findings = f_resp.json()
    assert len(findings) > 0
    f_id = findings[0]["id"]

    # Submit feedback
    fb_resp = client.post(f"/api/findings/{f_id}/feedback", json={
        "decision": "overridden",
        "reason": "Internal test environment override"
    })
    assert fb_resp.status_code == 200
    assert fb_resp.json()["decision"] == "overridden"

    # Check adaptive memory profiles
    mem_resp = client.get("/api/adaptive-memory/profiles")
    assert mem_resp.status_code == 200
    assert mem_resp.json()["total_overrides"] >= 1
