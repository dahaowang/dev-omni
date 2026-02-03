import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Minimize2, 
  Maximize2, 
  Trash2, 
  CheckCircle2, 
  Copy, 
  AlertCircle,
  PanelLeft
} from 'lucide-react';
import { ActionButton } from '../common/ActionButton';

interface JsonFormatterProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

export const JsonFormatter: React.FC<JsonFormatterProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [stats, setStats] = useState({ chars: 0, lines: 0 });
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Load initial placeholder
  useEffect(() => {
    const placeholder = JSON.stringify({
      name: "DevOmni",
      type: "Application",
      features: ["JSON Format", "SQL Format", "Converters"],
      meta: {
        version: "1.0.0",
        author: "AI Engineer"
      }
    }, null, 4);
    setInput(placeholder);
    handleFormat(placeholder);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStats = (text: string) => {
    setStats({
      chars: text.length,
      lines: text.split('\n').length
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setInput(newVal);
    updateStats(newVal);
    
    // Auto-validate on type (optional, could be debounced)
    try {
      if (newVal.trim() === '') {
        setIsValid(true);
        return;
      }
      JSON.parse(newVal);
      setIsValid(true);
    } catch (err) {
      setIsValid(false);
    }
  };

  const handleFormat = (textToFormat: string = input) => {
    try {
      const parsed = JSON.parse(textToFormat);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutput(formatted);
      setIsValid(true);
    } catch (error) {
      setOutput((error as Error).message);
      setIsValid(false);
    }
  };

  const handleCompact = () => {
    try {
      const parsed = JSON.parse(input);
      const compacted = JSON.stringify(parsed);
      setOutput(compacted);
      setIsValid(true);
    } catch (error) {
      setOutput((error as Error).message);
      setIsValid(false);
    }
  };

  const handleEscape = () => {
    // Simple JSON string escape
    try {
      const escaped = JSON.stringify(input);
      // Remove the surrounding quotes added by stringify to just get the escaped content
      setOutput(escaped.slice(1, -1));
    } catch (error) {
      setOutput("Error escaping text");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    updateStats('');
    setIsValid(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-app-bg text-text-primary">
      {/* Tool Header */}
      <div className="h-12 border-b border-border-base flex items-center px-4 bg-app-bg electron-drag select-none shrink-0">
        
        {/* If sidebar is closed, we need to show the spacer for traffic lights and the toggle button */}
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

        {/* Current Tool Label */}
        <h2 className="text-sm font-semibold text-text-primary tracking-wide">{toolLabel}</h2>
        
        {/* Right side spacer to push content if needed, or actions */}
        <div className="flex-1 electron-drag"></div>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Input Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg p-4 pr-0">
          <div className="flex items-center justify-between mb-2 pl-1 pr-4">
             <div className="text-sm font-medium text-text-secondary">Input (Paste JSON)</div>
             <button onClick={handleClear} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
               <Trash2 size={12} /> Clear
             </button>
          </div>
          <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden relative group hover:border-border-hover transition-colors">
            {/* Line Numbers Fake */}
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-input-bg border-r border-border-base pt-4 text-right pr-2 text-text-secondary font-mono text-xs select-none">
              {Array.from({ length: Math.min(stats.lines, 20) }).map((_, i) => (
                <div key={i} className="leading-6">{i + 1}</div>
              ))}
              {stats.lines > 20 && <div>...</div>}
            </div>
            
            <textarea
              spellCheck={false}
              value={input}
              onChange={handleInputChange}
              className="w-full h-full bg-transparent resize-none focus:outline-none p-4 pl-12 font-mono text-sm leading-6 text-text-primary placeholder-text-secondary"
              placeholder='Paste your JSON here...'
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="w-16 flex flex-col items-center justify-center space-y-4 px-2 pt-8">
           <ActionButton onClick={() => handleFormat(input)} icon={<ArrowRight size={18} />} label="Format" />
           <ActionButton onClick={handleCompact} icon={<Minimize2 size={18} />} label="Compact" />
           <ActionButton onClick={handleEscape} icon={<Maximize2 size={18} />} label="Escape" />
        </div>

        {/* Output Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg p-4 pl-0">
          <div className="text-sm font-medium text-text-secondary mb-2 pl-1">Output (Result)</div>
          <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden relative group hover:border-border-hover transition-colors">
            <textarea
              readOnly
              spellCheck={false}
              value={output}
              className={`w-full h-full bg-transparent resize-none focus:outline-none p-4 font-mono text-sm leading-6 ${isValid ? 'text-accent' : 'text-red-400'}`}
              placeholder='Result will appear here...'
            />
            
            {/* Copy Button */}
            <button 
              onClick={handleCopy}
              className="absolute bottom-4 right-4 bg-element-bg hover:brightness-110 text-text-primary px-4 py-2 rounded-md shadow-lg border border-border-base flex items-center space-x-2 transition-all active:scale-95"
            >
              {copyFeedback ? <CheckCircle2 size={16} className="text-green-500"/> : <Copy size={16} />}
              <span className="text-sm font-medium">{copyFeedback ? 'Copied!' : 'Copy Result'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-8 bg-sidebar-bg border-t border-border-base flex items-center px-4 justify-between text-xs text-text-secondary shrink-0">
        <div className="flex items-center space-x-4">
          <span>Characters: <span className="text-text-primary">{stats.chars}</span></span>
          <span className="w-px h-3 bg-border-base"></span>
          <span>Lines: <span className="text-text-primary">{stats.lines}</span></span>
        </div>
        
        <div className="flex items-center space-x-2">
           {input.trim() !== '' && (
             isValid ? (
               <div className="flex items-center space-x-1 text-green-500">
                 <CheckCircle2 size={12} />
                 <span className="font-medium">Valid JSON</span>
               </div>
             ) : (
               <div className="flex items-center space-x-1 text-red-500">
                 <AlertCircle size={12} />
                 <span className="font-medium">Invalid JSON</span>
               </div>
             )
           )}
           <span className="w-px h-3 bg-border-base mx-2"></span>
           <span className="text-text-secondary">UTF-8</span>
           <span className="w-px h-3 bg-border-base mx-2"></span>
           <span className="text-text-secondary">JSON</span>
        </div>
      </div>
    </div>
  );
};