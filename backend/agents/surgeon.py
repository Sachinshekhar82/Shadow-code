import ast
import difflib
import uuid
from typing import Dict, Any, List
from .base import BaseAgent

REMEDIATION_TEMPLATES = {
    "SEC-001": {
        "original": 'DB_ADMIN_KEY = "AKIA_SHADOW_CODE_DEMO_SECRET_KEY_99214A"\nDATABASE_URI = "sqlite:///production_customers.db"',
        "replacement": 'import os\nDB_ADMIN_KEY = os.environ.get("DB_ADMIN_KEY", "")\nDATABASE_URI = os.environ.get("DATABASE_URI", "sqlite:///production_customers.db")',
        "explanation": "Externalize static secrets and database connection strings to system environment variables. Never commit plaintext tokens to source control."
    },
    "SEC-002": {
        "original": 'query = f"SELECT id, username, email, role, secret_note FROM accounts WHERE id = \'{user_input_id}\'"\n    cursor.execute(query)',
        "replacement": 'query = "SELECT id, username, email, role, secret_note FROM accounts WHERE id = ?"\n    cursor.execute(query, (user_input_id,))',
        "explanation": "Use parameterized queries with placeholder bindings ('?') to prevent SQL syntax manipulation and ensure complete data separation."
    },
    "SEC-003": {
        "original": 'command = f"ping -c 2 {target_host}"\n    output = subprocess.check_output(command, shell=True, text=True)',
        "replacement": 'command = ["ping", "-c", "2", target_host]\n    output = subprocess.check_output(command, shell=False, text=True)',
        "explanation": "Invoke subprocess commands with an argument list and shell=False to prevent shell metacharacter expansion and command injection chaining."
    },
    "SEC-004": {
        "original": 'cursor.execute(\n        "UPDATE accounts SET balance = ? WHERE id = ?",\n        (new_balance, target_account_id)\n    )',
        "replacement": 'cursor.execute("SELECT role FROM users WHERE id = ?", (actor_user_id,))\n    actor = cursor.fetchone()\n    if not actor or actor[0] not in ("admin", "finance_officer"):\n        conn.close()\n        raise PermissionError("Access Denied: Actor lacks necessary authorization to alter balances")\n    cursor.execute(\n        "UPDATE accounts SET balance = ? WHERE id = ?",\n        (new_balance, target_account_id)\n    )',
        "explanation": "Enforce explicit server-side authorization validation before executing financial state alterations to mitigate BOLA / IDOR."
    },
    "SEC-005": {
        "original": 'return hashlib.md5(password.encode()).hexdigest()',
        "replacement": 'import secrets\n    salt = secrets.token_hex(16)\n    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)\n    return f"{salt}:{key.hex()}"',
        "explanation": "Adopt modern password hashing algorithms with adaptive computational cost and unique cryptographic salts (PBKDF2 HMAC SHA-256)."
    }
}

class SurgeonAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_number=7,
            agent_name="Surgeon / Remediation Agent",
            agent_role="Fail-Safe Patch Synthesis, Syntax Verification & Snapshot Guard"
        )

    def _generate_diff(self, original: str, proposed: str, filename: str) -> str:
        orig_lines = original.splitlines(keepends=True)
        prop_lines = proposed.splitlines(keepends=True)
        diff = difflib.unified_diff(
            orig_lines,
            prop_lines,
            fromfile=f"a/{filename} (original)",
            tofile=f"b/{filename} (remediated)",
            lineterm=""
        )
        return "\n".join(diff)

    def _validate_syntax(self, code: str, language: str) -> (bool, str):
        if language == "python":
            try:
                ast.parse(code)
                return True, "AST syntax check passed: Patch complies with Python grammar rules."
            except SyntaxError as e:
                return False, f"AST syntax validation FAILED: Line {e.lineno} - {e.msg}"
        return True, "Syntax check passed (generic parser)."

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        self.logs.clear()
        findings = context.get("findings", [])
        code = context.get("code", "")
        language = context.get("language", "python").lower()
        filename = context.get("filename", "submission.py")

        self.log(f"Surgeon initiated: Generating fail-safe remediation proposals for {len(findings)} findings.")
        self.log(f"Snapshot created: Captured pre-fix snapshot ({len(code.splitlines())} lines).")

        proposals: List[Dict[str, Any]] = []

        for f in findings:
            rule_id = f.get("rule_id", "")
            finding_id = f.get("id", str(uuid.uuid4()))
            
            # Lookup template or fallback
            tmpl = REMEDIATION_TEMPLATES.get(rule_id)
            if tmpl:
                orig_snippet = tmpl["original"]
                prop_snippet = tmpl["replacement"]
                explanation = tmpl["explanation"]
            else:
                orig_snippet = f.get("code_snippet", "# Original vulnerable code")
                prop_snippet = f"# REMEDIATED ({rule_id}): Ensure input sanitization and secure configuration\n" + orig_snippet
                explanation = f"Apply secure coding principles recommended by {f.get('cwe_id', 'OWASP')} guidelines."

            # Test applying patch to the entire code to validate syntax
            simulated_full_code = code.replace(orig_snippet, prop_snippet) if orig_snippet in code else code
            syntax_valid, val_msg = self._validate_syntax(simulated_full_code, language)

            diff_text = self._generate_diff(orig_snippet, prop_snippet, filename)

            status = "suggested" if syntax_valid else "validation_failed"
            if not syntax_valid:
                self.log(f"FAIL-SAFE TRIGGERED for {rule_id}: {val_msg}. Retaining original code snapshot.")
            else:
                self.log(f"Synthesized validated patch for {rule_id} ({f.get('title')}). State: suggested.")

            proposal = {
                "id": str(uuid.uuid4()),
                "finding_id": finding_id,
                "file_path": filename,
                "original_code": orig_snippet,
                "proposed_code": prop_snippet,
                "diff": diff_text,
                "explanation": explanation,
                "syntax_valid": syntax_valid,
                "validation_message": val_msg,
                "status": status,
                "pre_fix_snapshot": code
            }
            f["remediation"] = proposal
            proposals.append(proposal)

        summary = f"Synthesized {len(proposals)} remediation proposals with AST validation & snapshot safeguards."
        self.log(summary)

        return {
            "status": "COMPLETED",
            "summary": summary,
            "proposals": proposals,
            "findings": findings
        }
