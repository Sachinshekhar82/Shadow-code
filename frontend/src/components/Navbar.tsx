import React from 'react';
import { Shield, Play, GitBranch, RefreshCw, Radio } from 'lucide-react';
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
  return (
    <header className="h-16 border-b border-cyber-border bg-[#0b1120]/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Left: Branding & Academic Institution */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 flex items-center justify-center glow-cyan">
            <div className="w-full h-full bg-[#0d1527] rounded-[7px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                SHADOW CODE
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                v1.0 SDLC GATE
              </span>
            </div>
            <p className="text-[10px] text-cyber-muted tracking-tight">
              DSATM Department of CSE–Cyber Security
            </p>
          </div>
        </div>

        {/* Repository selector / indicator */}
        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-cyber-border/60">
          <span className="text-[11px] text-cyber-muted flex items-center gap-1.5 bg-[#121a2e] px-3 py-1.5 rounded-md border border-cyber-border">
            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target:</span>
            <span className="text-white font-mono font-medium">{activeRepoName}</span>
          </span>
        </div>
      </div>

      {/* Right: Mode & Actions */}
      <div className="flex items-center gap-3">
        {/* System mode indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#11192c] border border-cyber-border text-xs">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-cyber-muted text-[11px]">Engine:</span>
          <span className="text-emerald-400 font-semibold uppercase text-[11px]">
            {status?.mode || 'Demo Mode'}
          </span>
        </div>

        {/* Quick Demo Scan Button */}
        <button
          onClick={onRunDemo}
          disabled={isRunningDemo}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-400 text-black font-semibold text-xs hover:opacity-90 active:scale-95 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
        >
          {isRunningDemo ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Pipeline...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Demo Scan</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
