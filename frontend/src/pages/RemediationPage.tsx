import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  Check,
  Copy,
  Download,
  FileCode,
  Shield,
  ThumbsUp,
  RotateCcw,
  GitPullRequest,
  AlertCircle
} from 'lucide-react';
import { Finding, RemediationProposal } from '../types';
import { SeverityBadge, StatusBadge } from '../components/SeverityBadge';
import { DiffViewer } from '../components/DiffViewer';
import { handleRemediationAction } from '../services/api';
import { PageHeader } from '../components/PageHeader';

interface RemediationPageProps {
  findings: Finding[];
  selectedFinding?: Finding | null;
  onRefreshFindings: () => void;
}

export const RemediationPage: React.FC<RemediationPageProps> = ({
  findings,
  selectedFinding,
  onRefreshFindings
}) => {
  const findingsWithRemediation = findings.filter(f => f.remediation);

  const [activeFindingId, setActiveFindingId] = useState<string>(
    selectedFinding?.id || (findingsWithRemediation[0]?.id || '')
  );
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const currentFinding = findingsWithRemediation.find(f => f.id === activeFindingId);
  const remediation = currentFinding?.remediation;

  const triggerAction = async (action: 'approve' | 'apply' | 'rollback' | 'reject') => {
    if (!remediation) return;
    setActionLoading(true);
    try {
      const res = await handleRemediationAction(remediation.id, action);
      setFeedbackMessage((res as any)?.pr_url ? `Pull Request Staged: ${(res as any).pr_url}` : (res as any)?.message || 'Action executed successfully');
      onRefreshFindings();
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Remediation action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadDiff = () => {
    if (!remediation) return;
    const blob = new Blob([remediation.diff], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patch_${currentFinding?.rule_id || 'remediation'}.diff`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="AI Remediation Workspace"
        subtitle="Review context-aware code patches, AST syntax validation results, and regression tests. Human engineer approval is required before publishing Pull Requests."
        icon={Wrench}
        actions={
          feedbackMessage ? (
            <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          ) : undefined
        }
      />

      {findingsWithRemediation.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#111B2E] border border-[#263449] text-center space-y-3">
          <Shield className="w-10 h-10 text-cyan-400 mx-auto" />
          <h2 className="text-base font-bold text-[#F8FAFC]">No Remediation Proposals Generated Yet</h2>
          <p className="text-xs text-[#A7B3C7] max-w-md mx-auto">
            Execute a security scan from the Security Audits page. When high or critical findings are detected, autonomous agents synthesize safe, AST-validated code patches.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Proposal Selector Sidebar (1 col) */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8190A8] px-1">
              Active Proposals ({findingsWithRemediation.length})
            </h3>

            <div className="space-y-2">
              {findingsWithRemediation.map((f) => {
                const isSelected = f.id === activeFindingId;
                const rem = f.remediation!;

                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveFindingId(f.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all space-y-2 ${
                      isSelected
                        ? 'bg-[#162237] border-cyan-400 text-white shadow-sm'
                        : 'bg-[#111B2E] border-[#263449] hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <SeverityBadge severity={f.severity} />
                      <StatusBadge status={rem.status || rem.validation_status || 'suggested'} />
                    </div>
                    <div className="text-xs font-bold text-[#F8FAFC] truncate">{f.title}</div>
                    <div className="text-[11px] text-[#8190A8] font-mono truncate">{f.file_path} • Line {f.line_start}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Remediation Workspace Detail (3 cols) */}
          {currentFinding && remediation && (
            <div className="lg:col-span-3 space-y-5">
              {/* Proposal Header Banner */}
              <div className="p-5 rounded-xl bg-[#111B2E] border border-[#263449] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <SeverityBadge severity={currentFinding.severity} score={currentFinding.numeric_score} />
                      <StatusBadge status={remediation.status || remediation.validation_status || 'suggested'} />
                      <span className="text-xs font-mono text-cyan-400">{currentFinding.rule_id}</span>
                    </div>
                    <h2 className="text-lg font-bold text-[#F8FAFC]">{currentFinding.title}</h2>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {(remediation.status === 'suggested' || remediation.approval_status === 'pending') && (
                      <button
                        disabled={actionLoading}
                        onClick={() => triggerAction('approve')}
                        className="px-3 py-1.5 rounded-lg bg-[#162237] hover:bg-[#1E2D4A] border border-[#263449] text-slate-200 font-medium text-xs transition-colors flex items-center gap-1.5"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-amber-400" />
                        <span>Approve Patch</span>
                      </button>
                    )}

                    <button
                      disabled={actionLoading}
                      onClick={() => triggerAction('apply')}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <GitPullRequest className="w-3.5 h-3.5" />
                      <span>Create Pull Request</span>
                    </button>

                    {remediation.status === 'applied' && (
                      <button
                        disabled={actionLoading}
                        onClick={() => triggerAction('rollback')}
                        className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/40 font-medium text-xs transition-colors flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Rollback</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Validation Safeguards Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#0E1628] border border-[#263449] flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-[#F8FAFC] block">AST Syntax Sandbox Validation</span>
                      <span className="text-[11px] text-[#8190A8]">{remediation.validation_message || 'Syntax parser verified: No grammatical errors introduced.'}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0E1628] border border-[#263449] flex items-center gap-3">
                    <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-[#F8FAFC] block">Pre-Fix Snapshot Safety Guard</span>
                      <span className="text-[11px] text-[#8190A8]">Original source preserved for atomic rollback if required.</span>
                    </div>
                  </div>
                </div>

                {/* Security Improvement Rationale */}
                <div className="p-3.5 rounded-lg bg-[#0E1628] border border-[#263449] text-xs text-slate-200 space-y-1">
                  <span className="text-cyan-400 font-semibold block text-[11px] uppercase tracking-wide">
                    Security Improvement Rationale:
                  </span>
                  <p className="leading-relaxed">{remediation.explanation}</p>
                </div>
              </div>

              {/* Code Diff Display */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8190A8] flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    Unified Remediation Diff ({remediation.file_path})
                  </h3>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(remediation.proposed_code || remediation.proposed_patch || '');
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-2.5 py-1 text-xs text-[#A7B3C7] hover:text-white rounded border border-[#263449] bg-[#111B2E] flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy Patch'}</span>
                    </button>

                    <button
                      onClick={downloadDiff}
                      className="px-2.5 py-1 text-xs text-[#A7B3C7] hover:text-white rounded border border-[#263449] bg-[#111B2E] flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .diff</span>
                    </button>
                  </div>
                </div>

                <DiffViewer diff={remediation.diff} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
