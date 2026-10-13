import React from 'react';
import {
  ShieldAlert,
  CheckCircle,
  FileCode,
  GitBranch,
  Clock,
  ArrowUpRight,
  Cpu,
  Play,
  Flame,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Scan, Finding } from '../types';
import { SeverityBadge, StatusBadge } from '../components/SeverityBadge';
import { NavTab } from '../components/Sidebar';

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
  const latestScan = scans.length > 0 ? scans[0] : null;

  const totalScans = scans.length;
  const totalFindings = findings.length;
  const criticalCount = findings.filter(f => f.severity.toLowerCase() === 'critical').length;
  const highCount = findings.filter(f => f.severity.toLowerCase() === 'high').length;
  const mediumCount = findings.filter(f => f.severity.toLowerCase() === 'medium').length;
  const lowCount = findings.filter(f => f.severity.toLowerCase() === 'low').length;
  const resolvedCount = findings.filter(f => f.status === 'resolved' || f.status === 'accepted').length;

  const critPercent = totalFindings > 0 ? Math.round((criticalCount / totalFindings) * 100) : 0;
  const highPercent = totalFindings > 0 ? Math.round((highCount / totalFindings) * 100) : 0;
  const medPercent = totalFindings > 0 ? Math.round((mediumCount / totalFindings) * 100) : 0;
  const lowPercent = totalFindings > 0 ? Math.round((lowCount / totalFindings) * 100) : 0;

  const recentFindings = findings.slice(0, 5);

  const agentsSummary = [
    { num: 1, name: 'Parser / Receptionist', role: 'Tree-sitter & AST Decomposition', status: 'Active' },
    { num: 2, name: 'Pattern Scanner / Filter', role: 'Bandit & Semgrep Pre-Filter', status: 'Active' },
    { num: 3, name: 'Semantic Reasoner / Doctor', role: 'Context & Intent Analysis', status: 'Active' },
    { num: 4, name: 'CVE Correlator / Historian', role: 'NVD / CWE Threat Intel RAG', status: 'Active' },
    { num: 5, name: 'Severity Ranker / Judge', role: 'CVSS v3.1 Scoring Engine', status: 'Active' },
    { num: 6, name: 'Report Writer / Communicator', role: 'Plain-English Security Synthesis', status: 'Active' },
    { num: 7, name: 'The Surgeon / Fixer', role: 'Fail-Safe Remediation & AST Syntax', status: 'Active' },
    { num: 8, name: 'Adaptive Memory / Learner', role: 'Human-in-the-Loop Feedback Loop', status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="p-6 rounded-xl border border-cyber-border bg-gradient-to-r from-[#11192d] via-[#0d1626] to-[#0a1120] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase font-mono">
              Pre-Commit Security Gateway Active
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Autonomous DevSecOps Auditing Dashboard
          </h1>
          <p className="text-xs text-cyber-muted max-w-2xl">
            Shadow Code intercepts code changes between your local workstation and the remote repository,
            coordinating eight autonomous agents for static pre-filtering, semantic intent analysis, CVE intelligence, and fail-safe patch generation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('scanner')}
            className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-cyber-border transition-all flex items-center gap-2"
          >
            <FileCode className="w-4 h-4 text-cyan-400" />
            Launch Scanner
          </button>
          <button
            onClick={onRunDemo}
            disabled={isRunningDemo}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-400 hover:opacity-90 text-black text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            {isRunningDemo ? 'Running 8 Agents...' : 'One-Click Demo Scan'}
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-1">
          <div className="text-[11px] text-cyber-muted flex items-center justify-between">
            <span>Total Scans</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{totalScans}</div>
          <div className="text-[10px] text-emerald-400">Continuous Auditing</div>
        </div>

        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-1">
          <div className="text-[11px] text-cyber-muted flex items-center justify-between">
            <span>Total Findings</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{totalFindings}</div>
          <div className="text-[10px] text-amber-400">{criticalCount + highCount} High Risk</div>
        </div>

        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-1">
          <div className="text-[11px] text-cyber-muted flex items-center justify-between">
            <span>Critical Severity</span>
            <Flame className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">{criticalCount}</div>
          <div className="text-[10px] text-red-400/80">Immediate Remediation</div>
        </div>

        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-1">
          <div className="text-[11px] text-cyber-muted flex items-center justify-between">
            <span>Resolved / Accepted</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{resolvedCount}</div>
          <div className="text-[10px] text-emerald-400">Patched / Validated</div>
        </div>

        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-1">
          <div className="text-[11px] text-cyber-muted flex items-center justify-between">
            <span>Repositories</span>
            <GitBranch className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">1</div>
          <div className="text-[10px] text-purple-400">GitHub Connected</div>
        </div>

        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-1">
          <div className="text-[11px] text-cyber-muted flex items-center justify-between">
            <span>Avg Scan Time</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {latestScan ? `${(latestScan.duration_ms / 1000).toFixed(2)}s` : '1.2s'}
          </div>
          <div className="text-[10px] text-cyan-400">8 Agents Parallel/Seq</div>
        </div>
      </div>

      {/* Main Grid: Severity Distribution & 8-Agent Pipeline Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution */}
        <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Vulnerability Severity Breakdown
            </h3>
            <span className="text-xs text-cyber-muted font-mono">{totalFindings} Total</span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span> Critical (CVSS 9.0+)
                </span>
                <span className="font-mono text-slate-300">{criticalCount} ({critPercent}%)</span>
              </div>
              <div className="w-full bg-[#0d1424] rounded-full h-2 overflow-hidden">
                <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${critPercent}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-orange-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span> High (CVSS 7.0 - 8.9)
                </span>
                <span className="font-mono text-slate-300">{highCount} ({highPercent}%)</span>
              </div>
              <div className="w-full bg-[#0d1424] rounded-full h-2 overflow-hidden">
                <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${highPercent}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> Medium (CVSS 4.0 - 6.9)
                </span>
                <span className="font-mono text-slate-300">{mediumCount} ({medPercent}%)</span>
              </div>
              <div className="w-full bg-[#0d1424] rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${medPercent}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span> Low (CVSS 0.1 - 3.9)
                </span>
                <span className="font-mono text-slate-300">{lowCount} ({lowPercent}%)</span>
              </div>
              <div className="w-full bg-[#0d1424] rounded-full h-2 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${lowPercent}%` }}></div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0e1628] border border-cyber-border/60 text-xs text-cyber-muted flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Token Optimization: Deterministic static pre-filtering eliminated non-vulnerable code blocks before LLM reasoning, saving ~80% LLM token consumption.
            </span>
          </div>
        </div>

        {/* Eight Agents Status Overview */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Eight-Agent Orchestration Pipeline Status
            </h3>
            <button
              onClick={() => onNavigate('pipeline')}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              View Pipeline Details <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {agentsSummary.map((agent) => (
              <div
                key={agent.num}
                className="p-3 rounded-lg bg-[#0e1526] border border-cyber-border hover:border-cyan-500/40 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 font-mono text-xs flex items-center justify-center font-bold">
                    {agent.num}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{agent.name}</div>
                    <div className="text-[10px] text-cyber-muted">{agent.role}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {agent.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Findings Feed & Recent Scans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Findings */}
        <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Active High-Priority Vulnerabilities
            </h3>
            <button
              onClick={() => onNavigate('findings')}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              All Findings ({findings.length}) <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentFindings.length === 0 ? (
              <div className="p-6 text-center text-xs text-cyber-muted">
                No findings recorded yet. Run a scan to analyze code.
              </div>
            ) : (
              recentFindings.map((f) => (
                <div
                  key={f.id}
                  onClick={() => onOpenFinding(f)}
                  className="p-3 rounded-lg bg-[#0e1627] border border-cyber-border hover:border-cyan-500/40 hover:bg-[#121c32] cursor-pointer transition-all flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={f.severity} score={f.numeric_score} />
                      <span className="text-[11px] font-mono text-cyan-400">{f.rule_id}</span>
                      {f.cve_id && (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-800/40">
                          {f.cve_id}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-white truncate">{f.title}</div>
                    <div className="text-[10px] text-cyber-muted">
                      {f.file_path}:{f.line_start} • {f.detection_source}
                    </div>
                  </div>

                  <button className="px-2.5 py-1 text-[11px] font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 rounded hover:bg-cyan-900/60 transition-colors whitespace-nowrap">
                    Review →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Scan History */}
        <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Recent SDLC Security Scans
            </h3>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              Full History <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {scans.length === 0 ? (
              <div className="p-6 text-center text-xs text-cyber-muted">
                No scans executed yet.
              </div>
            ) : (
              scans.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  onClick={() => onSelectScan(s)}
                  className="p-3 rounded-lg bg-[#0e1627] border border-cyber-border hover:border-cyan-500/40 hover:bg-[#121c32] cursor-pointer transition-all flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={s.status} />
                      <span className="text-xs font-mono text-slate-300 font-semibold">{s.filename}</span>
                      <span className="text-[10px] text-cyber-muted">({s.scan_mode})</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Findings: <span className="text-red-400 font-bold">{s.critical_count} Crit</span>,{' '}
                      <span className="text-orange-400 font-bold">{s.high_count} High</span>,{' '}
                      <span className="text-amber-400">{s.medium_count} Med</span> • Duration: {(s.duration_ms / 1000).toFixed(2)}s
                    </div>
                  </div>

                  <span className="text-[11px] text-cyber-muted font-mono">
                    {new Date(s.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
