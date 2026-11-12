import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  badge?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: 'default' | 'critical' | 'high' | 'medium' | 'low' | 'success';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  badge,
  trend,
  variant = 'default'
}) => {
  let accentBorder = 'border-[#263449]';
  let iconColor = 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40';

  if (variant === 'critical') {
    accentBorder = 'border-red-900/40';
    iconColor = 'text-red-400 bg-red-950/40 border-red-800/40';
  } else if (variant === 'high') {
    accentBorder = 'border-orange-900/40';
    iconColor = 'text-orange-400 bg-orange-950/40 border-orange-800/40';
  } else if (variant === 'medium') {
    accentBorder = 'border-amber-900/40';
    iconColor = 'text-amber-400 bg-amber-950/40 border-amber-800/40';
  } else if (variant === 'low') {
    accentBorder = 'border-blue-900/40';
    iconColor = 'text-blue-400 bg-blue-950/40 border-blue-800/40';
  } else if (variant === 'success') {
    accentBorder = 'border-emerald-900/40';
    iconColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
  }

  return (
    <div className={`p-4 rounded-xl bg-[#111B2E] border ${accentBorder} shadow-sm flex flex-col justify-between`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#8190A8] uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-bold text-[#F8FAFC] tracking-tight">{value}</div>
        {badge && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#162237] text-slate-300 border border-[#263449]">
            {badge}
          </span>
        )}
        {trend && (
          <span className={`text-xs font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.value}
          </span>
        )}
      </div>

      {subtext && (
        <div className="mt-1.5 text-[11px] text-[#8190A8] truncate">{subtext}</div>
      )}
    </div>
  );
};
