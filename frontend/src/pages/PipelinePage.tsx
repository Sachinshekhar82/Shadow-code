import React, { useState } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Terminal,
  FileCode,
  ShieldAlert,
  Brain,
  Wrench,
  Search,
  Image as ImageIcon
} from 'lucide-react';
import { Scan, AgentExecution } from '../types';

interface PipelinePageProps {
  scan: Scan | null;
}

export const PipelinePage: React.FC<PipelinePageProps> = ({ scan }) => {
  const [selectedAgentNumber, setSelectedAgentNumber] = useState<number>(1);
  const [activeView, setActiveView] = useState<'agents' | 'diagrams'>('agents');

  const agentsMetadata = [
    {
      number: 1,
      name: 'Parser / Receptionist',
      role: 'AST Construction & Logical Code Unit Decomposition',
      icon: FileCode,
      technologies: 'Python AST, Tree-sitter, Regex Lexer',
      description: 'Accepts source files, parses them into Abstract Syntax Trees, divides code into function/class chunks, and filters non-code assets.',
      slideStage: 'Stage 2: Structural Analysis & Pre-Filtering'
    },
    {
      number: 2,
      name: 'Pattern Scanner / Filter',
      role: 'Deterministic SAST & Token Pre-Filtering',
      icon: ShieldAlert,
      technologies: 'Bandit, Semgrep, OWASP Top 10 Patterns',
      description: 'Executes static security analyzers to flag syntax vulnerabilities and eliminates ~80-90% safe code before LLM calls to optimize token usage.',
      slideStage: 'Stage 2: Structural Analysis & Pre-Filtering'
    },
    {
      number: 3,
      name: 'Semantic Reasoner / Doctor',
      role: 'Intent, Context & Business-Logic Analysis',
      icon: Cpu,
      technologies: 'Deterministic Semantic Engine / Llama 3.3 / Claude',
      description: 'Reasons about code context, identifying deep flaws (e.g. Broken Object Level Authorization, state mutation without permission checks).',
      slideStage: 'Stage 3: Semantic Reasoning & Threat Intel'
    },
    {
      number: 4,
      name: 'CVE Correlator / Historian',
      role: 'NVD Threat Intelligence & RAG Retrieval',
      icon: Search,
      technologies: 'NIST NVD REST API, Curated CVE/CWE Matrix, ChromaDB',
      description: 'Queries vulnerability databases to map detected code vulnerabilities against global CVE identifiers and real-world exploit benchmarks.',
      slideStage: 'Stage 4: Threat Intelligence'
    },
    {
      number: 5,
      name: 'Severity Ranker / Judge',
      role: 'Context-Aware CVSS v3.1 Scoring',
      icon: Layers,
      technologies: 'CVSS v3.1 Calculator, Attack Vector Analysis',
      description: 'Assigns Critical/High/Medium/Low ratings and numeric scores, weighing endpoint exposure and adaptive repository sensitivity.',
      slideStage: 'Stage 4: Evaluation & Ranking'
    },
    {
      number: 6,
      name: 'Report Writer / Communicator',
      role: 'Plain-English Security Synthesis & Gate Decision',
      icon: Terminal,
      technologies: 'Plain-English Generator, Compliance Matrix',
      description: 'Translates technical jargon into actionable executive reports, separating static scanner findings from AI semantic assessments.',
      slideStage: 'Stage 5: Remediation & Reporting'
    },
    {
      number: 7,
      name: 'The Surgeon / Fixer',
      role: 'Fail-Safe Remediation & AST Syntax Check',
      icon: Wrench,
      technologies: 'Unified Diff, Python AST Grammar Validation, Snapshot Store',
      description: 'Synthesizes secure patch replacements, validates modified code syntax via AST, and safeguards against hallucinated code with instant rollback.',
      slideStage: 'Stage 5: Remediation & Reporting'
    },
    {
      number: 8,
      name: 'Adaptive Memory / Learner',
      role: 'Human-in-the-Loop Feedback Learning',
      icon: Brain,
      technologies: 'Repository Sensitivity Profiles, Adaptive Weights',
      description: 'Records developer accepted/overridden feedback decisions to calibrate future severity rankings for that specific repository without suppressing critical risks.',
      slideStage: 'Stage 6: Developer Feedback Loop'
    }
  ];

  const agentExecutions = scan?.agent_executions || [];
  const selectedExec = agentExecutions.find(ae => ae.agent_number === selectedAgentNumber);
  const selectedMeta = agentsMetadata.find(am => am.number === selectedAgentNumber);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Eight-Agent Autonomous Pipeline Architecture
          </h1>
          <p className="text-xs text-cyber-muted">
            Sequential and reactive LangGraph-style orchestration pipeline connecting code commit reception to fail-safe remediation.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-[#101728] p-1 rounded-lg border border-cyber-border text-xs">
          <button
            onClick={() => setActiveView('agents')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeView === 'agents'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-cyber-muted hover:text-white'
            }`}
          >
            Live Agent Execution
          </button>
          <button
            onClick={() => setActiveView('diagrams')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeView === 'diagrams'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-cyber-muted hover:text-white'
            }`}
          >
            Architecture Slides & Diagrams
          </button>
        </div>
      </div>

      {activeView === 'diagrams' ? (
        /* College Review PPT Presentation Diagrams */
        <div className="space-y-6 animate-fadeIn">
          <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              Dayananda Sagar Academy of Technology & Management — Review Slide Diagrams
            </h3>
            <p className="text-xs text-cyber-muted">
              Source presentation diagrams extracted directly from the reference slides (PP1 1st review.pptx & PP2 1st review.pdf).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Slide 10: System Architecture Flow</span>
                <span className="text-cyber-muted font-mono">image1.png</span>
              </div>
              <div className="rounded-lg overflow-hidden border border-cyber-border bg-[#0d1424] p-2 flex items-center justify-center">
                <img
                  src="/diagrams/image1.png"
                  alt="Architecture Diagram Slide 10"
                  className="max-h-72 object-contain rounded"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Slide 11: Multi-Agent Pipeline Interaction</span>
                <span className="text-cyber-muted font-mono">image2.png</span>
              </div>
              <div className="rounded-lg overflow-hidden border border-cyber-border bg-[#0d1424] p-2 flex items-center justify-center">
                <img
                  src="/diagrams/image2.png"
                  alt="Architecture Diagram Slide 11"
                  className="max-h-72 object-contain rounded"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Live 8-Agent Execution Pipeline */
        <div className="space-y-6 animate-fadeIn">
          {/* Agent Pipeline Flowchart Bar */}
          <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border overflow-x-auto">
            <div className="flex items-center gap-2 min-w-[800px] justify-between">
              {agentsMetadata.map((agent, idx) => {
                const Icon = agent.icon;
                const exec = agentExecutions.find(ae => ae.agent_number === agent.number);
                const isSelected = selectedAgentNumber === agent.number;
                const isCompleted = exec?.status === 'COMPLETED';

                return (
                  <React.Fragment key={agent.number}>
                    <button
                      onClick={() => setSelectedAgentNumber(agent.number)}
                      className={`flex flex-col items-center p-2.5 rounded-lg border transition-all text-center flex-1 max-w-[120px] ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                          : 'bg-[#0e1628] border-cyber-border hover:border-slate-600 text-slate-300'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#121c32] flex items-center justify-center mb-1 relative">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                        {isCompleted && (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 border border-[#0e1628]"></span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-cyan-300">Agent {agent.number}</span>
                      <span className="text-[10px] font-medium truncate w-full">{agent.name.split('/')[0]}</span>
                    </button>

                    {idx < agentsMetadata.length - 1 && (
                      <div className="text-slate-600 select-none">→</div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Selected Agent Details */}
          {selectedMeta && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Agent Overview (1 col) */}
              <div className="p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 flex items-center justify-center font-bold font-mono text-base">
                    {selectedMeta.number}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedMeta.name}</h3>
                    <div className="text-[11px] text-cyan-400 font-mono">{selectedMeta.slideStage}</div>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-cyber-muted block text-[10px] uppercase font-semibold">Primary Responsibility:</span>
                    <p className="text-slate-200 mt-0.5 font-medium">{selectedMeta.role}</p>
                  </div>

                  <div>
                    <span className="text-cyber-muted block text-[10px] uppercase font-semibold">Underlying Technologies:</span>
                    <p className="text-cyan-300 font-mono mt-0.5">{selectedMeta.technologies}</p>
                  </div>

                  <div>
                    <span className="text-cyber-muted block text-[10px] uppercase font-semibold">Architecture Description:</span>
                    <p className="text-slate-300 leading-relaxed mt-0.5">{selectedMeta.description}</p>
                  </div>
                </div>
              </div>

              {/* Execution Telemetry & Logs (2 cols) */}
              <div className="lg:col-span-2 p-5 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-cyber-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    Agent {selectedMeta.number} Execution Telemetry & Output
                  </h4>
                  {selectedExec && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-cyber-muted font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" /> {selectedExec.duration_ms}ms
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {selectedExec.status}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {selectedExec.deterministic_mode ? 'Deterministic Local' : 'Live Integration'}
                      </span>
                    </div>
                  )}
                </div>

                {selectedExec ? (
                  <div className="space-y-3">
                    {/* Output summary banner */}
                    <div className="p-3 rounded-lg bg-[#0d1527] border border-cyber-border text-xs text-slate-200">
                      <span className="text-cyan-400 font-bold block mb-1">Summary Result:</span>
                      {selectedExec.output_summary || 'Agent completed without error.'}
                    </div>

                    {/* Terminal execution log */}
                    <div>
                      <span className="text-cyber-muted block text-[10px] uppercase font-semibold mb-1">
                        Internal Execution Trace:
                      </span>
                      <pre className="p-4 rounded-lg bg-[#070b14] border border-cyber-border font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-64 whitespace-pre-wrap">
                        {selectedExec.logs || '[INFO] Execution logged cleanly.'}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-cyber-muted">
                    No execution record for this agent yet. Execute a scan from the Security Scanner page to trigger the pipeline.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
