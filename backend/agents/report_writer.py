from typing import Dict, Any, List
from .base import BaseAgent

class ReportWriterAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_number=6,
            agent_name="Report Writer / Communicator",
            agent_role="Plain-English Security Synthesis & Executive Reporting"
        )

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        self.logs.clear()
        findings = context.get("findings", [])
        counts = context.get("counts", {"critical": 0, "high": 0, "medium": 0, "low": 0})
        filename = context.get("filename", "submission.py")

        self.log(f"Compiling comprehensive security audit report for {filename} ({len(findings)} findings).")

        # Categorize by source
        scanner_confirmed = [f for f in findings if "Bandit" in f.get("detection_source", "") or "Pattern" in f.get("detection_source", "")]
        semantic_confirmed = [f for f in findings if "Semantic" in f.get("detection_source", "") or "LLM" in f.get("detection_source", "")]

        self.log(f"Separation of Evidence: {len(scanner_confirmed)} confirmed by static pattern scanners, {len(semantic_confirmed)} by contextual semantic reasoner.")

        # Build executive summary
        if counts.get("critical", 0) > 0:
            posture = "CRITICAL RISK: IMMEDIATE REMEDIATION MANDATORY"
            gate_decision = "BLOCK_RECOMMENDED"
        elif counts.get("high", 0) > 0:
            posture = "HIGH RISK: SECURITY REVIEW REQUIRED BEFORE MERGE"
            gate_decision = "REVIEW_REQUIRED"
        elif counts.get("medium", 0) > 0:
            posture = "MODERATE RISK: NON-BLOCKING WARNINGS"
            gate_decision = "PASS_WITH_WARNINGS"
        else:
            posture = "CLEAN: REPOSITORY COMPLIANT WITH SECURITY POLICIES"
            gate_decision = "PASS"

        executive_summary = (
            f"Security Audit for target '{filename}'. Found {len(findings)} total issue(s) "
            f"({counts.get('critical', 0)} Critical, {counts.get('high', 0)} High, "
            f"{counts.get('medium', 0)} Medium, {counts.get('low', 0)} Low). "
            f"SDLC Gate Evaluation: {gate_decision}. Overall Posture: {posture}."
        )

        self.log(executive_summary)

        # Enhance each finding with plain-English impact statement and action item
        for f in findings:
            cwe = f.get("cwe_id", "CWE-General")
            title = f.get("title", "")
            if "SQL" in title:
                f["business_impact"] = "High probability of data exfiltration, database corruption, or complete authentication bypass."
                f["recommended_action"] = "Replace direct string formatting with parameterized SQL queries using driver parameter bindings."
            elif "Credential" in title or "Secret" in title:
                f["business_impact"] = "Compromise of production infrastructure or cloud accounts; credential harvesting via Git history."
                f["recommended_action"] = "Revoke exposed credentials immediately and load secret keys from system environment variables or Vault."
            elif "Command" in title:
                f["business_impact"] = "Remote code execution on host server, lateral container escape, or host takeover."
                f["recommended_action"] = "Set shell=False and supply arguments as an explicit validated list."
            elif "Authorization" in title or "BOLA" in title:
                f["business_impact"] = "Unauthorized horizontal privilege escalation permitting users to alter records of other accounts."
                f["recommended_action"] = "Enforce explicit server-side authorization checks on the actor ID before modifying database records."
            elif "MD5" in title or "Hash" in title:
                f["business_impact"] = "Vulnerability to dictionary/rainbow table attacks exposing user credentials."
                f["recommended_action"] = "Migrate to PBKDF2 HMAC SHA-256 or Argon2 with cryptographic salt and multiple iterations."
            else:
                f["business_impact"] = "General security degradation and non-compliance with secure SDLC standards."
                f["recommended_action"] = "Review code against OWASP guidelines."

        summary = f"Generated structured executive report with {gate_decision} gate status."

        return {
            "status": "COMPLETED",
            "summary": summary,
            "executive_summary": executive_summary,
            "gate_decision": gate_decision,
            "posture": posture,
            "scanner_confirmed_count": len(scanner_confirmed),
            "semantic_confirmed_count": len(semantic_confirmed),
            "findings": findings
        }
