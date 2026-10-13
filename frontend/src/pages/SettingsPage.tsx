import React, { useState } from 'react';
import {
  Settings,
  Info,
  Shield,
  Key,
  Database,
  GitBranch,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Cpu,
  Layers,
  Terminal
} from 'lucide-react';
import { SystemStatus } from '../types';

interface SettingsPageProps {
  status: SystemStatus | null;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ status }) => {
  const [activeTab, setActiveTab] = useState<'about' | 'integrations' | 'architecture'>('about');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            Project Architecture, Integrations & About
          </h1>
          <p className="text-xs text-cyber-muted">
            Institutional project information, literature survey context, integration configuration, and runtime diagnostic parameters.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-[#101728] p-1 rounded-lg border border-cyber-border text-xs">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'about'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-cyber-muted hover:text-white'
            }`}
          >
            About & Attribution
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'architecture'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-cyber-muted hover:text-white'
            }`}
          >
            Literature & Architecture
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'integrations'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-cyber-muted hover:text-white'
            }`}
          >
            Integrations & Diagnostics
          </button>
        </div>
      </div>

      {activeTab === 'about' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Institution Card */}
          <div className="p-6 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-[#0d1527] rounded-[10px] flex items-center justify-center">
                  <Shield className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">
                  Dayananda Sagar Academy of Technology & Management
                </h2>
                <div className="text-xs text-cyan-300 font-mono">
                  (Autonomous Institute under Visvesvaraya Technological University, Belagavi)
                </div>
                <div className="text-xs text-cyber-muted">
                  Department of Computer Science & Engineering — Cyber Security
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-cyber-border/60 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Project Credentials
                </h3>
                <div className="space-y-1.5 text-xs">
                  <div><strong className="text-white">Title:</strong> SHADOW-CODE: Agentic AI Framework for Autonomous Secure SDLC Auditing</div>
                  <div><strong className="text-white">Academic Semester:</strong> 7th Semester (2026–2027)</div>
                  <div><strong className="text-white">Review Milestone:</strong> Project Phase 2 — 1st Review Ready</div>
                  <div><strong className="text-white">Project Guide:</strong> Mr. Anitha R, Associate Professor</div>
                </div>
              </div>

              {/* Team Members */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Project Team Members
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#0e1628] border border-cyber-border">
                    <div className="font-bold text-white">Sachin Shekhar</div>
                    <div className="text-[11px] font-mono text-cyan-400">1DT23CY040</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0e1628] border border-cyber-border">
                    <div className="font-bold text-white">Abhinav Raj</div>
                    <div className="text-[11px] font-mono text-cyan-400">1DT23CY002</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0e1628] border border-cyber-border">
                    <div className="font-bold text-white">Ikshit Sinha</div>
                    <div className="text-[11px] font-mono text-cyan-400">1DT23CY022</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0e1628] border border-cyber-border">
                    <div className="font-bold text-white">Abhishek Anand</div>
                    <div className="text-[11px] font-mono text-cyan-400">1DT23CY003</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'architecture' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Literature Survey Gaps Addressed */}
          <div className="p-6 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Literature Survey & Academic Foundations
            </h3>
            <p className="text-xs text-cyber-muted">
              Gaps identified across state-of-the-art security research and directly addressed by Shadow Code:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-lg bg-[#0e1628] border border-cyber-border space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-white">LLMs in Software Security: A Survey (Z. Sheng, et al. 2025)</strong>
                  <span className="text-[10px] text-cyan-400 font-mono">arXiv 2025</span>
                </div>
                <p className="text-cyber-muted text-[11px]">
                  <strong>Gap Addressed:</strong> Struggles with false-positive rates; lacks a multi-agent orchestration system directly integrated into the developer's Git push pipeline.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0e1628] border border-cyber-border space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-white">From Large to Mammoth: Comparative Evaluation of LLMs (NDSS Symposium 2025)</strong>
                  <span className="text-[10px] text-cyan-400 font-mono">NDSS 2025</span>
                </div>
                <p className="text-cyber-muted text-[11px]">
                  <strong>Gap Addressed:</strong> Focuses solely on detection rather than remediation; performance fluctuates without static tools acting as a pre-filtering layer to save tokens.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0e1628] border border-cyber-border space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-white">Detecting Code Vulnerabilities using LLMs (IEEE DSN 2025)</strong>
                  <span className="text-[10px] text-cyan-400 font-mono">IEEE DSN 2025</span>
                </div>
                <p className="text-cyber-muted text-[11px]">
                  <strong>Gap Addressed:</strong> Patching success is limited without an adaptive feedback loop (Agent 8) that learns from human developer overrides and team-specific coding styles.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Integration Statuses */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Scanners */}
            <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">SAST Scanners</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-cyber-muted">Bandit SAST (Python):</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {status?.scanners_available.bandit ? 'ACTIVE' : 'UNAVAILABLE'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cyber-muted">Semgrep SAST:</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {status?.scanners_available.semgrep ? 'ACTIVE' : 'OPTIONAL (PATH)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cyber-muted">AST Grammar Engine:</span>
                  <span className="text-emerald-400 font-mono font-bold">ACTIVE</span>
                </div>
              </div>
            </div>

            {/* AI / LLM */}
            <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Semantic Reasoner</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-cyber-muted">Mode:</span>
                  <span className="text-cyan-400 font-mono font-bold">
                    {status?.llm_configured ? 'Live LLM Provider' : 'Deterministic Contextual'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cyber-muted">Provider:</span>
                  <span className="text-slate-300 font-mono">
                    {status?.llm_provider || 'Local AST Semantic Analyzer'}
                  </span>
                </div>
                <div className="text-[11px] text-cyber-muted">
                  Truthful Reporting: Unconfigured credentials run deterministic analyzer; never claiming synthetic LLM outputs.
                </div>
              </div>
            </div>

            {/* Threat Intel */}
            <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Vulnerability Intel</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-cyber-muted">Curated CVE Matrix:</span>
                  <span className="text-emerald-400 font-mono font-bold">ACTIVE (VERIFIED)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cyber-muted">NIST NVD Live API:</span>
                  <span className="text-cyan-400 font-mono font-bold">
                    {status?.nvd_configured ? 'CONNECTED' : 'LOCAL CACHE ACTIVE'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cyber-muted">Target GitHub:</span>
                  <span className="text-white font-mono text-[10px] truncate max-w-[130px]">
                    Sachinshekhar82/Shadow-code
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
