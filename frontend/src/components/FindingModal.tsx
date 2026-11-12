import React, { useState } from 'react';
import { X, ExternalLink, ShieldAlert, CheckCircle2, RotateCcw, AlertTriangle, Cpu, Terminal, ArrowRight } from 'lucide-react';
import { Finding } from '../types';
import { SeverityBadge, StatusBadge } from './SeverityBadge';
import { DiffViewer } from './DiffViewer';

interface FindingModalProps {
  finding: Finding | null;
  onClose: () => void;
  onFeedback: (findingId: string, decision: string, reason: string) => Promise<void>;
  onNavigateToRemediation?: (finding: Finding) => void;
}

export const FindingModal: React.FC<FindingModalProps> = ({
  finding,
  onClose,
  onFeedback,
  onNavigateToRemediation
}) => {
  if (!finding) return null;

  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const handleAction = async (decision: string) => {
    if (decision === 'overridden' && !showOverrideInput) {
      setShowOverrideInput(true);
      return;
    }
    setLoading(true);
    try {
      await onFeedback(finding.id, decision, overrideReason);
      setFeedbackSuccess(`Feedback logged: ${decision.toUpperCase()}`);
      setTimeout(() => {
        setFeedbackSuccess(null);
        onClose();
      }, 1200);
    } catch (err) {
      alert('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#111B2E] border border-[#263449] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#263449] flex items-start justify-between bg-[#0E1628]">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={finding.severity} score={finding.numeric_score} />
              <StatusBadge status={finding.status || 'open'} />
              <span className="text-[11px] font-mono text-cyan-400 bg-[#162237] px-2 py-0.5 rounded border border-[#263449]">
                {finding.rule_id}
              </span>
              <span className="text-xs text-[#8190A8] font-mono">
                {finding.file_path}:{finding.line_start}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#F8FAFC]">
              {finding.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8190A8] hover:text-white rounded-lg hover:bg-[#162237] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs text-slate-200">
          {feedbackSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{feedbackSuccess} — Recorded in continuous feedback engine.</span>
            </div>
          )}

          {/* Severity Rationale & Details */}
          <div className="p-4 rounded-lg bg-[#0E1628] border border-[#263449] space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Severity Assessment & Context
            </h3>
            <p className="text-[#A7B3C7] text-xs leading-relaxed">
              {finding.severity_rationale || finding.description}
            </p>
            <div className="pt-2 border-t border-[#263449]/70 flex flex-wrap gap-4 text-xs text-[#8190A8]">
              <div>Engine: <span className="text-slate-200 font-mono">{finding.detection_source || finding.scanner || 'Semgrep'}</span></div>
              {finding.cwe_id && <div>CWE: <span className="text-slate-200 font-mono">{finding.cwe_id}</span></div>}
              {finding.cve_id && (
                <div className="flex items-center gap-1">
                  CVE: <span className="text-amber-400 font-mono">{finding.cve_id}</span>
                  <a
                    href={`https://nvd.nist.gov/vuln/detail/${finding.cve_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3 inline ml-0.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Vulnerable Code Snippet */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8190A8] flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              Vulnerable Code Snippet (Lines {finding.line_start} - {finding.line_end})
            </h3>
            <pre className="p-3.5 rounded-lg bg-[#0A0F1D] border border-[#263449] font-mono text-xs text-red-300 overflow-x-auto leading-relaxed">
              <code>{finding.code_snippet || finding.evidence || '# No snippet captured'}</code>
            </pre>
          </div>

          {/* Impact & Recommendation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-lg bg-[#0E1628] border border-[#263449] space-y-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                Potential Security Impact
              </h4>
              <p className="text-xs text-[#A7B3C7] leading-relaxed">
                {finding.business_impact || 'Potential unauthorized access, data alteration or arbitrary code execution.'}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-[#0E1628] border border-[#263449] space-y-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Recommended Remediation
              </h4>
              <p className="text-xs text-[#A7B3C7] leading-relaxed">
                {finding.recommended_action || 'Refactor code to sanitize untrusted input and apply parameterized calls.'}
              </p>
            </div>
          </div>

          {/* Remediation Preview if available */}
          {finding.remediation && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                Synthesized Remediation Patch
              </h3>
              <DiffViewer diff={finding.remediation.diff} />
            </div>
          )}

          {/* Override Reason Input */}
          {showOverrideInput && (
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2">
              <label className="text-xs font-semibold text-amber-300">
                Provide Override Justification (Logged to audit trail):
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Verified test fixture; mitigated by upstream cloud WAF..."
                className="w-full bg-[#0A0F1D] border border-[#263449] rounded-lg p-2.5 text-xs text-white placeholder-[#8190A8] focus:outline-none focus:border-cyan-400"
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowOverrideInput(false)}
                  className="px-3 py-1 text-xs text-[#8190A8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleAction('overridden')}
                  className="px-3 py-1 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition-colors"
                >
                  Confirm Override
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-[#263449] bg-[#0E1628] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              disabled={loading}
              onClick={() => handleAction('accepted')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#162237] hover:bg-[#1E2D4A] text-slate-200 border border-[#263449] transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Accept</span>
            </button>
            <button
              disabled={loading}
              onClick={() => handleAction('overridden')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#162237] hover:bg-[#1E2D4A] text-slate-200 border border-[#263449] transition-colors flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Override</span>
            </button>
            <button
              disabled={loading}
              onClick={() => handleAction('false_positive')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#162237] hover:bg-[#1E2D4A] text-slate-200 border border-[#263449] transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
              <span>False Positive</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {finding.remediation && onNavigateToRemediation && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToRemediation(finding);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-colors flex items-center gap-1.5"
              >
                <span>Open in Remediation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-[#162237] hover:bg-[#1E2D4A] text-slate-300 transition-colors border border-[#263449]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
