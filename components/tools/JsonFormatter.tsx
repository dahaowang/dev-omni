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

interface ErrorDetails {
  message: string;
  line: number;
  column: number;
}

// --- Diff Utils ---

type DiffType = 'same' | 'added' | 'removed';
interface DiffLine { type: DiffType; content: string; }
interface DiffRowItem { type: DiffType; content: string; lineNumber: number; }
interface DiffRow { left?: DiffRowItem; right?: DiffRowItem; }

// Generic Diff Algorithm (LCS) for Char-level diffs
function computeGenericDiff<T>(
  seq1: T[], 
  seq2: T[], 
  isEqual: (a: T, b: T) => boolean
): { type: DiffType, content: T }[] {
  
  let start = 0;
  while (start < seq1.length && start < seq2.length && isEqual(seq1[start], seq2[start])) {
    start++;
  }

  let end1 = seq1.length - 1;
  let end2 = seq2.length - 1;
  while (end1 >= start && end2 >= start && isEqual(seq1[end1], seq2[end2])) {
    end1--;
    end2--;
  }

  const mid1 = seq1.slice(start, end1 + 1);
  const mid2 = seq2.slice(start, end2 + 1);

  let diffs: { type: DiffType, content: T }[] = [];
  const m = mid1.length;
  const n = mid2.length;

  if (m === 0) {
    diffs = mid2.map(item => ({ type: 'added' as DiffType, content: item }));
  } else if (n === 0) {
    diffs = mid1.map(item => ({ type: 'removed' as DiffType, content: item }));
  } else {
    const width = n + 1;
    const dp = new Int32Array((m + 1) * width);

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (isEqual(mid1[i - 1], mid2[j - 1])) {
          dp[i * width + j] = dp[(i - 1) * width + (j - 1)] + 1;
        } else {
          const up = dp[(i - 1) * width + j];
          const left = dp[i * width + (j - 1)];
          dp[i * width + j] = up > left ? up : left;
        }
      }
    }

    let i = m, j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && isEqual(mid1[i - 1], mid2[j - 1])) {
        diffs.unshift({ type: 'same', content: mid1[i - 1] });
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i * width + (j - 1)] >= dp[(i - 1) * width + j])) {
        diffs.unshift({ type: 'added', content: mid2[j - 1] });
        j--;
      } else if (i > 0 && (j === 0 || dp[i * width + (j - 1)] < dp[(i - 1) * width + j])) {
        diffs.unshift({ type: 'removed', content: mid1[i - 1] });
        i--;
      }
    }
  }

  const prefix = seq1.slice(0, start).map(item => ({ type: 'same' as DiffType, content: item }));
  const suffix = seq1.slice(end1 + 1).map(item => ({ type: 'same' as DiffType, content: item }));

  return [...prefix, ...diffs, ...suffix];
}

// Line Diff Wrapper
function computeLineDiff(text1: string, text2: string): DiffLine[] {
  const lines1 = text1.split(/\r?\n/);
  const lines2 = text2.split(/\r?\n/);
  const diffs = computeGenericDiff(lines1, lines2, (a, b) => a === b);
  return diffs.map(d => ({ type: d.type, content: d.content }));
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

interface InlineDiffPart { type: DiffType; content: string; }

function computeInlineDiff(text1: string, text2: string): InlineDiffPart[] {
  const chars1 = text1.split('');
  const chars2 = text2.split('');
  const raw = computeGenericDiff(chars1, chars2, (a, b) => a === b);
  
  // Aggregate
  const aggregated: InlineDiffPart[] = [];
  if (raw.length === 0) return [];
  
  let current = raw[0];
  let buffer = current.content;
  
  for (let i = 1; i < raw.length; i++) {
    const next = raw[i];
    if (next.type === current.type) {
      buffer += next.content;
    } else {
      aggregated.push({ type: current.type, content: buffer });
      current = next;
      buffer = next.content;
    }
  }
  aggregated.push({ type: current.type, content: buffer });
  return aggregated;
}

const InlineDiffRenderer: React.FC<{ parts: InlineDiffPart[], displayType: 'left' | 'right' }> = ({ parts, displayType }) => {
  return (
    <span>
      {parts.map((part, idx) => {
        if (displayType === 'left') {
           // Show same and removed
           if (part.type === 'added') return null;
           return (
             <span key={idx} className={part.type === 'removed' ? 'bg-red-500/40 rounded-[2px]' : ''}>
               {part.content}
             </span>
           );
        } else {
           // Show same and added
           if (part.type === 'removed') return null;
           return (
             <span key={idx} className={part.type === 'added' ? 'bg-green-500/40 rounded-[2px]' : ''}>
               {part.content}
             </span>
           );
        }
      })}
    </span>
  );
};

// --- JSON Utils ---

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

const looseJsonParse = (str: string) => {
  try {
    // eslint-disable-next-line no-new-func
    return Function('"use strict";return (' + str + ')')();
  } catch (e) {
    return null;
  }
};

const parseJsonError = (e: Error, text: string): ErrorDetails => {
  let line = 1;
  let column = 1;
  
  const match = e.message.match(/at position (\d+)/);
  if (match) {
    const pos = parseInt(match[1], 10);
    for (let i = 0; i < pos && i < text.length; i++) {
      if (text[i] === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
  }
  return { message: e.message, line, column };
};

// --- Component ---

export const JsonFormatter: React.FC<JsonFormatterProps> = ({ isSidebarOpen, toggleSidebar, toolLabel, initialValue }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  
  const [isValid, setIsValid] = useState(true);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  
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

  // Validation & Auto-Format Effect
  useEffect(() => {
    if (!input.trim()) {
      setIsValid(true);
      setErrorDetails(null);
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setIsValid(true);
      setErrorDetails(null);
      
      // Auto-populate output if valid
      setOutput(JSON.stringify(parsed, null, 2));
      
      // If we are currently in diff mode but the input is now valid, 
      // we likely fixed it, so we can exit diff mode (optional UX choice, but requested flow implies real-time updates)
      // We'll keep diff mode strictly for the "Repair" action comparison, but update validity.
    } catch (e) {
      setIsValid(false);
      setErrorDetails(parseJsonError(e as Error, input));
    }
  }, [input]);

  // Actions
  const handleFormat = () => {
    try {
      const obj = JSON.parse(input);
      setOutput(JSON.stringify(obj, null, 2));
      setDiffMode(false);
    } catch (e) { /* ignore */ }
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
      setErrorDetails({ message: "Failed to repair automatically.", line: 0, column: 0 });
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
    setErrorDetails(null);
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

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-0">
        
        {/* Workspace: Split Panes */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* Left Pane: Input */}
          <div className="flex-1 flex flex-col min-w-0 bg-app-bg p-4 pr-2 border-r border-border-base">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                 <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">Input</span>
                 {diffMode && <span className="text-[10px] bg-accent/10 text-accent px-2 rounded-full font-medium">Click to Edit</span>}
              </div>
              <button onClick={handleClear} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
                <Trash2 size={12} /> Clear
              </button>
            </div>
            <div className={`flex-1 bg-panel-bg rounded-lg border overflow-hidden relative transition-colors ${
              !isValid && input ? 'border-red-500/30' : 'border-border-base focus-within:border-accent'
            }`}>
              {diffMode ? (
                  <div 
                    className="w-full h-full overflow-auto font-mono text-sm leading-6 cursor-text"
                    onClick={() => setDiffMode(false)} // Switch back to edit mode on click
                  >
                    {diffRows.map((row, idx) => {
                        let inlineDiffs: InlineDiffPart[] | null = null;
                        if (row.left && row.right && row.left.type === 'removed' && row.right.type === 'added') {
                           inlineDiffs = computeInlineDiff(row.left.content, row.right.content);
                        }
                        
                        return (
                            <div key={idx} className={`flex ${row.left?.type === 'removed' ? 'bg-red-500/10' : ''}`}>
                              <div className="w-10 shrink-0 text-right pr-3 select-none text-text-secondary/40 border-r border-border-base/50 bg-sidebar-bg/50">
                                  {row.left?.lineNumber}
                              </div>
                              <div className={`flex-1 pl-3 pr-2 whitespace-pre-wrap break-all ${
                                  row.left?.type === 'removed' ? 'text-text-primary' : 'text-text-secondary'
                              }`}>
                                  {inlineDiffs ? (
                                     <InlineDiffRenderer parts={inlineDiffs} displayType="left" />
                                  ) : (
                                     row.left?.content || ''
                                  )}
                              </div>
                            </div>
                        );
                    })}
                  </div>
              ) : (
                  <textarea
                    spellCheck={false}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full h-full bg-transparent resize-none focus:outline-none p-4 font-mono text-sm leading-6 text-text-primary placeholder-text-secondary"
                    placeholder='Paste JSON here...'
                  />
              )}
            </div>
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
                    {diffRows.map((row, idx) => {
                        let inlineDiffs: InlineDiffPart[] | null = null;
                        if (row.left && row.right && row.left.type === 'removed' && row.right.type === 'added') {
                           inlineDiffs = computeInlineDiff(row.left.content, row.right.content);
                        }

                        return (
                            <div key={idx} className={`flex ${row.right?.type === 'added' ? 'bg-green-500/10' : ''}`}>
                              <div className="w-10 shrink-0 text-right pr-3 select-none text-text-secondary/40 border-r border-border-base/50 bg-sidebar-bg/50">
                                  {row.right?.lineNumber}
                              </div>
                              <div className={`flex-1 pl-3 pr-2 whitespace-pre-wrap break-all ${
                                  row.right?.type === 'added' ? 'text-text-primary' : 'text-accent'
                              }`}>
                                  {inlineDiffs ? (
                                     <InlineDiffRenderer parts={inlineDiffs} displayType="right" />
                                  ) : (
                                     row.right?.content || ''
                                  )}
                              </div>
                            </div>
                        );
                    })}
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

        {/* Debug / Error Panel (VS Code Style) */}
        {!isValid && errorDetails && (
           <div className="h-32 shrink-0 border-t border-border-base bg-panel-bg flex flex-col animate-slide-up-fade shadow-xl z-10">
              <div className="h-8 border-b border-border-base flex items-center px-4 gap-2 bg-sidebar-bg/50">
                 <XCircle size={14} className="text-red-400" />
                 <span className="text-xs font-bold text-text-secondary uppercase tracking-wide">Problems</span>
                 <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 rounded-full min-w-[18px] text-center">1</span>
              </div>
              <div className="flex-1 overflow-auto p-0">
                 <div className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 cursor-pointer border-l-2 border-transparent hover:border-red-500 transition-colors group">
                    <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                       <span className="text-xs font-medium text-text-primary truncate font-mono" title={errorDetails.message}>
                          {errorDetails.message}
                       </span>
                       <div className="flex items-center gap-4 text-xs text-text-secondary shrink-0 font-mono opacity-70 group-hover:opacity-100">
                          <span>JSON</span>
                          <span>[Ln {errorDetails.line}, Col {errorDetails.column}]</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};