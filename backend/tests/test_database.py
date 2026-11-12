import pytest
from datetime import datetime, timezone

from backend.app.db.mongo import get_db_manager, get_db_health, mask_mongodb_uri, DatabaseConnectionError
from backend.app.services.db_service import db_service
from backend.app.schemas.domain import ScanSchema, FindingSchema, RemediationSchema

def test_mask_mongodb_uri():
    uri = "mongodb+srv://admin:SecretPass123!@cluster0.mongodb.net/?appName=Test"
    masked = mask_mongodb_uri(uri)
    assert "SecretPass123!" not in masked
    assert "admin:*****@" in masked

def test_db_health_and_ping():
    health = get_db_health()
    assert health["connected"] is True
    assert health["status"] == "healthy"
    assert health["database"] == "shadow_code"
    assert health["ping_ms"] is not None
    assert health["ping_ms"] >= 0

def test_repository_persistence():
    repo_data = {
        "id": "repo-test-persist",
        "name": "Persistence Verification Repo",
        "url": "https://github.com/Sachinshekhar82/test-repo.git",
        "default_branch": "main",
        "status": "connected"
    }
    saved = db_service.upsert_repository(repo_data)
    assert saved["id"] == "repo-test-persist"
    assert saved["name"] == "Persistence Verification Repo"

    retrieved = db_service.get_repository("repo-test-persist")
    assert retrieved is not None
    assert retrieved["url"] == "https://github.com/Sachinshekhar82/test-repo.git"

def test_scan_and_findings_persistence():
    scan_id = "scan-persist-test-01"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    scan_obj = ScanSchema(
        id=scan_id,
        repository_id="repo-test-persist",
        branch="main",
        commit_sha="c0ffee123456",
        status="completed",
        trigger="test_suite",
        duration_seconds=1.8,
        critical_count=1,
        high_count=0,
        medium_count=0,
        low_count=0,
        total_findings=1,
        created_at=now_iso
    )
    db_service.create_scan(scan_obj)

    # Verify scan saved
    retrieved_scan = db_service.get_scan(scan_id)
    assert retrieved_scan is not None
    assert retrieved_scan["commit_sha"] == "c0ffee123456"

    # Save Finding associated with this scan
    finding_obj = FindingSchema(
        id="fnd-persist-test-01",
        scan_id=scan_id,
        repository_id="repo-test-persist",
        rule_id="test-rule-sql",
        scanner="semgrep",
        title="Test SQL Injection Finding",
        description="Dynamic string formatting in SQL statement",
        severity="CRITICAL",
        file_path="app/test_db.py",
        line_start=20,
        line_end=22,
        evidence="cursor.execute(f'SELECT {user_id}')",
        created_at=now_iso
    )
    inserted = db_service.save_findings([finding_obj])
    assert inserted >= 1

    # Retrieve findings by scan_id
    findings = db_service.list_findings(scan_id=scan_id)
    assert len(findings) >= 1
    assert any(f["id"] == "fnd-persist-test-01" for f in findings)

def test_remediation_persistence():
    now_iso = datetime.now(timezone.utc).isoformat()
    rem = RemediationSchema(
        id="rem-persist-test-01",
        finding_id="fnd-persist-test-01",
        scan_id="scan-persist-test-01",
        repository_id="repo-test-persist",
        file_path="app/test_db.py",
        original_code="cursor.execute(f'SELECT {user_id}')",
        proposed_patch="cursor.execute('SELECT ?', (user_id,))",
        diff="--- a/app/test_db.py\n+++ b/app/test_db.py",
        explanation="Replaced formatted SQL with bound parameter marker.",
        security_rationale="Prevents CWE-89 SQL injection.",
        regression_test="assert True",
        validation_status="passed",
        approval_status="pending",
        created_at=now_iso
    )
    saved = db_service.save_remediation(rem)
    assert saved["id"] == "rem-persist-test-01"

    retrieved = db_service.get_remediation("rem-persist-test-01")
    assert retrieved is not None
    assert retrieved["validation_status"] == "passed"

    # Update approval
    db_service.update_remediation("rem-persist-test-01", {"approval_status": "approved"})
    updated = db_service.get_remediation("rem-persist-test-01")
    assert updated["approval_status"] == "approved"
