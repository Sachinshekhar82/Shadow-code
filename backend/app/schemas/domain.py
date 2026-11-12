from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Finding ---
class FindingSchema(BaseModel):
    id: str
    scan_id: str
    repository_id: str
    commit_sha: str = "HEAD"
    rule_id: str
    scanner: str = "semgrep"  # "semgrep", "bandit", "ai_reasoner"
    title: str
    description: str
    severity: str = "HIGH"  # CRITICAL, HIGH, MEDIUM, LOW, INFO
    confidence: str = "HIGH"  # HIGH, MEDIUM, LOW
    cwe_id: Optional[str] = None
    owasp_category: Optional[str] = None
    file_path: str
    line_start: int = 1
    line_end: int = 1
    evidence: str
    code_context: Optional[str] = None
    ai_analysis_status: str = "pending"  # pending, analyzed, confirmed, false_positive
    ai_reasoning: Optional[str] = None
    attack_scenario: Optional[str] = None
    remediation_status: str = "open"  # open, remediated, in_review, dismissed
    remediation: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# --- Scan ---
class ScanCreateRequest(BaseModel):
    repository_id: str
    branch: Optional[str] = "main"
    commit_sha: Optional[str] = None
    target_files: Optional[List[str]] = None
    target_path: Optional[str] = None
    trigger: str = "manual"  # manual, push, pull_request, pre-push
    code_snippet: Optional[str] = None
    snippet_filename: Optional[str] = None

class ScanSchema(BaseModel):
    id: str
    repository_id: str
    branch: str = "main"
    commit_sha: str = "HEAD"
    status: str = "queued"  # queued, running, completed, failed
    trigger: str = "manual"
    duration_seconds: float = 0.0
    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0
    total_findings: int = 0
    scanner_errors: List[str] = []
    scanners_run: List[str] = []
    created_at: str
    completed_at: Optional[str] = None
    findings: Optional[List[FindingSchema]] = []

# --- Repository ---
class RepositoryCreateRequest(BaseModel):
    name: str
    url: str
    default_branch: str = "main"
    description: Optional[str] = ""

class RepositorySchema(BaseModel):
    id: str
    name: str
    url: str
    default_branch: str = "main"
    description: Optional[str] = ""
    last_scanned_commit: Optional[str] = None
    last_scan_status: Optional[str] = None
    status: str = "connected"  # connected, error, pending
    health_score: float = 100.0
    scan_count: int = 0
    created_at: str

# --- Remediation ---
class RemediationSchema(BaseModel):
    id: str
    finding_id: str
    scan_id: str
    repository_id: str
    file_path: str
    original_code: str
    proposed_patch: str
    diff: str
    explanation: str
    security_rationale: str
    regression_test: Optional[str] = None
    validation_status: str = "unvalidated"  # unvalidated, passed, failed, requires_human_review
    validation_details: Optional[Dict[str, Any]] = None
    approval_status: str = "pending"  # pending, approved, rejected
    pr_id: Optional[str] = None
    created_at: str

# --- Pull Request ---
class PullRequestCreateRequest(BaseModel):
    remediation_id: str
    target_branch: Optional[str] = "main"

class PullRequestSchema(BaseModel):
    id: str
    repository_id: str
    remediation_id: str
    finding_id: str
    branch_name: str
    target_branch: str = "main"
    pr_title: str
    pr_body: str
    pr_url: Optional[str] = None
    pr_number: Optional[int] = None
    status: str = "open"  # open, draft, merged, closed, failed, permission_denied
    error_message: Optional[str] = None
    human_review_required: bool = True
    created_at: str

# --- Agent Run ---
class AgentStep(BaseModel):
    step_name: str
    status: str
    tool: Optional[str] = None
    details: Optional[str] = None
    timestamp: str

class AgentRunSchema(BaseModel):
    id: str
    agent_name: str
    scan_id: Optional[str] = None
    finding_id: Optional[str] = None
    status: str = "running"  # running, completed, failed, retry
    current_step: str = "initialized"
    steps: List[AgentStep] = []
    retry_count: int = 0
    error_message: Optional[str] = None
    started_at: str
    completed_at: Optional[str] = None

# --- Chatbot ---
class ChatMessage(BaseModel):
    role: str  # user, assistant, system
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    repository_id: Optional[str] = None
    scan_id: Optional[str] = None
    finding_id: Optional[str] = None
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str
    grounding_references: List[str] = []
    cwe_citations: List[str] = []
    owasp_citations: List[str] = []
    disclaimer: str = "AI analysis provided for developer guidance; verify before applying in production."

# --- Dashboard & Analytics ---
class DashboardOverview(BaseModel):
    total_repositories: int
    total_scans: int
    open_findings: int
    security_health_score: float
    severity_breakdown: Dict[str, int]
    recent_scans: List[ScanSchema]
    recent_findings: List[FindingSchema]
    pending_remediations: int
    active_prs: int
    database_mode: str  # "MongoDB Atlas / Persistent" or "In-Memory Session Fallback"
