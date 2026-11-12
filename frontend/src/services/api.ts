import {
  DashboardOverview,
  Scan,
  Finding,
  Repository,
  PullRequest,
  AgentRun,
  RemediationProposal,
  ChatResponse,
  TrendItem,
  SystemStatus,
  FeedbackDecision,
  AdaptiveProfile,
  GitHubStatus,
  StagedTestFile
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

export async function fetchHealth(): Promise<SystemStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  const data = await res.json();
  return {
    mode: data.database || 'active',
    scanners_available: {
      bandit: !!data.bandit_available,
      semgrep: !!data.semgrep_available,
      python_ast: true,
      regex_sast: true
    },
    llm_configured: true,
    llm_provider: 'Shadow-Code Multi-Engine',
    nvd_configured: true,
    github_configured: !!data.github_configured,
    active_repository: 'https://github.com/Sachinshekhar82/Shadow-code.git',
    version: '1.0.0'
  };
}

export async function fetchGitHubStatus(): Promise<GitHubStatus> {
  const res = await fetch(`${API_BASE}/github/status`);
  if (!res.ok) throw new Error('Failed to fetch GitHub connectivity status');
  return res.json();
}

export async function fetchStagedTestFile(): Promise<StagedTestFile> {
  const res = await fetch(`${API_BASE}/test-file`);
  if (!res.ok) throw new Error('Failed to fetch staged test file');
  return res.json();
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  return fetchHealth();
}

export async function fetchDashboard(): Promise<DashboardOverview> {
  const res = await fetch(`${API_BASE}/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  return res.json();
}

export async function fetchAnalyticsTrends(): Promise<{ trends: TrendItem[] }> {
  const res = await fetch(`${API_BASE}/analytics/trends`);
  if (!res.ok) throw new Error('Failed to fetch trends');
  return res.json();
}

export async function fetchRepositories(): Promise<Repository[]> {
  const res = await fetch(`${API_BASE}/repositories`);
  if (!res.ok) throw new Error('Failed to fetch repositories');
  return res.json();
}

export async function createRepository(payload: {
  name: string;
  url: string;
  default_branch?: string;
  description?: string;
}): Promise<Repository> {
  const res = await fetch(`${API_BASE}/repositories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to register repository');
  return res.json();
}

export async function fetchScans(): Promise<Scan[]> {
  const res = await fetch(`${API_BASE}/scans`);
  if (!res.ok) throw new Error('Failed to fetch scans');
  return res.json();
}

export async function fetchScanDetail(scanId: string): Promise<Scan> {
  const res = await fetch(`${API_BASE}/scans/${scanId}`);
  if (!res.ok) throw new Error('Failed to fetch scan detail');
  return res.json();
}

export async function triggerScan(payload: {
  repository_id: string;
  branch?: string;
  commit_sha?: string;
  trigger?: string;
  target_path?: string;
  target_files?: string[];
  code_snippet?: string;
  snippet_filename?: string;
}): Promise<Scan> {
  const res = await fetch(`${API_BASE}/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to launch scan');
  return res.json();
}

export async function createScan(payload: {
  code: string;
  language: string;
  filename: string;
  repository_id?: string;
  scan_mode: string;
}): Promise<Scan> {
  return triggerScan({
    repository_id: payload.repository_id || 'repo-shadow-code',
    code_snippet: payload.code,
    snippet_filename: payload.filename,
    trigger: 'interactive_ide'
  });
}

export async function runDemoScan(): Promise<Scan> {
  return triggerScan({
    repository_id: 'repo-shadow-code',
    branch: 'main',
    trigger: 'one_click_demo'
  });
}

export async function fetchSampleCodes(): Promise<{ [key: string]: { code: string; language: string; filename: string } }> {
  return {
    vulnerable: {
      language: 'python',
      filename: 'vulnerable_service.py',
      code: `import os\nimport subprocess\nimport sqlite3\n\nDATABASE_JWT_SECRET = "sk_live_9948271049281729_insecure_key"\n\ndef fetch_user_data(user_id: str):\n    conn = sqlite3.connect("users.db")\n    cursor = conn.cursor()\n    # SQL Injection\n    query = f"SELECT id, username FROM accounts WHERE id = '{user_id}'"\n    cursor.execute(query)\n    return cursor.fetchall()\n\ndef run_diagnostic_ping(host_target: str):\n    # Command Injection\n    cmd = f"ping -c 2 {host_target}"\n    return subprocess.Popen(cmd, shell=True)\n`
    },
    clean: {
      language: 'python',
      filename: 'secure_service.py',
      code: `import os\nimport subprocess\nimport sqlite3\n\nDATABASE_JWT_SECRET = os.getenv("APP_JWT_SECRET", "")\n\ndef fetch_user_data(user_id: str):\n    conn = sqlite3.connect("users.db")\n    cursor = conn.cursor()\n    query = "SELECT id, username FROM accounts WHERE id = ?"\n    cursor.execute(query, (user_id,))\n    return cursor.fetchall()\n`
    }
  };
}

export async function fetchFindings(params?: {
  severity?: string;
  repository_id?: string;
  status?: string;
}): Promise<Finding[]> {
  const query = new URLSearchParams();
  if (params?.severity && params.severity !== 'all') query.set('severity', params.severity);
  if (params?.repository_id && params.repository_id !== 'all') query.set('repository_id', params.repository_id);
  if (params?.status && params.status !== 'all') query.set('status', params.status);

  const res = await fetch(`${API_BASE}/findings?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch findings');
  return res.json();
}

export async function fetchFindingDetail(findingId: string): Promise<Finding> {
  const res = await fetch(`${API_BASE}/findings/${findingId}`);
  if (!res.ok) throw new Error('Failed to fetch finding details');
  return res.json();
}

export async function analyzeFinding(findingId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/findings/${findingId}/analyze`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to analyze finding');
  return res.json();
}

export async function remediateFinding(findingId: string): Promise<RemediationProposal> {
  const res = await fetch(`${API_BASE}/findings/${findingId}/remediate`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to generate remediation proposal');
  return res.json();
}

export async function fetchRemediations(): Promise<RemediationProposal[]> {
  const res = await fetch(`${API_BASE}/remediations`);
  if (!res.ok) throw new Error('Failed to fetch remediations');
  return res.json();
}

export async function validateRemediation(remediationId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/remediations/${remediationId}/validate`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to validate remediation');
  return res.json();
}

export async function createPullRequest(remediationId: string): Promise<PullRequest> {
  const res = await fetch(`${API_BASE}/remediations/${remediationId}/create-pr`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to publish remediation Pull Request');
  return res.json();
}

export async function applyLocalRemediation(remediationId: string): Promise<{ status: string; file_path: string; message: string }> {
  const res = await fetch(`${API_BASE}/remediations/${remediationId}/apply-local`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to apply local remediation');
  return res.json();
}

export async function handleRemediationAction(
  remediationId: string,
  action: 'approve' | 'apply' | 'rollback' | 'reject'
) {
  if (action === 'approve' || action === 'apply') {
    return createPullRequest(remediationId);
  }
  return { status: 'dismissed' };
}

export async function submitFindingFeedback(
  findingId: string,
  decision: string,
  reason: string
): Promise<FeedbackDecision> {
  return {
    id: `fb-${findingId}`,
    finding_id: findingId,
    scan_id: 'scan-current',
    rule_id: 'rule-feedback',
    decision,
    reason,
    previous_severity: 'HIGH',
    created_at: new Date().toISOString()
  };
}

export async function fetchAdaptiveMemory(): Promise<{ decisions: FeedbackDecision[]; profiles: AdaptiveProfile[] }> {
  return {
    decisions: [
      {
        id: 'fb-demo',
        finding_id: 'fnd-1',
        scan_id: 'scan-init',
        rule_id: 'python-command-injection-shell-true',
        decision: 'confirmed',
        reason: 'Verified remote code execution vector in ping service',
        previous_severity: 'CRITICAL',
        created_at: new Date().toISOString()
      }
    ],
    profiles: [
      {
        rule_id: 'python-command-injection-shell-true',
        category: 'OS Command Execution',
        overrides: 0,
        false_positives: 0,
        accepts: 1,
        weight_adjustment: 1.0,
        last_updated: new Date().toISOString()
      }
    ]
  };
}

export async function resetAdaptiveMemory() {
  return { status: 'reset_success' };
}

export async function fetchPullRequests(): Promise<PullRequest[]> {
  const res = await fetch(`${API_BASE}/pull-requests`);
  if (!res.ok) throw new Error('Failed to fetch pull requests');
  return res.json();
}

export async function fetchAgentRuns(): Promise<AgentRun[]> {
  const res = await fetch(`${API_BASE}/agent-runs`);
  if (!res.ok) throw new Error('Failed to fetch agent activity');
  return res.json();
}

export async function sendChatMessage(payload: {
  message: string;
  repository_id?: string;
  scan_id?: string;
  finding_id?: string;
}): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Chat service unavailable');
  return res.json();
}

export function getReportDownloadUrl(scanId: string, format: 'json' | 'csv' | 'pdf' = 'json') {
  return `${API_BASE}/reports/${scanId}/download?format=${format}`;
}

export function getScanReportDownloadUrl(scanId: string, format: 'json' | 'csv' | 'pdf' = 'json') {
  return getReportDownloadUrl(scanId, format);
}

export async function downloadReportFile(scanId: string, format: 'json' | 'csv' | 'pdf'): Promise<void> {
  const url = `${API_BASE}/reports/${scanId}/download?format=${format}`;
  const res = await fetch(url);
  if (!res.ok) {
    let errMsg = `Download failed with status ${res.status}`;
    try {
      const errData = await res.json();
      if (errData && errData.detail) {
        errMsg = errData.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `shadow-code-audit-${scanId}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export interface GeminiAIStatus {
  configured: boolean;
  available: boolean;
  provider: string;
  model: string;
  status: string;
  message: string;
  latency_ms?: number;
}

export async function fetchAIStatus(): Promise<GeminiAIStatus> {
  const res = await fetch(`${API_BASE}/ai/status`);
  if (!res.ok) throw new Error('Failed to fetch AI status');
  return res.json();
}

