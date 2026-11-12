import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldAlert,
  AlertTriangle,
  Flame,
  Calendar,
  Clock,
  Loader2,
  FileDown,
  CheckCircle2
} from 'lucide-react';
import { Scan } from '../types';
import { SeverityBadge, StatusBadge } from '../components/SeverityBadge';
import { downloadReportFile } from '../services/api';
import { PageHeader } from '../components/PageHeader';

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
  const [downloadingFormat, setDownloadingFormat] = useState<'pdf' | 'csv' | 'json' | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async (format: 'pdf' | 'csv' | 'json') => {
    if (!activeScan) return;
    setDownloadingFormat(format);
    setDownloadError(null);
    setDownloadSuccess(null);

    try {
      await downloadReportFile(activeScan.id, format);
      setDownloadSuccess(`Successfully downloaded shadow-code-audit-${activeScan.id}.${format}`);
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err: any) {
      setDownloadError(err.message || `Failed to download ${format.toUpperCase()} report.`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Audit Reports & Compliance Export"
        subtitle="Formal evidence-based compliance reports with CVSS rankings, CWE threat mapping, and downloadable PDF, CSV, and JSON formats."
        icon={FileText}
        actions={
          activeScan ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg bg-[#162237] hover:bg-[#1E2D4A] text-slate-200 text-xs font-medium border border-[#263449] transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              {/* PDF Export */}
              <button
                onClick={() => handleDownload('pdf')}
                disabled={downloadingFormat !== null}
                className="px-3 py-1.5 rounded-lg bg-[#162237] hover:bg-[#1E2D4A] disabled:opacity-50 text-slate-200 text-xs font-medium border border-[#263449] transition-colors flex items-center gap-1.5"
              >
                {downloadingFormat === 'pdf' ? (
                  <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5 text-red-400" />
                )}
                <span>Export PDF</span>
              </button>

              {/* CSV Export */}
              <button
                onClick={() => handleDownload('csv')}
                disabled={downloadingFormat !== null}
                className="px-3 py-1.5 rounded-lg bg-[#162237] hover:bg-[#1E2D4A] disabled:opacity-50 text-slate-200 text-xs font-medium border border-[#263449] transition-colors flex items-center gap-1.5"
              >
                {downloadingFormat === 'csv' ? (
                  <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Export CSV</span>
              </button>

              {/* JSON Export */}
              <button
                onClick={() => handleDownload('json')}
                disabled={downloadingFormat !== null}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                {downloadingFormat === 'json' ? (
                  <Loader2 className="w-3.5 h-3.5 text-slate-950 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Export JSON</span>
              </button>
            </div>
          ) : undefined
        }
      />

      {/* Download Status Banners */}
      {downloadError && (
        <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center justify-between">
          <span>{downloadError}</span>
          <button onClick={() => setDownloadError(null)} className="text-red-400 hover:text-white ml-2 text-xs">✕</button>
        </div>
      )}

      {downloadSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {!activeScan ? (
        <div className="p-12 text-center text-xs text-[#8190A8] rounded-xl bg-[#111B2E] border border-[#263449]">
          No audit scans available to generate reports. Run a scan from the Security Audits page first.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Scan Selector if multiple */}
          {scans.length > 1 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#111B2E] border border-[#263449] overflow-x-auto text-xs">
              <span className="text-[#8190A8] shrink-0 font-medium">Select Audit Run:</span>
              {scans.slice(0, 6).map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelectScan(s)}
                  className={`px-3 py-1 rounded-md font-mono text-[11px] shrink-0 transition-colors ${
                    s.id === activeScan.id
                      ? 'bg-[#162237] text-[#F8FAFC] border border-cyan-400 font-bold'
                      : 'bg-[#0E1628] text-slate-400 hover:text-white border border-[#263449]'
                  }`}
                >
                  {s.id} ({new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </button>
              ))}
            </div>
          )}

          {/* Report Document Sheet */}
          <div className="p-8 rounded-xl bg-[#111B2E] border border-[#263449] space-y-6 text-slate-200">
            {/* Report Header */}
            <div className="pb-6 border-b border-[#263449] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-semibold block mb-1">
                  OFFICIAL AUDIT REPORT
                </span>
                <h2 className="text-xl font-bold text-[#F8FAFC]">
                  Shadow-Code Autonomous SDLC Security Assessment
                </h2>
                <p className="text-xs text-[#A7B3C7] mt-0.5 font-mono">
                  Report ID: {activeScan.id} • Target Branch: {activeScan.branch || 'main'}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-[#A7B3C7]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{new Date(activeScan.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Duration: {activeScan.duration_seconds}s</span>
                </div>
              </div>
            </div>

            {/* Executive Summary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-[#0E1628] border border-[#263449]">
                <span className="text-[11px] text-[#8190A8] uppercase font-medium block">Total Findings</span>
                <span className="text-xl font-bold text-[#F8FAFC] mt-0.5 block">{activeScan.total_findings}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#0E1628] border border-[#263449]">
                <span className="text-[11px] text-red-400 uppercase font-medium block">Critical Severity</span>
                <span className="text-xl font-bold text-red-400 mt-0.5 block">{activeScan.critical_count}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#0E1628] border border-[#263449]">
                <span className="text-[11px] text-orange-400 uppercase font-medium block">High Severity</span>
                <span className="text-xl font-bold text-orange-400 mt-0.5 block">{activeScan.high_count}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-[#0E1628] border border-[#263449]">
                <span className="text-[11px] text-amber-400 uppercase font-medium block">Medium Severity</span>
                <span className="text-xl font-bold text-amber-400 mt-0.5 block">{activeScan.medium_count}</span>
              </div>
            </div>

            {/* Findings Detail List */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                Enumerated Security Findings ({activeScan.findings?.length || 0})
              </h3>

              <div className="space-y-2.5">
                {activeScan.findings && activeScan.findings.map((f, i) => (
                  <div key={i} className="p-4 rounded-lg bg-[#0E1628] border border-[#263449] space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={f.severity} />
                        <span className="font-semibold text-white text-xs">{f.title}</span>
                      </div>
                      <span className="font-mono text-[11px] text-[#A7B3C7]">
                        {f.file_path}:{f.line_start}
                      </span>
                    </div>

                    <p className="text-xs text-[#A7B3C7] leading-relaxed">
                      {f.description}
                    </p>

                    <div className="pt-2 border-t border-[#263449]/70 flex flex-wrap gap-4 text-[11px] text-[#8190A8] font-mono">
                      <span>Rule: <strong className="text-slate-300">{f.rule_id}</strong></span>
                      <span>Engine: <strong className="text-slate-300 capitalize">{f.scanner}</strong></span>
                      <span>Classification: <strong className="text-cyan-300">{f.cwe_id || 'CWE'}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
