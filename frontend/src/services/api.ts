import { Scan, Finding, Repository, SystemStatus, FeedbackDecision, AdaptiveProfile } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const res = await fetch(`${API_BASE}/api/status`);
  return res.json();
}

export async function fetchSampleCodes() {
  const res = await fetch(`${API_BASE}/api/samples`);
  return res.json();
}

export async function runDemoScan(): Promise<Scan> {
  const res = await fetch(`${API_BASE}/api/scans/demo-run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Demo scan execution failed');
  return res.json();
}

export async function createScan(payload: {
  code: string;
  language: string;
  filename: string;
  repository_id?: string;
  scan_mode: string;
}): Promise<Scan> {
  const res = await fetch(`${API_BASE}/api/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Scan creation failed');
  return res.json();
}

export async function fetchScans(): Promise<Scan[]> {
  const res = await fetch(`${API_BASE}/api/scans`);
  if (!res.ok) throw new Error('Failed to fetch scans');
  return res.json();
}

export async function fetchScanDetail(scanId: string): Promise<Scan> {
  const res = await fetch(`${API_BASE}/api/scans/${scanId}`);
  if (!res.ok) throw new Error('Failed to fetch scan detail');
  return res.json();
}

export async function fetchFindings(params?: {
  severity?: string;
  status?: string;
  search?: string;
  scan_id?: string;
}): Promise<Finding[]> {
  const query = new URLSearchParams();
  if (params?.severity && params.severity !== 'all') query.set('severity', params.severity);
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.scan_id) query.set('scan_id', params.scan_id);

  const res = await fetch(`${API_BASE}/api/findings?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch findings');
  return res.json();
}

export async function submitFindingFeedback(
  findingId: string,
  decision: string,
  reason: string
): Promise<FeedbackDecision> {
  const res = await fetch(`${API_BASE}/api/findings/${findingId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, reason })
  });
  if (!res.ok) throw new Error('Failed to submit feedback');
  return res.json();
}

export async function handleRemediationAction(
  remediationId: string,
  action: 'approve' | 'apply' | 'rollback' | 'reject'
) {
  const res = await fetch(`${API_BASE}/api/remediations/${remediationId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Remediation action failed');
  }
  return res.json();
}

export async function fetchRepositories(): Promise<Repository[]> {
  const res = await fetch(`${API_BASE}/api/repositories`);
  if (!res.ok) throw new Error('Failed to fetch repositories');
  return res.json();
}

export async function fetchAdaptiveMemory() {
  const [decisionsRes, profilesRes] = await Promise.all([
    fetch(`${API_BASE}/api/adaptive-memory/decisions`),
    fetch(`${API_BASE}/api/adaptive-memory/profiles`)
  ]);
  const decisions: FeedbackDecision[] = await decisionsRes.json();
  const profiles = await profilesRes.json();
  return { decisions, profiles };
}

export async function resetAdaptiveMemory() {
  const res = await fetch(`${API_BASE}/api/adaptive-memory/reset`, { method: 'POST' });
  return res.json();
}

export function getScanReportDownloadUrl(scanId: string, format: 'json' | 'csv' = 'json') {
  return `${API_BASE}/api/scans/${scanId}/report?format=${format}`;
}
