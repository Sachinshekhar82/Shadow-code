import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data

def test_dashboard_endpoint(client):
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "total_repositories" in data
    assert "total_scans" in data
    assert "security_health_score" in data
    assert "severity_breakdown" in data

def test_repositories_endpoints(client):
    # List repositories
    res = client.get("/api/repositories")
    assert res.status_code == 200
    repos = res.json()
    assert len(repos) >= 1

    # Create new repository
    new_repo = {
        "name": "Audit Target Microservice",
        "url": "https://github.com/Sachinshekhar82/sample-service.git",
        "default_branch": "main",
        "description": "Test target"
    }
    create_res = client.post("/api/repositories", json=new_repo)
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert created_data["name"] == new_repo["name"]

def test_scan_and_findings_flow(client):
    # Trigger scan
    scan_req = {
        "repository_id": "repo-shadow-code",
        "branch": "main",
        "trigger": "pytest_automated"
    }
    scan_res = client.post("/api/scans", json=scan_req)
    assert scan_res.status_code == 202
    scan_data = scan_res.json()
    assert "id" in scan_data
    assert scan_data["total_findings"] >= 1

    # Get findings for scan
    fnd_res = client.get(f"/api/scans/{scan_data['id']}/findings")
    assert fnd_res.status_code == 200
    findings = fnd_res.json()
    assert len(findings) >= 1

    first_finding = findings[0]
    finding_id = first_finding["id"]

    # Analyze finding with AI
    analyze_res = client.post(f"/api/findings/{finding_id}/analyze")
    assert analyze_res.status_code == 200
    analysis_data = analyze_res.json()
    assert "reasoning" in analysis_data
    assert "remediation" in analysis_data

    # Validate remediation in sandbox
    rem_id = analysis_data["remediation"]["id"]
    val_res = client.post(f"/api/remediations/{rem_id}/validate")
    assert val_res.status_code == 200
    val_data = val_res.json()
    assert "validation_status" in val_data

    # Create Pull Request
    pr_res = client.post(f"/api/remediations/{rem_id}/create-pr")
    assert pr_res.status_code == 200
    pr_data = pr_res.json()
    assert "pr_url" in pr_data
    assert pr_data["human_review_required"] is True

def test_chatbot_endpoint(client):
    chat_req = {
        "message": "What is the recommended defense against CWE-78 command injection?"
    }
    res = client.post("/api/chat", json=chat_req)
    assert res.status_code == 200
    data = res.json()
    assert "response" in data
    assert len(data["cwe_citations"]) >= 1

def test_report_downloads(client):
    # Get a scan ID
    scans_res = client.get("/api/scans")
    scans = scans_res.json()
    if scans:
        scan_id = scans[0]["id"]
        json_report = client.get(f"/api/reports/{scan_id}?format=json")
        assert json_report.status_code == 200
        assert "application/json" in json_report.headers["content-type"]

        csv_report = client.get(f"/api/reports/{scan_id}?format=csv")
        assert csv_report.status_code == 200
        assert "text/csv" in csv_report.headers["content-type"]

def test_github_connectivity_endpoint(client):
    res = client.get("/api/github/status")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "authenticated" in data
    # Ensure token is never printed in response
    serialized = str(data)
    assert "ghp_" not in serialized
    assert "github_pat_" not in serialized
