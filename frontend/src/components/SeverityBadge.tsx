import React from 'react';

interface SeverityBadgeProps {
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | string;
  score?: number;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, score, size = 'sm' }) => {
  const sevLower = severity.toLowerCase();

  let badgeClasses = 'bg-slate-500/10 text-slate-300 border-slate-700/50';
  let dotColor = 'bg-slate-400';

  if (sevLower === 'critical') {
    badgeClasses = 'bg-red-500/10 text-red-300 border-red-500/30';
    dotColor = 'bg-red-400';
  } else if (sevLower === 'high') {
    badgeClasses = 'bg-orange-500/10 text-orange-300 border-orange-500/30';
    dotColor = 'bg-orange-400';
  } else if (sevLower === 'medium') {
    badgeClasses = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    dotColor = 'bg-amber-400';
  } else if (sevLower === 'low') {
    badgeClasses = 'bg-blue-500/10 text-blue-300 border-blue-500/30';
    dotColor = 'bg-blue-400';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded font-medium border font-mono tracking-wide ${padding} ${badgeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{severity.toUpperCase()}</span>
      {score !== undefined && (
        <span className="text-[10px] text-slate-400 font-mono">({score.toFixed(1)})</span>
      )}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const stLower = status.toLowerCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700/60';
  let dotColor = 'bg-slate-400';

  if (stLower === 'completed' || stLower === 'resolved' || stLower === 'applied' || stLower === 'connected' || stLower === 'passed') {
    styles = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    dotColor = 'bg-emerald-400';
  } else if (stLower === 'blocked' || stLower === 'failed' || stLower === 'validation_failed') {
    styles = 'bg-red-500/10 text-red-300 border-red-500/30';
    dotColor = 'bg-red-400';
  } else if (stLower === 'running' || stLower === 'in_progress') {
    styles = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
    dotColor = 'bg-cyan-400 animate-pulse';
  } else if (stLower === 'requires_human_review' || stLower === 'in_review' || stLower === 'pending') {
    styles = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    dotColor = 'bg-amber-400';
  } else if (stLower === 'open') {
    styles = 'bg-blue-500/10 text-blue-300 border-blue-500/30';
    dotColor = 'bg-blue-400';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border uppercase tracking-wider ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{status.replace(/_/g, ' ')}</span>
    </span>
  );
};
