import time
import uuid
import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from backend.agents.parser import ParserAgent
from backend.agents.pattern_scanner import PatternScannerAgent
from backend.agents.semantic_reasoner import SemanticReasonerAgent
from backend.agents.cve_correlator import CVECorrelatorAgent
from backend.agents.severity_ranker import SeverityRankerAgent
from backend.agents.report_writer import ReportWriterAgent
from backend.agents.surgeon import SurgeonAgent
from backend.agents.adaptive_memory import AdaptiveMemoryAgent

from backend.database.models import (
    Scan, AgentExecution, Finding, RemediationProposal, ScanLog, AdaptiveProfile, Repository
)

class ShadowCodeOrchestrator:
    def __init__(self, db: Session):
        self.db = db
        self.parser = ParserAgent()
        self.pattern_scanner = PatternScannerAgent()
        self.semantic_reasoner = SemanticReasonerAgent()
        self.cve_correlator = CVECorrelatorAgent()
        self.severity_ranker = SeverityRankerAgent()
        self.report_writer = ReportWriterAgent()
        self.surgeon = SurgeonAgent()
        self.adaptive_memory = AdaptiveMemoryAgent()

    def _log_scan(self, scan_id: str, stage: str, message: str, level: str = "INFO"):
        log_entry = ScanLog(
            scan_id=scan_id,
            stage=stage,
            level=level,
            message=message,
            timestamp=datetime.datetime.utcnow()
        )
        self.db.add(log_entry)

    def execute_scan(
        self,
        code: str,
        language: str = "python",
        filename: str = "submission.py",
        repository_id: str = None,
        scan_mode: str = "local_demo",
        branch: str = "main",
        commit_hash: str = None,
        commit_message: str = None,
        author: str = "Developer"
    ) -> Scan:
        scan_id = str(uuid.uuid4())
        scan_start_time = time.time()

        # Ensure or link repository
        if not repository_id:
            repo = self.db.query(Repository).filter(Repository.name == "Demo Repository").first()
            if not repo:
                repo = Repository(
                    id="repo-demo",
                    name="Demo Repository",
                    url="https://github.com/Sachinshekhar82/Shadow-code.git",
                    default_branch="main",
                    integration_mode="local_demo",
                    status="connected"
                )
                self.db.add(repo)
                self.db.flush()
            repository_id = repo.id

        # Fetch adaptive profiles for this repository
        profiles = self.db.query(AdaptiveProfile).filter(AdaptiveProfile.repository_id == repository_id).all()
        memory_weights = {p.rule_id: p.weight_adjustment for p in profiles}

        # Create Scan record
        scan_record = Scan(
            id=scan_id,
            repository_id=repository_id,
            scan_mode=scan_mode,
            status="RUNNING",
            branch=branch,
            commit_hash=commit_hash or ("a1b2c3d" if scan_mode == "local_demo" else None),
            commit_message=commit_message or ("Audit uncommitted changes" if scan_mode == "local_demo" else None),
            author=author,
            language=language,
            filename=filename,
            raw_input=code,
            files_scanned=1,
            created_at=datetime.datetime.utcnow()
        )
        self.db.add(scan_record)
        self.db.commit()

        self._log_scan(scan_id, "Gateway", f"Shadow Code Gateway intercepted code submission '{filename}'. Initializing agentic pipeline.")

        pipeline_context: Dict[str, Any] = {
            "scan_id": scan_id,
            "code": code,
            "language": language,
            "filename": filename,
            "repository_id": repository_id,
            "scan_mode": scan_mode,
            "memory_weights": memory_weights,
            "stored_profiles": memory_weights,
            "findings": []
        }

        agents = [
            (self.parser, 1),
            (self.pattern_scanner, 2),
            (self.semantic_reasoner, 3),
            (self.cve_correlator, 4),
            (self.severity_ranker, 5),
            (self.report_writer, 6),
            (self.surgeon, 7),
            (self.adaptive_memory, 8)
        ]

        all_findings_by_rule = {}

        for agent, number in agents:
            agent_start = time.time()
            agent_start_dt = datetime.datetime.utcnow()
            agent_exec_id = str(uuid.uuid4())

            agent_exec = AgentExecution(
                id=agent_exec_id,
                scan_id=scan_id,
                agent_number=number,
                agent_name=agent.agent_name,
                agent_role=agent.agent_role,
                status="RUNNING",
                started_at=agent_start_dt,
                deterministic_mode=True
            )
            self.db.add(agent_exec)
            self.db.commit()

            self._log_scan(scan_id, agent.agent_name, f"Agent {number} started execution.")

            try:
                result = agent.run(pipeline_context)
                agent_duration = int((time.time() - agent_start) * 1000)

                # Merge findings
                if "findings" in result:
                    for f in result["findings"]:
                        # assign stable finding ID
                        if "id" not in f:
                            f["id"] = str(uuid.uuid4())
                        f["scan_id"] = scan_id
                        f["repository_id"] = repository_id
                        rule_key = f.get("rule_id", f["id"])
                        if rule_key not in all_findings_by_rule:
                            all_findings_by_rule[rule_key] = f
                        else:
                            # enrich existing
                            all_findings_by_rule[rule_key].update(f)

                    pipeline_context["findings"] = list(all_findings_by_rule.values())

                if "code_units" in result:
                    pipeline_context["code_units"] = result["code_units"]
                if "counts" in result:
                    pipeline_context["counts"] = result["counts"]

                agent_exec.status = "COMPLETED"
                agent_exec.completed_at = datetime.datetime.utcnow()
                agent_exec.duration_ms = agent_duration
                agent_exec.output_summary = result.get("summary", "Agent finished successfully.")
                agent_exec.logs = "\n".join(agent.logs)
                agent_exec.deterministic_mode = result.get("deterministic_mode", True)
                self.db.commit()

                self._log_scan(scan_id, agent.agent_name, f"Agent {number} completed in {agent_duration}ms. {result.get('summary', '')}")

            except Exception as ex:
                agent_duration = int((time.time() - agent_start) * 1000)
                agent_exec.status = "FAILED"
                agent_exec.completed_at = datetime.datetime.utcnow()
                agent_exec.duration_ms = agent_duration
                agent_exec.output_summary = f"Execution error: {str(ex)}"
                agent_exec.logs = "\n".join(agent.logs) + f"\n[ERROR] {str(ex)}"
                self.db.commit()
                self._log_scan(scan_id, agent.agent_name, f"Agent {number} failed: {str(ex)}", level="ERROR")

        # Persist findings and proposals to database
        final_findings = list(all_findings_by_rule.values())
        crit_c = 0
        high_c = 0
        med_c = 0
        low_c = 0

        for f_data in final_findings:
            sev = f_data.get("severity", "Medium")
            if sev == "Critical":
                crit_c += 1
            elif sev == "High":
                high_c += 1
            elif sev == "Medium":
                med_c += 1
            else:
                low_c += 1

            finding_obj = Finding(
                id=f_data["id"],
                scan_id=scan_id,
                repository_id=repository_id,
                rule_id=f_data.get("rule_id", "GEN-01"),
                category=f_data.get("category", "security"),
                title=f_data.get("title", "Detected Security Issue"),
                description=f_data.get("description", ""),
                file_path=filename,
                line_start=f_data.get("line_start", 1),
                line_end=f_data.get("line_end", 1),
                code_snippet=f_data.get("code_snippet", ""),
                severity=sev,
                numeric_score=f_data.get("numeric_score", 5.0),
                severity_rationale=f_data.get("severity_rationale", ""),
                cwe_id=f_data.get("cwe_id"),
                cve_id=f_data.get("cve_id"),
                cve_references=f_data.get("cve_references"),
                detection_source=f_data.get("detection_source", "Pattern Scanner"),
                status="open",
                created_at=datetime.datetime.utcnow()
            )
            self.db.add(finding_obj)

            # Persist remediation proposal if present
            rem = f_data.get("remediation")
            if rem:
                rem_obj = RemediationProposal(
                    id=rem.get("id", str(uuid.uuid4())),
                    finding_id=finding_obj.id,
                    scan_id=scan_id,
                    file_path=filename,
                    original_code=rem.get("original_code", ""),
                    proposed_code=rem.get("proposed_code", ""),
                    diff=rem.get("diff", ""),
                    explanation=rem.get("explanation", ""),
                    syntax_valid=rem.get("syntax_valid", True),
                    validation_message=rem.get("validation_message", ""),
                    status=rem.get("status", "suggested"),
                    pre_fix_snapshot=rem.get("pre_fix_snapshot", code),
                    created_at=datetime.datetime.utcnow()
                )
                self.db.add(rem_obj)

        total_scan_duration = int((time.time() - scan_start_time) * 1000)

        # Update Scan record
        gate = pipeline_context.get("gate_decision", "PASS")
        scan_status = "BLOCKED" if gate == "BLOCK_RECOMMENDED" and scan_mode == "strict" else "COMPLETED"

        scan_record.status = scan_status
        scan_record.total_findings = len(final_findings)
        scan_record.critical_count = crit_c
        scan_record.high_count = high_c
        scan_record.medium_count = med_c
        scan_record.low_count = low_c
        scan_record.duration_ms = total_scan_duration

        # Increment repo scan count
        repo = self.db.query(Repository).filter(Repository.id == repository_id).first()
        if repo:
            repo.scan_count += 1

        self.db.commit()
        self._log_scan(scan_id, "Gateway", f"Scan pipeline finalized in {total_scan_duration}ms. Status: {scan_status}. Total findings: {len(final_findings)}.")

        self.db.refresh(scan_record)
        return scan_record
