import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  CheckCircle2,
  RefreshCw,
  Lock,
  AlertTriangle,
  Play,
  Check,
  FileCode2,
  GitPullRequest,
  Sparkles,
  ArrowRight,
  ChevronRight,
  AlertOctagon,
  Eye,
  CheckCircle,
  FileWarning,
  KeyRound,
  Download,
  Info
} from 'lucide-react';
import {
  Repository,
  Scan,
  GitHubStatus,
  GitHubRepoDetails,
  StagedTestFile,
  Finding,
  RemediationProposal,
  PullRequest
} from '../types';
import {
  fetchGitHubStatus,
  fetchStagedTestFile,
  triggerScan,
  fetchScanDetail,
  remediateFinding,
  createPullRequest,
  fetchRemediations,
  applyLocalRemediation
} from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { CodeViewer } from '../components/CodeViewer';
import { DiffViewer } from '../components/DiffViewer';
import { StatusBadge, SeverityBadge } from '../components/SeverityBadge';

interface RepositoriesPageProps {
  repositories: Repository[];
  scans: Scan[];
}

export const RepositoriesPage: React.FC<RepositoriesPageProps> = ({
  repositories,
  scans
}) => {
  const [githubStatus, setGithubStatus] = useState<GitHubStatus | null>(null);
  const [loadingGithub, setLoadingGithub] = useState<boolean>(true);
  const [githubError, setGithubError] = useState<string | null>(null);

  // Staged File & Security Gate Workspace State
  const [stagedFile, setStagedFile] = useState<StagedTestFile | null>(null);
  const [loadingFile, setLoadingFile] = useState<boolean>(true);
  const [pushIntercepting, setPushIntercepting] = useState<boolean>(false);
  const [interceptionStatus, setInterceptionStatus] = useState<'idle' | 'intercepted' | 'cleared'>('idle');
  const [activeScan, setActiveScan] = useState<Scan | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [activeRemediation, setActiveRemediation] = useState<RemediationProposal | null>(null);
  const [remediating, setRemediating] = useState<boolean>(false);
  const [creatingPr, setCreatingPr] = useState<boolean>(false);
  const [applyingLocal, setApplyingLocal] = useState<boolean>(false);
  const [createdPr, setCreatedPr] = useState<PullRequest | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadGitHubStatus = async () => {
    setLoadingGithub(true);
    setGithubError(null);
    try {
      const status = await fetchGitHubStatus();
      setGithubStatus(status);
    } catch (err: any) {
      setGithubError(err.message || 'Failed to verify GitHub connection');
    } finally {
      setLoadingGithub(false);
    }
  };

  const loadStagedTestFile = async () => {
    setLoadingFile(true);
    try {
      const data = await fetchStagedTestFile();
      setStagedFile(data);
    } catch (err: any) {
      console.error('Failed to load staged test file:', err);
    } finally {
      setLoadingFile(false);
    }
  };

  useEffect(() => {
    loadGitHubStatus();
    loadStagedTestFile();
  }, []);

  // Pre-populate if scans exist
  useEffect(() => {
    const existingScan = scans.find(
      s => s.trigger === 'pre_push_intercept' || s.total_findings > 0
    );
    if (existingScan && !activeScan) {
      fetchScanDetail(existingScan.id).then(detail => {
        setActiveScan(detail);
        if (detail.findings && detail.findings.length > 0) {
          setFindings(detail.findings);
          setSelectedFinding(detail.findings[0]);
          setInterceptionStatus('intercepted');
        }
      }).catch(console.error);

      fetchRemediations().then(rems => {
        if (rems && rems.length > 0) {
          setActiveRemediation(rems[0]);
        }
      }).catch(console.error);
    }
  }, [scans]);

  const handleSimulateGitPush = async () => {
    setPushIntercepting(true);
    setActionMessage('Simulating git push origin main... Pre-push hook intercepting staged code transmission.');
    setCreatedPr(null);
    try {
      const newScan = await triggerScan({
        repository_id: 'repo-shadow-code',
        target_path: 'vulnerable_api_service.py',
        trigger: 'pre_push_intercept'
      });

      const detail = await fetchScanDetail(newScan.id);
      setActiveScan(detail);
      setInterceptionStatus('intercepted');

      if (detail.findings && detail.findings.length > 0) {
        setFindings(detail.findings);
        const critFinding = detail.findings.find(f => f.severity === 'CRITICAL') || detail.findings[0];
        setSelectedFinding(critFinding);

        setActionMessage('⛔ Git push intercepted & blocked! Running Google Gemini AI remediation agent...');

        setRemediating(true);
        try {
          const rem = await remediateFinding(critFinding.id);
          setActiveRemediation(rem);
          setActionMessage('✅ Gemini AI synthesized surgical patch. Review diff, apply locally or publish PR.');
        } catch (remErr: any) {
          console.error('Remediation error:', remErr);
          setActionMessage('⚠️ Security gate blocked push. Select a finding to generate an AI fix.');
        } finally {
          setRemediating(false);
        }
      } else {
        setFindings([]);
        setInterceptionStatus('cleared');
        setActionMessage('✅ Security gate passed: No critical issues detected.');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setActionMessage(`Error during gate check: ${err.message || 'Unknown error'}`);
    } finally {
      setPushIntercepting(false);
    }
  };

  const handleGenerateRemediation = async (finding: Finding) => {
    setSelectedFinding(finding);
    setRemediating(true);
    setActionMessage(`Invoking Google Gemini to remediate ${finding.title}...`);
    try {
      const rem = await remediateFinding(finding.id);
      setActiveRemediation(rem);
      setActionMessage(`✅ Surgical fix synthesized for ${finding.cwe_id || finding.rule_id}! Ready for Pull Request review.`);
    } catch (err: any) {
      setActionMessage(`Remediation generation failed: ${err.message}`);
    } finally {
      setRemediating(false);
    }
  };

  const handleApplyLocalPatch = async () => {
    if (!activeRemediation) return;
    setApplyingLocal(true);
    setActionMessage('Applying AI remediation to local file...');
    try {
      const res = await applyLocalRemediation(activeRemediation.id);
      setActionMessage(`✅ ${res.message}`);
      await loadStagedTestFile();
    } catch (err: any) {
      setActionMessage(`Failed to apply local fix: ${err.message}`);
    } finally {
      setApplyingLocal(false);
    }
  };

  const handleCreateGitHubPR = async () => {
    if (!activeRemediation) return;
    setCreatingPr(true);
    setActionMessage('Connecting to GitHub API to create branch and publish Pull Request...');
    try {
      const pr = await createPullRequest(activeRemediation.id);
      setCreatedPr(pr);
      if (pr.status === 'open' && pr.pr_number) {
        setActionMessage(`🎉 Pull Request #${pr.pr_number} created on GitHub! Ready for review.`);
      } else if (pr.status === 'permission_denied') {
        setActionMessage('⚠️ GitHub Token requires write permissions to create PRs directly.');
      } else {
        setActionMessage(pr.error_message || 'Pull Request status updated.');
      }
    } catch (err: any) {
      setActionMessage(`Failed to create Pull Request: ${err.message}`);
    } finally {
      setCreatingPr(false);
    }
  };

  const totalFindings = scans.reduce((acc, s) => acc + (s.total_findings || 0), 0);
  const repoDetails = typeof githubStatus?.repository === 'object' ? (githubStatus.repository as GitHubRepoDetails) : null;
  const repoFullName = repoDetails?.full_name || (typeof githubStatus?.repository === 'string' ? githubStatus.repository : 'Sachinshekhar82/Shadow-code');
  const targetRepoUrl = repoDetails?.html_url || 'https://github.com/Sachinshekhar82/Shadow-code';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Repository Integration & Security Gate"
        subtitle="Audits Git repositories for automated static analysis, pre-push gate interception, and AI-driven Pull Request generation."
        icon={GitBranch}
        actions={
          <button
            onClick={loadGitHubStatus}
            disabled={loadingGithub}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#162237] hover:bg-[#1E2D4A] border border-[#263449] text-xs font-medium text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loadingGithub ? 'animate-spin' : ''}`} />
            <span>Re-verify Connection</span>
          </button>
        }
      />

      {/* Primary Repository Connection Card */}
      <div className="p-5 rounded-xl bg-[#111B2E] border border-[#263449] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#263449]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#162237] border border-[#263449] flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-[#F8FAFC]">
                  {repoFullName}
                </h2>
                {targetRepoUrl && (
                  <a
                    href={targetRepoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#8190A8] hover:text-cyan-400 transition-colors"
                    title="Open on GitHub"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {loadingGithub ? (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#162237] text-slate-400">
                    Verifying...
                  </span>
                ) : githubStatus?.authenticated ? (
                  <StatusBadge status="connected" />
                ) : (
                  <StatusBadge status="requires_config" />
                )}
              </div>
              <p className="text-xs text-[#A7B3C7] mt-0.5">
                Target Default Branch: <span className="text-[#F8FAFC] font-mono">{repoDetails?.default_branch || 'main'}</span> • Authenticated User: <span className="text-slate-200 font-mono">@{githubStatus?.user || 'Sachinshekhar82'}</span>
              </p>
            </div>
          </div>

          {/* Credential Isolation Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0E1628] border border-[#263449] text-xs">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[#8190A8]">Credentials:</span>
            <span className="text-emerald-300 font-medium font-mono text-[11px]">Isolated in backend (.env)</span>
          </div>
        </div>

        {/* Compact Statistics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-[#0E1628] border border-[#263449]">
            <span className="text-[11px] text-[#8190A8] block uppercase font-medium">Audited Repositories</span>
            <span className="text-lg font-bold text-[#F8FAFC] mt-0.5 block">{repositories.length || 1}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Active monitoring</span>
          </div>

          <div className="p-3 rounded-lg bg-[#0E1628] border border-[#263449]">
            <span className="text-[11px] text-[#8190A8] block uppercase font-medium">Completed Scans</span>
            <span className="text-lg font-bold text-[#F8FAFC] mt-0.5 block">{scans.length}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Dual-engine passes</span>
          </div>

          <div className="p-3 rounded-lg bg-[#0E1628] border border-[#263449]">
            <span className="text-[11px] text-[#8190A8] block uppercase font-medium">Identified Issues</span>
            <span className="text-lg font-bold text-amber-400 mt-0.5 block">{totalFindings}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Requiring remediation</span>
          </div>

          <div className="p-3 rounded-lg bg-[#0E1628] border border-[#263449]">
            <span className="text-[11px] text-[#8190A8] block uppercase font-medium">Repository Access</span>
            <span className="text-xs font-mono font-bold text-emerald-400 mt-1.5 block">Push: Protected • PR: Enabled</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Automated branch creation</span>
          </div>
        </div>
      </div>

      {/* Action Notice Bar */}
      {actionMessage && (
        <div className="p-3.5 rounded-lg bg-[#0E1628] border border-cyan-800/50 flex items-center justify-between text-xs text-cyan-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 animate-pulse" />
            <span>{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-200 text-xs px-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* INTERACTIVE WORKSPACE: Staged File & Security Gate Interceptor */}
      <div className="space-y-6">
        {/* Step 1 Card: Local Staged File Interceptor */}
        <div className="p-5 rounded-xl bg-[#111B2E] border border-[#263449] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#263449]/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#162237] border border-[#263449] flex items-center justify-center text-amber-400">
                <FileWarning className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#F8FAFC]">
                    {stagedFile?.filename || 'vulnerable_api_service.py'}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/40 text-amber-300 border border-amber-800/40 font-semibold">
                    Local Staged Test File
                  </span>
                </div>
                <span className="text-[11px] text-[#8190A8]">
                  Target: <code className="text-slate-300">{repoFullName}</code> (branch: <code className="text-slate-300">main</code>)
                </span>
              </div>
            </div>

            {/* Simulate Push Button */}
            <button
              onClick={handleSimulateGitPush}
              disabled={pushIntercepting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-950/40 transition-all disabled:opacity-50"
            >
              {pushIntercepting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Intercepting Push & Scanning...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Simulate Git Push & Intercept</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-[#A7B3C7] leading-relaxed">
            This local test file contains deliberate security vulnerabilities for DevSecOps testing. Attempting to push this file directly triggers the Shadow-Code pre-push gate, which blocks direct transmission, performs multi-engine static analysis with Semgrep & Bandit, reasons via Google Gemini, and allows publishing an AI-refined Pull Request.
          </p>

          {/* Seeded Vulnerability Tags */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[11px] text-[#8190A8] py-0.5 font-medium">Seeded Test Vectors:</span>
            <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-300 border border-red-800/40 text-[11px] font-mono font-medium">
              CWE-78 Command Injection
            </span>
            <span className="px-2 py-0.5 rounded bg-orange-950/40 text-orange-300 border border-orange-800/40 text-[11px] font-mono font-medium">
              CWE-89 SQL Injection
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40 text-[11px] font-mono font-medium">
              CWE-502 Deserialization (pickle)
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40 text-[11px] font-mono font-medium">
              CWE-798 Hardcoded Secrets
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-800/40 text-[11px] font-mono font-medium">
              CWE-328 Weak MD5 Hash
            </span>
          </div>

          {/* Source Code Viewer */}
          <div className="pt-2">
            <CodeViewer
              code={stagedFile?.content || '# Loading staged file...'}
              filename="vulnerable_api_service.py"
              language="python"
              maxHeight="max-h-64"
            />
          </div>
        </div>

        {/* Step 2: Interception Alert & Detected Vulnerabilities */}
        {interceptionStatus === 'intercepted' && activeScan && (
          <div className="p-5 rounded-xl bg-[#111B2E] border border-red-900/60 space-y-5 animate-in fade-in duration-300">
            {/* Gate Block Banner */}
            <div className="p-4 rounded-lg bg-red-950/30 border border-red-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-900/40 border border-red-700/60 flex items-center justify-center text-red-400 flex-shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-300">
                    ⛔ Git Push Blocked by Shadow-Code Pre-Push Security Gate
                  </h4>
                  <p className="text-xs text-red-200/80 mt-1 leading-relaxed">
                    Direct push to <code className="text-white font-mono">{repoFullName}:main</code> was rejected. Policy blocks pushes containing Critical or High severity security vulnerabilities. Remediate with Google Gemini before publishing a review Pull Request.
                  </p>
                </div>
              </div>

              {/* Severity Breakdown Pills */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-center px-3 py-1.5 rounded bg-[#162237] border border-[#263449]">
                  <span className="text-[10px] uppercase text-[#8190A8] block font-semibold">Critical</span>
                  <span className="text-sm font-bold text-red-400">{activeScan.critical_count}</span>
                </div>
                <div className="text-center px-3 py-1.5 rounded bg-[#162237] border border-[#263449]">
                  <span className="text-[10px] uppercase text-[#8190A8] block font-semibold">High</span>
                  <span className="text-sm font-bold text-amber-400">{activeScan.high_count}</span>
                </div>
                <div className="text-center px-3 py-1.5 rounded bg-[#162237] border border-[#263449]">
                  <span className="text-[10px] uppercase text-[#8190A8] block font-semibold">Medium</span>
                  <span className="text-sm font-bold text-yellow-400">{activeScan.medium_count}</span>
                </div>
                <div className="text-center px-3 py-1.5 rounded bg-[#162237] border border-[#263449]">
                  <span className="text-[10px] uppercase text-[#8190A8] block font-semibold">Total</span>
                  <span className="text-sm font-bold text-[#F8FAFC]">{activeScan.total_findings}</span>
                </div>
              </div>
            </div>

            {/* Findings List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                  Identified Security Risks & CWE Classifications
                </h4>
                <span className="text-[11px] text-[#8190A8]">
                  Scanned via: {activeScan.scanners_run?.join(' + ') || 'Semgrep + Bandit'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {findings.map(finding => {
                  const isSelected = selectedFinding?.id === finding.id;
                  return (
                    <div
                      key={finding.id}
                      onClick={() => setSelectedFinding(finding)}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#162237] border-cyan-500/70 shadow-md shadow-cyan-950/20'
                          : 'bg-[#0E1628] border-[#263449] hover:border-slate-600'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <SeverityBadge severity={finding.severity} />
                          <span className="text-xs font-bold text-[#F8FAFC]">
                            {finding.title}
                          </span>
                          {finding.cwe_id && (
                            <span className="px-1.5 py-0.5 rounded bg-[#111B2E] text-slate-300 font-mono text-[10px] border border-[#263449]">
                              {finding.cwe_id}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-400">
                            Lines {finding.line_start}-{finding.line_end}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateRemediation(finding);
                            }}
                            disabled={remediating && isSelected}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1E2D4A] hover:bg-cyan-600 hover:text-white border border-cyan-700/50 text-[11px] font-medium text-cyan-300 transition-colors"
                          >
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span>Remediate with Gemini</span>
                          </button>
                        </div>
                      </div>

                      {finding.evidence && (
                        <div className="mt-2 p-2 rounded bg-[#0A0F1D] font-mono text-[11px] text-red-300/90 truncate border border-red-950">
                          {finding.evidence}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Google Gemini AI Remediation & Unified Diff */}
        {activeRemediation && (
          <div className="p-5 rounded-xl bg-[#111B2E] border border-cyan-800/60 space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#263449]/70">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#F8FAFC]">
                      Google Gemini AI Surgical Remediation
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      AST Syntax Validated
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8190A8]">
                    Remediating file: <code className="text-slate-300">{activeRemediation.file_path || 'vulnerable_api_service.py'}</code>
                  </span>
                </div>
              </div>

              {/* Action Buttons: Apply Locally or Create PR */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleApplyLocalPatch}
                  disabled={applyingLocal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#162237] hover:bg-[#1E2D4A] border border-[#263449] text-slate-200 font-medium text-xs transition-all disabled:opacity-50"
                  title="Apply secure fix directly to local vulnerable_api_service.py file"
                >
                  {applyingLocal ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      <span>Applying...</span>
                    </>
                  ) : (
                    <>
                      <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Apply Fix Locally</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCreateGitHubPR}
                  disabled={creatingPr}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
                >
                  {creatingPr ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting to GitHub...</span>
                    </>
                  ) : (
                    <>
                      <GitPullRequest className="w-3.5 h-3.5" />
                      <span>Create GitHub PR for Review</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Explanation */}
            <div className="p-3.5 rounded-lg bg-[#0E1628] border border-[#263449] space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block">
                Security Rationale & Fix Details
              </span>
              <p className="text-xs text-[#A7B3C7] leading-relaxed">
                {activeRemediation.explanation}
              </p>
              {activeRemediation.security_rationale && (
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  CWE Reference: {activeRemediation.security_rationale}
                </p>
              )}
            </div>

            {/* Diff Viewer */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-[#8190A8] uppercase tracking-wider block">
                Unified Remediation Diff (Vulnerable Original vs. AI Refined Code)
              </span>
              <DiffViewer diff={activeRemediation.diff} />
            </div>
          </div>
        )}

        {/* Step 4: GitHub Pull Request Status & Review Trigger */}
        {createdPr && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {createdPr.status === 'open' && createdPr.pr_number ? (
              // Successful PR Created
              <div className="p-5 rounded-xl bg-[#0E1628] border border-emerald-500/70 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-600/50 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-emerald-300">
                          Pull Request Published to GitHub!
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-semibold">
                          PR #{createdPr.pr_number} Ready for Review
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Branch: <code className="text-cyan-300 font-mono">{createdPr.branch_name}</code> → <code className="text-slate-300 font-mono">main</code>
                      </p>
                    </div>
                  </div>

                  {createdPr.pr_url && (
                    <a
                      href={createdPr.pr_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-950/40 transition-colors flex-shrink-0"
                    >
                      <span>Open & Review PR on GitHub</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="p-3.5 rounded-lg bg-[#111B2E] border border-[#263449] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#F8FAFC]">
                      {createdPr.pr_title}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400">
                      Status: Open for Human Review
                    </span>
                  </div>
                  <p className="text-xs text-[#A7B3C7] leading-relaxed whitespace-pre-wrap">
                    {createdPr.pr_body}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    The AI-refined code is staged on GitHub for review. Once you approve the Pull Request on GitHub, it will be automatically merged into <code className="text-slate-200">main</code>.
                  </span>
                </div>
              </div>
            ) : (
              // GitHub Token Permission Required Banner (Handles 403 / Missing Permissions)
              <div className="p-5 rounded-xl bg-[#131B2E] border border-amber-600/70 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-950/60 border border-amber-600/50 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-amber-300">
                        GitHub Token Write Permissions Required
                      </h3>
                      <p className="text-xs text-amber-200/90 leading-relaxed">
                        {createdPr.error_message || "GitHub rejected branch and Pull Request creation (403 Forbidden)."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handleApplyLocalPatch}
                      disabled={applyingLocal}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Fix Locally Now</span>
                    </button>
                    {createdPr.pr_url && (
                      <a
                        href={createdPr.pr_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#162237] hover:bg-[#1E2D4A] border border-[#263449] text-xs font-medium text-slate-200 transition-colors"
                      >
                        <span>View Repo Pulls</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Clear Instruction Card */}
                <div className="p-4 rounded-lg bg-[#0E1628] border border-[#263449] space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2 font-semibold text-slate-200">
                    <Info className="w-4 h-4 text-cyan-400" />
                    <span>How to enable automated GitHub branch and Pull Request creation:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-400 text-[12px] leading-relaxed">
                    <li>
                      Go to GitHub:{' '}
                      <a
                        href="https://github.com/settings/tokens"
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 underline hover:text-cyan-300 font-mono"
                      >
                        github.com/settings/tokens
                      </a>{' '}
                      (Personal access tokens).
                    </li>
                    <li>
                      If using a <strong className="text-slate-200">Fine-grained token</strong>, edit your token and grant under <strong className="text-slate-200">Repository permissions</strong>:
                      <div className="flex items-center gap-2 mt-1 ml-4 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-[#162237] text-emerald-300 border border-emerald-800/40">Contents: Read and write</span>
                        <span className="px-2 py-0.5 rounded bg-[#162237] text-emerald-300 border border-emerald-800/40">Pull requests: Read and write</span>
                      </div>
                    </li>
                    <li>
                      <em className="text-slate-300">Alternatively:</em> Generate a <strong className="text-slate-200">Classic Token</strong> with the <code className="text-cyan-300 font-mono">repo</code> scope checked.
                    </li>
                    <li>
                      Update <code className="text-slate-200 font-mono">GITHUB_TOKEN</code> in <code className="text-slate-200 font-mono">backend/.env</code>.
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
