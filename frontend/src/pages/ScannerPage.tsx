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
  Cpu
} from 'lucide-react';
import { Scan, Finding } from '../types';
import { SeverityBadge, StatusBadge } from '../components/SeverityBadge';
import { createScan, fetchSampleCodes } from '../services/api';

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
      const data = await fetchSampleCodes();
      if (type === 'vulnerable') {
        setCode(data.vulnerable_code);
        setFilename(data.vulnerable_filename);
        setLanguage('python');
      } else {
        setCode(data.clean_code);
        setFilename(data.clean_filename);
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

    // Simulate animated step indicators matching backend stages
    const stages = [
      'Stage 1: Parser — Extracting AST and filtering assets...',
      'Stage 2: Pattern Scanner — Running Bandit & Semgrep pre-filters...',
      'Stage 3: Semantic Reasoner — Contextual intent & business logic analysis...',
      'Stage 4: CVE Correlator — Querying NVD / CWE threat intelligence matrix...',
      'Stage 5: Severity Ranker — Evaluating CVSS v3.1 context base scores...',
      'Stage 6: Report Writer — Plain-English security report synthesis...',
      'Stage 7: Surgeon — Fail-safe patch generation & AST syntax check...',
      'Stage 8: Adaptive Memory — Calibrating team preferences & feedback...'
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < stages.length) {
        setCurrentStage(stages[currentIdx]);
        setStageProgress(Math.round(((currentIdx + 1) / stages.length) * 100));
        currentIdx++;
      }
    }, 280);

    try {
      const scan = await createScan({
        code,
        language,
        filename,
        scan_mode: scanMode
      });
      clearInterval(interval);
      setCurrentStage('Scan Completed Successfully');
      setStageProgress(100);
      setResultScan(scan);
      onScanCompleted(scan);
    } catch (err: any) {
      clearInterval(interval);
      setErrorMsg(err.message || 'Scan execution failed');
    } finally {
      setIsScanning(false);
    }
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Code Security Scanner & Quarantine Gate
          </h1>
          <p className="text-xs text-cyber-muted">
            Analyze uncommitted code changes before they reach GitHub. Eight autonomous agents evaluate syntax, semantics, and threat intelligence.
          </p>
        </div>

        {/* Quick Sample Selectors */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLoadSample('vulnerable')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition-all flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            Load Vulnerable Sample
          </button>
          <button
            onClick={() => handleLoadSample('clean')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Load Clean Sample
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-lg text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Editor & Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Code Input (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between bg-[#11192c] px-4 py-2 rounded-t-xl border border-cyber-border text-xs text-cyber-muted">
            <div className="flex items-center gap-3">
              <span className="font-mono text-cyan-300 font-semibold">{filename}</span>
              <span>•</span>
              <span className="capitalize">{language}</span>
              <span>•</span>
              <span>{lineCount} lines</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".py,.js,.ts,.java,.cpp,.c,.go,.php"
                />
              </label>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="hover:text-white flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Syntax Code Textarea with line numbers */}
          <div className="relative rounded-b-xl border border-t-0 border-cyber-border bg-[#070b14] overflow-hidden">
            <div className="flex font-mono text-xs">
              {/* Line Numbers */}
              <div className="w-12 py-3 bg-[#0a0f1d] border-r border-cyber-border/40 select-none text-right pr-3 text-slate-600 space-y-[2px]">
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

        {/* Configuration & Trigger Controls (1 col) */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Scan Parameters
            </h3>

            <div>
              <label className="text-[11px] text-cyber-muted block mb-1">Target Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#0d1424] border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="python">Python (AST + Bandit)</option>
                <option value="javascript">JavaScript / TypeScript</option>
                <option value="java">Java (OWASP SAST)</option>
                <option value="c">C / C++ (Memory Safety)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-cyber-muted block mb-1">Audit Policy Mode</label>
              <select
                value={scanMode}
                onChange={(e) => setScanMode(e.target.value)}
                className="w-full bg-[#0d1424] border border-cyber-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="local_demo">Local Demo Mode (Full Insights)</option>
                <option value="strict">Strict Mode (Pre-Push Gate Block)</option>
                <option value="review">Review Mode (CI/CD Advisory)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-cyber-border/60">
              <button
                onClick={handleStartScan}
                disabled={isScanning || !code.trim()}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-400 text-black font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Pipeline...</span>
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

          {/* Pipeline Stage Live Tracker */}
          {isScanning && (
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/40 space-y-3 animate-pulse">
              <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
                <span className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
                  Orchestrator Active
                </span>
                <span className="font-mono">{stageProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${stageProgress}%` }}
                ></div>
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                {currentStage}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {resultScan && (
        <div className="p-6 rounded-xl bg-cyber-card border border-cyber-border space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cyber-border">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status={resultScan.status} />
                <span className="text-xs font-mono text-cyan-400">Scan ID: {resultScan.id.substring(0, 8)}</span>
                <span className="text-xs text-cyber-muted">• {(resultScan.duration_ms / 1000).toFixed(2)}s</span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Audit Results for {resultScan.filename}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-cyber-muted">Findings Breakdown:</span>
              <span className="px-2.5 py-1 rounded bg-red-500/15 text-red-400 font-bold font-mono text-xs border border-red-500/30">
                {resultScan.critical_count} Critical
              </span>
              <span className="px-2.5 py-1 rounded bg-orange-500/15 text-orange-400 font-bold font-mono text-xs border border-orange-500/30">
                {resultScan.high_count} High
              </span>
              <span className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-400 font-bold font-mono text-xs border border-amber-500/30">
                {resultScan.medium_count} Medium
              </span>
            </div>
          </div>

          {/* Finding Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Identified Vulnerabilities ({resultScan.findings.length})
            </h3>

            {resultScan.findings.length === 0 ? (
              <div className="p-8 rounded-lg bg-[#0e1628] text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-sm font-bold text-white">No Vulnerabilities Detected</div>
                <div className="text-xs text-cyber-muted">Code complies with secure development policies.</div>
              </div>
            ) : (
              resultScan.findings.map((finding) => (
                <div
                  key={finding.id}
                  className="p-4 rounded-lg bg-[#0e1627] border border-cyber-border hover:border-cyan-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={finding.severity} score={finding.numeric_score} />
                      <span className="text-xs font-mono text-cyan-400 font-bold">{finding.rule_id}</span>
                      {finding.cve_id && (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                          {finding.cve_id}
                        </span>
                      )}
                      <span className="text-xs text-cyber-muted">Line {finding.line_start}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{finding.title}</h4>
                    <p className="text-xs text-slate-300 line-clamp-2">{finding.description}</p>
                    <div className="text-[11px] text-cyber-muted font-mono">
                      Source: <span className="text-cyan-300">{finding.detection_source}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onOpenFinding(finding)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-cyber-border transition-colors"
                    >
                      Inspect Evidence
                    </button>
                    {finding.remediation && (
                      <button
                        onClick={() => onNavigateToRemediation(finding)}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black transition-colors"
                      >
                        Remediate Patch →
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
