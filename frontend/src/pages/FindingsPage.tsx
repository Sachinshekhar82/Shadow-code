import React, { useState } from 'react';
import {
  Search,
  Filter,
  Bug,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Finding } from '../types';
import { SeverityBadge, StatusBadge } from '../components/SeverityBadge';
import { PageHeader } from '../components/PageHeader';

interface FindingsPageProps {
  findings: Finding[];
  onOpenFinding: (finding: Finding) => void;
  onNavigateToRemediation: (finding: Finding) => void;
  onFeedback: (findingId: string, decision: string, reason: string) => Promise<void>;
}

export const FindingsPage: React.FC<FindingsPageProps> = ({
  findings,
  onOpenFinding,
  onNavigateToRemediation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = findings.filter((f) => {
    if (severityFilter !== 'all' && f.severity.toLowerCase() !== severityFilter.toLowerCase()) {
      return false;
    }
    if (statusFilter !== 'all' && (f.status || f.remediation_status || 'open').toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitle = f.title.toLowerCase().includes(term);
      const matchDesc = f.description.toLowerCase().includes(term);
      const matchRule = f.rule_id.toLowerCase().includes(term);
      const matchCve = (f.cve_id || f.cwe_id || '').toLowerCase().includes(term);
      const matchCwe = f.cwe_id?.toLowerCase().includes(term);
      const matchPath = f.file_path?.toLowerCase().includes(term);
      if (!matchTitle && !matchDesc && !matchRule && !matchCve && !matchCwe && !matchPath) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Vulnerability Explorer"
        subtitle="Normalized security findings aggregated across static analysis engines (Semgrep, Bandit) and contextual AI reasoning."
        icon={Bug}
        actions={
          <span className="text-xs text-[#8190A8] font-mono px-3 py-1.5 rounded-lg bg-[#111B2E] border border-[#263449]">
            Showing <strong className="text-white">{filtered.length}</strong> of {findings.length} findings
          </span>
        }
      />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#111B2E] border border-[#263449] flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-[#8190A8] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, rule ID, file path, CWE, or CVE..."
            className="w-full bg-[#0A0F1D] border border-[#263449] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#8190A8] focus:outline-none focus:border-cyan-400 font-sans"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#8190A8] flex items-center gap-1 font-medium">
              <Filter className="w-3.5 h-3.5" /> Severity:
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[#0A0F1D] border border-[#263449] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-[#8190A8] font-medium">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0A0F1D] border border-[#263449] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="remediated">Remediated</option>
              <option value="accepted">Accepted</option>
              <option value="false_positive">False Positive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Findings Table */}
      <div className="rounded-xl border border-[#263449] bg-[#111B2E] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0E1628] text-[#8190A8] border-b border-[#263449] font-mono uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Vulnerability & Rule</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">File Location</th>
                <th className="py-3 px-4">Detection Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263449]/60 text-slate-200 bg-[#111B2E]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8190A8]">
                    No security findings matched the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((finding) => (
                  <tr
                    key={finding.id}
                    className="hover:bg-[#162237] transition-colors cursor-pointer"
                    onClick={() => onOpenFinding(finding)}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SeverityBadge severity={finding.severity} score={finding.numeric_score} />
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-[#F8FAFC] truncate mb-0.5">{finding.title}</div>
                      <div className="font-mono text-slate-400 text-[11px] truncate">
                        {finding.rule_id}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-300 font-mono text-[11px]">{finding.cwe_id || 'N/A'}</div>
                      {finding.cve_id && (
                        <div className="text-amber-400 font-mono text-[10px] flex items-center gap-0.5 mt-0.5">
                          {finding.cve_id}
                          <ExternalLink className="w-2.5 h-2.5 inline" />
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-[#A7B3C7]">
                      {finding.file_path}:{finding.line_start}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-[#8190A8] capitalize">
                      {finding.detection_source || finding.scanner || 'semgrep'}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={finding.status || finding.remediation_status || 'open'} />
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenFinding(finding)}
                          className="px-2.5 py-1 rounded bg-[#162237] hover:bg-[#1E2D4A] hover:text-white text-slate-300 text-[11px] font-medium border border-[#263449] transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => onNavigateToRemediation(finding)}
                          className="px-2.5 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 text-[11px] font-medium border border-cyan-800/40 transition-colors flex items-center gap-1"
                        >
                          <span>Remediate</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
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
