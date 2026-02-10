import React, { useState, useEffect } from 'react';
import { 
  PanelLeft, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  FileJson, 
  FileCode,
  ArrowRight,
  ArrowRightLeft
} from 'lucide-react';
// @ts-ignore
import { load, dump } from 'js-yaml';
import { LineNumberTextarea } from '../common/LineNumberTextarea';

interface JsonToYamlToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

type Mode = 'json2yaml' | 'yaml2json';

export const JsonToYamlTool: React.FC<JsonToYamlToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [mode, setMode] = useState<Mode>('json2yaml');
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      if (mode === 'json2yaml') {
        // JSON -> YAML
        const parsed = JSON.parse(input);
        const yaml = dump(parsed, { indent: 2, lineWidth: -1 });
        setOutput(yaml);
      } else {
        // YAML -> JSON
        const parsed = load(input);
        const json = JSON.stringify(parsed, null, 2);
        setOutput(json);
      }
      setError(null);
    } catch (err) {
      setError((err as Error).message);
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
    setOutput('');
    setError(null);
  };

  const toggleMode = () => {
    setMode(prev => prev === 'json2yaml' ? 'yaml2json' : 'json2yaml');
    setInput(output); // Optional: Swap content
    setOutput('');
    setError(null);
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

        {/* Toolbar */}
        <div className="flex items-center space-x-3 electron-no-drag">
           <div className="flex bg-panel-bg rounded-md p-1 border border-border-base">
             <button
               onClick={() => setMode('json2yaml')}
               className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                 mode === 'json2yaml'
                   ? 'bg-element-bg text-text-primary shadow-sm' 
                   : 'text-text-secondary hover:text-text-primary'
               }`}
             >
               JSON → YAML
             </button>
             <button
               onClick={() => setMode('yaml2json')}
               className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                 mode === 'yaml2json'
                   ? 'bg-element-bg text-text-primary shadow-sm' 
                   : 'text-text-secondary hover:text-text-primary'
               }`}
             >
               YAML → JSON
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
      <div className="flex-1 flex overflow-hidden">
        
        {/* Input Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg p-4 pr-0">
          <div className="flex items-center justify-between mb-2 pl-1 pr-4">
             <div className="flex items-center space-x-2 text-text-secondary">
                {mode === 'json2yaml' ? <FileJson size={14} /> : <FileCode size={14} />}
                <span className="text-sm font-medium">{mode === 'json2yaml' ? 'JSON Input' : 'YAML Input'}</span>
             </div>
             <button onClick={handleClear} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
               <Trash2 size={12} /> Clear
             </button>
          </div>
          <div className={`flex-1 bg-panel-bg rounded-lg border overflow-hidden transition-colors ${
            error ? 'border-red-900/50' : 'border-border-base focus-within:border-accent'
          }`}>
            <LineNumberTextarea
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'json2yaml' ? 'Paste JSON here...' : 'Paste YAML here...'}
              className="text-text-primary placeholder-text-secondary"
            />
          </div>
          {error && <div className="text-xs text-red-400 mt-2 ml-1 truncate">{error}</div>}
        </div>

        {/* Action Icon Spacer */}
        <div className="w-12 flex flex-col items-center justify-center pt-8 text-text-secondary opacity-50">
           <ArrowRight size={24} />
        </div>

        {/* Output Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg p-4 pl-0">
          <div className="flex items-center space-x-2 text-text-secondary mb-2 pl-1">
             {mode === 'json2yaml' ? <FileCode size={14} /> : <FileJson size={14} />}
             <span className="text-sm font-medium">{mode === 'json2yaml' ? 'YAML Output' : 'JSON Output'}</span>
          </div>
          <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden relative group hover:border-border-hover transition-colors">
            <LineNumberTextarea
              readOnly
              spellCheck={false}
              value={output}
              placeholder={mode === 'json2yaml' ? 'YAML result...' : 'JSON result...'}
              className="text-accent placeholder-text-secondary"
            />
            
            {/* Copy Button */}
            {output && !error && (
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