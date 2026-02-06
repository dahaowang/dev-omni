import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Minimize2, 
  Maximize2, 
  Trash2, 
  CheckCircle2, 
  Copy, 
  AlertCircle,
  PanelLeft,
  AlertTriangle,
  Check
} from 'lucide-react';
import { ActionButton } from '../common/ActionButton';

interface JsonFormatterProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

const runLint = (json: any): string[] => {
  const warnings: string[] = [];
  
  const traverse = (obj: any, path: string = '', depth: number = 0) => {
    if (depth > 6) {
      warnings.push(`Deep nesting detected at '${path || 'root'}'. Consider flattening structure.`);
      return;
    }

    if (Array.isArray(obj)) {
      if (obj.length > 0) {
        // Check for mixed types in array (heuristic: check first 20 items)
        const types = new Set(obj.slice(0, 20).map(item => item === null ? 'null' : typeof item));
        if (types.size > 1) {
          warnings.push(`Array at '${path || 'root'}' contains mixed types: ${Array.from(types).join(', ')}.`);
        }
      }
      
      obj.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          traverse(item, `${path}[${index}]`, depth + 1);
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        warnings.push(`Empty object found at '${path || 'root'}'.`);
      }

      keys.forEach(key => {
        // Naming convention check: Spaces or special chars (heuristic)
        if (/[^a-zA-Z0-9_]/.test(key)) {
           warnings.push(`Key '${key}' at '${path}' contains special characters. Recommended: camelCase or snake_case.`);
        }
        
        traverse(obj[key], path ? `${path}.${key}` : key, depth + 1);
      });
    }
  };

  traverse(json);
  return warnings;
};

export const JsonFormatter: React.FC<JsonFormatterProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [stats, setStats] = useState({ chars: 0, lines: 0 });
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // Linting State
  const [lintWarnings, setLintWarnings] = useState<string[]>([]);
  const [outputTab, setOutputTab] = useState<'output' | 'lint'>('output');

  useEffect(() => {
    const placeholder = JSON.stringify({
      name: "DevOmni",
      type: "Application",
      features: ["JSON Format", "SQL Format", "Converters"],
      meta: {
        version: "1.0.0",
        author: "AI Engineer",
        "bad key example": "warning trigger"
      },
      emptyObj: {}
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
    // Basic validation on type
    try {
      if (newVal.trim() === '') {
        setIsValid(true);
        setLintWarnings([]);
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
      
      // Run Lint
      const warnings = runLint(parsed);
      setLintWarnings(warnings);
      // Optional: Auto-switch to lint tab if many warnings? No, annoying.
    } catch (error) {
      setOutput((error as Error).message);
      setIsValid(false);
      setLintWarnings([]);
    }
  };

  const handleCompact = () => {
    try {
      const parsed = JSON.parse(input);
      const compacted = JSON.stringify(parsed);
      setOutput(compacted);
      setIsValid(true);
      setLintWarnings(runLint(parsed));
    } catch (error) {
      setOutput((error as Error).message);
      setIsValid(false);
    }
  };

  const handleEscape = () => {
    try {
      const escaped = JSON.stringify(input);
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
    setLintWarnings([]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-app-bg text-text-primary">
      {/* Standard Header */}
      <div className="h-12 border-b border-border-base flex items-center px-4 bg-app-bg electron-drag select-none shrink-0 justify-between">
        <div className="flex items-center">
          {!isSidebarOpen && (
            <>
              {/* Traffic Light Spacer for macOS */}
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
            <h2 className="text-sm font-semibold text-text-primary tracking-wide">{toolLabel}</h2>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden p-6 pt-4">
        
        {/* Input Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg pr-2">
          <div className="flex items-center justify-between mb-2">
             <div className="text-sm font-bold text-text-secondary uppercase tracking-wider">Input</div>
             <button onClick={handleClear} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
               <Trash2 size={12} /> Clear
             </button>
          </div>
          <div className="flex-1 bg-panel-bg rounded-xl border border-border-base overflow-hidden relative group hover:border-accent/30 transition-colors shadow-[var(--shadow-card)]">
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-app-bg border-r border-border-base pt-4 text-right pr-2 text-text-secondary font-mono text-xs select-none">
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
        <div className="w-16 flex flex-col items-center justify-center space-y-4 px-2 pt-6">
           <ActionButton onClick={() => { handleFormat(input); setOutputTab('output'); }} icon={<ArrowRight size={18} />} label="Format" />
           <ActionButton onClick={handleCompact} icon={<Minimize2 size={18} />} label="Compact" />
           <ActionButton onClick={handleEscape} icon={<Maximize2 size={18} />} label="Escape" />
        </div>

        {/* Output Pane with Tabs */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg pl-2">
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setOutputTab('output')}
                  className={`text-sm font-bold uppercase tracking-wider transition-colors hover:text-text-primary ${
                    outputTab === 'output' ? 'text-text-primary border-b-2 border-accent' : 'text-text-secondary'
                  }`}
                >
                  Result
                </button>
                <button 
                  onClick={() => setOutputTab('lint')}
                  className={`text-sm font-bold uppercase tracking-wider transition-colors hover:text-text-primary flex items-center gap-2 ${
                    outputTab === 'lint' ? 'text-text-primary border-b-2 border-accent' : 'text-text-secondary'
                  }`}
                >
                  Lint
                  {lintWarnings.length > 0 && (
                    <span className="bg-orange-500/20 text-orange-500 text-[10px] px-1.5 rounded-full font-mono">
                      {lintWarnings.length}
                    </span>
                  )}
                </button>
             </div>
          </div>
          
          <div className="flex-1 bg-panel-bg rounded-xl border border-border-base overflow-hidden relative group hover:border-accent/30 transition-colors shadow-[var(--shadow-card)]">
            {outputTab === 'output' ? (
              <>
                <textarea
                  readOnly
                  spellCheck={false}
                  value={output}
                  className={`w-full h-full bg-transparent resize-none focus:outline-none p-4 font-mono text-sm leading-6 ${isValid ? 'text-accent' : 'text-red-400'}`}
                  placeholder='Result will appear here...'
                />
                
                <button 
                  onClick={handleCopy}
                  className="absolute bottom-4 right-4 bg-element-bg hover:brightness-105 text-text-primary px-4 py-2 rounded-lg border border-border-base flex items-center space-x-2 transition-all active:scale-95 shadow-sm"
                >
                  {copyFeedback ? <CheckCircle2 size={16} className="text-green-500"/> : <Copy size={16} />}
                  <span className="text-sm font-medium">{copyFeedback ? 'Copied!' : 'Copy Result'}</span>
                </button>
              </>
            ) : (
              <div className="w-full h-full overflow-y-auto p-4">
                 {lintWarnings.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-full text-text-secondary space-y-3 opacity-60">
                     <CheckCircle2 size={48} className="text-green-500" />
                     <p className="font-medium">No structure issues found.</p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {lintWarnings.map((warning, idx) => (
                       <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                          <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
                          <span className="text-sm text-text-primary">{warning}</span>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-8 bg-sidebar-bg border-t border-border-base flex items-center px-6 justify-between text-xs text-text-secondary shrink-0">
        <div className="flex items-center space-x-4">
          <span>Chars: <span className="text-text-primary">{stats.chars}</span></span>
          <span className="w-px h-3 bg-border-base"></span>
          <span>Lines: <span className="text-text-primary">{stats.lines}</span></span>
        </div>
        
        <div className="flex items-center space-x-2">
           {input.trim() !== '' && (
             isValid ? (
               <>
                 {lintWarnings.length > 0 ? (
                   <div className="flex items-center space-x-1 text-orange-500 cursor-pointer hover:underline" onClick={() => setOutputTab('lint')}>
                     <AlertTriangle size={12} />
                     <span className="font-medium">{lintWarnings.length} Issues</span>
                   </div>
                 ) : (
                   <div className="flex items-center space-x-1 text-green-500">
                      <Check size={12} />
                      <span className="font-medium">Clean</span>
                   </div>
                 )}
                 <span className="w-px h-3 bg-border-base mx-2"></span>
               </>
             ) : (
               <div className="flex items-center space-x-1 text-red-500">
                 <AlertCircle size={12} />
                 <span className="font-medium">Invalid</span>
               </div>
             )
           )}
           <span className="text-text-secondary">JSON</span>
        </div>
      </div>
    </div>
  );
};