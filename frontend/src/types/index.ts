export interface RemediationProposal {
  id: string;
  finding_id: string;
  file_path: string;
  original_code: string;
  proposed_patch?: string;
  proposed_code?: string;
  diff: string;
  explanation: string;
  security_rationale?: string;
  regression_test?: string;
  syntax_valid?: boolean;
  validation_message?: string;
  validation_status?: 'unvalidated' | 'passed' | 'failed' | 'requires_human_review';
  validation_details?: Record<string, any>;
  approval_status?: 'pending' | 'approved' | 'rejected';
  status?: 'suggested' | 'approved' | 'applied' | 'rejected' | 'rolled_back' | string;
  pre_fix_snapshot?: string;
  applied_at?: string;
  pr_id?: string;
  created_at: string;
}

export interface Finding {
  id: string;
  scan_id: string;
  repository_id?: string;
  commit_sha?: string;
  rule_id: string;
  category?: string;
  scanner?: string;
  detection_source?: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | 'Critical' | 'High' | 'Medium' | 'Low' | string;
  numeric_score?: number;
  severity_rationale?: string;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  cwe_id?: string;
  cve_id?: string;
  cve_references?: string;
  file_path: string;
  line_start: number;
  line_end: number;
  evidence?: string;
  code_snippet?: string;
  code_context?: string;
  business_impact?: string;
  recommended_action?: string;
  ai_analysis_status?: 'pending' | 'analyzed' | 'confirmed' | 'false_positive' | string;
  ai_reasoning?: string;
  attack_scenario?: string;
  remediation_status?: 'open' | 'remediated' | 'in_review' | 'dismissed' | string;
  status?: 'open' | 'accepted' | 'rejected' | 'overridden' | 'resolved' | 'false_positive' | string;
  created_at: string;
  updated_at?: string;
  remediation?: RemediationProposal;
}

export interface AgentExecution {
  id: string;
  agent_number: number;
  agent_name: string;
  agent_role: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'SKIPPED' | 'FAILED' | string;
  started_at?: string;
  completed_at?: string;
  duration_ms: number;
  input_summary?: string;
  output_summary?: string;
  logs?: string;
  deterministic_mode: boolean;
}

export interface ScanLog {
  id: number;
  level: string;
  stage: string;
  message: string;
  timestamp: string;
}

export interface AgentStep {
  step_name: string;
  status: string;
  tool?: string;
  details?: string;
  timestamp: string;
}

export interface AgentRun {
  id: string;
  agent_name: string;
  scan_id?: string;
  finding_id?: string;
  status: 'running' | 'completed' | 'failed' | 'requires_human_review' | string;
  current_step: string;
  steps: AgentStep[];
  retry_count: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface Scan {
  id: string;
  repository_id?: string;
  repository_name?: string;
  scan_mode?: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED' | 'queued' | 'running' | 'completed' | 'failed' | string;
  branch: string;
  commit_sha?: string;
  commit_hash?: string;
  commit_message?: string;
  author?: string;
  language?: string;
  filename?: string;
  raw_input?: string;
  files_scanned?: number;
  total_findings: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  duration_seconds?: number;
  duration_ms?: number;
  trigger?: string;
  scanner_errors?: string[];
  scanners_run?: string[];
  created_at: string;
  completed_at?: string;
  findings?: Finding[];
  agent_executions?: AgentExecution[];
  logs?: ScanLog[];
}

export interface Repository {
  id: string;
  name: string;
  url: string;
  default_branch: string;
  description?: string;
  integration_mode?: string;
  last_scanned_commit?: string;
  last_scan_status?: string;
  status: 'connected' | 'error' | 'pending' | string;
  health_score?: number;
  scan_count: number;
  created_at: string;
  updated_at?: string;
}

export interface PullRequest {
  id: string;
  repository_id: string;
  remediation_id: string;
  finding_id: string;
  branch_name: string;
  target_branch: string;
  pr_title: string;
  pr_body: string;
  pr_url?: string;
  pr_number?: number;
  status: 'open' | 'draft' | 'merged' | 'closed' | 'failed' | 'permission_denied' | string;
  error_message?: string;
  human_review_required: boolean;
  created_at: string;
}

export interface SystemStatus {
  mode: string;
  scanners_available: {
    bandit: boolean;
    semgrep: boolean;
    python_ast: boolean;
    regex_sast: boolean;
  };
  llm_configured: boolean;
  llm_provider?: string;
  nvd_configured: boolean;
  github_configured: boolean;
  active_repository: string;
  version: string;
}

export interface FeedbackDecision {
  id: string;
  finding_id: string;
  scan_id: string;
  repository_id?: string;
  rule_id: string;
  decision: string;
  reason?: string;
  previous_severity: string;
  adjusted_severity?: string;
  created_at: string;
}

export interface AdaptiveProfile {
  rule_id: string;
  category: string;
  overrides: number;
  false_positives: number;
  accepts: number;
  weight_adjustment: number;
  last_updated: string;
}

export interface DashboardOverview {
  total_repositories: number;
  total_scans: number;
  open_findings: number;
  security_health_score: number;
  severity_breakdown: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  recent_scans: Scan[];
  recent_findings: Finding[];
  pending_remediations: number;
  active_prs: number;
  database_mode: string;
}

export interface TrendItem {
  scan_id: string;
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  response: string;
  grounding_references: string[];
  cwe_citations: string[];
  owasp_citations: string[];
  disclaimer: string;
}

export interface GitHubRepoPermissions {
  admin?: boolean;
  push?: boolean;
  pull?: boolean;
}

export interface GitHubRepoDetails {
  full_name: string;
  default_branch: string;
  private: boolean;
  html_url: string;
  open_issues_count: number;
  permissions?: GitHubRepoPermissions;
}

export interface GitHubStatus {
  status: 'connected' | 'unconfigured' | 'error' | string;
  authenticated: boolean;
  user?: string;
  repository?: GitHubRepoDetails | string;
  message?: string;
  error?: string;
}

export interface StagedTestFile {
  filename: string;
  path: string;
  absolute_path?: string;
  line_count: number;
  content: string;
  language: string;
  repository_id: string;
  remote_repo: string;
  vulnerabilities: Array<{
    type: string;
    cwe: string;
    severity: string;
    line: number;
  }>;
}

