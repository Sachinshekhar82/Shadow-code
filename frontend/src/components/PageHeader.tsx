import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  actions
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#263449]/60">
      <div>
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-[#162237] border border-[#263449] flex items-center justify-center text-cyan-400">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            {title}
            {badge && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 font-normal">
                {badge}
              </span>
            )}
          </h1>
        </div>
        {subtitle && (
          <p className="mt-1 text-xs sm:text-sm text-[#A7B3C7] max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
