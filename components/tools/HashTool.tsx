import React, { useState, useEffect } from 'react';
import { 
  PanelLeft, 
  Copy, 
  CheckCircle2, 
  Trash2
} from 'lucide-react';

interface HashToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha512';

export const HashTool: React.FC<HashToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('md5');
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (!input) {
      setOutput('');
      return;
    }

    try {
      // Use Electron's Node integration
      if ((window as any).require) {
        const crypto = (window as any).require('crypto');
        const hash = crypto.createHash(algorithm).update(input).digest('hex');
        setOutput(hash);
      } else {
        // Fallback or development mode message
        setOutput('Error: Node integration not available. Run in Electron.');
      }
    } catch (error) {
      console.error('Hash calculation error:', error);
      setOutput('Error calculating hash');
    }
  }, [input, algorithm]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
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

        {/* Toolbar / Algorithm Selector */}
        <div className="flex items-center space-x-3 electron-no-drag">
           <div className="flex bg-panel-bg rounded-md p-1 border border-border-base">
             {(['md5', 'sha1', 'sha256', 'sha512'] as HashAlgorithm[]).map((algo) => (
               <button
                 key={algo}
                 onClick={() => setAlgorithm(algo)}
                 className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                   algorithm === algo 
                     ? 'bg-element-bg text-text-primary shadow-sm' 
                     : 'text-text-secondary hover:text-text-primary'
                 }`}
               >
                 {algo.toUpperCase()}
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-4">
        
        {/* Input Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 pl-1">
             <div className="text-sm font-medium text-text-secondary">Input Text</div>
             <button onClick={handleClear} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
               <Trash2 size={12} /> Clear
             </button>
          </div>
          <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden focus-within:border-accent transition-colors">
            <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               className="w-full h-full bg-transparent resize-none p-4 font-mono text-sm leading-6 focus:outline-none placeholder-text-secondary"
               placeholder="Type or paste content here to generate hash..."
               spellCheck={false}
            />
          </div>
        </div>

        {/* Output Section */}
        <div className="shrink-0">
          <div className="text-sm font-medium text-text-secondary mb-2 pl-1">
            Generated Hash ({algorithm.toUpperCase()})
          </div>
          <div className="relative bg-panel-bg rounded-lg border border-border-base overflow-hidden">
             <div className="p-4 pr-12 font-mono text-sm break-all text-accent min-h-[3.5rem] flex items-center">
               {output || <span className="text-text-secondary opacity-50">Hash will appear here...</span>}
             </div>
             
             {output && (
                <button 
                  onClick={handleCopy}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-text-secondary hover:text-text-primary hover:bg-hover-overlay rounded-md transition-colors"
                  title="Copy Hash"
                >
                  {copyFeedback ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                </button>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};