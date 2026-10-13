import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Bug,
  Cpu,
  Wrench,
  GitBranch,
  FileText,
  History,
  Brain,
  Settings,
  ChevronRight,
  Info
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'scanner'
  | 'findings'
  | 'pipeline'
  | 'remediation'
  | 'repositories'
  | 'reports'
  | 'history'
  | 'feedback'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  openFindingsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  openFindingsCount
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'scanner', label: 'Security Scanner', icon: ShieldAlert, badge: 'Live' },
    { id: 'findings', label: 'Findings Explorer', icon: Bug, count: openFindingsCount },
    { id: 'pipeline', label: '8-Agent Pipeline', icon: Cpu },
    { id: 'remediation', label: 'Remediation Workspace', icon: Wrench },
    { id: 'repositories', label: 'GitHub Repositories', icon: GitBranch },
    { id: 'reports', label: 'Audit Reports', icon: FileText },
    { id: 'history', label: 'Scan History & Logs', icon: History },
    { id: 'feedback', label: 'Adaptive Feedback', icon: Brain },
    { id: 'settings', label: 'Architecture & About', icon: Info },
  ];

  return (
    <aside className="w-64 border-r border-cyber-border bg-[#090d18] flex flex-col justify-between select-none">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Core Auditing Suite
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as NavTab)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-cyber-muted hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300">
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    {item.count}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Attribution Card */}
      <div className="p-4 border-t border-cyber-border/80 bg-[#070b14]/60">
        <div className="p-3 rounded-lg bg-[#0e1627] border border-cyber-border/50 text-[11px] space-y-1">
          <div className="font-semibold text-white">College Review Phase 2</div>
          <div className="text-cyber-muted text-[10px]">Team: Sachin, Abhinav, Ikshit, Abhishek</div>
          <div className="text-cyan-400 text-[10px]">Guide: Mr. Anitha R, DSATM</div>
        </div>
      </div>
    </aside>
  );
};
