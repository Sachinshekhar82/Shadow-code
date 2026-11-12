import os
import hmac
import hashlib
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.scanner import scanner_engine
from backend.app.agents.validation_agent import validation_agent
from backend.app.agents.remediation_agent import remediation_agent
from backend.app.schemas.domain import FindingSchema, RemediationSchema
from backend.app.core.config import settings

client = TestClient(app)

def test_scanner_real_fixtures():
    """Verify Semgrep and Bandit identify real vulnerabilities in test fixture."""
    vuln_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "scanner", "fixtures", "vulnerable_service.py")
    )
    assert os.path.exists(vuln_path)

    scan_obj, findings = scanner_engine.execute_scan(
        repository_id="repo-shadow-code",
        target_path=vuln_path
    )

    assert scan_obj.status == "completed"
    assert scan_obj.total_findings >= 4
    assert scan_obj.critical_count >= 1

    rule_ids = [f.rule_id.lower() for f in findings]
    # Check for command injection and weak hash / pickle / sql
    assert any("command-injection" in r or "b602" in r for r in rule_ids)
    assert any("hash" in r or "b324" in r or "md5" in r for r in rule_ids)

def test_validation_agent_pass_and_fail():
    """Test sandbox patch validation for valid vs invalid syntax and residual vulnerabilities."""
    mock_finding = FindingSchema(
        id="fnd-test-val",
        scan_id="scan-test",
        repository_id="repo-test",
        commit_sha="HEAD",
        rule_id="python-command-injection-shell-true",
        scanner="semgrep",
        title="Command Injection",
        description="Subprocess with shell=True",
        severity="CRITICAL",
        confidence="HIGH",
        file_path="diagnostic.py",
        line_start=10,
        line_end=12,
        evidence="subprocess.Popen(cmd, shell=True)",
        created_at="2026-10-13T00:00:00Z",
        updated_at="2026-10-13T00:00:00Z"
    )

    # 1. Valid Remediated Patch
    valid_rem = RemediationSchema(
        id="rem-valid",
        finding_id=mock_finding.id,
        scan_id=mock_finding.scan_id,
        repository_id=mock_finding.repository_id,
        file_path="diagnostic.py",
        original_code="subprocess.Popen(cmd, shell=True)",
        proposed_patch="subprocess.run(['ping', '-c', '2', '127.0.0.1'], check=False)",
        diff="--- a\n+++ b",
        explanation="Removed shell=True",
        security_rationale="OWASP compliant",
        regression_test="assert True",
        validation_status="unvalidated",
        created_at="2026-10-13T00:00:00Z"
    )
    status_valid, details_valid = validation_agent.validate_patch(valid_rem, mock_finding)
    assert status_valid == "passed"
    assert details_valid["syntax_check"] == "PASS"

    # 2. Syntax-Broken Patch
    broken_rem = RemediationSchema(
        id="rem-broken",
        finding_id=mock_finding.id,
        scan_id=mock_finding.scan_id,
        repository_id=mock_finding.repository_id,
        file_path="diagnostic.py",
        original_code="subprocess.Popen(cmd, shell=True)",
        proposed_patch="def broken_syntax( { : invalid python code",
        diff="--- a\n+++ b",
        explanation="Invalid code",
        security_rationale="N/A",
        validation_status="unvalidated",
        created_at="2026-10-13T00:00:00Z"
    )
    status_broken, details_broken = validation_agent.validate_patch(broken_rem, mock_finding)
    assert status_broken == "failed"
    assert "FAIL" in details_broken["syntax_check"]

def test_webhook_hmac_signature_verification():
    """Verify GitHub webhook endpoint validates HMAC-SHA256 signatures."""
    payload = b'{"ref": "refs/heads/main", "after": "a1b2c3d4"}'
    secret = settings.GITHUB_WEBHOOK_SECRET.encode("utf-8")
    valid_signature = "sha256=" + hmac.new(secret, payload, hashlib.sha256).hexdigest()

    # Valid Signature
    res_valid = client.post(
        "/api/webhook/github",
        content=payload,
        headers={"X-Hub-Signature-256": valid_signature, "Content-Type": "application/json"}
    )
    assert res_valid.status_code == 200

    # Tampered Signature
    res_invalid = client.post(
        "/api/webhook/github",
        content=payload,
        headers={"X-Hub-Signature-256": "sha256=invalidtamperedsignature123", "Content-Type": "application/json"}
    )
    assert res_invalid.status_code == 403
