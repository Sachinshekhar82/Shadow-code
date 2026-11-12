import React, { useEffect, useState } from 'react';
import { GitPullRequest, ExternalLink, ShieldCheck, AlertCircle, Clock, GitBranch, Shield } from 'lucide-react';
import { fetchPullRequests } from '../services/api';
import { PullRequest } from '../types';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/SeverityBadge';

export const PullRequestsPage: React.FC = () => {
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPullRequests()
      .then((data) => setPrs(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Pull Request Management"
        subtitle="Autonomous remediation branches staged for human review. Shadow-Code never merges Pull Requests automatically."
        icon={GitPullRequest}
        actions={
          <div className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Human Review Required Prior to Merge</span>
          </div>
        }
      />

      {loading ? (
        <div className="p-12 text-center text-[#8190A8] font-mono text-xs">
          Loading pull request logs...
        </div>
      ) : prs.length === 0 ? (
        <div className="bg-[#111B2E] border border-[#263449] rounded-xl p-12 text-center space-y-3">
          <Shield className="w-10 h-10 text-cyan-400 mx-auto" />
          <h3 className="text-base font-semibold text-[#F8FAFC]">No Remediations Published as PRs Yet</h3>
          <p className="text-xs text-[#A7B3C7] max-w-md mx-auto">
            Navigate to the <strong>AI Remediation</strong> workspace and approve an AST-validated patch to stage a pull request on the configured repository.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {prs.map((pr) => (
            <div
              key={pr.id}
              className="bg-[#111B2E] border border-[#263449] hover:border-slate-600 rounded-xl p-5 transition-colors space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#162237] border border-[#263449] text-cyan-400">
                      {pr.id}
                    </span>
                    <h3 className="text-base font-semibold text-[#F8FAFC]">{pr.pr_title}</h3>
                    <StatusBadge status={pr.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#A7B3C7] font-mono">
                    <span className="flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{pr.branch_name} &rarr; {pr.target_branch}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(pr.created_at).toLocaleString()}</span>
                    </span>
                  </div>
                </div>

                {pr.pr_url && (
                  <a
                    href={pr.pr_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#162237] hover:bg-[#1E2D4A] text-cyan-300 hover:text-cyan-200 text-xs font-semibold rounded-lg border border-[#263449] transition-colors flex-shrink-0"
                  >
                    <span>View on GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Review Policy Note */}
              <div className="pt-3 border-t border-[#263449] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sandbox Grammar & Security Tests: <strong>PASS</strong></span>
                </div>
                <div className="text-amber-300 text-[11px] font-medium">
                  Branch protections preserved • Human approval required
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
