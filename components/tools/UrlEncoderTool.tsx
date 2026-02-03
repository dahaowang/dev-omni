import React, { useState, useEffect } from 'react';
import { 
  PanelLeft, 
  Copy, 
  CheckCircle2, 
  Trash2,
  ArrowRightLeft,
  Link as LinkIcon
} from 'lucide-react';

interface UrlEncoderToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

type Mode = 'encode' | 'decode';

export const UrlEncoderTool: React.FC<UrlEncoderToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (!input) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      let result = '';
      if (mode === 'encode') {
        result = encodeURIComponent(input);
      } else {
        result = decodeURIComponent(input);
      }
      setOutput(result);
      setError(null);
    } catch (err) {
      setOutput('');
      setError('Error: Malformed URL sequence.');
    }
  }, [input, mode]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleClear = () => {
    setInput('');
  };

  const toggleMode = () => {
    setMode(prev => prev === 'encode' ? 'decode' : 'encode');
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
          <h2 className="text-sm font-semibold text-text-primary tracking-wide mr-6">{toolLabel}</h2>
        </div>

        {/* Toolbar */}
        <div className="flex items-center space-x-3 electron-no-drag">
           <div className="flex bg-panel-bg rounded-md p-1 border border-border-base">
             <button
               onClick={() => setMode('encode')}
               className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                 mode === 'encode'
                   ? 'bg-element-bg text-text-primary shadow-sm' 
                   : 'text-text-secondary hover:text-text-primary'
               }`}
             >
               Encode
             </button>
             <button
               onClick={() => setMode('decode')}
               className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                 mode === 'decode'
                   ? 'bg-element-bg text-text-primary shadow-sm' 
                   : 'text-text-secondary hover:text-text-primary'
               }`}
             >
               Decode
             </button>
           </div>
           
           <div className="w-px h-4 bg-border-base mx-1" />

           <button 
              onClick={toggleMode}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-hover-overlay rounded transition-colors"
              title="Switch Mode"
           >
              <ArrowRightLeft size={16} />
           </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-4">
        
        {/* Input Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 pl-1">
             <div className="text-sm font-medium text-text-secondary">Input</div>
             <button onClick={handleClear} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
               <Trash2 size={12} /> Clear
             </button>
          </div>
          <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden focus-within:border-accent transition-colors">
            <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               className="w-full h-full bg-transparent resize-none p-4 font-mono text-sm leading-6 focus:outline-none placeholder-text-secondary"
               placeholder={mode === 'encode' ? "Enter text to encode..." : "Enter URL-encoded text to decode..."}
               spellCheck={false}
            />
          </div>
        </div>

        {/* Output Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 pl-1">
            <div className="text-sm font-medium text-text-secondary">
              Output <span className="text-xs opacity-50 ml-1">({mode === 'encode' ? 'URL Encoded' : 'Decoded'})</span>
            </div>
            {error && (
              <span className="text-xs text-red-400 font-medium">{error}</span>
            )}
          </div>
          <div className={`flex-1 bg-panel-bg rounded-lg border overflow-hidden relative group transition-colors ${
            error ? 'border-red-900/50' : 'border-border-base'
          }`}>
             <textarea 
               readOnly
               value={output}
               className={`w-full h-full bg-transparent resize-none p-4 font-mono text-sm leading-6 focus:outline-none ${
                 error ? 'text-red-400' : 'text-accent'
               } placeholder-text-secondary`}
               placeholder="Result will appear here..."
            />
             
             {output && !error && (
                <button 
                  onClick={handleCopy}
                  className="absolute bottom-4 right-4 bg-element-bg hover:brightness-110 text-text-primary px-4 py-2 rounded-md shadow-lg border border-border-base flex items-center space-x-2 transition-all active:scale-95"
                >
                  {copyFeedback ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                  <span className="text-sm font-medium">{copyFeedback ? 'Copied' : 'Copy'}</span>
                </button>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};
