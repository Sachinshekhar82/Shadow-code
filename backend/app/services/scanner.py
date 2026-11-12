import os
import sys
import json
import uuid
import shutil
import tempfile
import subprocess
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional

from backend.app.core.config import settings
from backend.app.schemas.domain import FindingSchema, ScanSchema

logger = logging.getLogger("shadow_code.scanner")

def _get_executable(name: str) -> str:
    """Find executable in the current virtualenv or system PATH."""
    venv_dir = os.path.dirname(sys.executable)
    exe_name = f"{name}.exe" if sys.platform == "win32" else name
    cand = os.path.join(venv_dir, exe_name)
    if os.path.isfile(cand) and os.access(cand, os.X_OK):
        return cand
    cand_plain = os.path.join(venv_dir, name)
    if os.path.isfile(cand_plain) and os.access(cand_plain, os.X_OK):
        return cand_plain
    which_path = shutil.which(name)
    if which_path:
        return which_path
    return name

def _read_code_context(file_path: str, line_start: int, line_end: int, margin: int = 3) -> Tuple[str, str]:
    """Read target evidence and surrounding context."""
    if not os.path.isfile(file_path):
        return "", ""
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
        total = len(lines)
        c_start = max(1, line_start - margin)
        c_end = min(total, line_end + margin)
        
        evidence = "".join(lines[line_start - 1 : line_end]).strip()
        context_lines = []
        for idx in range(c_start, c_end + 1):
            marker = ">" if (line_start <= idx <= line_end) else " "
            context_lines.append(f"{marker} {idx:4d} | {lines[idx - 1]}")
        context = "".join(context_lines)
        return evidence, context
    except Exception as e:
        logger.warning(f"Failed reading code context: {e}")
        return "", ""

class SecurityScannerEngine:
    """
    Coordinates multi-engine security scanning (Semgrep + Bandit)
    and produces normalized findings.
    """

    def __init__(self):
        self.semgrep_bin = _get_executable("semgrep")
        self.bandit_bin = _get_executable("bandit")
        self.rules_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "scanner", "rules", "security_rules.yaml")
        )

    def run_semgrep(self, target_path: str) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """Run Semgrep scanner and parse JSON results."""
        if not settings.ENABLE_SEMGREP:
            return [], None
        try:
            cmd = [
                self.semgrep_bin,
                "scan",
                "--config", self.rules_path if os.path.exists(self.rules_path) else "auto",
                "--json",
                "--quiet",
                target_path
            ]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=settings.SCAN_TIMEOUT_SECONDS,
                check=False
            )
            # Semgrep may output banner then JSON, search for JSON object start
            raw = result.stdout
            json_start = raw.find('{"version":')
            if json_start == -1:
                json_start = raw.find('{')
            
            if json_start != -1:
                parsed = json.loads(raw[json_start:])
                return parsed.get("results", []), None
            return [], f"Semgrep completed without valid JSON payload: {result.stderr[:200]}"
        except subprocess.TimeoutExpired:
            return [], f"Semgrep scan timed out after {settings.SCAN_TIMEOUT_SECONDS}s"
        except Exception as e:
            logger.error(f"Semgrep execution error: {e}")
            return [], str(e)

    def run_bandit(self, target_path: str) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """Run Bandit scanner and parse JSON results."""
        if not settings.ENABLE_BANDIT:
            return [], None
        try:
            cmd = [
                self.bandit_bin,
                "-r", target_path,
                "-f", "json",
                "-q"
            ]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=settings.SCAN_TIMEOUT_SECONDS,
                check=False
            )
            raw = result.stdout
            json_start = raw.find('{')
            if json_start != -1:
                parsed = json.loads(raw[json_start:])
                return parsed.get("results", []), None
            return [], f"Bandit returned non-JSON output: {result.stderr[:200]}"
        except subprocess.TimeoutExpired:
            return [], f"Bandit scan timed out after {settings.SCAN_TIMEOUT_SECONDS}s"
        except Exception as e:
            logger.error(f"Bandit execution error: {e}")
            return [], str(e)

    def execute_scan(
        self,
        repository_id: str,
        commit_sha: str = "HEAD",
        target_path: Optional[str] = None,
        code_snippet: Optional[str] = None,
        snippet_filename: Optional[str] = "input.py",
        branch: str = "main",
        trigger: str = "manual"
    ) -> Tuple[ScanSchema, List[FindingSchema]]:
        """
        Executes a controlled security scan across either repository files
        or an isolated code snippet.
        """
        scan_id = f"scan-{uuid.uuid4().hex[:10]}"
        start_time = datetime.now(timezone.utc)
        errors: List[str] = []
        scanners_run: List[str] = []
        temp_dir: Optional[str] = None

        try:
            # Determine scan working directory
            if code_snippet:
                temp_dir = tempfile.mkdtemp(prefix="shadow_scan_")
                scan_target = os.path.join(temp_dir, snippet_filename or "input.py")
                with open(scan_target, "w", encoding="utf-8") as f:
                    f.write(code_snippet)
            elif target_path:
                cand_path = target_path if os.path.isabs(target_path) else os.path.join(settings.WORKSPACE_ROOT, target_path)
                if os.path.exists(cand_path):
                    scan_target = cand_path
                else:
                    scan_target = settings.WORKSPACE_ROOT
            else:
                vuln_api = os.path.join(settings.WORKSPACE_ROOT, "vulnerable_api_service.py")
                sample_file = os.path.join(settings.WORKSPACE_ROOT, "sample_vulnerable_service.py")
                default_fixture = os.path.abspath(
                    os.path.join(os.path.dirname(__file__), "..", "..", "..", "scanner", "fixtures", "vulnerable_service.py")
                )
                if os.path.exists(vuln_api):
                    scan_target = vuln_api
                elif os.path.exists(sample_file):
                    scan_target = sample_file
                elif os.path.exists(default_fixture):
                    scan_target = default_fixture
                else:
                    scan_target = settings.WORKSPACE_ROOT

            normalized_findings: List[FindingSchema] = []

            # 1. Semgrep Run
            semgrep_results, s_err = self.run_semgrep(scan_target)
            scanners_run.append("semgrep")
            if s_err:
                errors.append(f"Semgrep: {s_err}")
            
            for item in semgrep_results:
                f_path = item.get("path", "")
                start_l = item.get("start", {}).get("line", 1)
                end_l = item.get("end", {}).get("line", start_l)
                extra = item.get("extra", {})
                meta = extra.get("metadata", {})
                
                evidence, context = _read_code_context(f_path, start_l, end_l)
                sev_raw = extra.get("severity", "WARNING").upper()
                sev_map = {"ERROR": "HIGH", "WARNING": "MEDIUM", "INFO": "LOW"}
                severity = sev_map.get(sev_raw, "MEDIUM")
                if "command-injection" in item.get("check_id", "").lower():
                    severity = "CRITICAL"

                finding = FindingSchema(
                    id=f"fnd-{uuid.uuid4().hex[:10]}",
                    scan_id=scan_id,
                    repository_id=repository_id,
                    commit_sha=commit_sha,
                    rule_id=item.get("check_id", "semgrep-rule"),
                    scanner="semgrep",
                    title=extra.get("message", "Semgrep security finding").split(":")[0],
                    description=extra.get("message", "Security issue flagged by Semgrep rules"),
                    severity=severity,
                    confidence=meta.get("confidence", "HIGH"),
                    cwe_id=meta.get("cwe"),
                    owasp_category=meta.get("owasp"),
                    file_path=os.path.relpath(f_path, temp_dir or settings.WORKSPACE_ROOT) if f_path else "unknown",
                    line_start=start_l,
                    line_end=end_l,
                    evidence=evidence or extra.get("lines", ""),
                    code_context=context,
                    ai_analysis_status="pending",
                    remediation_status="open",
                    created_at=datetime.now(timezone.utc).isoformat(),
                    updated_at=datetime.now(timezone.utc).isoformat()
                )
                normalized_findings.append(finding)

            # 2. Bandit Run
            bandit_results, b_err = self.run_bandit(scan_target)
            scanners_run.append("bandit")
            if b_err:
                errors.append(f"Bandit: {b_err}")

            for item in bandit_results:
                f_path = item.get("filename", "")
                line_no = item.get("line_number", 1)
                lines = item.get("line_range", [line_no])
                start_l = lines[0] if lines else line_no
                end_l = lines[-1] if lines else line_no
                
                # Check for duplicate with Semgrep by file and line proximity
                is_duplicate = False
                for existing in normalized_findings:
                    if abs(existing.line_start - start_l) <= 1:
                        existing.scanner = "semgrep + bandit"
                        is_duplicate = True
                        break
                if is_duplicate:
                    continue

                evidence, context = _read_code_context(f_path, start_l, end_l)
                b_sev = item.get("issue_severity", "MEDIUM").upper()
                b_cwe = item.get("issue_cwe", {})
                cwe_str = f"CWE-{b_cwe.get('id')}" if b_cwe.get("id") else None

                finding = FindingSchema(
                    id=f"fnd-{uuid.uuid4().hex[:10]}",
                    scan_id=scan_id,
                    repository_id=repository_id,
                    commit_sha=commit_sha,
                    rule_id=f"bandit-{item.get('test_id', 'issue')}",
                    scanner="bandit",
                    title=item.get("issue_text", "Bandit vulnerability issue"),
                    description=item.get("more_info", item.get("issue_text", "")),
                    severity=b_sev if b_sev in ["CRITICAL", "HIGH", "MEDIUM", "LOW"] else "MEDIUM",
                    confidence=item.get("issue_confidence", "HIGH"),
                    cwe_id=cwe_str,
                    owasp_category="A03:2021-Injection" if "sql" in item.get("issue_text", "").lower() else None,
                    file_path=os.path.relpath(f_path, temp_dir or settings.WORKSPACE_ROOT) if f_path else "unknown",
                    line_start=start_l,
                    line_end=end_l,
                    evidence=evidence or item.get("code", ""),
                    code_context=context,
                    ai_analysis_status="pending",
                    remediation_status="open",
                    created_at=datetime.now(timezone.utc).isoformat(),
                    updated_at=datetime.now(timezone.utc).isoformat()
                )
                normalized_findings.append(finding)

            end_time = datetime.now(timezone.utc)
            duration = max(0.1, round((end_time - start_time).total_seconds(), 2))

            crit = sum(1 for f in normalized_findings if f.severity == "CRITICAL")
            high = sum(1 for f in normalized_findings if f.severity == "HIGH")
            med = sum(1 for f in normalized_findings if f.severity == "MEDIUM")
            low = sum(1 for f in normalized_findings if f.severity in ["LOW", "INFO"])

            scan_obj = ScanSchema(
                id=scan_id,
                repository_id=repository_id,
                branch=branch,
                commit_sha=commit_sha,
                status="completed" if not errors or normalized_findings else "failed" if errors and not normalized_findings else "completed",
                trigger=trigger,
                duration_seconds=duration,
                critical_count=crit,
                high_count=high,
                medium_count=med,
                low_count=low,
                total_findings=len(normalized_findings),
                scanner_errors=errors,
                scanners_run=scanners_run,
                created_at=start_time.isoformat(),
                completed_at=end_time.isoformat()
            )
            return scan_obj, normalized_findings

        finally:
            if temp_dir and os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)

scanner_engine = SecurityScannerEngine()
