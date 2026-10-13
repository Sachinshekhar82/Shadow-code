from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ScanCreateRequest(BaseModel):
    code: str = Field(..., description="Source code text to analyze")
    language: str = Field(default="python", description="Programming language (e.g. python, javascript, java)")
    filename: str = Field(default="submission.py", description="Target file name")
    repository_id: Optional[str] = Field(default=None, description="Associated repository ID")
    scan_mode: str = Field(default="local_demo", description="Scan mode: local_demo, strict, review")

class AgentExecutionSchema(BaseModel):
    id: str
    agent_number: int
    agent_name: str
    agent_role: str
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_ms: int = 0
    input_summary: Optional[str] = None
    output_summary: Optional[str] = None
    logs: Optional[str] = None
    deterministic_mode: bool = True

    class Config:
        from_attributes = True

class RemediationSchema(BaseModel):
    id: str
    finding_id: str
    file_path: str
    original_code: str
    proposed_code: str
    diff: str
    explanation: str
    syntax_valid: bool
    validation_message: str
    status: str
    pre_fix_snapshot: Optional[str] = None
    applied_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FindingSchema(BaseModel):
    id: str
    scan_id: str
    repository_id: Optional[str] = None
    rule_id: str
    category: str
    title: str
    description: str
    file_path: str
    line_start: int
    line_end: int
    code_snippet: Optional[str] = None
    severity: str
    numeric_score: float
    severity_rationale: Optional[str] = None
    cwe_id: Optional[str] = None
    cve_id: Optional[str] = None
    cve_references: Optional[str] = None
    detection_source: str
    status: str
    created_at: datetime
    remediation: Optional[RemediationSchema] = None

    class Config:
        from_attributes = True

class ScanLogSchema(BaseModel):
    id: int
    level: str
    stage: str
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True

class ScanDetailResponse(BaseModel):
    id: str
    repository_id: Optional[str] = None
    scan_mode: str
    status: str
    branch: str
    commit_hash: Optional[str] = None
    commit_message: Optional[str] = None
    author: str
    language: str
    filename: str
    raw_input: Optional[str] = None
    files_scanned: int
    total_findings: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    duration_ms: int
    created_at: datetime
    findings: List[FindingSchema] = []
    agent_executions: List[AgentExecutionSchema] = []
    logs: List[ScanLogSchema] = []

    class Config:
        from_attributes = True

class ScanListItem(BaseModel):
    id: str
    repository_id: Optional[str] = None
    repository_name: Optional[str] = None
    scan_mode: str
    status: str
    branch: str
    language: str
    filename: str
    total_findings: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    duration_ms: int
    created_at: datetime

    class Config:
        from_attributes = True
