import React, { useState } from 'react';
import {
  Search,
  Filter,
  Bug,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  FileCode
} from 'lucide-react';
import { Finding } from '../types';
import { SeverityBadge, StatusBadge } from '../components/SeverityBadge';

interface FindingsPageProps {
  findings: Finding[];
  onOpenFinding: (finding: Finding) => void;
  onNavigateToRemediation: (finding: Finding) => void;
  onFeedback: (findingId: string, decision: string, reason: string) => Promise<void>;
}

export const FindingsPage: React.FC<FindingsPageProps> = ({
  findings,
  onOpenFinding,
  onNavigateToRemediation,
  onFeedback
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = findings.filter((f) => {
    if (severityFilter !== 'all' && f.severity.toLowerCase() !== severityFilter.toLowerCase()) {
      return false;
    }
    if (statusFilter !== 'all' && f.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitle = f.title.toLowerCase().includes(term);
      const matchDesc = f.description.toLowerCase().includes(term);
      const matchRule = f.rule_id.toLowerCase().includes(term);
      const matchCve = f.cve_id?.toLowerCase().includes(term);
      const matchCwe = f.cwe_id?.toLowerCase().includes(term);
      if (!matchTitle && !matchDesc && !matchRule && !matchCve && !matchCwe) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bug className="w-5 h-5 text-cyan-400" />
            Vulnerability Findings Explorer
          </h1>
          <p className="text-xs text-cyber-muted">
            Inspect, filter, and triage security findings detected across repository commits. Mark findings as accepted, overridden, or false-positives to train Agent 8.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-cyber-muted font-mono">
            Showing {filtered.length} of {findings.length} findings
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-cyber-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, rule ID, CWE, or CVE..."
            className="w-full bg-[#0d1424] border border-cyber-border rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Severity Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-cyber-muted flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Severity:
          </label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#0d1424] border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical (9.0+)</option>
            <option value="high">High (7.0 - 8.9)</option>
            <option value="medium">Medium (4.0 - 6.9)</option>
            <option value="low">Low (0.1 - 3.9)</option>
          </select>
        </div>

        {/* Status Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-cyber-muted">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0d1424] border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="accepted">Accepted</option>
            <option value="overridden">Overridden</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
          </select>
        </div>
      </div>

      {/* Findings Table */}
      <div className="rounded-xl border border-cyber-border bg-cyber-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1527] text-cyber-muted border-b border-cyber-border font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Severity / Score</th>
                <th className="py-3 px-4">Rule & Title</th>
                <th className="py-3 px-4">CWE / CVE</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/40 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-cyber-muted">
                    No findings matched your current filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((finding) => (
                  <tr
                    key={finding.id}
                    className="hover:bg-[#121c32]/50 transition-colors cursor-pointer"
                    onClick={() => onOpenFinding(finding)}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SeverityBadge severity={finding.severity} score={finding.numeric_score} />
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-mono text-cyan-400 font-bold text-[11px] mb-0.5">
                        {finding.rule_id}
                      </div>
                      <div className="font-semibold text-white truncate">{finding.title}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-300 font-mono text-[11px]">{finding.cwe_id || 'N/A'}</div>
                      {finding.cve_id && (
                        <div className="text-amber-400 font-mono text-[10px] flex items-center gap-0.5">
                          {finding.cve_id}
                          <ExternalLink className="w-2.5 h-2.5 inline" />
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-cyber-muted">
                      {finding.file_path}:{finding.line_start}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-400">
                      {finding.detection_source}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={finding.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenFinding(finding)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-cyber-border transition-colors"
                        >
                          Details
                        </button>
                        {finding.remediation && (
                          <button
                            onClick={() => onNavigateToRemediation(finding)}
                            className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-[11px] font-medium border border-cyan-500/30 transition-colors"
                          >
                            Remediate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
