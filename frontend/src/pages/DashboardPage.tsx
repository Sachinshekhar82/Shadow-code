import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Clock,
  Play,
  Flame,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Activity,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { Scan, Finding, TrendItem } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { NavTab } from '../components/Sidebar';
import { fetchAnalyticsTrends } from '../services/api';
import { MetricCard } from '../components/MetricCard';

interface DashboardPageProps {
  scans: Scan[];
  findings: Finding[];
  onSelectScan: (scan: Scan) => void;
  onOpenFinding: (finding: Finding) => void;
  onNavigate: (tab: NavTab) => void;
  onRunDemo: () => void;
  isRunningDemo: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  scans,
  findings,
  onSelectScan,
  onOpenFinding,
  onNavigate,
  onRunDemo,
  isRunningDemo
}) => {
  const [trends, setTrends] = useState<TrendItem[]>([]);

  useEffect(() => {
    fetchAnalyticsTrends()
      .then((data) => setTrends(data.trends))
      .catch(() => {
        setTrends([
          { scan_id: 's1', date: 'Baseline', critical: 1, high: 2, medium: 2, low: 2, total: 7 },
        ]);
      });
  }, [scans]);

  const totalScans = scans.length;
  const totalFindings = findings.length;
  const criticalCount = findings.filter(f => f.severity.toUpperCase() === 'CRITICAL').length;
  const highCount = findings.filter(f => f.severity.toUpperCase() === 'HIGH').length;
  const mediumCount = findings.filter(f => f.severity.toUpperCase() === 'MEDIUM').length;
  const lowCount = findings.filter(f => ['LOW', 'INFO'].includes(f.severity.toUpperCase())).length;

  // Documented formula: Score = max(0, 100 - (Crit*25 + High*10 + Med*3 + Low*1))
  const penalty = (criticalCount * 25) + (highCount * 10) + (mediumCount * 3) + (lowCount * 1);
  const healthScore = Math.max(0, Math.min(100, 100 - penalty));

  const recentFindings = findings.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="p-5 rounded-xl bg-[#111B2E] border border-[#263449] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-[11px] font-semibold text-slate-300 tracking-wider uppercase font-mono">
              Continuous SDLC Gate Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F8FAFC]">
            Security Posture & Compliance Dashboard
          </h1>
          <p className="text-xs text-[#A7B3C7] max-w-2xl leading-relaxed">
            Multi-engine static analysis (Semgrep & Bandit) correlated with contextual AI vulnerability reasoning and AST-verified sandbox patch synthesis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('scanner')}
            className="px-3.5 py-2 rounded-lg bg-[#162237] hover:bg-[#1E2D4A] text-slate-200 text-xs font-medium border border-[#263449] transition-colors flex items-center gap-2"
          >
            <span>Audit Workspace</span>
          </button>
          <button
            onClick={onRunDemo}
            disabled={isRunningDemo}
            className="px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunningDemo ? 'Auditing Codebase...' : 'Execute Security Scan'}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          label="Health Score"
          value={`${healthScore.toFixed(0)}/100`}
          subtext="Formula: 100 - deductions"
          icon={ShieldCheck}
          variant={healthScore >= 70 ? 'success' : healthScore >= 40 ? 'medium' : 'critical'}
        />

        <MetricCard
          label="Total Scans"
          value={totalScans}
          subtext="Continuous monitoring"
          icon={Clock}
        />

        <MetricCard
          label="Open Findings"
          value={totalFindings}
          subtext={`${criticalCount + highCount} high-risk issues`}
          icon={ShieldAlert}
          variant={totalFindings > 0 ? 'medium' : 'success'}
        />

        <MetricCard
          label="Critical"
          value={criticalCount}
          subtext="Immediate merge block"
          icon={Flame}
          variant={criticalCount > 0 ? 'critical' : 'default'}
        />

        <MetricCard
          label="High Severity"
          value={highCount}
          subtext="Remediation required"
          icon={AlertTriangle}
          variant={highCount > 0 ? 'high' : 'default'}
        />

        <MetricCard
          label="Medium & Low"
          value={mediumCount + lowCount}
          subtext="Policy review pending"
          icon={ShieldAlert}
          variant={mediumCount > 0 ? 'low' : 'default'}
        />
      </div>

      {/* Analytics Trend Chart & Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart (Recharts) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#111B2E] border border-[#263449] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Vulnerability Trends Over Audit Scans
            </h3>
            <span className="text-xs text-[#8190A8] font-mono">Historical Evolution</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCrit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F87171" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#F87171" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2B3E" />
                <XAxis dataKey="date" stroke="#8190A8" fontSize={11} />
                <YAxis stroke="#8190A8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D1422', borderColor: '#263449', borderRadius: '8px', fontSize: '12px', color: '#F8FAFC' }}
                />
                <Area type="monotone" dataKey="total" stroke="#22D3EE" fillOpacity={1} fill="url(#colorTotal)" name="Total Findings" />
                <Area type="monotone" dataKey="critical" stroke="#F87171" fillOpacity={1} fill="url(#colorCrit)" name="Critical Severity" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="p-5 rounded-xl bg-[#111B2E] border border-[#263449] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Severity Breakdown
            </h3>
            <span className="text-xs text-[#8190A8] font-mono">{totalFindings} Total</span>
          </div>

          <div className="space-y-3.5 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-red-300 font-medium">Critical (CVSS 9.0+)</span>
                <span className="font-mono text-white font-semibold">{criticalCount}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#0E1628] overflow-hidden">
                <div
                  className="h-full bg-red-400 rounded-full"
                  style={{ width: `${totalFindings > 0 ? (criticalCount / totalFindings) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-orange-300 font-medium">High (CVSS 7.0 - 8.9)</span>
                <span className="font-mono text-white font-semibold">{highCount}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#0E1628] overflow-hidden">
                <div
                  className="h-full bg-orange-400 rounded-full"
                  style={{ width: `${totalFindings > 0 ? (highCount / totalFindings) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-amber-300 font-medium">Medium (CVSS 4.0 - 6.9)</span>
                <span className="font-mono text-white font-semibold">{mediumCount}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#0E1628] overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${totalFindings > 0 ? (mediumCount / totalFindings) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-blue-300 font-medium">Low & Informational</span>
                <span className="font-mono text-white font-semibold">{lowCount}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#0E1628] overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full"
                  style={{ width: `${totalFindings > 0 ? (lowCount / totalFindings) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 text-[11px] text-[#8190A8] border-t border-[#263449]">
            Enforcement policy blocks pull request merges when unresolved Critical findings are present.
          </div>
        </div>
      </div>

      {/* Recent Findings Table */}
      <div className="p-5 rounded-xl bg-[#111B2E] border border-[#263449] space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Recent Security Findings
            </h3>
            <p className="text-xs text-[#A7B3C7]">
              Normalized results combining static pattern detection with AI contextual threat analysis.
            </p>
          </div>
          <button
            onClick={() => onNavigate('findings')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors flex items-center gap-1"
          >
            <span>View All Findings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#263449]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#263449] bg-[#0E1628] text-[#8190A8] font-mono uppercase text-[11px]">
                <th className="py-2.5 px-3.5">Severity</th>
                <th className="py-2.5 px-3.5">Vulnerability Title</th>
                <th className="py-2.5 px-3.5">File & Location</th>
                <th className="py-2.5 px-3.5">Classification</th>
                <th className="py-2.5 px-3.5">Scanner Engine</th>
                <th className="py-2.5 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263449]/60 bg-[#111B2E]">
              {recentFindings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#8190A8]">
                    No security findings discovered. Repository is compliant.
                  </td>
                </tr>
              ) : (
                recentFindings.map((f) => (
                  <tr key={f.id} className="hover:bg-[#162237] transition-colors">
                    <td className="py-3 px-3.5">
                      <SeverityBadge severity={f.severity} />
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-[#F8FAFC]">{f.title}</div>
                      <div className="text-[11px] text-[#8190A8] truncate max-w-md">{f.description}</div>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-300 text-[11px]">
                      {f.file_path}:{f.line_start}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 rounded bg-[#0E1628] border border-[#263449] text-slate-300 text-[10px] font-mono">
                        {f.cwe_id || 'CWE Security Issue'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-400 capitalize">
                      {f.scanner || 'Semgrep + Bandit'}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => onOpenFinding(f)}
                        className="px-2.5 py-1 rounded bg-[#162237] hover:bg-[#1E2D4A] hover:text-white text-slate-300 font-medium border border-[#263449] transition-colors"
                      >
                        Inspect
                      </button>
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
