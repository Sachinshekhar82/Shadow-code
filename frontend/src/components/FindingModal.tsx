import React, { useState } from 'react';
import { X, ExternalLink, ShieldAlert, CheckCircle2, RotateCcw, AlertTriangle, Cpu, Terminal } from 'lucide-react';
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
      setFeedbackSuccess(`Decision recorded: ${decision.toUpperCase()}`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-cyber-card border border-cyber-border rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-cyber-border flex items-start justify-between bg-[#131b2e]/60">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <SeverityBadge severity={finding.severity} score={finding.numeric_score} />
              <StatusBadge status={finding.status} />
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                {finding.rule_id}
              </span>
              <span className="text-xs text-cyber-muted">
                {finding.file_path}:{finding.line_start}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {finding.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-cyber-muted hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300">
          {feedbackSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {feedbackSuccess} — Recorded in Adaptive Memory!
            </div>
          )}

          {/* Severity Rationale & Score Vector */}
          <div className="p-4 rounded-lg bg-[#0e1626] border border-cyber-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              CVSS v3.1 Context & Severity Rationale
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              {finding.severity_rationale || finding.description}
            </p>
            <div className="mt-2 pt-2 border-t border-cyber-border/40 flex flex-wrap gap-4 text-xs text-cyber-muted">
              <div>Detection Source: <span className="text-cyan-300">{finding.detection_source}</span></div>
              {finding.cwe_id && <div>CWE: <span className="text-slate-200">{finding.cwe_id}</span></div>}
              {finding.cve_id && (
                <div className="flex items-center gap-1">
                  CVE: <span className="text-amber-400 font-semibold">{finding.cve_id}</span>
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

          {/* Evidence Code Snippet */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              Vulnerable Code Snippet (Line {finding.line_start} - {finding.line_end})
            </h3>
            <pre className="p-4 rounded-lg bg-[#070b14] border border-cyber-border font-mono text-xs text-red-300 overflow-x-auto">
              <code>{finding.code_snippet || '# No snippet captured'}</code>
            </pre>
          </div>

          {/* Business Impact & Remediation Recommendation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#111a2f] border border-cyber-border">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1">
                Potential Security Impact
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {finding.business_impact || 'Potential unauthorized access, data alteration or code execution.'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#111a2f] border border-cyber-border">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                Recommended Action
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {finding.recommended_action || 'Refactor code to sanitize input and apply defense-in-depth principles.'}
              </p>
            </div>
          </div>

          {/* Remediation Preview if available */}
          {finding.remediation && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                The Surgeon: Synthesized Remediation Patch
              </h3>
              <DiffViewer diff={finding.remediation.diff} />
              <p className="text-xs text-cyber-muted mt-2">
                Validation status: <span className="text-emerald-400">{finding.remediation.validation_message}</span>
              </p>
            </div>
          )}

          {/* Override Reason Input */}
          {showOverrideInput && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2">
              <label className="text-xs font-semibold text-amber-400">
                Provide Override Justification (Stored in Adaptive Memory):
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Test mock input; mitigated by upstream cloud WAF; legacy internal script..."
                className="w-full bg-[#0d1424] border border-cyber-border rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowOverrideInput(false)}
                  className="px-3 py-1 text-xs text-cyber-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleAction('overridden')}
                  className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-black rounded-lg transition-colors"
                >
                  Confirm Override
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-cyber-border bg-[#101728] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              disabled={loading}
              onClick={() => handleAction('accepted')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Accept Finding
            </button>
            <button
              disabled={loading}
              onClick={() => handleAction('overridden')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Override Warning
            </button>
            <button
              disabled={loading}
              onClick={() => handleAction('false_positive')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> False Positive
            </button>
          </div>

          <div className="flex items-center gap-2">
            {finding.remediation && onNavigateToRemediation && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToRemediation(finding);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black transition-colors"
              >
                Open in Surgeon Workspace →
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
