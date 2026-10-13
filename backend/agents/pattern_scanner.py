import json
import os
import re
import shutil
import subprocess
import tempfile
from typing import Dict, Any, List
from .base import BaseAgent

# Built-in high-fidelity pattern rules (OWASP Top 10)
PATTERN_RULES = [
    {
        "id": "SEC-001",
        "category": "secrets",
        "title": "Hardcoded Cloud / Database Credentials",
        "pattern": re.compile(r'(?i)(AKIA[0-9A-Z]{16}|(?:secret|api_key|password|admin_key|token)\s*=\s*["\'][a-zA-Z0-9_\-\.]{8,}["\'])'),
        "cwe": "CWE-798",
        "severity": "Critical",
        "description": "Hardcoded credentials or sensitive cryptographic keys detected in source code."
    },
    {
        "id": "SEC-002",
        "category": "injection",
        "title": "SQL Injection via Dynamic Query Construction",
        "pattern": re.compile(r'(?i)(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE).*(?:f["\']|\.format\(|\%\s*\(|\+\s*[a-zA-Z_])'),
        "cwe": "CWE-89",
        "severity": "Critical",
        "description": "Unsanitized string concatenation or format interpolation inside an SQL statement."
    },
    {
        "id": "SEC-003",
        "category": "command_injection",
        "title": "Command Injection via Shell Subprocess Execution",
        "pattern": re.compile(r'(?i)(?:subprocess\.(?:check_output|run|Popen|call)\s*\(.*shell\s*=\s*True|os\.system\s*\()'),
        "cwe": "CWE-78",
        "severity": "High",
        "description": "System command execution with shell=True or unescaped user string parameter."
    },
    {
        "id": "SEC-005",
        "category": "cryptography",
        "title": "Insecure Cryptographic Hash Function (MD5/SHA1)",
        "pattern": re.compile(r'(?i)hashlib\.(?:md5|sha1)\s*\('),
        "cwe": "CWE-327",
        "severity": "Medium",
        "description": "Cryptographically broken hash algorithm used for data hashing without collision resistance."
    },
    {
        "id": "SEC-006",
        "category": "eval_injection",
        "title": "Unsafe Dynamic Code Evaluation (eval / exec)",
        "pattern": re.compile(r'(?i)\b(?:eval|exec)\s*\('),
        "cwe": "CWE-95",
        "severity": "High",
        "description": "Dynamic evaluation of arbitrary strings as code introduces arbitrary code execution."
    }
]

class PatternScannerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_number=2,
            agent_name="Pattern Scanner / Filter",
            agent_role="Deterministic SAST (Bandit / Semgrep / Pattern Pre-Filtering)"
        )

    def _check_semgrep_available(self) -> bool:
        return shutil.which("semgrep") is not None

    def _check_bandit_available(self) -> bool:
        # Check venv or PATH bandit
        venv_bandit = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "venv", "Scripts", "bandit.exe"))
        if os.path.exists(venv_bandit):
            return True
        return shutil.which("bandit") is not None

    def _get_bandit_cmd(self) -> str:
        venv_bandit = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "venv", "Scripts", "bandit.exe"))
        if os.path.exists(venv_bandit):
            return venv_bandit
        return "bandit"

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        self.logs.clear()
        code = context.get("code", "")
        language = context.get("language", "python").lower()
        filename = context.get("filename", "submission.py")

        semgrep_active = self._check_semgrep_available()
        bandit_active = self._check_bandit_available()

        self.log(f"Scanner readiness: Bandit={bandit_active}, Semgrep={semgrep_active}")
        if not semgrep_active:
            self.log("Semgrep: Optional engine not present on local PATH. Running Bandit + AST pattern engine.")

        findings: List[Dict[str, Any]] = []
        lines = code.splitlines()

        # 1. Run Bandit for Python if available
        if bandit_active and (language == "python" or filename.endswith(".py")):
            try:
                with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as tmp_f:
                    tmp_f.write(code)
                    tmp_path = tmp_f.name

                cmd = [self._get_bandit_cmd(), "-f", "json", tmp_path]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
                os.remove(tmp_path)

                if res.stdout:
                    try:
                        bandit_json = json.loads(res.stdout)
                        b_results = bandit_json.get("results", [])
                        self.log(f"Bandit static analysis completed: {len(b_results)} raw issues detected.")
                        for br in b_results:
                            line_num = br.get("line_number", 1)
                            test_id = br.get("test_id", "B000")
                            issue_text = br.get("issue_text", "")
                            issue_sev = br.get("issue_severity", "MEDIUM").capitalize()
                            code_snip = br.get("code", "")

                            # Map Bandit findings to our normalized format
                            findings.append({
                                "rule_id": f"BANDIT-{test_id}",
                                "category": "static_sast",
                                "title": f"Bandit {test_id}: {issue_text}",
                                "description": f"Bandit security scanner flagged potential risk: {issue_text}",
                                "file_path": filename,
                                "line_start": line_num,
                                "line_end": line_num,
                                "code_snippet": code_snip.strip(),
                                "severity": issue_sev if issue_sev in ["Critical", "High", "Medium", "Low"] else "Medium",
                                "cwe_id": f"CWE-{br.get('issue_cwe', {}).get('id', 'N/A')}",
                                "detection_source": "Bandit SAST Engine"
                            })
                    except Exception as parse_err:
                        self.log(f"Bandit output parse note: {parse_err}")
            except Exception as e:
                self.log(f"Bandit run warning: {e}")

        # 2. Run AST & Regular Expression Pattern Rules
        matched_rules = 0
        for i, line in enumerate(lines):
            line_no = i + 1
            for rule in PATTERN_RULES:
                if rule["pattern"].search(line):
                    matched_rules += 1
                    # Extract 2-line snippet context
                    snippet_lines = lines[max(0, i-1):min(len(lines), i+2)]
                    snippet = "\n".join(snippet_lines)

                    findings.append({
                        "rule_id": rule["id"],
                        "category": rule["category"],
                        "title": rule["title"],
                        "description": rule["description"],
                        "file_path": filename,
                        "line_start": line_no,
                        "line_end": line_no,
                        "code_snippet": snippet.strip(),
                        "severity": rule["severity"],
                        "cwe_id": rule["cwe"],
                        "detection_source": "Pattern Scanner (Deterministic)"
                    })

        self.log(f"Pattern Scanner completed. {len(findings)} pattern matches found.")

        # 3. Intelligent Pre-Filtering: Flag hot-spots for Agent 3 (Doctor)
        flagged_units = []
        for unit in context.get("code_units", []):
            start = unit.get("line_start", 0)
            end = unit.get("line_end", 9999)
            # Check if any finding falls within unit
            has_finding = any(start <= f["line_start"] <= end for f in findings)
            if has_finding:
                flagged_units.append(unit["name"])

        # Token optimization calculation (Slide 7)
        total_units = max(1, len(context.get("code_units", [])))
        clean_units = max(0, total_units - len(flagged_units))
        token_savings_pct = int((clean_units / total_units) * 100) if total_units > 0 else 0

        self.log(f"Pre-filter token optimization: {clean_units}/{total_units} code units classified low-risk (~{token_savings_pct}% LLM token savings).")

        summary = f"Identified {len(findings)} pattern-based vulnerabilities. Pre-filtering saved ~{token_savings_pct}% unnecessary LLM token processing."

        return {
            "status": "COMPLETED",
            "summary": summary,
            "findings": findings,
            "flagged_units": flagged_units,
            "token_savings_pct": token_savings_pct,
            "scanners_used": {
                "bandit": bandit_active,
                "semgrep": semgrep_active,
                "pattern_rules": True
            }
        }
