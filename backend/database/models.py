import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .session import Base

class Repository(Base):
    __tablename__ = "repositories"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    url = Column(String(512), nullable=False)
    default_branch = Column(String(64), default="main")
    integration_mode = Column(String(32), default="local_demo") # local_demo | github_app | ci_webhook
    status = Column(String(32), default="connected")
    scan_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    scans = relationship("Scan", back_populates="repository", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="repository", cascade="all, delete-orphan")
    feedbacks = relationship("FeedbackDecision", back_populates="repository", cascade="all, delete-orphan")


class Scan(Base):
    __tablename__ = "scans"

    id = Column(String(64), primary_key=True)
    repository_id = Column(String(64), ForeignKey("repositories.id"), nullable=True)
    scan_mode = Column(String(32), default="local_demo") # local_demo | strict | review | github_sync
    status = Column(String(32), default="QUEUED") # QUEUED, RUNNING, COMPLETED, FAILED, BLOCKED
    branch = Column(String(64), default="main")
    commit_hash = Column(String(64), nullable=True)
    commit_message = Column(String(255), nullable=True)
    author = Column(String(128), default="Developer")
    language = Column(String(32), default="python")
    filename = Column(String(255), default="submission.py")
    raw_input = Column(Text, nullable=True)
    files_scanned = Column(Integer, default=1)
    total_findings = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    repository = relationship("Repository", back_populates="scans")
    agent_executions = relationship("AgentExecution", back_populates="scan", cascade="all, delete-orphan", order_by="AgentExecution.agent_number")
    findings = relationship("Finding", back_populates="scan", cascade="all, delete-orphan")
    logs = relationship("ScanLog", back_populates="scan", cascade="all, delete-orphan")


class AgentExecution(Base):
    __tablename__ = "agent_executions"

    id = Column(String(64), primary_key=True)
    scan_id = Column(String(64), ForeignKey("scans.id"), nullable=False)
    agent_number = Column(Integer, nullable=False)
    agent_name = Column(String(64), nullable=False)
    agent_role = Column(String(128), nullable=False)
    status = Column(String(32), default="PENDING") # PENDING, RUNNING, COMPLETED, SKIPPED, FAILED
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, default=0)
    input_summary = Column(Text, nullable=True)
    output_summary = Column(Text, nullable=True)
    logs = Column(Text, nullable=True)
    deterministic_mode = Column(Boolean, default=True)

    scan = relationship("Scan", back_populates="agent_executions")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(64), primary_key=True)
    scan_id = Column(String(64), ForeignKey("scans.id"), nullable=False)
    repository_id = Column(String(64), ForeignKey("repositories.id"), nullable=True)
    rule_id = Column(String(64), nullable=False)
    category = Column(String(64), default="security")
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    file_path = Column(String(255), nullable=False)
    line_start = Column(Integer, default=1)
    line_end = Column(Integer, default=1)
    code_snippet = Column(Text, nullable=True)
    severity = Column(String(16), nullable=False) # Critical, High, Medium, Low
    numeric_score = Column(Float, default=5.0) # CVSS estimated base score 0.0-10.0
    severity_rationale = Column(Text, nullable=True)
    cwe_id = Column(String(32), nullable=True)
    cve_id = Column(String(32), nullable=True)
    cve_references = Column(Text, nullable=True) # JSON or newline separated URLs
    detection_source = Column(String(64), default="Pattern Scanner") # Bandit, Semgrep, Semantic Reasoner, Hybrid
    status = Column(String(32), default="open") # open, accepted, rejected, overridden, resolved, false_positive
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    scan = relationship("Scan", back_populates="findings")
    repository = relationship("Repository", back_populates="findings")
    remediation = relationship("RemediationProposal", back_populates="finding", uselist=False, cascade="all, delete-orphan")
    feedbacks = relationship("FeedbackDecision", back_populates="finding", cascade="all, delete-orphan")


class RemediationProposal(Base):
    __tablename__ = "remediation_proposals"

    id = Column(String(64), primary_key=True)
    finding_id = Column(String(64), ForeignKey("findings.id"), nullable=False, unique=True)
    scan_id = Column(String(64), ForeignKey("scans.id"), nullable=False)
    file_path = Column(String(255), nullable=False)
    original_code = Column(Text, nullable=False)
    proposed_code = Column(Text, nullable=False)
    diff = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    syntax_valid = Column(Boolean, default=True)
    validation_message = Column(Text, default="Syntax validated via AST parser")
    status = Column(String(32), default="suggested") # suggested, approved, applied, rejected, rolled_back
    pre_fix_snapshot = Column(Text, nullable=True)
    applied_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    finding = relationship("Finding", back_populates="remediation")


class FeedbackDecision(Base):
    __tablename__ = "feedback_decisions"

    id = Column(String(64), primary_key=True)
    finding_id = Column(String(64), ForeignKey("findings.id"), nullable=False)
    scan_id = Column(String(64), ForeignKey("scans.id"), nullable=False)
    repository_id = Column(String(64), ForeignKey("repositories.id"), nullable=True)
    rule_id = Column(String(64), nullable=False)
    decision = Column(String(32), nullable=False) # accepted, rejected, overridden, false_positive
    reason = Column(Text, nullable=True)
    previous_severity = Column(String(16), nullable=False)
    adjusted_severity = Column(String(16), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    finding = relationship("Finding", back_populates="feedbacks")
    repository = relationship("Repository", back_populates="feedbacks")


class ScanLog(Base):
    __tablename__ = "scan_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scan_id = Column(String(64), ForeignKey("scans.id"), nullable=False)
    level = Column(String(16), default="INFO") # INFO, WARN, ERROR, DEBUG
    stage = Column(String(64), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    scan = relationship("Scan", back_populates="logs")


class AdaptiveProfile(Base):
    __tablename__ = "adaptive_profiles"

    id = Column(String(64), primary_key=True)
    repository_id = Column(String(64), nullable=False)
    rule_id = Column(String(64), nullable=False)
    category = Column(String(64), default="general")
    override_count = Column(Integer, default=0)
    false_positive_count = Column(Integer, default=0)
    accept_count = Column(Integer, default=0)
    weight_adjustment = Column(Float, default=0.0) # -0.2, -0.4 etc
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
