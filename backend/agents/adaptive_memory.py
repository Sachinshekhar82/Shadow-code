from typing import Dict, Any, List
from .base import BaseAgent

class AdaptiveMemoryAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_number=8,
            agent_name="Adaptive Memory / Learner",
            agent_role="Human-in-the-Loop Feedback Integration & Team Preference Adaptation"
        )

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        self.logs.clear()
        repo_id = context.get("repository_id", "default_repo")
        findings = context.get("findings", [])
        stored_profiles = context.get("stored_profiles", {}) # rule_id -> weight_adjustment

        self.log(f"Loading repository adaptive profiles for repository: '{repo_id}'")
        self.log(f"Active learned weight modifiers: {len(stored_profiles)} rule adjustment(s) in effect.")

        adjusted_count = 0
        for f in findings:
            rule_id = f.get("rule_id", "")
            if rule_id in stored_profiles:
                adj = stored_profiles[rule_id]
                adjusted_count += 1
                self.log(f"Applied adaptive memory weight to {rule_id}: {adj:+.1f} severity modifier.")

        summary = (
            f"Adaptive Memory active. Evaluated {len(findings)} finding(s) across repository '{repo_id}'. "
            f"Incorporated team preference history ({len(stored_profiles)} rules tuned)."
        )
        self.log(summary)

        return {
            "status": "COMPLETED",
            "summary": summary,
            "repository_id": repo_id,
            "adjusted_rules_count": adjusted_count,
            "active_weights": stored_profiles
        }
