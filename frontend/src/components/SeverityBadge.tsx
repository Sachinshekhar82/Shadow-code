import React from 'react';

interface SeverityBadgeProps {
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | string;
  score?: number;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, score }) => {
  const sevLower = severity.toLowerCase();

  let colorClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  if (sevLower === 'critical') {
    colorClasses = 'bg-red-500/15 text-red-400 border-red-500/40 shadow-sm shadow-red-500/10';
  } else if (sevLower === 'high') {
    colorClasses = 'bg-orange-500/15 text-orange-400 border-orange-500/40 shadow-sm shadow-orange-500/10';
  } else if (sevLower === 'medium') {
    colorClasses = 'bg-amber-500/15 text-amber-400 border-amber-500/40';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
      {severity}
      {score !== undefined && (
        <span className="text-[10px] opacity-75 font-mono">({score.toFixed(1)})</span>
      )}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const stLower = status.toLowerCase();

  let styles = 'bg-slate-700/40 text-slate-300 border-slate-600/30';
  if (stLower === 'completed' || stLower === 'resolved' || stLower === 'applied' || stLower === 'connected') {
    styles = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
  } else if (stLower === 'blocked' || stLower === 'failed' || stLower === 'validation_failed') {
    styles = 'bg-rose-500/15 text-rose-400 border-rose-500/40';
  } else if (stLower === 'running' || stLower === 'suggested') {
    styles = 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40';
  } else if (stLower === 'overridden' || stLower === 'approved') {
    styles = 'bg-amber-500/15 text-amber-400 border-amber-500/40';
  } else if (stLower === 'false_positive') {
    styles = 'bg-purple-500/15 text-purple-400 border-purple-500/40';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${styles}`}>
      {status.replace('_', ' ')}
    </span>
  );
};
