import React, { useState, useEffect } from 'react';
import {
  Brain,
  ThumbsUp,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Shield,
  Layers
} from 'lucide-react';
import { FeedbackDecision, AdaptiveProfile } from '../types';
import { fetchAdaptiveMemory, resetAdaptiveMemory } from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { MetricCard } from '../components/MetricCard';

export const FeedbackPage: React.FC = () => {
  const [decisions, setDecisions] = useState<FeedbackDecision[]>([]);
  const [profiles, setProfiles] = useState<AdaptiveProfile[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdaptiveMemory();
      setDecisions(data.decisions);
      const profList = Array.isArray(data.profiles) ? data.profiles : (data.profiles as any)?.profiles || [];
      setProfiles(profList);
      setStats((data.profiles as any) || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all learned weights and adaptive preferences?')) {
      return;
    }
    try {
      const res = await resetAdaptiveMemory();
      setResetSuccess((res as any).message || (res as any).status || 'Memory reset successfully');
      loadData();
      setTimeout(() => setResetSuccess(null), 3000);
    } catch (err) {
      alert('Failed to reset adaptive memory');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Adaptive Feedback & Severity Calibration"
        subtitle="Learns from engineering overrides and false-positive flags to calibrate repository severity weighting while strictly preserving critical risk safety guardrails."
        icon={Brain}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-[#162237] hover:bg-[#1E2D4A] text-slate-200 text-xs font-medium border border-[#263449] transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/40 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Weights</span>
            </button>
          </div>
        }
      />

      {resetSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{resetSuccess}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <MetricCard
          label="Tuned Rules"
          value={profiles.length}
          subtext="Calibrated for team habits"
          icon={Layers}
        />
        <MetricCard
          label="Accepted Findings"
          value={stats.total_accepts || 0}
          subtext="Confirmed vulnerabilities"
          icon={CheckCircle2}
          variant="success"
        />
        <MetricCard
          label="Manual Overrides"
          value={stats.total_overrides || 0}
          subtext="Contextual bypasses"
          icon={AlertTriangle}
          variant="medium"
        />
        <MetricCard
          label="Suppressed Noise"
          value={stats.total_false_positives || 0}
          subtext="False positives marked"
          icon={Brain}
        />
      </div>

      {/* Safety Guardrails Banner */}
      <div className="p-5 rounded-xl bg-[#111B2E] border border-[#263449] space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          Adaptive Feedback Safety Guardrails
        </h3>
        <p className="text-xs text-[#A7B3C7] leading-relaxed">
          When engineers override a specific rule in a repository (e.g. flagging a diagnostic ping subprocess as an authorized local admin script),
          Shadow-Code logs the justification and recalibrates severity scoring for subsequent scans.
        </p>
        <div className="p-3 rounded-lg bg-[#0E1628] border border-red-500/30 text-xs text-red-300 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>
            <strong>Safety Constraint Enforced:</strong> Critical vulnerabilities (CVSS 9.0+ such as Raw SQL Injection or Hardcoded Secrets)
            can never be downgraded below High severity, regardless of historical override volume, preventing accidental security blind spots.
          </span>
        </div>
      </div>

      {/* Grid: Profiles & Decision Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adaptive Profiles */}
        <div className="p-5 rounded-xl bg-[#111B2E] border border-[#263449] space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Repository-Specific Tuning Weights
          </h3>

          <div className="space-y-2.5">
            {profiles.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8190A8]">
                No adaptive weight adjustments yet. Override or mark a finding as false-positive in the Vulnerability Explorer to train the engine.
              </div>
            ) : (
              profiles.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-[#0E1628] border border-[#263449] flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold font-mono text-cyan-400">{p.rule_id}</span>
                    <div className="text-[11px] text-[#8190A8]">
                      Overrides: <span className="text-amber-400">{p.overrides}</span> • False Positives: <span className="text-purple-400">{p.false_positives}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#162237] text-cyan-300 border border-[#263449]">
                      Weight: {p.weight_adjustment > 0 ? `+${p.weight_adjustment}` : p.weight_adjustment.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Feedback Audit Trail */}
        <div className="p-5 rounded-xl bg-[#111B2E] border border-[#263449] space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
            Developer Feedback Audit Trail
          </h3>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {decisions.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8190A8]">
                No human feedback decisions recorded yet.
              </div>
            ) : (
              decisions.map((d) => (
                <div
                  key={d.id}
                  className="p-3 rounded-lg bg-[#0E1628] border border-[#263449] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400 truncate max-w-[240px]">{d.rule_id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-[#162237] text-slate-200 border border-[#263449]">
                      {d.decision}
                    </span>
                  </div>

                  {d.reason && (
                    <p className="text-xs text-slate-300 italic">"{d.reason}"</p>
                  )}

                  <div className="text-[10px] text-[#8190A8] font-mono">
                    {new Date(d.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
