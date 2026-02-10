import React, { useState, useEffect } from 'react';
import { 
  PanelLeft, 
  Copy, 
  CheckCircle2, 
  Trash2,
  Fingerprint
} from 'lucide-react';

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
    <div className="flex-1 flex flex-col h-full bg-app-bg text-text-primary">
      {/* Header */}
      <div className="h-12 border-b border-border-base flex items-center px-4 bg-app-bg electron-drag select-none shrink-0 justify-between">
        <div className="flex items-center">
          {!isSidebarOpen && (
            <>
              <div className="w-[70px] h-full shrink-0 electron-drag" />
              <button 
                onClick={toggleSidebar} 
                className="electron-no-drag p-1 mr-3 rounded-md text-text-secondary hover:text-text-primary hover:bg-hover-overlay transition-colors"
                title="Open Sidebar"
              >
                <PanelLeft size={18} />
              </button>
            </>
          )}
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-text-primary tracking-wide mr-6">{toolLabel}</h2>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
        
          {/* Input Section */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2 px-1">
               <div className="text-sm font-medium text-text-secondary">Input Text</div>
               <button onClick={handleClear} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
                 <Trash2 size={12} /> Clear
               </button>
            </div>
            <div className="bg-panel-bg rounded-lg border border-border-base overflow-hidden focus-within:border-accent transition-colors h-32 shrink-0 shadow-sm">
              <textarea 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 className="w-full h-full bg-transparent resize-none p-4 font-mono text-sm leading-6 focus:outline-none placeholder-text-secondary"
                 placeholder="Type or paste content here..."
                 spellCheck={false}
              />
            </div>
          </div>

          {/* Outputs Section */}
          <div className="flex flex-col gap-3">
             <div className="text-sm font-medium text-text-secondary px-1 flex items-center gap-2">
                <Fingerprint size={16} />
                <span>Generated Hashes</span>
             </div>
             
             <div className="grid gap-3">
               {ALGORITHMS.map((algo) => (
                 <div 
                    key={algo} 
                    className="group bg-panel-bg border border-border-base rounded-lg p-4 flex flex-col gap-2 hover:border-accent/50 transition-colors shadow-sm"
                 >
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider bg-element-bg px-2 py-0.5 rounded border border-border-base">
                          {algo.toUpperCase()}
                       </span>
                       {results[algo] && (
                          <button 
                            onClick={() => handleCopy(results[algo], algo)}
                            className="text-text-secondary hover:text-text-primary opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                            title="Copy Hash"
                          >
                            {copyFeedback === algo ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                          </button>
                       )}
                    </div>
                    
                    <div className="font-mono text-sm text-accent break-all selection:bg-accent/20">
                       {results[algo] || <span className="text-text-secondary opacity-30 italic">Waiting for input...</span>}
                    </div>
                 </div>
               ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};