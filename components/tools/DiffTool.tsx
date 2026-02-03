import React, { useState, useMemo, useEffect } from 'react';
import { 
  PanelLeft, 
  Split, 
  Edit3, 
  ArrowRightLeft,
  Trash2,
  Copy,
  CheckCircle2,
  MinusCircle,
  PlusCircle,
  Loader2,
  Star
} from 'lucide-react';

interface DiffToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

type DiffType = 'same' | 'added' | 'removed';

interface DiffLine {
  type: DiffType;
  content: string;
}

interface DiffRowItem {
  type: DiffType;
  content: string;
  lineNumber: number;
}

interface DiffRow {
  left?: DiffRowItem;
  right?: DiffRowItem;
}

// Optimized Diff Algorithm
const computeLineDiff = (text1: string, text2: string): DiffLine[] => {
  const lines1 = text1.split(/\r?\n/);
  const lines2 = text2.split(/\r?\n/);

  // 1. Prefix Optimization
  let start = 0;
  while (
    start < lines1.length && 
    start < lines2.length && 
    lines1[start] === lines2[start]
  ) {
    start++;
  }

  // 2. Suffix Optimization
  let end1 = lines1.length - 1;
  let end2 = lines2.length - 1;
  while (
    end1 >= start && 
    end2 >= start && 
    lines1[end1] === lines2[end2]
  ) {
    end1--;
    end2--;
  }

  // The middle part that actually changed
  const mid1 = lines1.slice(start, end1 + 1);
  const mid2 = lines2.slice(start, end2 + 1);

  let diffs: DiffLine[] = [];

  const m = mid1.length;
  const n = mid2.length;

  // Handle empty middle cases (pure additions or removals)
  if (m === 0) {
    diffs = mid2.map(l => ({ type: 'added', content: l }));
  } else if (n === 0) {
    diffs = mid1.map(l => ({ type: 'removed', content: l }));
  } else {
    // LCS with flattened 1D array for memory efficiency
    const width = n + 1;
    const dp = new Int32Array((m + 1) * width);
    
    // Accessor helpers inline (compiler optimizes these in JS usually, but manual indexing is safer for perf)
    // dp[i * width + j]
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (mid1[i - 1] === mid2[j - 1]) {
          dp[i * width + j] = dp[(i - 1) * width + (j - 1)] + 1;
        } else {
          const up = dp[(i - 1) * width + j];
          const left = dp[i * width + (j - 1)];
          dp[i * width + j] = up > left ? up : left;
        }
      }
    }

    // Backtrack to generate diff
    let i = m, j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && mid1[i - 1] === mid2[j - 1]) {
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

  // Reconstruct full result
  const prefix = lines1.slice(0, start).map(l => ({ type: 'same', content: l } as DiffLine));
  const suffix = lines1.slice(end1 + 1).map(l => ({ type: 'same', content: l } as DiffLine));

  return [...prefix, ...diffs, ...suffix];
};

// Align diffs side-by-side
const processDiffToRows = (diffs: DiffLine[]): DiffRow[] => {
  const rows: DiffRow[] = [];
  let bufferRemovals: DiffLine[] = [];
  let bufferAdditions: DiffLine[] = [];
  
  let originalLineNum = 1;
  let modifiedLineNum = 1;

  const flushBuffers = () => {
    const count = Math.max(bufferRemovals.length, bufferAdditions.length);
    for (let k = 0; k < count; k++) {
      const rem = bufferRemovals[k];
      const add = bufferAdditions[k];
      
      rows.push({
        left: rem ? { ...rem, lineNumber: originalLineNum++ } : undefined,
        right: add ? { ...add, lineNumber: modifiedLineNum++ } : undefined
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

  flushBuffers(); // Flush any remaining at the end
  return rows;
};

export const DiffTool: React.FC<DiffToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel, isFavorite, onToggleFavorite }) => {
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');
  const [mode, setMode] = useState<'edit' | 'view'>('edit');
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // Debounce State
  const [debouncedOriginal, setDebouncedOriginal] = useState('');
  const [debouncedModified, setDebouncedModified] = useState('');
  const [isComputing, setIsComputing] = useState(false);

  // Debounce Effect
  useEffect(() => {
    if (mode === 'view') {
      setIsComputing(true);
      const handler = setTimeout(() => {
        setDebouncedOriginal(original);
        setDebouncedModified(modified);
        setIsComputing(false);
      }, 600); // 600ms debounce

      return () => clearTimeout(handler);
    }
  }, [original, modified, mode]);

  // Compute diffs and stats
  const { rows, stats } = useMemo(() => {
    if (mode !== 'view') return { rows: [], stats: { added: 0, removed: 0, total: 0 } };
    
    // Use debounced values here
    const linearDiff = computeLineDiff(debouncedOriginal, debouncedModified);
    const calculatedRows = processDiffToRows(linearDiff);
    
    const added = linearDiff.filter(l => l.type === 'added').length;
    const removed = linearDiff.filter(l => l.type === 'removed').length;
    const total = linearDiff.length;

    return { rows: calculatedRows, stats: { added, removed, total } };
  }, [debouncedOriginal, debouncedModified, mode]);

  const handleSwap = () => {
    setOriginal(modified);
    setModified(original);
  };

  const handleClear = () => {
    setOriginal('');
    setModified('');
    setMode('edit');
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(modified);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
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
              >
                <PanelLeft size={18} />
              </button>
            </>
          )}
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-text-primary tracking-wide mr-6">{toolLabel}</h2>
            <button 
              onClick={onToggleFavorite} 
              className="electron-no-drag text-text-secondary hover:text-accent transition-colors p-1 rounded-md hover:bg-hover-overlay"
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
               <Star size={16} className={isFavorite ? "fill-accent text-accent" : ""} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center space-x-2 electron-no-drag">
           {mode === 'edit' ? (
             <>
               <button onClick={handleSwap} className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-hover-overlay rounded transition-colors" title="Swap Inputs">
                 <ArrowRightLeft size={16} />
               </button>
               <button onClick={handleClear} className="p-1.5 text-text-secondary hover:text-red-400 hover:bg-hover-overlay rounded transition-colors" title="Clear All">
                 <Trash2 size={16} />
               </button>
               <div className="w-px h-4 bg-border-base mx-2" />
               <button 
                onClick={() => setMode('view')} 
                className="flex items-center space-x-2 px-3 py-1.5 bg-accent text-white rounded-md text-xs font-medium hover:opacity-90 shadow-sm"
               >
                 <Split size={14} />
                 <span>Compare</span>
               </button>
             </>
           ) : (
             <>
               <button onClick={handleClear} className="p-1.5 text-text-secondary hover:text-red-400 hover:bg-hover-overlay rounded transition-colors" title="Clear All">
                 <Trash2 size={16} />
               </button>
               <div className="w-px h-4 bg-border-base mx-2" />
               <button 
                onClick={() => setMode('edit')} 
                className="flex items-center space-x-2 px-3 py-1.5 bg-element-bg border border-border-base text-text-primary rounded-md text-xs font-medium hover:bg-hover-overlay shadow-sm"
               >
                 <Edit3 size={14} />
                 <span>Edit</span>
               </button>
             </>
           )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {mode === 'edit' ? (
          <div className="flex-1 flex flex-row">
            {/* Original Input */}
            <div className="flex-1 flex flex-col p-4 border-r border-border-base min-w-0">
               <div className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Original Text</div>
               <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden focus-within:border-accent transition-colors">
                 <textarea 
                    value={original}
                    onChange={(e) => setOriginal(e.target.value)}
                    className="w-full h-full bg-transparent resize-none p-4 font-mono text-sm leading-6 focus:outline-none placeholder-text-secondary"
                    placeholder="Paste original text here..."
                    spellCheck={false}
                 />
               </div>
            </div>

            {/* Modified Input */}
            <div className="flex-1 flex flex-col p-4 min-w-0">
               <div className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Modified Text</div>
               <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden focus-within:border-accent transition-colors">
                 <textarea 
                    value={modified}
                    onChange={(e) => setModified(e.target.value)}
                    className="w-full h-full bg-transparent resize-none p-4 font-mono text-sm leading-6 focus:outline-none placeholder-text-secondary"
                    placeholder="Paste modified text here..."
                    spellCheck={false}
                 />
               </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0 bg-app-bg">
            
            {/* Stats Header */}
            <div className="bg-app-bg border-b border-border-base py-3 px-6 flex items-center justify-between shrink-0">
               <div className="flex items-center space-x-6">
                 {isComputing ? (
                   <div className="flex items-center space-x-2 text-text-secondary">
                     <Loader2 size={16} className="animate-spin" />
                     <span className="text-sm font-medium">Computing diff...</span>
                   </div>
                 ) : (
                   <>
                     <div className="flex items-center space-x-2 text-red-400">
                        <MinusCircle size={16} />
                        <span className="font-semibold text-sm">{stats.removed} removals</span>
                     </div>
                     <div className="flex items-center space-x-2 text-green-500">
                        <PlusCircle size={16} />
                        <span className="font-semibold text-sm">{stats.added} additions</span>
                     </div>
                   </>
                 )}
               </div>

               <div className="flex items-center space-x-4">
                  <span className="text-xs text-text-secondary">{rows.length} rows</span>
                  <button 
                    onClick={handleCopyResult}
                    className="flex items-center space-x-1 text-xs font-medium text-text-primary hover:text-accent transition-colors"
                  >
                    {copyFeedback ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                    <span>{copyFeedback ? 'Copied' : 'Copy'}</span>
                  </button>
               </div>
            </div>

            {/* Diff View */}
            <div className={`flex-1 overflow-auto bg-app-bg ${isComputing ? 'opacity-50 pointer-events-none' : ''}`}>
              {rows.length === 0 ? (
                <div className="p-8 text-center text-text-secondary">No differences found or empty inputs.</div>
              ) : (
                <div className="flex flex-col min-w-fit font-mono text-xs">
                   {rows.map((row, idx) => (
                     <div key={idx} className="flex w-full group hover:bg-hover-overlay/50">
                        
                        {/* LEFT PANE */}
                        <div className={`flex-1 flex min-w-0 border-r border-border-base/40 ${
                          row.left?.type === 'removed' ? 'bg-red-500/10' : ''
                        }`}>
                           <div className="w-10 shrink-0 text-right pr-3 py-1 select-none text-text-secondary/40">
                             {row.left?.lineNumber}
                           </div>
                           <div className={`flex-1 pl-2 pr-2 py-1 whitespace-pre-wrap break-all ${
                             row.left?.type === 'removed' ? 'text-text-primary' : 'text-text-secondary'
                           }`}>
                             {row.left?.content}
                           </div>
                        </div>

                        {/* RIGHT PANE */}
                        <div className={`flex-1 flex min-w-0 ${
                          row.right?.type === 'added' ? 'bg-green-500/10' : ''
                        }`}>
                           <div className="w-10 shrink-0 text-right pr-3 py-1 select-none text-text-secondary/40">
                             {row.right?.lineNumber}
                           </div>
                           <div className={`flex-1 pl-2 pr-2 py-1 whitespace-pre-wrap break-all ${
                             row.right?.type === 'added' ? 'text-text-primary' : 'text-text-secondary'
                           }`}>
                             {row.right?.content}
                           </div>
                        </div>

                     </div>
                   ))}
                   {/* Extra space at bottom */}
                   <div className="h-8"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};