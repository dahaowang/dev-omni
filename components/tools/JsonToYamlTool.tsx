import React, { useState, useEffect } from 'react';
import { 
  PanelLeft, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  FileJson, 
  FileCode,
  ArrowRight
} from 'lucide-react';
import { ActionButton } from '../common/ActionButton';

interface JsonToYamlToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

// --- YAML Conversion Logic ---

const toYAML = (data: any, indentLevel = 0): string => {
  const indent = '  '.repeat(indentLevel);
  
  if (data === null) return 'null';
  if (data === undefined) return '';
  
  // Primitives
  if (typeof data !== 'object') {
    return JSON.stringify(data);
  }

  // Arrays
  if (Array.isArray(data)) {
    if (data.length === 0) return '[]';
    return data.map(item => {
      if (typeof item === 'object' && item !== null) {
        // Recursive call for object in array
        // We trim start to align the first key with the dash
        const itemYaml = toYAML(item, indentLevel + 1);
        return `${indent}- ${itemYaml.trimStart()}`; 
      } else {
        return `${indent}- ${toYAML(item, 0)}`; // 0 indent because it follows the dash immediately
      }
    }).join('\n');
  }

  // Objects
  const keys = Object.keys(data);
  if (keys.length === 0) return '{}';
  
  return keys.map(key => {
    const value = data[key];
    const valueType = typeof value;
    
    // Simple key handling (quote if contains special chars - simplified check)
    const formattedKey = /^[a-zA-Z0-9_]+$/.test(key) ? key : JSON.stringify(key);
    
    if (value === null) {
       return `${indent}${formattedKey}: null`;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) return `${indent}${formattedKey}: []`;
      return `${indent}${formattedKey}:\n${toYAML(value, indentLevel)}`; // Array handles its own indentation
    }
    
    if (valueType === 'object') {
      if (Object.keys(value).length === 0) return `${indent}${formattedKey}: {}`;
      return `${indent}${formattedKey}:\n${toYAML(value, indentLevel + 1)}`;
    }
    
    return `${indent}${formattedKey}: ${toYAML(value, 0)}`;
  }).join('\n');
};

export const JsonToYamlTool: React.FC<JsonToYamlToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
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
      const parsed = JSON.parse(input);
      const yaml = toYAML(parsed);
      setOutput(yaml);
      setError(null);
    } catch (err) {
      // Don't clear output immediately on typing error to prevent flashing, 
      // but do show error state.
      setError((err as Error).message);
    }
  }, [input]);

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
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Input Pane (JSON) */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg p-4 pr-0">
          <div className="flex items-center justify-between mb-2 pl-1 pr-4">
             <div className="flex items-center space-x-2 text-text-secondary">
                <FileJson size={14} />
                <span className="text-sm font-medium">JSON Input</span>
             </div>
             <button onClick={handleClear} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
               <Trash2 size={12} /> Clear
             </button>
          </div>
          <div className={`flex-1 bg-panel-bg rounded-lg border overflow-hidden transition-colors ${
            error ? 'border-red-900/50' : 'border-border-base focus-within:border-accent'
          }`}>
            <textarea
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-full bg-transparent resize-none focus:outline-none p-4 font-mono text-sm leading-6 text-text-primary placeholder-text-secondary"
              placeholder='Paste JSON here...'
            />
          </div>
          {error && <div className="text-xs text-red-400 mt-2 ml-1 truncate">{error}</div>}
        </div>

        {/* Action Icon Spacer */}
        <div className="w-12 flex flex-col items-center justify-center pt-8 text-text-secondary opacity-50">
           <ArrowRight size={24} />
        </div>

        {/* Output Pane (YAML) */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg p-4 pl-0">
          <div className="flex items-center space-x-2 text-text-secondary mb-2 pl-1">
             <FileCode size={14} />
             <span className="text-sm font-medium">YAML Output</span>
          </div>
          <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden relative group hover:border-border-hover transition-colors">
            <textarea
              readOnly
              spellCheck={false}
              value={output}
              className="w-full h-full bg-transparent resize-none focus:outline-none p-4 font-mono text-sm leading-6 text-accent placeholder-text-secondary"
              placeholder='YAML result...'
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