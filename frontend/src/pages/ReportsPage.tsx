import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Calendar,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Scan } from '../types';
import { SeverityBadge, StatusBadge } from '../components/SeverityBadge';
import { getScanReportDownloadUrl } from '../services/api';

interface ReportsPageProps {
  scans: Scan[];
  selectedScan: Scan | null;
  onSelectScan: (scan: Scan) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  scans,
  selectedScan,
  onSelectScan
}) => {
  const activeScan = selectedScan || (scans.length > 0 ? scans[0] : null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    if (!activeScan) return;
    window.open(getScanReportDownloadUrl(activeScan.id, 'json'), '_blank');
  };

  const handleDownloadCsv = () => {
    if (!activeScan) return;
    window.open(getScanReportDownloadUrl(activeScan.id, 'csv'), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Security Audit Reports & Compliance Export
          </h1>
          <p className="text-xs text-cyber-muted">
            Formal, evidence-based security auditing reports with CVSS v3.1 rankings, NVD intelligence correlation, and remediation summaries.
          </p>
        </div>

        {activeScan && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-cyber-border transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print Report
            </button>
            <button
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-cyber-border transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Export CSV
            </button>
            <button
              onClick={handleDownloadJson}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
          </div>
        )}
      </div>

      {!activeScan ? (
        <div className="p-12 text-center text-xs text-cyber-muted rounded-xl bg-cyber-card border border-cyber-border">
          No audit scans available to generate reports. Run a scan from the Security Scanner page first.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Scan Selector if multiple */}
          {scans.length > 1 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-cyber-card border border-cyber-border overflow-x-auto text-xs">
              <span className="text-cyber-muted shrink-0">Select Scan:</span>
              {scans.slice(0, 6).map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelectScan(s)}
                  className={`px-3 py-1 rounded-md font-mono text-[11px] shrink-0 transition-colors ${
                    s.id === activeScan.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'bg-[#0e1628] text-slate-400 hover:text-white border border-cyber-border'
                  }`}
                >
                  {s.filename} ({s.id.substring(0, 6)})
                </button>
              ))}
            </div>
          )}

          {/* Report Document Card */}
          <div className="p-8 rounded-xl bg-cyber-card border border-cyber-border space-y-8 shadow-2xl print:bg-white print:text-black">
            {/* Report Header */}
            <div className="border-b border-cyber-border pb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold mb-1">
                  SHADOW CODE SECURITY AUDIT REPORT
                </div>
                <h2 className="text-2xl font-extrabold text-white">
                  Target Assessment: {activeScan.filename}
                </h2>
                <div className="text-xs text-cyber-muted mt-1 space-x-3">
                  <span>Author: <strong className="text-slate-300">{activeScan.author}</strong></span>
                  <span>•</span>
                  <span>Branch: <strong className="text-cyan-400 font-mono">{activeScan.branch}</strong></span>
                  <span>•</span>
                  <span>Scan Mode: <strong className="text-slate-300 capitalize">{activeScan.scan_mode}</strong></span>
                </div>
              </div>

              <div className="text-right space-y-1">
                <StatusBadge status={activeScan.status} />
                <div className="text-[11px] text-cyber-muted font-mono">
                  {new Date(activeScan.created_at).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Scan ID: {activeScan.id}
                </div>
              </div>
            </div>

            {/* Executive Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-[#0e1628] border border-cyber-border/60 text-center">
                <span className="text-[10px] uppercase font-bold text-cyber-muted block">Total Issues</span>
                <span className="text-2xl font-mono font-bold text-white">{activeScan.total_findings}</span>
              </div>
              <div className="p-4 rounded-lg bg-[#0e1628] border border-red-500/20 text-center">
                <span className="text-[10px] uppercase font-bold text-red-400 block">Critical</span>
                <span className="text-2xl font-mono font-bold text-red-400">{activeScan.critical_count}</span>
              </div>
              <div className="p-4 rounded-lg bg-[#0e1628] border border-orange-500/20 text-center">
                <span className="text-[10px] uppercase font-bold text-orange-400 block">High</span>
                <span className="text-2xl font-mono font-bold text-orange-400">{activeScan.high_count}</span>
              </div>
              <div className="p-4 rounded-lg bg-[#0e1628] border border-amber-500/20 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">Medium / Low</span>
                <span className="text-2xl font-mono font-bold text-amber-400">{activeScan.medium_count + activeScan.low_count}</span>
              </div>
            </div>

            {/* Findings Inventory */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-cyber-border pb-2">
                Detailed Vulnerability Inventory
              </h3>

              <div className="space-y-4">
                {activeScan.findings.map((f, i) => (
                  <div
                    key={f.id}
                    className="p-5 rounded-lg bg-[#0b1222] border border-cyber-border space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">#{i + 1}</span>
                        <SeverityBadge severity={f.severity} score={f.numeric_score} />
                        <span className="font-mono text-xs font-bold text-cyan-400">{f.rule_id}</span>
                        <h4 className="text-sm font-bold text-white">{f.title}</h4>
                      </div>
                      <div className="text-xs text-cyber-muted font-mono">
                        Line {f.line_start} - {f.line_end}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {f.description}
                    </p>

                    <div className="p-3 rounded bg-[#070b14] border border-cyber-border font-mono text-xs text-red-300 overflow-x-auto">
                      <code>{f.code_snippet}</code>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-cyber-muted font-semibold block text-[10px] uppercase">CVSS Calculation Vector:</span>
                        <span className="text-slate-300 font-mono text-[11px]">{f.severity_rationale || 'Score calibrated against CVSS 3.1'}</span>
                      </div>
                      <div>
                        <span className="text-cyber-muted font-semibold block text-[10px] uppercase">Threat Intel Benchmark:</span>
                        <span className="text-amber-400 font-mono text-[11px]">
                          {f.cve_id ? `${f.cve_id} (${f.cwe_id})` : f.cwe_id || 'CWE Generic'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Academic Attribution Footer */}
            <div className="pt-6 border-t border-cyber-border text-center text-xs text-cyber-muted space-y-1">
              <div>Institution: Dayananda Sagar Academy of Technology & Management (Autonomous Institute under VTU)</div>
              <div>Department of CSE–Cyber Security • 7th Semester Project Phase 2</div>
              <div className="text-[11px] text-cyan-400">Project Team: Sachin Shekhar (1DT23CY040), Abhinav Raj (1DT23CY002), Ikshit Sinha (1DT23CY022), Abhishek Anand (1DT23CY003)</div>
              <div className="text-[11px]">Project Guide: Mr. Anitha R, Associate Professor</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
