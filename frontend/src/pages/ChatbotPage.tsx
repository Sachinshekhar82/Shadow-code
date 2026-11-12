import React, { useState, useEffect } from 'react';
import { Send, Bot, User, Shield, BookOpen, Sparkles, Cpu } from 'lucide-react';
import { sendChatMessage, fetchAIStatus, GeminiAIStatus } from '../services/api';
import { ChatResponse, ChatMessage } from '../types';
import { PageHeader } from '../components/PageHeader';

export const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hello! I am the **Shadow-Code Security Assistant**.\n\nI am grounded in your repository's static analysis records (Semgrep & Bandit), CWE/OWASP benchmarks, and sandbox remediation checks. You can query vulnerability mechanics, attack scenarios, or ask for remediation guidance.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<ChatResponse | null>(null);
  const [aiStatus, setAiStatus] = useState<GeminiAIStatus | null>(null);

  useEffect(() => {
    fetchAIStatus().then(setAiStatus).catch(() => {});
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const data = await sendChatMessage({ message: currentInput });
      setLastResponse(data);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Failed to fetch security reasoning: ${err.message || 'Network error'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'How does Shadow-Code detect and mitigate CWE-78 command injection?',
    'Explain the security risks of deserializing untrusted data with pickle.',
    'What is the recommended defense against SQL injection in database queries?',
    'Which OWASP Top 10 categories are covered by the scanning engines?',
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Security Chatbot"
        subtitle="Conversational DevSecOps assistant grounded in verified repository audit records, CWE guidelines, and sandbox remediation results."
        icon={Bot}
      />

      {/* AI Engine Status Banner */}
      {aiStatus && (
        <div className="flex flex-wrap items-center justify-between text-xs px-4 py-2.5 bg-[#111B2E] border border-[#263449] rounded-xl gap-2">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-[#8190A8] font-medium">AI Engine:</span>
            <span className="text-[#F8FAFC] font-mono font-semibold">
              Google Gemini ({aiStatus.model})
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
              aiStatus.available
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${aiStatus.available ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              {aiStatus.available ? 'Live Gemini Connected' : 'Deterministic Security Fallback Active'}
            </span>
          </div>
          <div className="text-[11px] text-[#8190A8]">
            {aiStatus.message}
          </div>
        </div>
      )}

      {/* Suggested Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => setInput(prompt)}
            className="text-left text-xs p-3 rounded-lg bg-[#111B2E] border border-[#263449] hover:border-cyan-500/40 hover:bg-[#162237] text-[#A7B3C7] hover:text-[#F8FAFC] transition-colors flex items-center gap-2.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{prompt}</span>
          </button>
        ))}
      </div>

      {/* Chat Window Container */}
      <div className="bg-[#111B2E] border border-[#263449] rounded-xl flex flex-col h-[520px] shadow-sm overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-[#162237] border border-[#263449] flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl p-4 text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#162237] border border-[#334155] text-[#F8FAFC]'
                    : 'bg-[#0E1628] border border-[#263449] text-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.timestamp && (
                  <div className="text-[10px] mt-2 text-[#8190A8] text-right">{m.timestamp}</div>
                )}
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-[#162237] border border-[#263449] flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 items-center text-xs text-cyan-400">
              <div className="w-8 h-8 rounded-lg bg-[#162237] border border-[#263449] flex items-center justify-center animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <span className="font-mono">Querying CWE knowledge base and audit records...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3.5 border-t border-[#263449] bg-[#0E1628] flex gap-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a vulnerability, CWE reference, or patch rationale..."
            className="flex-1 bg-[#0A0F1D] border border-[#263449] focus:border-cyan-400 rounded-lg px-3.5 py-2 text-xs text-white placeholder-[#8190A8] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* Citations Box */}
      {lastResponse && (
        <div className="bg-[#111B2E] border border-[#263449] rounded-xl p-4 text-xs text-[#A7B3C7] flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5 text-[#F8FAFC] font-semibold">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Citations & References:</span>
          </div>
          {lastResponse.cwe_citations.map((cwe, i) => (
            <span key={i} className="px-2 py-0.5 rounded bg-[#0E1628] border border-[#263449] text-cyan-300 font-mono text-[11px]">
              {cwe}
            </span>
          ))}
          {lastResponse.owasp_citations.map((owasp, i) => (
            <span key={i} className="px-2 py-0.5 rounded bg-[#0E1628] border border-[#263449] text-purple-300 font-mono text-[11px]">
              {owasp}
            </span>
          ))}
          <div className="text-[11px] text-[#8190A8] ml-auto italic">
            {lastResponse.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
