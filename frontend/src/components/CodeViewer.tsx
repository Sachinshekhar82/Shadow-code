import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  language?: string;
  filename?: string;
  maxHeight?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language = 'bash',
  filename,
  maxHeight = 'max-h-72'
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-[#263449] bg-[#0A0F1D] overflow-hidden text-xs">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#263449] bg-[#0E1628]">
        <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>{filename || language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white hover:bg-[#162237] transition-colors"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <pre className={`p-3.5 font-mono text-[11px] leading-relaxed text-slate-200 overflow-x-auto ${maxHeight} whitespace-pre`}>
        <code>{code}</code>
      </pre>
    </div>
  );
};
