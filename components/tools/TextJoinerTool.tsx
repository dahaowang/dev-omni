import React, { useState, useEffect } from 'react';
import { 
  PanelLeft, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  ArrowRightLeft,
  ArrowDownToLine,
  ArrowUpFromLine
} from 'lucide-react';
import { ActionButton } from '../common/ActionButton';

interface TextJoinerToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

type Mode = 'join' | 'split';

const PRESETS = [
  { label: 'Comma', val: ',' },
  { label: 'Semi', val: ';' },
  { label: 'Pipe', val: '|' },
  { label: 'Space', val: ' ' },
  { label: 'Tab', val: '\t' },
];

export const TextJoinerTool: React.FC<TextJoinerToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('join');
  const [delimiter, setDelimiter] = useState(',');
  
  // Options
  const [trim, setTrim] = useState(true);
  const [ignoreEmpty, setIgnoreEmpty] = useState(true);
  
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    processText();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, mode, delimiter, trim, ignoreEmpty]);

  const processText = () => {
    if (!input) {
      setOutput('');
      return;
    }

    let result = '';
    
    if (mode === 'join') {
      // Split by newline, join by delimiter
      const lines = input.split(/\r?\n/);
      
      const processed = lines.filter(line => {
        if (ignoreEmpty && !line.trim()) return false;
        return true;
      }).map(line => {
        return trim ? line.trim() : line;
      });

      result = processed.join(delimiter);

    } else {
      // Split by delimiter, join by newline
      // Handle special case for 'new line' delimiter if user inputs escape seq? 
      // For now, treat delimiter as literal string unless it's specifically \t which we handle via preset input
      
      const parts = input.split(delimiter);
      
      const processed = parts.filter(part => {
        if (ignoreEmpty && !part.trim()) return false;
        return true;
      }).map(part => {
        return trim ? part.trim() : part;
      });

      result = processed.join('\n');
    }

    setOutput(result);
  };

  const handleCopy = () => {
    if (!output) return;
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

        {/* Top Controls */}
        <div className="flex items-center space-x-3 electron-no-drag">
           <div className="flex bg-panel-bg rounded-md p-1 border border-border-base">
             <button
               onClick={() => setMode('join')}
               className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                 mode === 'join'
                   ? 'bg-element-bg text-text-primary shadow-sm' 
                   : 'text-text-secondary hover:text-text-primary'
               }`}
             >
               <ArrowUpFromLine size={14} />
               <span>Join Lines</span>
             </button>
             <button
               onClick={() => setMode('split')}
               className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                 mode === 'split'
                   ? 'bg-element-bg text-text-primary shadow-sm' 
                   : 'text-text-secondary hover:text-text-primary'
               }`}
             >
               <ArrowDownToLine size={14} />
               <span>Split Text</span>
             </button>
           </div>
        </div>
      </div>

      {/* Configuration Bar */}
      <div className="p-4 border-b border-border-base bg-sidebar-bg/50 flex flex-wrap gap-4 items-center shrink-0">
         
         {/* Delimiter Input */}
         <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-text-secondary uppercase">Delimiter</span>
            <div className="relative">
              <input 
                type="text" 
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                placeholder=","
                className="w-24 bg-input-bg border border-border-base text-sm rounded px-2 py-1.5 focus:border-accent outline-none font-mono text-center"
              />
            </div>
         </div>

         {/* Presets */}
         <div className="flex items-center gap-1">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => setDelimiter(p.val)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                   delimiter === p.val 
                   ? 'bg-accent/10 border-accent text-accent font-medium' 
                   : 'bg-element-bg border-border-base text-text-secondary hover:text-text-primary hover:border-border-hover'
                }`}
                title={`Use ${p.label} as delimiter`}
              >
                {p.label}
              </button>
            ))}
         </div>

         <div className="w-px h-6 bg-border-base mx-2" />

         {/* Options */}
         <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={trim} 
                onChange={() => setTrim(!trim)}
                className="rounded border-border-base bg-input-bg text-accent focus:ring-0 w-3.5 h-3.5"
              />
              <span className="text-xs text-text-secondary group-hover:text-text-primary select-none">Trim Whitespace</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={ignoreEmpty} 
                onChange={() => setIgnoreEmpty(!ignoreEmpty)}
                className="rounded border-border-base bg-input-bg text-accent focus:ring-0 w-3.5 h-3.5"
              />
              <span className="text-xs text-text-secondary group-hover:text-text-primary select-none">Ignore Empty</span>
            </label>
         </div>

      </div>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        
        {/* Input */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-2 px-1">
             <div className="text-sm font-medium text-text-secondary">
               Input {mode === 'join' ? '(List)' : '(Single Line)'}
             </div>
             <button onClick={handleClear} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
               <Trash2 size={12} /> Clear
             </button>
          </div>
          <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden focus-within:border-accent transition-colors">
            <textarea
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-full bg-transparent resize-none p-4 font-mono text-sm leading-6 focus:outline-none placeholder-text-secondary"
              placeholder={mode === 'join' ? "Paste lines here..." : "Paste text to split here..."}
            />
          </div>
        </div>

        {/* Arrow visual */}
        <div className="flex flex-col justify-center items-center text-border-base">
           {mode === 'join' ? <ArrowRightLeft size={24} /> : <ArrowRightLeft size={24} className="rotate-90 md:rotate-0" />}
        </div>

        {/* Output */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-2 px-1">
             <div className="text-sm font-medium text-text-secondary">
               Output {mode === 'join' ? '(Single Line)' : '(List)'}
             </div>
          </div>
          <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden relative group hover:border-border-hover transition-colors">
            <textarea
              readOnly
              value={output}
              className="w-full h-full bg-transparent resize-none p-4 font-mono text-sm leading-6 focus:outline-none text-accent placeholder-text-secondary"
              placeholder="Result..."
            />
            {output && (
              <button 
                onClick={handleCopy}
                className="absolute bottom-4 right-4 bg-element-bg hover:brightness-110 text-text-primary px-4 py-2 rounded-md shadow-lg border border-border-base flex items-center space-x-2 transition-all active:scale-95"
              >
                {copyFeedback ? <CheckCircle2 size={16} className="text-green-500"/> : <Copy size={16} />}
                <span className="text-sm font-medium">{copyFeedback ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};