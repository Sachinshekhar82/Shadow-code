export interface RemediationProposal {
  id: string;
  finding_id: string;
  file_path: string;
  original_code: string;
  proposed_code: string;
  diff: string;
  explanation: string;
  syntax_valid: boolean;
  validation_message: string;
  status: 'suggested' | 'approved' | 'applied' | 'rejected' | 'rolled_back';
  pre_fix_snapshot?: string;
  applied_at?: string;
}

export interface Finding {
  id: string;
  scan_id: string;
  repository_id?: string;
  rule_id: string;
  category: string;
  title: string;
  description: string;
  file_path: string;
  line_start: number;
  line_end: number;
  code_snippet?: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  numeric_score: number;
  severity_rationale?: string;
  cwe_id?: string;
  cve_id?: string;
  cve_references?: string;
  detection_source: string;
  status: 'open' | 'accepted' | 'rejected' | 'overridden' | 'resolved' | 'false_positive';
  created_at: string;
  remediation?: RemediationProposal;
  business_impact?: string;
  recommended_action?: string;
}

export interface AgentExecution {
  id: string;
  agent_number: number;
  agent_name: string;
  agent_role: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'SKIPPED' | 'FAILED';
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

export interface Scan {
  id: string;
  repository_id?: string;
  repository_name?: string;
  scan_mode: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
  branch: string;
  commit_hash?: string;
  commit_message?: string;
  author: string;
  language: string;
  filename: string;
  raw_input?: string;
  files_scanned: number;
  total_findings: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  duration_ms: number;
  created_at: string;
  findings: Finding[];
  agent_executions: AgentExecution[];
  logs: ScanLog[];
}

export interface Repository {
  id: string;
  name: string;
  url: string;
  default_branch: string;
  integration_mode: string;
  status: string;
  scan_count: number;
  created_at: string;
  updated_at: string;
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
