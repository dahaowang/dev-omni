import React, { useState, useEffect, useMemo } from 'react';
import { 
  PanelLeft, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  AlignLeft,
  Minimize2,
  ArrowDownAZ,
  Wrench,
  Copy,
  ArrowRightLeft
} from 'lucide-react';

interface JsonFormatterProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
  initialValue?: string;
}

// --- Utils: Diff Logic (Inline to keep self-contained as requested by style) ---

type DiffType = 'same' | 'added' | 'removed';
interface DiffLine { type: DiffType; content: string; }
interface DiffRowItem { type: DiffType; content: string; lineNumber: number; }
interface DiffRow { left?: DiffRowItem; right?: DiffRowItem; }

function computeLineDiff(text1: string, text2: string): DiffLine[] {
  const lines1 = text1.split(/\r?\n/);
  const lines2 = text2.split(/\r?\n/);
  
  // Simple LCS implementation
  const m = lines1.length;
  const n = lines2.length;
  const dp = new Int32Array((m + 1) * (n + 1));
  const width = n + 1;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (lines1[i - 1] === lines2[j - 1]) {
        dp[i * width + j] = dp[(i - 1) * width + (j - 1)] + 1;
      } else {
        const up = dp[(i - 1) * width + j];
        const left = dp[i * width + (j - 1)];
        dp[i * width + j] = up > left ? up : left;
      }
    }
  }

  let i = m, j = n;
  const diffs: DiffLine[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
      diffs.unshift({ type: 'same', content: lines1[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i * width + (j - 1)] >= dp[(i - 1) * width + j])) {
      diffs.unshift({ type: 'added', content: lines2[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i * width + (j - 1)] < dp[(i - 1) * width + j])) {
      diffs.unshift({ type: 'removed', content: lines1[i - 1] });
      i--;
    }
  }
  return diffs;
}

function processDiffToRows(diffs: DiffLine[]): DiffRow[] {
  const rows: DiffRow[] = [];
  let bufferRemovals: DiffLine[] = [];
  let bufferAdditions: DiffLine[] = [];
  let originalLineNum = 1;
  let modifiedLineNum = 1;

  const flushBuffers = () => {
    const count = Math.max(bufferRemovals.length, bufferAdditions.length);
    for (let k = 0; k < count; k++) {
      rows.push({
        left: bufferRemovals[k] ? { ...bufferRemovals[k], lineNumber: originalLineNum++ } : undefined,
        right: bufferAdditions[k] ? { ...bufferAdditions[k], lineNumber: modifiedLineNum++ } : undefined
      });
    }
    bufferRemovals = [];
    bufferAdditions = [];
  };

  diffs.forEach(item => {
    if (item.type === 'same') {
      flushBuffers();
      rows.push({
        left: { ...item, lineNumber: originalLineNum++ },
        right: { ...item, lineNumber: modifiedLineNum++ }
      });
    } else if (item.type === 'removed') {
      bufferRemovals.push(item);
    } else if (item.type === 'added') {
      bufferAdditions.push(item);
    }
  });
  flushBuffers();
  return rows;
}

// --- Utils: JSON Logic ---

const sortObjectKeys = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.keys(obj).sort().reduce((acc, key) => {
      acc[key] = sortObjectKeys(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

// "Loose" parser to repair JSON (handles single quotes, trailing commas, unquoted keys)
const looseJsonParse = (str: string) => {
  try {
    // eslint-disable-next-line no-new-func
    return Function('"use strict";return (' + str + ')')();
  } catch (e) {
    return null;
  }
};

// --- Component ---

export const JsonFormatter: React.FC<JsonFormatterProps> = ({ isSidebarOpen, toggleSidebar, toolLabel, initialValue }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  
  const [isValid, setIsValid] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // View State
  const [diffMode, setDiffMode] = useState(false);
  const [repairedJson, setRepairedJson] = useState('');
  
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Initialize
  useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
    }
  }, [initialValue]);

  // Validation Effect
  useEffect(() => {
    if (!input.trim()) {
      setIsValid(true);
      setErrorMsg(null);
      return;
    }
    try {
      JSON.parse(input);
      setIsValid(true);
      setErrorMsg(null);
      // Auto-populate output if in diff mode or just generally? 
      // User request implies Format button is manual action, 
      // but usually editors update live. Let's keep output manual via buttons for "Format"
      // unless we are repairing.
    } catch (e) {
      setIsValid(false);
      setErrorMsg((e as Error).message);
    }
  }, [input]);

  // Actions
  const handleFormat = () => {
    try {
      const obj = JSON.parse(input);
      setOutput(JSON.stringify(obj, null, 2));
      setDiffMode(false);
    } catch (e) { /* ignore, disabled button */ }
  };

  const handleMinify = () => {
    try {
      const obj = JSON.parse(input);
      setOutput(JSON.stringify(obj));
      setDiffMode(false);
    } catch (e) { /* ignore */ }
  };

  const handleSort = () => {
    try {
      const obj = JSON.parse(input);
      const sorted = sortObjectKeys(obj);
      setOutput(JSON.stringify(sorted, null, 2));
      setDiffMode(false);
    } catch (e) { /* ignore */ }
  };

  const handleRepair = () => {
    const repairedObj = looseJsonParse(input);
    if (repairedObj) {
      const formatted = JSON.stringify(repairedObj, null, 2);
      setRepairedJson(formatted);
      setOutput(formatted);
      setDiffMode(true);
    } else {
      // If even loose parse fails, maybe try basic string replacements or show error
      // For this implementation, we assume loose parse covers most "repairable" cases.
      setErrorMsg("Failed to repair automatically.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output || (diffMode ? repairedJson : ''));
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setDiffMode(false);
    setIsValid(true);
  };

  // Diff Computation
  const diffRows = useMemo(() => {
    if (!diffMode) return [];
    const diffs = computeLineDiff(input, repairedJson);
    return processDiffToRows(diffs);
  }, [input, repairedJson, diffMode]);

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
              >
                <PanelLeft size={18} />
              </button>
            </>
          )}
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-text-primary tracking-wide">{toolLabel}</h2>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center space-x-3 electron-no-drag">
           {/* Validation Status */}
           <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md border ${
             isValid 
               ? 'bg-green-500/10 border-green-500/20 text-green-500' 
               : 'bg-red-500/10 border-red-500/20 text-red-400'
           }`}>
              {isValid ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              <span className="text-xs font-bold uppercase">{isValid ? 'Valid' : 'Invalid'}</span>
           </div>

           <div className="w-px h-4 bg-border-base mx-1" />

           {/* Actions */}
           <div className="flex bg-panel-bg rounded-md p-1 border border-border-base">
              <button
                 onClick={handleFormat}
                 disabled={!isValid || !input}
                 className="flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-sm transition-all text-text-secondary hover:text-text-primary hover:bg-hover-overlay disabled:opacity-30 disabled:cursor-not-allowed"
                 title="Format JSON"
              >
                 <AlignLeft size={14} />
                 <span>Format</span>
              </button>
              <button
                 onClick={handleMinify}
                 disabled={!isValid || !input}
                 className="flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-sm transition-all text-text-secondary hover:text-text-primary hover:bg-hover-overlay disabled:opacity-30 disabled:cursor-not-allowed"
                 title="Minify JSON"
              >
                 <Minimize2 size={14} />
                 <span>Minify</span>
              </button>
              <button
                 onClick={handleSort}
                 disabled={!isValid || !input}
                 className="flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-sm transition-all text-text-secondary hover:text-text-primary hover:bg-hover-overlay disabled:opacity-30 disabled:cursor-not-allowed"
                 title="Sort Keys"
              >
                 <ArrowDownAZ size={14} />
                 <span>Sort</span>
              </button>
           </div>

           <div className="w-px h-4 bg-border-base mx-1" />

           {/* Repair Button */}
           <button
             onClick={handleRepair}
             disabled={isValid || !input}
             className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all border ${
                !isValid && input
                  ? 'bg-accent text-white border-accent shadow-sm hover:brightness-110 active:scale-95'
                  : 'bg-element-bg border-border-base text-text-secondary opacity-50 cursor-not-allowed'
             }`}
             title="Attempt to repair invalid JSON"
           >
              <Wrench size={14} />
              <span>Repair</span>
           </button>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Pane: Input */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg p-4 pr-2 border-r border-border-base">
          <div className="flex items-center justify-between mb-2 px-1">
             <div className="text-sm font-bold text-text-secondary uppercase tracking-wider">Input</div>
             <button onClick={handleClear} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
               <Trash2 size={12} /> Clear
             </button>
          </div>
          <div className={`flex-1 bg-panel-bg rounded-lg border overflow-hidden relative transition-colors ${
             !isValid && input ? 'border-red-500/30' : 'border-border-base focus-within:border-accent'
          }`}>
             {/* If in diff mode, overlay the 'left' side of diff, OR just show textarea with highlights? 
                 Standard diff is side-by-side. We'll reuse the textarea for editing if not in diff mode.
                 If in diff mode, we render the Left Diff Column to show removals.
             */}
             {diffMode ? (
                <div className="w-full h-full overflow-auto font-mono text-sm leading-6">
                   {diffRows.map((row, idx) => (
                      <div key={idx} className={`flex ${row.left?.type === 'removed' ? 'bg-red-500/10' : ''}`}>
                         <div className="w-10 shrink-0 text-right pr-3 select-none text-text-secondary/40 border-r border-border-base/50 bg-sidebar-bg/50">
                            {row.left?.lineNumber}
                         </div>
                         <div className={`flex-1 pl-3 pr-2 whitespace-pre-wrap break-all ${
                            row.left?.type === 'removed' ? 'text-text-primary' : 'text-text-secondary'
                         }`}>
                            {row.left?.content || ''}
                         </div>
                      </div>
                   ))}
                </div>
             ) : (
                <textarea
                  spellCheck={false}
                  value={input}
                  onChange={(e) => {
                     setInput(e.target.value);
                     setDiffMode(false); // Reset diff on edit
                  }}
                  className="w-full h-full bg-transparent resize-none focus:outline-none p-4 font-mono text-sm leading-6 text-text-primary placeholder-text-secondary"
                  placeholder='Paste JSON here...'
                />
             )}
          </div>
          {!isValid && errorMsg && <div className="text-xs text-red-400 mt-2 px-1 font-mono truncate">{errorMsg}</div>}
        </div>

        {/* Right Pane: Output */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg p-4 pl-2">
          <div className="flex items-center justify-between mb-2 px-1">
             <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">Output</span>
                {diffMode && (
                   <span className="text-[10px] bg-accent/20 text-accent px-2 rounded-full font-medium flex items-center gap-1">
                     <ArrowRightLeft size={10} /> Diff View
                   </span>
                )}
             </div>
             {/* Copy Button */}
             {(output || repairedJson) && (
               <button 
                 onClick={handleCopy}
                 className="flex items-center space-x-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
               >
                 {copyFeedback ? <CheckCircle2 size={12} className="text-green-500"/> : <Copy size={12} />}
                 <span>{copyFeedback ? 'Copied' : 'Copy'}</span>
               </button>
             )}
          </div>
          
          <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden relative group hover:border-border-hover transition-colors">
             {diffMode ? (
                <div className="w-full h-full overflow-auto font-mono text-sm leading-6">
                   {diffRows.map((row, idx) => (
                      <div key={idx} className={`flex ${row.right?.type === 'added' ? 'bg-green-500/10' : ''}`}>
                         <div className="w-10 shrink-0 text-right pr-3 select-none text-text-secondary/40 border-r border-border-base/50 bg-sidebar-bg/50">
                            {row.right?.lineNumber}
                         </div>
                         <div className={`flex-1 pl-3 pr-2 whitespace-pre-wrap break-all ${
                            row.right?.type === 'added' ? 'text-text-primary' : 'text-accent'
                         }`}>
                            {row.right?.content || ''}
                         </div>
                      </div>
                   ))}
                </div>
             ) : (
                <textarea
                  readOnly
                  spellCheck={false}
                  value={output}
                  className="w-full h-full bg-transparent resize-none focus:outline-none p-4 font-mono text-sm leading-6 text-accent placeholder-text-secondary"
                  placeholder='Result will appear here...'
                />
             )}
          </div>
        </div>

      </div>
    </div>
  );
};