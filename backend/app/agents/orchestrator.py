import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from backend.app.schemas.domain import (
    FindingSchema,
    RemediationSchema,
    AgentRunSchema,
    AgentStep,
    PullRequestSchema
)
from backend.app.agents.repo_analysis_agent import repo_analysis_agent
from backend.app.agents.vulnerability_reasoning_agent import vulnerability_reasoning_agent
from backend.app.agents.remediation_agent import remediation_agent
from backend.app.agents.validation_agent import validation_agent
from backend.app.agents.pr_reporting_agent import pr_reporting_agent
from backend.app.db.mongo import get_database

logger = logging.getLogger("shadow_code.agents.orchestrator")

class AgentOrchestrator:
    """
    State machine coordinator managing multi-agent collaboration across
    analysis, reasoning, patch synthesis, validation, and PR stages.
    """

    def __init__(self):
        self.max_retries = 3

    def orchestrate_finding_workflow(
        self,
        finding: FindingSchema,
        repo_url: str = "https://github.com/Sachinshekhar82/Shadow-code.git"
    ) -> Dict[str, Any]:
        """
        Coordinates the end-to-end multi-agent audit lifecycle for a single finding:
        Reasoning -> Remediation -> Validation -> PR Preparation.
        """
        db = get_database()
        run_id = f"run-{uuid.uuid4().hex[:10]}"
        steps: List[AgentStep] = []
        started_at = datetime.now(timezone.utc).isoformat()

        def log_step(name: str, tool: str, details: str, status: str = "completed"):
            step = AgentStep(
                step_name=name,
                tool=tool,
                details=details,
                status=status,
                timestamp=datetime.now(timezone.utc).isoformat()
            )
            steps.append(step)
            db.agent_runs.update_one(
                {"id": run_id},
                {"$set": {
                    "steps": [s.model_dump() for s in steps],
                    "current_step": name,
                    "status": "running"
                }},
                upsert=True
            )

        # Initialize record
        agent_run = AgentRunSchema(
            id=run_id,
            agent_name="ShadowCode-Coordinator",
            scan_id=finding.scan_id,
            finding_id=finding.id,
            status="running",
            current_step="initialization",
            steps=[],
            retry_count=0,
            started_at=started_at
        )
        db.agent_runs.insert_one(agent_run.model_dump())

        try:
            # Stage 1: Vulnerability Reasoning
            log_step("Vulnerability Reasoning", "vulnerability_reasoning_agent", f"Analyzing rule {finding.rule_id}")
            reasoning_result = vulnerability_reasoning_agent.analyze_finding(finding)
            
            # Update finding in DB
            db.findings.update_one(
                {"id": finding.id},
                {"$set": {
                    "ai_analysis_status": reasoning_result.get("status", "analyzed"),
                    "ai_reasoning": reasoning_result.get("reasoning"),
                    "attack_scenario": reasoning_result.get("attack_scenario"),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )

            # Stage 2: Remediation Proposal
            log_step("Remediation Synthesis", "remediation_agent", f"Generating minimal patch for {finding.file_path}")
            remediation = remediation_agent.propose_remediation(finding)
            
            # Stage 3: Isolated Sandbox Validation
            log_step("Sandbox Validation", "validation_agent", "Running AST parser and re-scan tests in isolated container")
            val_status, val_details = validation_agent.validate_patch(remediation, finding)
            remediation.validation_status = val_status
            remediation.validation_details = val_details

            # Save remediation in DB
            db.remediations.insert_one(remediation.model_dump())

            # Stage 4: Workflow Completion
            final_status = "completed" if val_status == "passed" else "requires_human_review"
            log_step("Workflow Staging", "orchestrator", f"Remediation ready with validation status: {val_status}", status=final_status)

            completed_at = datetime.now(timezone.utc).isoformat()
            db.agent_runs.update_one(
                {"id": run_id},
                {"$set": {
                    "status": final_status,
                    "completed_at": completed_at,
                    "current_step": "ready_for_human_approval"
                }}
            )

            return {
                "agent_run_id": run_id,
                "reasoning": reasoning_result,
                "remediation": remediation,
                "validation_status": val_status,
                "validation_details": val_details
            }

        except Exception as e:
            logger.error(f"Orchestration failure: {e}")
            log_step("Error Handler", "orchestrator", str(e), status="failed")
            db.agent_runs.update_one(
                {"id": run_id},
                {"$set": {
                    "status": "failed",
                    "error_message": str(e),
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            raise e

orchestrator = AgentOrchestrator()
