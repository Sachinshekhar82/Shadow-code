import React from 'react';
import { Shield, Play, GitBranch, RefreshCw } from 'lucide-react';
import { SystemStatus } from '../types';

interface NavbarProps {
  status: SystemStatus | null;
  onRunDemo: () => void;
  isRunningDemo: boolean;
  activeRepoName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  status,
  onRunDemo,
  isRunningDemo,
  activeRepoName
}) => {
  const isHealthy = status?.mode === 'active' || status?.mode === 'persistent_mongodb' || status?.mode === 'in_memory_mock';
  const enginesCount = status?.scanners_available
    ? Object.values(status.scanners_available).filter(Boolean).length
    : 2;

  return (
    <header className="h-16 border-b border-[#263449] bg-[#0B1120]/95 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Left: Branding & Repository Target */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#162237] border border-[#263449] flex items-center justify-center text-cyan-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-[#F8FAFC]">
                SHADOW-CODE
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#162237] text-slate-300 border border-[#263449]">
                v1.0 SDLC
              </span>
            </div>
            <p className="text-[11px] text-[#8190A8] tracking-tight">
              Enterprise Secure SDLC Auditor
            </p>
          </div>
        </div>

        {/* Monitored Repository Indicator */}
        <div className="hidden lg:flex items-center pl-6 border-l border-[#263449]/80">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111B2E] border border-[#263449] text-xs">
            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[#8190A8]">Target:</span>
            <span className="text-[#F8FAFC] font-mono font-medium truncate max-w-[240px]">
              {activeRepoName || 'Sachinshekhar82/Shadow-code'}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Engine Status & Primary Action */}
      <div className="flex items-center gap-4">
        {/* Backend & Scanner Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111B2E] border border-[#263449] text-xs">
          <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
          <span className="text-[#8190A8] font-medium">Scanner Engines:</span>
          <span className="text-slate-200 font-mono font-semibold text-[11px]">
            {enginesCount} Active (Semgrep + Bandit)
          </span>
        </div>

        {/* Primary Run Security Scan Button */}
        <button
          onClick={onRunDemo}
          disabled={isRunningDemo}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 text-slate-950 font-semibold text-xs transition-colors disabled:opacity-50 shadow-sm"
        >
          {isRunningDemo ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Running Security Audit...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Security Scan</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
