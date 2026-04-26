import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  CheckCircle2, 
  Trash2,
  Hash as HashIcon,
  Fingerprint
} from 'lucide-react';
import {
  PaneHeader,
  StatusBadge,
  ToolButton,
  ToolHeader,
  ToolPane,
  ToolShell
} from '../common/ToolChrome';

interface HashToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

const ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha512'] as const;
type HashAlgorithm = typeof ALGORITHMS[number];

export const HashTool: React.FC<HashToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [input, setInput] = useState<string>('');
  const [results, setResults] = useState<Record<HashAlgorithm, string>>({
    md5: '',
    sha1: '',
    sha256: '',
    sha512: ''
  });
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!input) {
      setResults({ md5: '', sha1: '', sha256: '', sha512: '' });
      return;
    }

    try {
      // Use Electron's Node integration
      if ((window as any).require) {
        const crypto = (window as any).require('crypto');
        const newResults = {} as Record<HashAlgorithm, string>;
        
        ALGORITHMS.forEach(algo => {
          newResults[algo] = crypto.createHash(algo).update(input).digest('hex');
        });
        
        setResults(newResults);
      } else {
        // Fallback for development mode in browser
        const mockResults = {} as Record<HashAlgorithm, string>;
        ALGORITHMS.forEach(algo => {
             mockResults[algo] = `[${algo} placeholder - requires Electron]`;
        });
        setResults(mockResults);
      }
    } catch (error) {
      console.error('Hash calculation error:', error);
    }
  }, [input]);

  const handleCopy = (text: string, algo: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(algo);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleClear = () => {
    setInput('');
  };

  return (
    <ToolShell>
      <ToolHeader icon={<HashIcon />} title={toolLabel} subtitle="MD5 · SHA-1 · SHA-256 · SHA-512">
        <StatusBadge icon={<Fingerprint size={11} />}>{input.length} chars input</StatusBadge>
        <ToolButton onClick={handleClear} icon={<Trash2 />} variant="ghost" disabled={!input}>
          Clear
        </ToolButton>
      </ToolHeader>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ToolPane className="shrink-0 border-b border-border-base">
          <PaneHeader title="Input" meta="text" />
          <div className="h-36 overflow-hidden bg-app-bg">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-full w-full resize-none bg-transparent p-4 font-mono text-sm leading-6 placeholder:text-text-secondary focus:outline-none"
              placeholder="Type or paste content here..."
              spellCheck={false}
            />
          </div>
        </ToolPane>

        <ToolPane>
          <PaneHeader title="Generated hashes" meta={`${ALGORITHMS.length} algorithms`} />
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
            {ALGORITHMS.map((algo) => (
              <div
                key={algo}
                className="grid grid-cols-[80px_1fr_auto] items-center gap-3 rounded-[var(--radius)] border border-border-base bg-panel-bg px-3 py-3 transition-colors hover:border-border-hover"
              >
                <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-accent">
                  {algo}
                </div>
                <div className="break-all font-mono text-xs leading-5 text-text-primary">
                  {results[algo] || <span className="italic text-text-secondary opacity-50">Waiting for input...</span>}
                </div>
                <ToolButton
                  onClick={() => handleCopy(results[algo], algo)}
                  disabled={!results[algo]}
                  icon={copyFeedback === algo ? <CheckCircle2 /> : <Copy />}
                  variant="ghost"
                  className="px-2"
                  title="Copy hash"
                />
              </div>
            ))}
          </div>
        </ToolPane>
      </div>
    </ToolShell>
  );
};
