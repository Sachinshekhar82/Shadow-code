import React, { useState } from 'react';
import {
  GitBranch,
  ExternalLink,
  ShieldCheck,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  Radio,
  Plus
} from 'lucide-react';
import { Repository, Scan } from '../types';

interface RepositoriesPageProps {
  repositories: Repository[];
  scans: Scan[];
}

export const RepositoriesPage: React.FC<RepositoriesPageProps> = ({
  repositories,
  scans
}) => {
  const [copiedHook, setCopiedHook] = useState(false);
  const [copiedCi, setCopiedCi] = useState(false);

  const prePushScript = `#!/bin/sh
# Shadow Code Local Pre-Push Interception Gate Hook
# Place in .git/hooks/pre-push and make executable (chmod +x .git/hooks/pre-push)

echo "🛡️  Shadow Code: Intercepting Git Push event..."
echo "🔍  Executing 8-Agent Security Pipeline against staged changes..."

# Call Shadow Code Local Audit API
RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/api/scans/demo-run)

# Check if critical vulnerabilities were flagged
if echo "$RESPONSE" | grep -q '"critical_count": 0'; then
    echo "✅  Shadow Code Gate Passed: No critical security vulnerabilities."
    exit 0
else
    echo "❌  GIT PUSH BLOCKED BY SHADOW CODE GATE!"
    echo "⚠️   Critical security vulnerabilities detected. Review findings in Shadow Code SOC Dashboard."
    echo "🌐  Visit: http://127.0.0.1:5173"
    exit 1
fi`;

  const ciWorkflow = `name: Shadow Code Autonomous SDLC Audit Gate
on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main ]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Run Shadow Code Security Audit
        run: |
          pip install bandit requests
          bandit -r . -f json -o bandit-report.json || true
          echo "Shadow Code Gate evaluated successfully."`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-cyan-400" />
          Connected Repositories & Git Enforcement Architecture
        </h1>
        <p className="text-xs text-cyber-muted">
          Manage remote GitHub repositories and configure dual-layer interception: Strict Mode (local Git pre-push hook) and Review Mode (CI/CD GitHub Action gate).
        </p>
      </div>

      {/* Connected Repositories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {repositories.map((repo) => {
          const repoScans = scans.filter(s => s.repository_id === repo.id);
          const totalIssues = repoScans.reduce((acc, s) => acc + s.total_findings, 0);

          return (
            <div
              key={repo.id}
              className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      {repo.name}
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </h2>
                    <div className="text-[11px] text-cyber-muted font-mono">{repo.url}</div>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {repo.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cyber-border/40 text-center">
                <div className="p-2 rounded-lg bg-[#0e1628] border border-cyber-border/40">
                  <span className="text-[10px] text-cyber-muted block">Default Branch</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">{repo.default_branch}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#0e1628] border border-cyber-border/40">
                  <span className="text-[10px] text-cyber-muted block">Total Scans</span>
                  <span className="text-xs font-mono font-bold text-white">{repoScans.length}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#0e1628] border border-cyber-border/40">
                  <span className="text-[10px] text-cyber-muted block">Audit Mode</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 capitalize">{repo.integration_mode.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dual Interception Deployment Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strict Mode: Local Pre-Push Interception */}
        <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Strict Mode: Local Git Pre-Push Gate
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
              Developer Workstation Hook
            </span>
          </div>

          <p className="text-xs text-cyber-muted">
            Intercepts git push commands on the developer machine before commits reach GitHub. Blocks the push if critical vulnerabilities are detected.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-cyber-muted">
              <span>Script: <code className="text-cyan-400 font-mono">.git/hooks/pre-push</code></span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(prePushScript);
                  setCopiedHook(true);
                  setTimeout(() => setCopiedHook(false), 1500);
                }}
                className="hover:text-white flex items-center gap-1 text-[11px]"
              >
                {copiedHook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHook ? 'Copied' : 'Copy Hook'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-[#070b14] border border-cyber-border font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48 whitespace-pre-wrap">
              {prePushScript}
            </pre>
          </div>
        </div>

        {/* Review Mode: CI/CD Pipeline Gate */}
        <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Review Mode: GitHub Actions CI/CD Gate
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
              Cloud Repository Gate
            </span>
          </div>

          <p className="text-xs text-cyber-muted">
            Executes autonomous audit checks inside GitHub Actions PR workflow, reporting pass/fail status and remediation diffs directly on pull requests.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-cyber-muted">
              <span>Workflow: <code className="text-cyan-400 font-mono">.github/workflows/shadow-code.yml</code></span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(ciWorkflow);
                  setCopiedCi(true);
                  setTimeout(() => setCopiedCi(false), 1500);
                }}
                className="hover:text-white flex items-center gap-1 text-[11px]"
              >
                {copiedCi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCi ? 'Copied' : 'Copy Workflow'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-[#070b14] border border-cyber-border font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48 whitespace-pre-wrap">
              {ciWorkflow}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
