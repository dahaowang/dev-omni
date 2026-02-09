import React, { useState, useEffect, useCallback } from 'react';
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
  Check,
  ChevronRight,
  ChevronDown,
  Code2,
  ListTree,
  ChevronsDown,
  ChevronsUp
} from 'lucide-react';
import { ActionButton } from '../common/ActionButton';

// --- Types & Interfaces ---

interface JsonFormatterProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

interface JsonNodeProps {
  name?: string;
  value: any;
  isLast: boolean;
  level: number;
  expandDepth: number;
  // Used to force re-sync with expandDepth when global controls are used
  syncId: number; 
}

// --- Utils ---

const getType = (value: any): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

// --- JSON Tree Components ---

const JsonNode: React.FC<JsonNodeProps> = ({ name, value, isLast, level, expandDepth, syncId }) => {
  const [expanded, setExpanded] = useState(level < expandDepth);
  
  // Sync expansion state when global controls (syncId) change
  useEffect(() => {
    setExpanded(level < expandDepth);
  }, [expandDepth, level, syncId]);

  const type = getType(value);
  const isExpandable = type === 'object' || type === 'array';
  const isEmpty = isExpandable && Object.keys(value).length === 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const renderValue = () => {
    if (type === 'string') return <span className="text-[#a5d6ff] break-all">"{value}"</span>; // Soft Blue
    if (type === 'number') return <span className="text-[#ff9b5e]">{value}</span>; // Orange
    if (type === 'boolean') return <span className="text-[#79c0ff] font-semibold">{value.toString()}</span>; // Blue
    if (type === 'null') return <span className="text-gray-500 italic">null</span>;
    return <span className="text-text-primary">{String(value)}</span>;
  };

  const renderObjectContent = () => {
    const keys = Object.keys(value);
    if (keys.length === 0) return null;

    return keys.map((key, idx) => (
      <JsonNode
        key={key}
        name={key}
        value={value[key]}
        isLast={idx === keys.length - 1}
        level={level + 1}
        expandDepth={expandDepth}
        syncId={syncId}
      />
    ));
  };

  const renderArrayContent = () => {
    if (value.length === 0) return null;

    return value.map((item: any, idx: number) => (
      <JsonNode
        key={idx}
        value={item}
        isLast={idx === value.length - 1}
        level={level + 1}
        expandDepth={expandDepth}
        syncId={syncId}
      />
    ));
  };

  const indentSize = 1.25; // rem

  return (
    <div className="font-mono text-sm leading-6">
      <div 
        className={`flex items-start hover:bg-hover-overlay rounded-sm transition-colors cursor-pointer select-text ${!isExpandable ? 'cursor-default' : ''}`}
        style={{ paddingLeft: `${level * indentSize}rem` }}
        onClick={isExpandable && !isEmpty ? handleToggle : undefined}
      >
        {/* Toggle Icon */}
        <div className="w-5 h-6 flex items-center justify-center shrink-0 mr-1 text-text-secondary">
          {isExpandable && !isEmpty && (
            expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 break-words">
          {name && <span className="text-[#d2a8ff] mr-2">{name}:</span>} {/* Purple for keys */}
          
          {!isExpandable ? (
            <>
              {renderValue()}
              {!isLast && <span className="text-text-secondary">,</span>}
            </>
          ) : (
            <>
              <span className="text-text-secondary">{type === 'array' ? '[' : '{'}</span>
              
              {!expanded && !isEmpty && (
                <button 
                  onClick={handleToggle}
                  className="mx-1 px-1.5 py-0.5 text-[10px] bg-element-bg rounded text-text-secondary hover:text-text-primary hover:bg-border-base transition-colors select-none"
                >
                  {type === 'array' ? `${value.length} items` : '...'}
                </button>
              )}

              {isEmpty && <span className="text-text-secondary mx-1"></span>}

              {(!expanded || isEmpty) && (
                <>
                  <span className="text-text-secondary">{type === 'array' ? ']' : '}'}</span>
                  {!isLast && <span className="text-text-secondary">,</span>}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Children */}
      {isExpandable && expanded && !isEmpty && (
        <div>
          {type === 'array' ? renderArrayContent() : renderObjectContent()}
          <div 
            className="hover:bg-hover-overlay rounded-sm transition-colors"
            style={{ paddingLeft: `${level * indentSize}rem` }}
          >
             <div className="flex items-center">
               <div className="w-5 h-6 mr-1" /> {/* Spacer for icon alignment */}
               <span className="text-text-secondary">{type === 'array' ? ']' : '}'}</span>
               {!isLast && <span className="text-text-secondary">,</span>}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const JsonTree: React.FC<{ data: any, expandDepth: number, syncId: number }> = ({ data, expandDepth, syncId }) => {
  return (
    <div className="p-4 overflow-auto w-full h-full">
      <JsonNode 
        value={data} 
        isLast={true} 
        level={0} 
        expandDepth={expandDepth} 
        syncId={syncId}
      />
    </div>
  );
};

// --- Lint Logic ---

const runLint = (json: any): string[] => {
  const warnings: string[] = [];
  
  const traverse = (obj: any, path: string = '', depth: number = 0) => {
    if (depth > 6) {
      warnings.push(`Deep nesting detected at '${path || 'root'}'. Consider flattening structure.`);
      return;
    }

    if (Array.isArray(obj)) {
      if (obj.length > 0) {
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

// --- Main Component ---

export const JsonFormatter: React.FC<JsonFormatterProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [stats, setStats] = useState({ chars: 0, lines: 0 });
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // View State
  const [outputTab, setOutputTab] = useState<'output' | 'lint'>('output');
  const [viewMode, setViewMode] = useState<'code' | 'tree'>('code');
  
  // Tree Control State
  const [expandDepth, setExpandDepth] = useState<number>(2);
  const [syncId, setSyncId] = useState<number>(0);
  
  // Linting State
  const [lintWarnings, setLintWarnings] = useState<string[]>([]);

  useEffect(() => {
    const placeholder = JSON.stringify({
      name: "DevOmni",
      type: "Application",
      active: true,
      features: ["JSON Format", "Tree View", "Converters"],
      meta: {
        version: "1.0.0",
        author: {
           name: "Engineer",
           role: "Senior Frontend"
        },
        stats: {
           downloads: 1200,
           rating: 4.8
        }
      },
      configs: [
        { id: 1, setting: "Dark Mode" },
        { id: 2, setting: "Auto Save" }
      ]
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
    try {
      if (newVal.trim() === '') {
        setIsValid(true);
        setParsedData(null);
        setLintWarnings([]);
        return;
      }
      const parsed = JSON.parse(newVal);
      setParsedData(parsed);
      setIsValid(true);
    } catch (err) {
      setIsValid(false);
      setParsedData(null);
    }
  };

  const handleFormat = (textToFormat: string = input) => {
    try {
      const parsed = JSON.parse(textToFormat);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutput(formatted);
      setParsedData(parsed);
      setIsValid(true);
      setLintWarnings(runLint(parsed));
    } catch (error) {
      setOutput((error as Error).message);
      setIsValid(false);
      setLintWarnings([]);
      setParsedData(null);
    }
  };

  const handleCompact = () => {
    try {
      const parsed = JSON.parse(input);
      const compacted = JSON.stringify(parsed);
      setOutput(compacted);
      setParsedData(parsed);
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
    setParsedData(null);
    updateStats('');
    setIsValid(true);
    setLintWarnings([]);
  };

  // Tree Controls
  const triggerExpandAll = () => {
    setExpandDepth(100);
    setSyncId(s => s + 1);
  };

  const triggerCollapseAll = () => {
    setExpandDepth(0);
    setSyncId(s => s + 1); // Depth 0 collapses root children technically, or we can use 1 for root expanded
  };
  
  const triggerLevel = (lvl: number) => {
    setExpandDepth(lvl);
    setSyncId(s => s + 1);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-app-bg text-text-primary">
      {/* Standard Header */}
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

        {/* Output Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg pl-2">
          
          {/* Output Toolbar */}
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

             {/* Tree/Code Toggle & Controls */}
             {outputTab === 'output' && isValid && parsedData && (
               <div className="flex items-center space-x-2 bg-panel-bg rounded-md p-0.5 border border-border-base">
                 
                 {viewMode === 'tree' && (
                   <div className="flex items-center px-1 border-r border-border-base mr-1 gap-0.5">
                     <button 
                       onClick={triggerCollapseAll} 
                       className="p-1 hover:bg-hover-overlay rounded text-text-secondary hover:text-text-primary"
                       title="Collapse All"
                     >
                       <ChevronsUp size={14} />
                     </button>
                     <div className="flex text-[10px] font-mono text-text-secondary mx-1 gap-1">
                        <button onClick={() => triggerLevel(1)} className="hover:text-accent">1</button>
                        <button onClick={() => triggerLevel(2)} className="hover:text-accent">2</button>
                        <button onClick={() => triggerLevel(3)} className="hover:text-accent">3</button>
                     </div>
                     <button 
                       onClick={triggerExpandAll} 
                       className="p-1 hover:bg-hover-overlay rounded text-text-secondary hover:text-text-primary"
                       title="Expand All"
                     >
                       <ChevronsDown size={14} />
                     </button>
                   </div>
                 )}

                 <button
                   onClick={() => setViewMode('code')}
                   className={`p-1.5 rounded transition-all ${viewMode === 'code' ? 'bg-element-bg text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                   title="Code View"
                 >
                   <Code2 size={14} />
                 </button>
                 <button
                   onClick={() => setViewMode('tree')}
                   className={`p-1.5 rounded transition-all ${viewMode === 'tree' ? 'bg-element-bg text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                   title="Tree View"
                 >
                   <ListTree size={14} />
                 </button>
               </div>
             )}
          </div>
          
          <div className="flex-1 bg-panel-bg rounded-xl border border-border-base overflow-hidden relative group hover:border-accent/30 transition-colors shadow-[var(--shadow-card)] flex flex-col">
            
            {outputTab === 'output' ? (
              <>
                {viewMode === 'code' || !isValid || !parsedData ? (
                  <textarea
                    readOnly
                    spellCheck={false}
                    value={output}
                    className={`w-full h-full bg-transparent resize-none focus:outline-none p-4 font-mono text-sm leading-6 ${isValid ? 'text-accent' : 'text-red-400'}`}
                    placeholder='Result will appear here...'
                  />
                ) : (
                  <JsonTree 
                    data={parsedData} 
                    expandDepth={expandDepth} 
                    syncId={syncId} 
                  />
                )}
                
                {/* Copy Button (Only show on hover or always? Let's keep it visible but subtle) */}
                <button 
                  onClick={handleCopy}
                  className="absolute bottom-4 right-4 bg-element-bg hover:brightness-105 text-text-primary px-4 py-2 rounded-lg border border-border-base flex items-center space-x-2 transition-all active:scale-95 shadow-sm opacity-90 hover:opacity-100 z-10"
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
