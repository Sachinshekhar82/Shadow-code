import React, { useState } from 'react';
import {
  History,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Terminal,
  FileCode
} from 'lucide-react';
import { Scan } from '../types';
import { StatusBadge } from '../components/SeverityBadge';

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
      s.filename.toLowerCase().includes(term) ||
      s.author.toLowerCase().includes(term) ||
      s.scan_mode.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          Audit Scan History & System Telemetry Logs
        </h1>
        <p className="text-xs text-cyber-muted">
          Inspect immutable records of past audits, agent execution logs, and runtime duration metrics without rerunning pipeline scans.
        </p>
      </div>

      {/* Search */}
      <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border">
        <div className="relative">
          <Search className="w-4 h-4 text-cyber-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search scans by scan ID, filename, author, or mode..."
            className="w-full bg-[#0d1424] border border-cyber-border rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scans List (1 col) */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Historical Scans ({filteredScans.length})
          </h3>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredScans.length === 0 ? (
              <div className="p-6 text-center text-xs text-cyber-muted rounded-lg bg-cyber-card border border-cyber-border">
                No past scans found.
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
                        ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-sm'
                        : 'bg-cyber-card border-cyber-border hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <StatusBadge status={s.status} />
                      <span className="text-[10px] font-mono text-cyber-muted">
                        {new Date(s.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                        {s.filename}
                      </div>
                      <div className="text-[10px] font-mono text-cyber-muted mt-0.5">
                        ID: {s.id.substring(0, 8)} • {(s.duration_ms / 1000).toFixed(2)}s
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
            <div className="space-y-5">
              {/* Scan Summary Banner */}
              <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                      Audit Session: {selectedScanDetail.id}
                    </span>
                    <h2 className="text-base font-bold text-white">
                      File: {selectedScanDetail.filename} ({selectedScanDetail.language})
                    </h2>
                  </div>
                  <StatusBadge status={selectedScanDetail.status} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-cyber-border/40 text-center text-xs">
                  <div className="p-2 rounded bg-[#0d1628]">
                    <span className="text-[10px] text-cyber-muted block">Findings</span>
                    <span className="font-mono font-bold text-white">{selectedScanDetail.total_findings}</span>
                  </div>
                  <div className="p-2 rounded bg-[#0d1628]">
                    <span className="text-[10px] text-cyber-muted block">Duration</span>
                    <span className="font-mono font-bold text-cyan-400">{selectedScanDetail.duration_ms}ms</span>
                  </div>
                  <div className="p-2 rounded bg-[#0d1628]">
                    <span className="text-[10px] text-cyber-muted block">Audit Policy</span>
                    <span className="font-mono font-bold text-emerald-400 capitalize">{selectedScanDetail.scan_mode}</span>
                  </div>
                  <div className="p-2 rounded bg-[#0d1628]">
                    <span className="text-[10px] text-cyber-muted block">Timestamp</span>
                    <span className="font-mono text-[10px] text-slate-300">{new Date(selectedScanDetail.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Scan Internal Logs */}
              <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Gateway & Orchestrator Execution Log Stream
                </h3>

                <div className="p-4 rounded-lg bg-[#070b14] border border-cyber-border font-mono text-xs text-slate-300 space-y-1.5 max-h-72 overflow-y-auto">
                  {selectedScanDetail.logs && selectedScanDetail.logs.length > 0 ? (
                    selectedScanDetail.logs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-slate-600 select-none text-[10px]">
                          [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>
                        <span className="text-cyan-400 font-bold text-[10px]">[{log.stage}]</span>
                        <span className={log.level === 'ERROR' ? 'text-red-400' : 'text-slate-200'}>
                          {log.message}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-cyber-muted">No low-level logs recorded for this scan session.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-cyber-muted rounded-xl bg-cyber-card border border-cyber-border">
              Select a scan from the left list to inspect logs and telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
