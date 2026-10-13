import os
import ast
import json
import httpx
from typing import Dict, Any, List
from .base import BaseAgent

class SemanticReasonerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_number=3,
            agent_name="Semantic Reasoner / Doctor",
            agent_role="Context, Intent & Business-Logic Vulnerability Analysis"
        )
        self.llm_api_key = os.environ.get("LLM_API_KEY", "")
        self.llm_provider = os.environ.get("LLM_PROVIDER", "").lower()
        self.llm_model = os.environ.get("LLM_MODEL", "llama-3.3-70b-versatile")
        self.llm_base_url = os.environ.get("LLM_BASE_URL", "")

    def _call_live_llm(self, code: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Invokes a real LLM endpoint when valid credentials exist."""
        prompt = (
            "You are Shadow Code's Agent 3 (Semantic Reasoner). Analyze the following source code for deep "
            "semantic, contextual, and business-logic vulnerabilities (e.g. Broken Object Level Authorization, "
            "missing role checks, unvalidated flows, race conditions).\n"
            "Return ONLY a valid JSON array of objects with keys:\n"
            "rule_id, title, description, line_start, line_end, severity, cwe_id, rationale.\n\n"
            f"Code:\n{code}\n"
        )
        # Handle standard OpenAI/Groq compatible chat completions
        url = self.llm_base_url or ("https://api.groq.com/openai/v1/chat/completions" if self.llm_provider == "groq" else "https://api.openai.com/v1/chat/completions")
        headers = {
            "Authorization": f"Bearer {self.llm_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.llm_model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1
        }
        with httpx.Client(timeout=20.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            # Clean JSON formatting
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            findings = json.loads(content)
            for f in findings:
                f["detection_source"] = f"LLM Semantic Reasoner ({self.llm_model})"
            return findings

    def _run_deterministic_semantic_analyzer(self, code: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Deterministic, AST-backed semantic and business-logic reasoning engine.
        Inspects function signatures, parameter names, and database state alterations
        to detect missing authorization / BOLA (CWE-639) without requiring external LLMs.
        """
        findings = []
        lines = code.splitlines()

        # Check for Broken Object Level Authorization (BOLA / CWE-639):
        # A function receiving an actor_id and target_id and modifying DB without checking actor's permissions
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    arg_names = [arg.arg for arg in node.args.args]
                    # Check if function involves sensitive actions (balance, role, transfer, delete, update)
                    has_actor = any("actor" in a or "user_id" in a for a in arg_names)
                    has_target = any("target" in a or "account" in a or "recipient" in a for a in arg_names)
                    
                    # Check if body has SQL UPDATE or DELETE
                    func_source = "\n".join(lines[node.lineno - 1 : getattr(node, "end_lineno", node.lineno + 15)])
                    has_state_mutation = "UPDATE " in func_source.upper() or "DELETE " in func_source.upper()
                    has_auth_check = any(term in func_source.lower() for term in ["role", "is_admin", "permission", "owner", "raise permissionerror"])

                    if (has_actor or has_target) and has_state_mutation and not has_auth_check:
                        findings.append({
                            "rule_id": "SEC-004",
                            "category": "business_logic",
                            "title": "Broken Object Level Authorization (BOLA / IDOR)",
                            "description": (
                                f"Function '{node.name}' performs state-modifying database operations using "
                                f"parameters {arg_names} without validating that the actor possesses ownership "
                                "or administrative authorization for the target resource."
                            ),
                            "file_path": context.get("filename", "submission.py"),
                            "line_start": node.lineno,
                            "line_end": getattr(node, "end_lineno", node.lineno + 10),
                            "code_snippet": func_source.strip()[:200] + "...",
                            "severity": "High",
                            "cwe_id": "CWE-639",
                            "severity_rationale": "Missing authorization gate in state-modifying business logic permits horizontal privilege escalation.",
                            "detection_source": "Deterministic Contextual Semantic Reasoner"
                        })
        except Exception as e:
            self.log(f"AST semantic walk note: {e}")

        # Additional semantic intent check: Raw string SQL execution
        if "execute(" in code and ("f\"" in code or ".format(" in code):
            # Check if SEC-002 already covered it or add semantic context
            pass

        return findings

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        self.logs.clear()
        code = context.get("code", "")
        has_credentials = bool(self.llm_api_key and self.llm_provider)

        findings: List[Dict[str, Any]] = []
        is_deterministic = True

        if has_credentials:
            self.log(f"Configured LLM provider detected: {self.llm_provider} ({self.llm_model}). Dispatching prompt...")
            try:
                findings = self._call_live_llm(code, context)
                is_deterministic = False
                self.log(f"LLM Semantic Reasoner returned {len(findings)} validated findings.")
            except Exception as e:
                self.log(f"Live LLM call failed ({e}). Gracefully falling back to Deterministic Semantic Reasoner.")
                findings = self._run_deterministic_semantic_analyzer(code, context)
                is_deterministic = True
        else:
            self.log("LLM credentials unconfigured. Analysis performed using Deterministic Contextual Semantic Engine (Never claiming LLM generation).")
            findings = self._run_deterministic_semantic_analyzer(code, context)
            is_deterministic = True

        summary = (
            f"Semantic analysis completed ({'Live LLM: ' + self.llm_model if not is_deterministic else 'Deterministic Contextual Analyzer'}). "
            f"Identified {len(findings)} deep contextual/business-logic issue(s)."
        )
        self.log(summary)

        return {
            "status": "COMPLETED",
            "summary": summary,
            "findings": findings,
            "deterministic_mode": is_deterministic,
            "llm_used": not is_deterministic
        }
