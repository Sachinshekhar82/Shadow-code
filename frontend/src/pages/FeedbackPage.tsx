import React, { useState, useEffect } from 'react';
import {
  Brain,
  ThumbsUp,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Shield,
  Layers
} from 'lucide-react';
import { FeedbackDecision, AdaptiveProfile } from '../types';
import { fetchAdaptiveMemory, resetAdaptiveMemory } from '../services/api';

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
      setProfiles(data.profiles.profiles || []);
      setStats(data.profiles);
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
      setResetSuccess(res.message);
      loadData();
      setTimeout(() => setResetSuccess(null), 3000);
    } catch (err) {
      alert('Failed to reset adaptive memory');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            Agent 8: Adaptive Memory & Human-in-the-Loop Feedback
          </h1>
          <p className="text-xs text-cyber-muted">
            Learns from team overrides and false-positive flags to calibrate repository severity weighting while preserving critical risk safety guardrails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-cyber-border transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Reset Learned Memory
          </button>
        </div>
      </div>

      {resetSuccess && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{resetSuccess}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border">
          <span className="text-[10px] uppercase font-bold text-cyber-muted block">Adapted Rules</span>
          <span className="text-2xl font-mono font-bold text-cyan-400">{profiles.length}</span>
          <span className="text-[10px] text-cyber-muted block mt-0.5">Tuned for team habits</span>
        </div>

        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block">Accepted Findings</span>
          <span className="text-2xl font-mono font-bold text-emerald-400">{stats.total_accepts || 0}</span>
          <span className="text-[10px] text-emerald-400/80 block mt-0.5">Confirmed vulnerabilities</span>
        </div>

        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border">
          <span className="text-[10px] uppercase font-bold text-amber-400 block">Manual Overrides</span>
          <span className="text-2xl font-mono font-bold text-amber-400">{stats.total_overrides || 0}</span>
          <span className="text-[10px] text-amber-400/80 block mt-0.5">Contextual bypasses</span>
        </div>

        <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border">
          <span className="text-[10px] uppercase font-bold text-purple-400 block">False Positives</span>
          <span className="text-2xl font-mono font-bold text-purple-400">{stats.total_false_positives || 0}</span>
          <span className="text-[10px] text-purple-400/80 block mt-0.5">Noise suppressed</span>
        </div>
      </div>

      {/* Adaptive Mechanics Explanation & Guardrails */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-[#11192d] to-[#0c1424] border border-cyber-border space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          Adaptive Feedback Mechanics & Critical Safety Guardrails
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          When developers override a specific rule in a repository (e.g. flagging a diagnostic subprocess execution as an intended internal tool),
          Agent 8 records the rationale and tunes future severity calculations for that repository.
        </p>
        <div className="p-3 rounded-lg bg-[#070b14] border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>
            <strong>Safety Guardrail Active:</strong> Critical vulnerabilities (CVSS 9.0+ such as Raw SQL Injection or Hardcoded Cloud Admin Keys)
            are NEVER suppressed below High risk, regardless of historical override volume, preventing accidental security blind spots.
          </span>
        </div>
      </div>

      {/* Grid: Profiles & Decision Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adaptive Profiles */}
        <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Repository-Specific Tuning Weights
          </h3>

          <div className="space-y-2.5">
            {profiles.length === 0 ? (
              <div className="p-6 text-center text-xs text-cyber-muted">
                No adaptive weight adjustments yet. Override or mark a finding as false-positive to see real-time tuning.
              </div>
            ) : (
              profiles.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-[#0e1628] border border-cyber-border flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold font-mono text-cyan-400">{p.rule_id}</span>
                    <div className="text-[11px] text-cyber-muted">
                      Overrides: <span className="text-amber-400">{p.overrides}</span> • False Positives: <span className="text-purple-400">{p.false_positives}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                      Adjustment: {p.weight_adjustment > 0 ? `+${p.weight_adjustment}` : p.weight_adjustment.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Feedback Audit Trail */}
        <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
            Recent Developer Feedback Audit Trail
          </h3>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {decisions.length === 0 ? (
              <div className="p-6 text-center text-xs text-cyber-muted">
                No feedback decisions recorded yet.
              </div>
            ) : (
              decisions.map((d) => (
                <div
                  key={d.id}
                  className="p-3 rounded-lg bg-[#0e1628] border border-cyber-border space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400">{d.rule_id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {d.decision}
                    </span>
                  </div>

                  {d.reason && (
                    <p className="text-xs text-slate-300 italic">
                      "{d.reason}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-cyber-muted font-mono pt-1">
                    <span>Severity: {d.previous_severity} → {d.adjusted_severity || d.previous_severity}</span>
                    <span>{new Date(d.created_at).toLocaleTimeString()}</span>
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
