import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database.session import Base
from backend.database.models import Repository, Scan, Finding, AdaptiveProfile
from backend.agents.parser import ParserAgent
from backend.agents.pattern_scanner import PatternScannerAgent
from backend.agents.semantic_reasoner import SemanticReasonerAgent
from backend.agents.cve_correlator import CVECorrelatorAgent
from backend.agents.severity_ranker import SeverityRankerAgent
from backend.agents.report_writer import ReportWriterAgent
from backend.agents.surgeon import SurgeonAgent
from backend.agents.adaptive_memory import AdaptiveMemoryAgent
from backend.pipeline.orchestrator import ShadowCodeOrchestrator

VULNERABLE_CODE = '''
import sqlite3
import subprocess
import hashlib

DB_ADMIN_KEY = "AKIA_SHADOW_CODE_DEMO_SECRET_KEY_99214A"

def hash_password(password: str) -> str:
    return hashlib.md5(password.encode()).hexdigest()

def get_user(uid: str):
    conn = sqlite3.connect("test.db")
    c = conn.cursor()
    c.execute(f"SELECT * FROM users WHERE id = '{uid}'")
    return c.fetchone()

def run_diag(host: str):
    return subprocess.check_output(f"ping {host}", shell=True)

def update_bal(actor_id: int, target_account_id: int, balance: float):
    conn = sqlite3.connect("test.db")
    c = conn.cursor()
    c.execute("UPDATE accounts SET balance = ? WHERE id = ?", (balance, target_account_id))
    conn.commit()
'''

def test_agent_1_parser():
    agent = ParserAgent()
    # Code test
    res = agent.run({"code": VULNERABLE_CODE, "language": "python", "filename": "test.py"})
    assert res["status"] == "COMPLETED"
    assert res["lines_of_code"] > 10
    assert len(res["code_units"]) >= 4
    # Non-code test
    res_img = agent.run({"code": "binary...", "language": "python", "filename": "test.png"})
    assert res_img["status"] == "FILTERED_NON_CODE"

def test_agent_2_pattern_scanner():
    agent = PatternScannerAgent()
    res = agent.run({"code": VULNERABLE_CODE, "language": "python", "filename": "test.py", "code_units": [{"name": "get_user", "line_start": 13, "line_end": 17}]})
    assert res["status"] == "COMPLETED"
    assert len(res["findings"]) >= 3 # Detects hardcoded key, SQL injection, command injection, md5
    assert res["token_savings_pct"] >= 0

def test_agent_3_semantic_reasoner():
    agent = SemanticReasonerAgent()
    res = agent.run({"code": VULNERABLE_CODE, "language": "python", "filename": "test.py"})
    assert res["status"] == "COMPLETED"
    assert res["deterministic_mode"] is True
    # Should catch BOLA (CWE-639)
    bola_findings = [f for f in res["findings"] if f["rule_id"] == "SEC-004"]
    assert len(bola_findings) == 1
    assert "Broken Object Level Authorization" in bola_findings[0]["title"]

def test_agent_4_cve_correlator():
    agent = CVECorrelatorAgent()
    findings = [{"rule_id": "SEC-002", "cwe_id": "CWE-89", "title": "SQL Injection"}]
    res = agent.run({"findings": findings})
    assert res["status"] == "COMPLETED"
    assert findings[0]["cve_id"] == "CVE-2022-34265"
    assert findings[0]["cve_confidence"] > 0.8

def test_agent_5_severity_ranker():
    agent = SeverityRankerAgent()
    findings = [
        {"rule_id": "SEC-002", "cwe_id": "CWE-89", "title": "SQL Injection", "severity": "Critical"},
        {"rule_id": "SEC-005", "cwe_id": "CWE-327", "title": "MD5 Hash", "severity": "Medium"}
    ]
    res = agent.run({"findings": findings, "memory_weights": {}})
    assert res["status"] == "COMPLETED"
    assert findings[0]["numeric_score"] >= 9.0
    assert findings[0]["severity"] == "Critical"
    assert findings[1]["severity"] == "Medium"

def test_agent_6_report_writer():
    agent = ReportWriterAgent()
    findings = [{"rule_id": "SEC-002", "severity": "Critical", "title": "SQL Injection", "cwe_id": "CWE-89"}]
    res = agent.run({"findings": findings, "counts": {"critical": 1, "high": 0, "medium": 0, "low": 0}, "filename": "test.py"})
    assert res["status"] == "COMPLETED"
    assert res["gate_decision"] == "BLOCK_RECOMMENDED"
    assert "business_impact" in findings[0]

def test_agent_7_surgeon():
    agent = SurgeonAgent()
    findings = [{"rule_id": "SEC-002", "id": "f-123", "title": "SQL Injection"}]
    res = agent.run({"findings": findings, "code": VULNERABLE_CODE, "language": "python", "filename": "test.py"})
    assert res["status"] == "COMPLETED"
    assert len(res["proposals"]) == 1
    assert res["proposals"][0]["syntax_valid"] is True
    assert "SELECT" in res["proposals"][0]["proposed_code"]
    assert "---" in res["proposals"][0]["diff"] or "@@" in res["proposals"][0]["diff"]

def test_agent_8_adaptive_memory():
    agent = AdaptiveMemoryAgent()
    findings = [{"rule_id": "SEC-005"}]
    res = agent.run({"findings": findings, "repository_id": "repo-demo", "stored_profiles": {"SEC-005": -1.0}})
    assert res["status"] == "COMPLETED"
    assert res["adjusted_rules_count"] == 1

def test_full_pipeline_orchestration():
    test_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=test_engine)
    TestingSession = sessionmaker(bind=test_engine)
    db = TestingSession()

    orchestrator = ShadowCodeOrchestrator(db)
    scan = orchestrator.execute_scan(
        code=VULNERABLE_CODE,
        language="python",
        filename="vulnerable_test.py",
        scan_mode="local_demo"
    )

    assert scan.id is not None
    assert scan.status in ["COMPLETED", "BLOCKED"]
    assert scan.total_findings >= 4
    assert scan.critical_count >= 1
    assert len(scan.agent_executions) == 8
    for ae in scan.agent_executions:
        assert ae.status == "COMPLETED"
