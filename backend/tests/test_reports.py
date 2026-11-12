import json
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.reports import (
    generate_json_report,
    generate_csv_report,
    generate_pdf_report,
    sanitize_csv_cell
)
from backend.app.services.db_service import db_service
from backend.app.schemas.domain import ScanSchema, FindingSchema

client = TestClient(app)

SAMPLE_SCAN = {
    "id": "scan-rep-test-99",
    "repository_id": "repo-shadow-code",
    "branch": "main",
    "commit_sha": "abc123def456",
    "status": "completed",
    "trigger": "audit_test",
    "duration_seconds": 1.45,
    "scanners_run": ["semgrep", "bandit"],
    "critical_count": 1,
    "high_count": 0,
    "medium_count": 1,
    "low_count": 0,
    "total_findings": 2,
    "created_at": "2026-10-14T00:00:00Z"
}

SAMPLE_FINDINGS = [
    {
        "id": "fnd-rep-1",
        "scan_id": "scan-rep-test-99",
        "repository_id": "repo-shadow-code",
        "rule_id": "python-command-injection",
        "scanner": "bandit",
        "title": "Subprocess shell=True command injection",
        "description": "Untrusted input concatenated into shell command.",
        "severity": "CRITICAL",
        "confidence": "HIGH",
        "cwe_id": "CWE-78",
        "owasp_category": "A03:2021-Injection",
        "file_path": "services/ping.py",
        "line_start": 15,
        "line_end": 17,
        "evidence": "subprocess.Popen(cmd, shell=True)",
        "ai_analysis_status": "confirmed",
        "remediation_status": "open"
    },
    {
        "id": "fnd-rep-2",
        "scan_id": "scan-rep-test-99",
        "repository_id": "repo-shadow-code",
        "rule_id": "python-insecure-hash",
        "scanner": "semgrep",
        "title": "Weak MD5 algorithm utilized",
        "description": "Collision-vulnerable MD5 digest.",
        "severity": "MEDIUM",
        "confidence": "MEDIUM",
        "cwe_id": "CWE-328",
        "owasp_category": "A02:2021-Cryptographic Failures",
        "file_path": "auth/hash.py",
        "line_start": 40,
        "line_end": 40,
        "evidence": "hashlib.md5(pw.encode())",
        "ai_analysis_status": "pending",
        "remediation_status": "open"
    }
]

def test_csv_formula_injection_sanitization():
    assert sanitize_csv_cell("=1+1") == "'=1+1"
    assert sanitize_csv_cell("@SUM(A1:A10)") == "'@SUM(A1:A10)"
    assert sanitize_csv_cell("+cmd|' /C calc'!A0") == "'+cmd|' /C calc'!A0"
    assert sanitize_csv_cell("-2+5") == "'-2+5"
    assert sanitize_csv_cell("Standard Secure Text") == "Standard Secure Text"
    assert sanitize_csv_cell(None) == ""

def test_json_report_generation():
    json_str = generate_json_report(SAMPLE_SCAN, SAMPLE_FINDINGS)
    data = json.loads(json_str)

    assert "metadata" in data
    assert data["metadata"]["generator"] == "Shadow-Code Agentic DevSecOps Platform"
    assert "repository" in data
    assert "scan" in data
    assert data["scan"]["id"] == "scan-rep-test-99"
    assert "summary" in data
    assert data["summary"]["total_findings"] == 2
    assert data["summary"]["critical_count"] == 1
    assert len(data["findings"]) == 2

def test_csv_report_generation():
    csv_str = generate_csv_report(SAMPLE_SCAN, SAMPLE_FINDINGS)
    lines = csv_str.strip().splitlines()
    
    assert len(lines) == 3  # Header + 2 rows
    header = lines[0]
    assert "Finding ID" in header
    assert "Severity" in header
    assert "CWE ID" in header
    assert "Pull Request URL" in header

    # Ensure findings are listed
    assert "fnd-rep-1" in lines[1]
    assert "CRITICAL" in lines[1]
    assert "CWE-78" in lines[1]

def test_pdf_report_generation_binary():
    pdf_bytes = generate_pdf_report(SAMPLE_SCAN, SAMPLE_FINDINGS)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF-")

def test_pdf_clean_scan_report():
    clean_scan = dict(SAMPLE_SCAN, critical_count=0, high_count=0, medium_count=0, low_count=0, total_findings=0)
    pdf_bytes = generate_pdf_report(clean_scan, [])
    assert pdf_bytes.startswith(b"%PDF-")
    assert len(pdf_bytes) > 500

def test_pdf_failed_scan_report():
    failed_scan = dict(SAMPLE_SCAN, status="failed")
    pdf_bytes = generate_pdf_report(failed_scan, SAMPLE_FINDINGS)
    assert pdf_bytes.startswith(b"%PDF-")
    assert len(pdf_bytes) > 1000

def test_api_report_downloads():
    # Seed sample scan and findings in database
    scan_schema = ScanSchema(**SAMPLE_SCAN)
    db_service.create_scan(scan_schema)
    finding_schemas = [FindingSchema(**f) for f in SAMPLE_FINDINGS]
    db_service.save_findings(finding_schemas)

    # 1. Download PDF
    resp_pdf = client.get(f"/api/reports/{SAMPLE_SCAN['id']}/download?format=pdf")
    assert resp_pdf.status_code == 200
    assert resp_pdf.headers["content-type"] == "application/pdf"
    assert f'filename="shadow-code-audit-{SAMPLE_SCAN["id"]}.pdf"' in resp_pdf.headers.get("content-disposition", "")
    assert resp_pdf.content.startswith(b"%PDF-")

    # 2. Download CSV
    resp_csv = client.get(f"/api/reports/{SAMPLE_SCAN['id']}/download?format=csv")
    assert resp_csv.status_code == 200
    assert "text/csv" in resp_csv.headers["content-type"]
    assert f'filename="shadow-code-audit-{SAMPLE_SCAN["id"]}.csv"' in resp_csv.headers.get("content-disposition", "")
    assert "Finding ID" in resp_csv.text

    # 3. Download JSON
    resp_json = client.get(f"/api/reports/{SAMPLE_SCAN['id']}/download?format=json")
    assert resp_json.status_code == 200
    assert resp_json.headers["content-type"] == "application/json"
    assert f'filename="shadow-code-audit-{SAMPLE_SCAN["id"]}.json"' in resp_json.headers.get("content-disposition", "")
    json_data = resp_json.json()
    assert json_data["scan"]["id"] == SAMPLE_SCAN["id"]

    # 4. 404 Handling for Missing Scan
    resp_404 = client.get("/api/reports/scan-does-not-exist/download?format=pdf")
    assert resp_404.status_code == 404
    assert resp_404.headers["content-type"] == "application/json"
    assert "not found" in resp_404.json()["detail"].lower()
