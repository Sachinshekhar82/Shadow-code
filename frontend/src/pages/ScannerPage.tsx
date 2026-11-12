import React, { useState } from 'react';
import {
  Play,
  Upload,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Shield,
  Layers,
  Terminal,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { Scan, Finding } from '../types';
import { SeverityBadge, StatusBadge } from '../components/SeverityBadge';
import { createScan, fetchSampleCodes } from '../services/api';
import { PageHeader } from '../components/PageHeader';

interface ScannerPageProps {
  onScanCompleted: (scan: Scan) => void;
  onOpenFinding: (finding: Finding) => void;
  onNavigateToRemediation: (finding: Finding) => void;
}

export const ScannerPage: React.FC<ScannerPageProps> = ({
  onScanCompleted,
  onOpenFinding,
  onNavigateToRemediation
}) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [filename, setFilename] = useState('submission.py');
  const [scanMode, setScanMode] = useState('local_demo');
  const [isScanning, setIsScanning] = useState(false);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [stageProgress, setStageProgress] = useState<number>(0);
  const [resultScan, setResultScan] = useState<Scan | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load sample codes from API
  const handleLoadSample = async (type: 'vulnerable' | 'clean') => {
    try {
      const data: any = await fetchSampleCodes();
      if (type === 'vulnerable') {
        setCode(data.vulnerable?.code || data.vulnerable_code || '');
        setFilename(data.vulnerable?.filename || data.vulnerable_filename || 'vulnerable_service.py');
        setLanguage('python');
      } else {
        setCode(data.clean?.code || data.clean_code || '');
        setFilename(data.clean?.filename || data.clean_filename || 'secure_service.py');
        setLanguage('python');
      }
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg('Failed to load sample code from server');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('File too large (Max 2MB supported)');
      return;
    }

    setFilename(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'py') setLanguage('python');
    else if (ext === 'js' || ext === 'ts') setLanguage('javascript');
    else if (ext === 'java') setLanguage('java');
    else if (ext === 'c' || ext === 'cpp') setLanguage('c');

    const reader = new FileReader();
    reader.onload = (event) => {
      setCode(event.target?.result as string || '');
      setErrorMsg(null);
    };
    reader.readAsText(file);
  };

  const handleStartScan = async () => {
    if (!code.trim()) {
      setErrorMsg('Please paste code or load a sample before starting analysis.');
      return;
    }

    setIsScanning(true);
    setErrorMsg(null);
    setResultScan(null);

    const stages = [
      'Stage 1: AST Extraction & Asset Filtering...',
      'Stage 2: Running Semgrep & Bandit Static Rules...',
      'Stage 3: Contextual Threat Reasoning & CWE Correlation...',
      'Stage 4: Normalizing Findings & Security Policy Verification...'
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < stages.length) {
        setCurrentStage(stages[stepIdx]);
        setStageProgress(Math.round(((stepIdx + 1) / stages.length) * 85));
        stepIdx++;
      }
    }, 400);

    try {
      const responseScan = await createScan({
        code: code,
        filename: filename,
        language: language,
        scan_mode: scanMode
      });

      clearInterval(interval);
      setStageProgress(100);
      setCurrentStage('Security audit complete.');

      setResultScan(responseScan);
      onScanCompleted(responseScan);
    } catch (err: any) {
      clearInterval(interval);
      setErrorMsg(err.message || 'Security scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const lineCount = code ? code.split('\n').length : 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Security Audits"
        subtitle="Execute on-demand multi-engine security scans against source code files or test fixtures using Semgrep, Bandit, and AI threat modeling."
        icon={Shield}
      />

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-red-950/30 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Editor & Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Code Input & Textarea Area (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          {/* Editor Header Bar */}
          <div className="p-3 rounded-t-xl bg-[#0E1628] border border-[#263449] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-cyan-400" />
                {filename}
              </span>
              <span className="text-[#8190A8] font-mono text-[11px]">{lineCount} lines</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#8190A8]">
              <button
                onClick={() => handleLoadSample('vulnerable')}
                className="px-2.5 py-1 rounded bg-[#162237] hover:bg-[#1E2D4A] text-slate-200 hover:text-white border border-[#263449] transition-colors text-[11px]"
              >
                Load Vulnerable Sample
              </button>
              <button
                onClick={() => handleLoadSample('clean')}
                className="px-2.5 py-1 rounded bg-[#162237] hover:bg-[#1E2D4A] text-slate-200 hover:text-white border border-[#263449] transition-colors text-[11px]"
              >
                Load Clean Sample
              </button>

              <label className="cursor-pointer px-2.5 py-1 rounded bg-[#162237] hover:bg-[#1E2D4A] text-slate-200 hover:text-white border border-[#263449] transition-colors flex items-center gap-1 text-[11px]">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".py,.js,.ts,.java,.c,.cpp"
                />
              </label>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-2 py-1 rounded hover:bg-[#162237] text-slate-300 transition-colors flex items-center gap-1 text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Syntax Code Textarea with line numbers */}
          <div className="rounded-b-xl border border-t-0 border-[#263449] bg-[#0A0F1D] overflow-hidden">
            <div className="flex font-mono text-xs">
              {/* Line Numbers */}
              <div className="w-12 py-3 bg-[#0D1422] border-r border-[#263449] select-none text-right pr-3 text-slate-500 space-y-[2px]">
                {Array.from({ length: Math.max(1, lineCount) }).map((_, i) => (
                  <div key={i} className="leading-5 text-[11px]">{i + 1}</div>
                ))}
              </div>

              {/* Text Area */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="# Paste source code here or click 'Load Vulnerable Sample' above..."
                className="w-full py-3 px-4 bg-transparent text-slate-200 placeholder-slate-600 focus:outline-none resize-none font-mono text-xs leading-5 min-h-[380px]"
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* Scan Parameters & Actions (1 col) */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#111B2E] border border-[#263449] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Scan Configuration
            </h3>

            <div>
              <label className="text-[11px] text-[#8190A8] block mb-1 font-medium">Target Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#0A0F1D] border border-[#263449] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-sans"
              >
                <option value="python">Python (AST + Bandit + Semgrep)</option>
                <option value="javascript">JavaScript / TypeScript</option>
                <option value="java">Java (OWASP SAST)</option>
                <option value="c">C / C++ (Memory Safety)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#8190A8] block mb-1 font-medium">Policy Enforcement Mode</label>
              <select
                value={scanMode}
                onChange={(e) => setScanMode(e.target.value)}
                className="w-full bg-[#0A0F1D] border border-[#263449] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-sans"
              >
                <option value="local_demo">Audit Mode (Continuous Assessment)</option>
                <option value="strict">Strict Mode (Pre-Push Gate Block)</option>
                <option value="review">Review Mode (CI/CD PR Gating)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-[#263449]">
              <button
                onClick={handleStartScan}
                disabled={isScanning || !code.trim()}
                className="w-full py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Codebase...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Run Security Audit</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pipeline Stage Tracker */}
          {isScanning && (
            <div className="p-4 rounded-xl bg-[#0E1628] border border-[#263449] space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
                <span className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
                  Audit Pipeline Active
                </span>
                <span className="font-mono text-slate-300">{stageProgress}%</span>
              </div>
              <div className="w-full bg-[#162237] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${stageProgress}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {currentStage}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {resultScan && (
        <div className="p-5 rounded-xl bg-[#111B2E] border border-[#263449] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC]">
                Audit Results: {resultScan.total_findings} Findings Identified
              </h3>
              <p className="text-xs text-[#A7B3C7]">
                Duration: <span className="font-mono text-white">{resultScan.duration_seconds}s</span> • Commit: <span className="font-mono text-cyan-400">{resultScan.commit_sha}</span>
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#263449]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0E1628] text-[#8190A8] border-b border-[#263449] font-mono uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3.5">Severity</th>
                  <th className="py-2.5 px-3.5">Title</th>
                  <th className="py-2.5 px-3.5">File Location</th>
                  <th className="py-2.5 px-3.5">Classification</th>
                  <th className="py-2.5 px-3.5">Scanner Source</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263449]/60 text-slate-200 bg-[#111B2E]">
                {resultScan.findings && resultScan.findings.map((f) => (
                  <tr key={f.id} className="hover:bg-[#162237] transition-colors">
                    <td className="py-3 px-3.5">
                      <SeverityBadge severity={f.severity} />
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-[#F8FAFC]">
                      {f.title}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[#A7B3C7] text-[11px]">
                      {f.file_path}:{f.line_start}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-300">
                      {f.cwe_id || 'CWE'}
                    </td>
                    <td className="py-3 px-3.5 text-slate-400 capitalize">
                      {f.scanner}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenFinding(f)}
                          className="px-2.5 py-1 rounded bg-[#162237] hover:bg-[#1E2D4A] text-slate-200 text-[11px] font-medium border border-[#263449] transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => onNavigateToRemediation(f)}
                          className="px-2.5 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 text-[11px] font-medium border border-cyan-800/40 transition-colors flex items-center gap-1"
                        >
                          <span>Remediate</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
