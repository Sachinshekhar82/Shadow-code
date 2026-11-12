import React from 'react';
import {
  LayoutDashboard,
  GitBranch,
  ShieldAlert,
  Bug,
  Wrench,
  GitPullRequest,
  FileText,
  History,
  Brain,
  MessageSquare,
  LucideIcon
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'repositories'
  | 'scanner'
  | 'findings'
  | 'remediation'
  | 'pull_requests'
  | 'reports'
  | 'history'
  | 'feedback'
  | 'chatbot';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  openFindingsCount: number;
}

interface NavItemConfig {
  id: NavTab;
  label: string;
  icon: LucideIcon;
  badge?: string;
  count?: number;
}

interface NavGroup {
  title: string;
  items: NavItemConfig[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  openFindingsCount
}) => {
  const groups: NavGroup[] = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'repositories', label: 'Repositories', icon: GitBranch },
        { id: 'scanner', label: 'Security Audits', icon: ShieldAlert, badge: 'Live' },
      ]
    },
    {
      title: 'SECURITY',
      items: [
        { id: 'findings', label: 'Vulnerabilities', icon: Bug, count: openFindingsCount },
        { id: 'remediation', label: 'AI Remediation', icon: Wrench },
        { id: 'pull_requests', label: 'Pull Requests', icon: GitPullRequest },
      ]
    },
    {
      title: 'INSIGHTS',
      items: [
        { id: 'reports', label: 'Audit Reports', icon: FileText },
        { id: 'history', label: 'Scan History', icon: History },
        { id: 'feedback', label: 'Adaptive Feedback', icon: Brain },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'chatbot', label: 'Security Chatbot', icon: MessageSquare, badge: 'AI' },
      ]
    }
  ];

  return (
    <aside className="w-64 border-r border-[#263449] bg-[#0D1422] flex flex-col justify-between select-none">
      <div className="py-4 px-3 space-y-6 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.title} className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-[#8190A8] uppercase">
              {group.title}
            </div>

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full relative flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#162237] text-[#F8FAFC]'
                      : 'text-[#A7B3C7] hover:text-[#F8FAFC] hover:bg-[#162237]/50'
                  }`}
                >
                  {/* Subtle active left bar indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-cyan-400 rounded-r" />
                  )}

                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-[#8190A8]'}`} />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#111B2E] text-cyan-400 border border-[#263449] font-mono">
                        {item.badge}
                      </span>
                    )}
                    {typeof item.count === 'number' && item.count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-800/60 font-mono font-medium">
                        {item.count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-[#263449] text-center text-[11px] text-[#8190A8] font-mono">
        Shadow-Code Security Platform
      </div>
    </aside>
  );
};
