import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Split, 
  Edit3, 
  ArrowRightLeft,
  Trash2,
  Copy,
  CheckCircle2,
  MinusCircle,
  PlusCircle,
  Loader2,
  ChevronUp,
  ChevronDown,
  ScanText,
  Space,
  ArrowDownAZ,
  ArrowUpAZ,
  List
} from 'lucide-react';
import { LineNumberTextarea } from '../common/LineNumberTextarea';
import {
  PaneHeader,
  SegmentedControl,
  StatusBadge,
  StatusBar,
  ToolButton,
  ToolHeader,
  ToolPane,
  ToolShell
} from '../common/ToolChrome';

interface DiffToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

type DiffType = 'same' | 'added' | 'removed';

interface DiffPart {
  type: DiffType;
  content: string;
}

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

// --- Generalized LCS Algorithm ---

/**
 * Calculates the Longest Common Subsequence and returns the diff chunks.
 * @param seq1 Array of items (lines or chars)
 * @param seq2 Array of items
 * @param isEqual Comparator function
 * @returns Array of DiffPart
 */
function computeDiff<T>(
  seq1: T[], 
  seq2: T[], 
  isEqual: (a: T, b: T) => boolean
): { type: DiffType, content: T }[] {
  
  // 1. Prefix Optimization
  let start = 0;
  while (start < seq1.length && start < seq2.length && isEqual(seq1[start], seq2[start])) {
    start++;
  }

  // 2. Suffix Optimization
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
    diffs = mid2.map(item => ({ type: 'added', content: item }));
  } else if (n === 0) {
    diffs = mid1.map(item => ({ type: 'removed', content: item }));
  } else {
    // DP Matrix
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

    // Backtrack
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

// --- Specific Implementations ---

const normalize = (str: string) => str.trim().replace(/\s+/g, ' ');

const computeLineDiff = (text1: string, text2: string, ignoreWhitespace: boolean): DiffLine[] => {
  const lines1 = text1.split(/\r?\n/);
  const lines2 = text2.split(/\r?\n/);

  const comparator = (a: string, b: string) => {
    if (ignoreWhitespace) return normalize(a) === normalize(b);
    return a === b;
  };

  return computeDiff(lines1, lines2, comparator);
};

const computeInlineDiff = (text1: string, text2: string): DiffPart[] => {
  // We use a character based diff for inline highlighting
  // Simple equality check for characters
  const chars1 = text1.split('');
  const chars2 = text2.split('');
  
  const rawDiffs = computeDiff(chars1, chars2, (a, b) => a === b);
  
  // Aggregate adjacent chars of same type back into strings for rendering performance
  const aggregated: DiffPart[] = [];
  if (rawDiffs.length === 0) return [];

  let current = rawDiffs[0];
  // convert single char content to string holder
  let buffer = current.content; 
  
  for (let i = 1; i < rawDiffs.length; i++) {
    const next = rawDiffs[i];
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

// --- Components ---

const InlineDiffRenderer: React.FC<{ parts: DiffPart[], displayType: 'left' | 'right' }> = ({ parts, displayType }) => {
  return (
    <span>
      {parts.map((part, idx) => {
        // If we are rendering the LEFT side (Original), we show 'same' and 'removed'. We ignore 'added'.
        if (displayType === 'left') {
           if (part.type === 'added') return null;
           return (
             <span key={idx} className={part.type === 'removed' ? 'bg-red-500/40 rounded-[2px]' : ''}>
               {part.content}
             </span>
           );
        } else {
        // If we are rendering the RIGHT side (Modified), we show 'same' and 'added'. We ignore 'removed'.
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

export const DiffTool: React.FC<DiffToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');
  const [mode, setMode] = useState<'edit' | 'view'>('edit');
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // Options
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [showInlineDiff, setShowInlineDiff] = useState(true);
  const [sortMode, setSortMode] = useState<'none' | 'asc' | 'desc'>('none');

  // Debounce State
  const [debouncedOriginal, setDebouncedOriginal] = useState('');
  const [debouncedModified, setDebouncedModified] = useState('');
  const [isComputing, setIsComputing] = useState(false);

  // Navigation State
  const [currentChunkIndex, setCurrentChunkIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

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
    
    let text1 = debouncedOriginal;
    let text2 = debouncedModified;

    // Process sorting
    if (sortMode !== 'none') {
      const sortFn = (a: string, b: string) => sortMode === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
      text1 = text1.split(/\r?\n/).sort(sortFn).join('\n');
      text2 = text2.split(/\r?\n/).sort(sortFn).join('\n');
    }

    // Use debounced (and optionally sorted) values here
    const linearDiff = computeLineDiff(text1, text2, ignoreWhitespace);
    const calculatedRows = processDiffToRows(linearDiff);
    
    const added = linearDiff.filter(l => l.type === 'added').length;
    const removed = linearDiff.filter(l => l.type === 'removed').length;
    const total = linearDiff.length;

    return { rows: calculatedRows, stats: { added, removed, total } };
  }, [debouncedOriginal, debouncedModified, mode, ignoreWhitespace, sortMode]);

  // Compute chunks of changes for navigation
  const diffChunks = useMemo(() => {
    const chunks: {start: number, end: number}[] = [];
    if (mode !== 'view') return chunks;

    let start = -1;
    rows.forEach((row, idx) => {
      const isDiff = row.left?.type === 'removed' || row.right?.type === 'added';
      if (isDiff) {
        if (start === -1) start = idx;
      } else {
        if (start !== -1) {
          chunks.push({ start, end: idx - 1 });
          start = -1;
        }
      }
    });
    // Close pending chunk
    if (start !== -1) {
      chunks.push({ start, end: rows.length - 1 });
    }
    return chunks;
  }, [rows, mode]);

  // Reset navigation when rows change
  useEffect(() => {
    setCurrentChunkIndex(-1);
  }, [rows]);

  const scrollToChunk = (index: number) => {
    if (index >= 0 && index < diffChunks.length) {
      const chunk = diffChunks[index];
      const rowEl = document.getElementById(`diff-row-${chunk.start}`);
      if (rowEl) {
         rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleNextDiff = () => {
    if (diffChunks.length === 0) return;
    const next = currentChunkIndex + 1;
    const target = next >= diffChunks.length ? 0 : next;
    setCurrentChunkIndex(target);
    scrollToChunk(target);
  };

  const handlePrevDiff = () => {
    if (diffChunks.length === 0) return;
    const prev = currentChunkIndex - 1;
    const target = prev < 0 ? diffChunks.length - 1 : prev;
    setCurrentChunkIndex(target);
    scrollToChunk(target);
  };

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
    <ToolShell>
      <ToolHeader icon={<Split />} title={toolLabel} subtitle="compare text · inline changes · line sorting">
        {mode === 'edit' ? (
          <>
            <StatusBadge>{original.length + modified.length} chars</StatusBadge>
            <ToolButton onClick={handleSwap} icon={<ArrowRightLeft />}>
              Swap
            </ToolButton>
            <ToolButton onClick={handleClear} icon={<Trash2 />} variant="ghost">
              Clear
            </ToolButton>
            <ToolButton onClick={() => setMode('view')} icon={<Split />} variant="primary">
              Compare
            </ToolButton>
          </>
        ) : (
          <>
            <SegmentedControl
              value={sortMode}
              onChange={(value: 'none' | 'asc' | 'desc') => setSortMode(value)}
              options={[
                { value: 'none', label: 'Original', icon: <List /> },
                { value: 'asc', label: 'A-Z', icon: <ArrowDownAZ /> },
                { value: 'desc', label: 'Z-A', icon: <ArrowUpAZ /> }
              ]}
            />
            <ToolButton
              onClick={() => setIgnoreWhitespace(!ignoreWhitespace)}
              icon={<Space />}
              variant={ignoreWhitespace ? 'primary' : 'default'}
              title="Ignore whitespace"
            >
              Whitespace
            </ToolButton>
            <ToolButton
              onClick={() => setShowInlineDiff(!showInlineDiff)}
              icon={<ScanText />}
              variant={showInlineDiff ? 'primary' : 'default'}
              title="Inline highlighting"
            >
              Inline
            </ToolButton>
            <ToolButton onClick={() => setMode('edit')} icon={<Edit3 />}>
              Edit
            </ToolButton>
          </>
        )}
      </ToolHeader>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {mode === 'edit' ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
            <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
              <PaneHeader title="Original text" meta={`${original ? original.split('\n').length : 0} lines`} />
              <div className="relative min-h-0 flex-1 overflow-hidden">
                <LineNumberTextarea
                  value={original}
                  onChange={(e) => setOriginal(e.target.value)}
                  placeholder="Paste original text here..."
                  spellCheck={false}
                />
              </div>
            </ToolPane>

            <ToolPane>
              <PaneHeader title="Modified text" meta={`${modified ? modified.split('\n').length : 0} lines`} />
              <div className="relative min-h-0 flex-1 overflow-hidden">
                <LineNumberTextarea
                  value={modified}
                  onChange={(e) => setModified(e.target.value)}
                  placeholder="Paste modified text here..."
                  spellCheck={false}
                />
              </div>
            </ToolPane>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col bg-app-bg">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border-base bg-sidebar-bg px-4 py-2">
              <div className="flex items-center gap-3">
                {isComputing ? (
                  <StatusBadge icon={<Loader2 size={11} className="animate-spin" />}>Computing</StatusBadge>
                ) : (
                  <>
                    <StatusBadge tone="bad" icon={<MinusCircle size={11} />}>{stats.removed} removed</StatusBadge>
                    <StatusBadge tone="ok" icon={<PlusCircle size={11} />}>{stats.added} added</StatusBadge>
                    <StatusBadge>{rows.length} rows</StatusBadge>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {diffChunks.length > 0 && (
                  <div className="flex h-7 items-center rounded-[var(--radius-sm)] border border-border-base bg-panel-bg p-0.5">
                    <button
                      type="button"
                      onClick={handlePrevDiff}
                      className="inline-flex h-[22px] w-6 items-center justify-center rounded text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
                      title="Previous difference"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <span className="min-w-[3.5rem] px-2 text-center font-mono text-xs text-text-secondary">
                      {currentChunkIndex !== -1 ? currentChunkIndex + 1 : '-'} / {diffChunks.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextDiff}
                      className="inline-flex h-[22px] w-6 items-center justify-center rounded text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
                      title="Next difference"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                )}
                <ToolButton onClick={handleCopyResult} icon={copyFeedback ? <CheckCircle2 /> : <Copy />} disabled={!modified}>
                  {copyFeedback ? 'Copied' : 'Copy'}
                </ToolButton>
              </div>
            </div>

            <div ref={containerRef} className={`min-h-0 flex-1 overflow-auto bg-app-bg ${isComputing ? 'pointer-events-none opacity-50' : ''}`}>
              {rows.length === 0 ? (
                <div className="p-8 text-center text-text-secondary">No differences found or empty inputs.</div>
              ) : (
                <div className="flex flex-col min-w-fit font-mono text-xs pb-8">
                   {rows.map((row, idx) => {
                     const isSelected = currentChunkIndex !== -1 && idx >= diffChunks[currentChunkIndex].start && idx <= diffChunks[currentChunkIndex].end;
                     const isModifiedLine = row.left?.type === 'removed' && row.right?.type === 'added';
                     
                     // Calculate inline diffs if enabled and applicable
                     let inlineDiffs: DiffPart[] | null = null;
                     if (showInlineDiff && isModifiedLine && row.left && row.right) {
                        inlineDiffs = computeInlineDiff(row.left.content, row.right.content);
                     }

                     return (
                       <div 
                         key={idx} 
                         id={`diff-row-${idx}`}
                         className={`flex w-full group transition-colors duration-150 ${
                           isSelected ? 'bg-accent/5 relative z-10' : 'hover:bg-hover-overlay/50'
                         }`}
                       >
                          {isSelected && (
                             <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent" />
                          )}
                          
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
                               {inlineDiffs ? (
                                  <InlineDiffRenderer parts={inlineDiffs} displayType="left" />
                               ) : (
                                  row.left?.content
                               )}
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
                               {inlineDiffs ? (
                                  <InlineDiffRenderer parts={inlineDiffs} displayType="right" />
                               ) : (
                                  row.right?.content
                               )}
                             </div>
                          </div>

                       </div>
                     );
                   })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {mode === 'view' && (
        <StatusBar>
          <span>Changes <b className="font-medium text-text-primary">{diffChunks.length}</b></span>
          <span className="h-3 w-px bg-border-base" />
          <span>Removed <b className="font-medium text-text-primary">{stats.removed}</b></span>
          <span className="h-3 w-px bg-border-base" />
          <span>Added <b className="font-medium text-text-primary">{stats.added}</b></span>
        </StatusBar>
      )}
    </ToolShell>
  );
};
