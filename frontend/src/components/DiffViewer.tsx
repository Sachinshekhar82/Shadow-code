import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface DiffViewerProps {
  diff: string;
  originalCode?: string;
  proposedCode?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diff, originalCode, proposedCode }) => {
  const lines = diff.split('\n');

  return (
    <div className="rounded-lg border border-cyber-border bg-[#0d1322] font-mono text-xs overflow-hidden">
      <div className="bg-[#131b2e] px-4 py-2 border-b border-cyber-border flex items-center justify-between text-cyber-muted text-[11px]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-400"></span> Vulnerable Original
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Remediated Replacement
          </span>
        </div>
        <span className="text-[10px] text-cyber-muted">Unified Git Diff</span>
      </div>

      <div className="p-3 overflow-x-auto max-h-[420px] divide-y divide-cyber-border/20">
        {lines.map((line, idx) => {
          let bgClass = 'hover:bg-slate-800/20';
          let textClass = 'text-slate-300';
          let icon = null;

          if (line.startsWith('---') || line.startsWith('+++')) {
            textClass = 'text-cyber-muted font-bold';
            bgClass = 'bg-[#151f38]';
          } else if (line.startsWith('@@')) {
            textClass = 'text-cyan-400 font-semibold';
            bgClass = 'bg-cyan-950/20';
          } else if (line.startsWith('-')) {
            textClass = 'text-red-300';
            bgClass = 'bg-red-500/10';
            icon = <Minus className="w-3 h-3 text-red-400 inline mr-1 flex-shrink-0" />;
          } else if (line.startsWith('+')) {
            textClass = 'text-emerald-300';
            bgClass = 'bg-emerald-500/10';
            icon = <Plus className="w-3 h-3 text-emerald-400 inline mr-1 flex-shrink-0" />;
          }

          return (
            <div key={idx} className={`py-1 px-2 flex items-start font-mono ${bgClass} ${textClass}`}>
              <span className="w-8 select-none text-right pr-3 text-slate-500 text-[10px]">{idx + 1}</span>
              <span className="flex-1 whitespace-pre-wrap break-all">
                {icon}
                {line.startsWith('-') || line.startsWith('+') ? line.substring(1) : line}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
