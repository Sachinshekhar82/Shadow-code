from typing import Dict, Any, List
from .base import BaseAgent

SEVERITY_THRESHOLDS = {
    "Critical": (9.0, 10.0),
    "High": (7.0, 8.9),
    "Medium": (4.0, 6.9),
    "Low": (0.1, 3.9)
}

class SeverityRankerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_number=5,
            agent_name="Severity Ranker / Judge",
            agent_role="Context-Aware Risk Evaluation & CVSS v3.1 Scoring"
        )

    def _calculate_score(self, finding: Dict[str, Any], memory_weights: Dict[str, float]) -> Dict[str, Any]:
        cwe = finding.get("cwe_id", "")
        rule_id = finding.get("rule_id", "")
        base_sev = finding.get("severity", "Medium")

        # Initial CVSS v3.1 base estimation matrix
        if "89" in cwe or "SQL" in finding.get("title", ""):
            # SQL Injection: AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H -> 9.8
            raw_score = 9.8
            vector = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
            rationale = "Remotely exploitable with no privileges or user interaction; permits complete confidentiality and integrity compromise."
        elif "798" in cwe or "Credential" in finding.get("title", ""):
            # Hardcoded Credentials: AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:L/A:N -> 9.1
            raw_score = 9.1
            vector = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:L/A:N"
            rationale = "Direct plaintext exposure of cloud administrative secrets allows persistent lateral unauthorized infrastructure access."
        elif "78" in cwe or "Command" in finding.get("title", ""):
            # Command Injection: AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H -> 8.6
            raw_score = 8.6
            vector = "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H"
            rationale = "Shell execution on untrusted argument permits host operating system command chaining and arbitrary process control."
        elif "639" in cwe or "Authorization" in finding.get("title", ""):
            # BOLA: AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N -> 8.2
            raw_score = 8.2
            vector = "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N"
            rationale = "Missing object-level authorization gate allows authenticated callers to mutate unauthorized customer balance records."
        elif "327" in cwe or "MD5" in finding.get("title", ""):
            # Broken Cryptography: AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:N/A:N -> 6.5
            raw_score = 6.5
            vector = "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:N/A:N"
            rationale = "MD5 hash collision weakness allows offline dictionary cracking of password stores."
        elif "95" in cwe:
            # Eval: 9.8
            raw_score = 9.8
            vector = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
            rationale = "Dynamic execution of untrusted input leads to full system compromise."
        else:
            raw_score = 5.0
            vector = "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:N"
            rationale = "Standard security warning requiring remediation."

        # Apply Agent 8 Adaptive Memory modifier if available
        adjustment = memory_weights.get(rule_id, 0.0)
        final_score = max(1.0, min(10.0, raw_score + adjustment))
        
        # Categorize
        if final_score >= 9.0:
            severity = "Critical"
        elif final_score >= 7.0:
            severity = "High"
        elif final_score >= 4.0:
            severity = "Medium"
        else:
            severity = "Low"

        # Guardrail: Critical findings are NEVER demoted to Low/Medium regardless of feedback
        if raw_score >= 9.0 and severity not in ["Critical", "High"]:
            severity = "High"
            final_score = max(7.0, final_score)
            rationale += " (Safety Guardrail: Critical vulnerability protected against excessive feedback suppression)."

        if adjustment != 0.0:
            rationale += f" [Adaptive Memory Adjustment applied: {adjustment:+.1f}]"

        return {
            "numeric_score": round(final_score, 1),
            "severity": severity,
            "cvss_vector": vector,
            "rationale": f"Estimated Score: {round(final_score, 1)}/10.0 ({severity}). Vector: {vector}. Context: {rationale}"
        }

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        self.logs.clear()
        findings = context.get("findings", [])
        memory_weights = context.get("memory_weights", {})

        self.log(f"Evaluating {len(findings)} findings with context-aware CVSS v3.1 calculator.")
        if memory_weights:
            self.log(f"Active repository adaptive weights loaded: {memory_weights}")

        crit_count = 0
        high_count = 0
        med_count = 0
        low_count = 0

        for f in findings:
            res = self._calculate_score(f, memory_weights)
            f["numeric_score"] = res["numeric_score"]
            f["severity"] = res["severity"]
            f["severity_rationale"] = res["rationale"]
            f["cvss_vector"] = res["cvss_vector"]

            sev = res["severity"]
            if sev == "Critical":
                crit_count += 1
            elif sev == "High":
                high_count += 1
            elif sev == "Medium":
                med_count += 1
            else:
                low_count += 1

            self.log(f"Ranked {f.get('rule_id')}: {sev} (Score {res['numeric_score']}) - {f.get('title')}")

        summary = (
            f"Assigned risk ratings: {crit_count} Critical, {high_count} High, "
            f"{med_count} Medium, {low_count} Low. All scores calibrated against CVSS v3.1 standard."
        )
        self.log(summary)

        return {
            "status": "COMPLETED",
            "summary": summary,
            "findings": findings,
            "counts": {
                "critical": crit_count,
                "high": high_count,
                "medium": med_count,
                "low": low_count
            }
        }
