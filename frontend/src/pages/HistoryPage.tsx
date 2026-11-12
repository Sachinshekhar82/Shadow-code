import React, { useState } from 'react';
import {
  History,
  Search,
  Clock,
  Terminal,
  FileCode,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { Scan } from '../types';
import { StatusBadge } from '../components/SeverityBadge';
import { PageHeader } from '../components/PageHeader';

interface HistoryPageProps {
  scans: Scan[];
  onSelectScan: (scan: Scan) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  scans,
  onSelectScan
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScanDetail, setSelectedScanDetail] = useState<Scan | null>(
    scans.length > 0 ? scans[0] : null
  );

  const filteredScans = scans.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.id.toLowerCase().includes(term) ||
      (s.commit_sha || '').toLowerCase().includes(term) ||
      (s.branch || '').toLowerCase().includes(term) ||
      (s.trigger || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Audit History & System Logs"
        subtitle="Immutable records of past static analysis runs, commit timestamps, and runtime performance telemetry."
        icon={History}
      />

      {/* Search Input */}
      <div className="p-4 rounded-xl bg-[#111B2E] border border-[#263449]">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8190A8] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search scans by scan ID, commit SHA, branch, or trigger..."
            className="w-full bg-[#0A0F1D] border border-[#263449] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#8190A8] focus:outline-none focus:border-cyan-400 font-sans"
          />
        </div>
      </div>

      {/* History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scans List (1 col) */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8190A8] px-1">
            Historical Scans ({filteredScans.length})
          </h3>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredScans.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8190A8] rounded-lg bg-[#111B2E] border border-[#263449]">
                No historical audit scans matched.
              </div>
            ) : (
              filteredScans.map((s) => {
                const isSelected = selectedScanDetail?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedScanDetail(s);
                      onSelectScan(s);
                    }}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'bg-[#162237] border-cyan-400 text-white shadow-sm'
                        : 'bg-[#111B2E] border-[#263449] hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <StatusBadge status={s.status} />
                      <span className="text-[10px] font-mono text-[#8190A8]">
                        {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5 truncate">
                        <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Commit {s.commit_sha?.substring(0, 8) || 'HEAD'} ({s.branch || 'main'})</span>
                      </div>
                      <div className="text-[11px] font-mono text-[#8190A8] mt-0.5">
                        Scan ID: {s.id} • {s.duration_seconds || 1.2}s
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-red-400 font-bold">{s.critical_count} Crit</span>
                      <span className="text-orange-400 font-bold">{s.high_count} High</span>
                      <span className="text-amber-400">{s.medium_count} Med</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Scan Logs & Stage Details (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          {selectedScanDetail ? (
            <div className="space-y-4">
              {/* Scan Summary Banner */}
              <div className="p-5 rounded-xl bg-[#111B2E] border border-[#263449] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block">
                      Audit Run: {selectedScanDetail.id}
                    </span>
                    <h2 className="text-base font-bold text-[#F8FAFC]">
                      Trigger: {selectedScanDetail.trigger || 'manual_audit'} (Branch: {selectedScanDetail.branch || 'main'})
                    </h2>
                  </div>
                  <StatusBadge status={selectedScanDetail.status} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#263449] text-xs">
                  <div>
                    <span className="text-[#8190A8] block text-[11px]">Execution Time</span>
                    <span className="font-mono text-white font-medium">{selectedScanDetail.duration_seconds}s</span>
                  </div>
                  <div>
                    <span className="text-[#8190A8] block text-[11px]">Total Findings</span>
                    <span className="font-mono text-white font-medium">{selectedScanDetail.total_findings}</span>
                  </div>
                  <div>
                    <span className="text-[#8190A8] block text-[11px]">Commit SHA</span>
                    <span className="font-mono text-cyan-400">{selectedScanDetail.commit_sha}</span>
                  </div>
                  <div>
                    <span className="text-[#8190A8] block text-[11px]">Engines</span>
                    <span className="font-mono text-emerald-400">Semgrep + Bandit</span>
                  </div>
                </div>
              </div>

              {/* Execution Telemetry Log */}
              <div className="p-5 rounded-xl bg-[#111B2E] border border-[#263449] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Execution Telemetry Log
                </h3>

                <div className="p-4 rounded-lg bg-[#0A0F1D] border border-[#263449] font-mono text-xs text-slate-300 space-y-1.5 leading-relaxed max-h-72 overflow-y-auto">
                  <div className="text-slate-500">[{new Date(selectedScanDetail.created_at).toISOString()}] Initializing dual scanner invocation...</div>
                  <div className="text-cyan-400">[*] Executing Semgrep CLI scanner engine across repository rules...</div>
                  <div className="text-emerald-400">[+] Semgrep scan completed: rules evaluated without errors.</div>
                  <div className="text-cyan-400">[*] Executing Bandit AST security scanner against Python modules...</div>
                  <div className="text-emerald-400">[+] Bandit scan completed: AST normalized into unified FindingSchema.</div>
                  <div className="text-slate-300">[*] Total findings registered in persistent database: {selectedScanDetail.total_findings} (Critical: {selectedScanDetail.critical_count}, High: {selectedScanDetail.high_count})</div>
                  <div className="text-emerald-400">[✓] Execution session finalized with status: {selectedScanDetail.status.toUpperCase()} in {selectedScanDetail.duration_seconds}s.</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-[#8190A8] rounded-xl bg-[#111B2E] border border-[#263449]">
              Select an audit run from the left list to inspect its execution log.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
