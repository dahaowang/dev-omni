import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Braces,
  Trash2, 
  CheckCircle2, 
  XCircle,
  AlignLeft,
  Minimize2,
  ArrowDownAZ,
  Wrench,
  Copy,
  ArrowRightLeft,
  Network,
  Code2,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
// @ts-ignore
import { jsonrepair } from 'jsonrepair';
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

interface JsonStats {
  keys: number;
  maxDepth: number;
  objects: number;
  arrays: number;
  sizeBytes: number;
  lines: number;
  chars: number;
}

// --- Diff Utils (unchanged) ---

type DiffType = 'same' | 'added' | 'removed';
interface DiffLine { type: DiffType; content: string; }
interface DiffRowItem { type: DiffType; content: string; lineNumber: number; }
interface DiffRow { left?: DiffRowItem; right?: DiffRowItem; }

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
           if (part.type === 'added') return null;
           return <span key={idx} className={part.type === 'removed' ? 'bg-red-500/40 rounded-[2px]' : ''}>{part.content}</span>;
        } else {
           if (part.type === 'removed') return null;
           return <span key={idx} className={part.type === 'added' ? 'bg-green-500/40 rounded-[2px]' : ''}>{part.content}</span>;
        }
      })}
    </span>
  );
};

// --- Tree View Component ---

const JsonTreeNode: React.FC<{ 
  name?: string; 
  value: any; 
  isLast: boolean; 
  level: number; 
}> = ({ name, value, isLast, level }) => {
  const [expanded, setExpanded] = useState(true);
  const isObject = typeof value === 'object' && value !== null;
  const isArray = Array.isArray(value);
  const isEmpty = isObject && Object.keys(value).length === 0;

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const renderValue = (val: any) => {
    if (typeof val === 'string') return <span className="text-green-400">"{val}"</span>;
    if (typeof val === 'number') return <span className="text-orange-400">{val}</span>;
    if (typeof val === 'boolean') return <span className="text-purple-400">{val.toString()}</span>;
    if (val === null) return <span className="text-gray-500">null</span>;
    return null;
  };

  const indent = level * 1.5;

  if (isObject && !isEmpty) {
    const keys = Object.keys(value);
    const bracketOpen = isArray ? '[' : '{';
    const bracketClose = isArray ? ']' : '}';
    const length = isArray ? value.length : keys.length;

    return (
      <div className="font-mono text-sm leading-6">
        <div 
          className="flex hover:bg-white/5 cursor-pointer rounded px-1 -ml-1 select-none"
          style={{ paddingLeft: `${indent}rem` }}
          onClick={toggle}
        >
          <div className="mr-1 mt-1 text-text-secondary">
             {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
          <div className="flex-1">
             {name && <span className="text-blue-400 mr-1">"{name}":</span>}
             <span className="text-text-primary">{bracketOpen}</span>
             {!expanded && (
               <span className="text-text-secondary mx-1 text-xs">
                 {isArray ? `Array(${length})` : `Object{${length}}`} ...
               </span>
             )}
             {!expanded && <span className="text-text-primary">{bracketClose}{!isLast && ','}</span>}
          </div>
        </div>
        
        {expanded && (
          <div>
            {keys.map((key, idx) => (
              <JsonTreeNode
                key={key}
                name={isArray ? undefined : key}
                value={value[key]}
                isLast={idx === keys.length - 1}
                level={level + 1}
              />
            ))}
            <div style={{ paddingLeft: `${indent + 1.25}rem` }} className="text-text-primary">
               {bracketClose}{!isLast && ','}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Primitive or Empty
  return (
    <div 
       className="font-mono text-sm leading-6 flex hover:bg-white/5 px-1 -ml-1 rounded"
       style={{ paddingLeft: `${indent + 1.25}rem` }}
    >
       <div className="flex-1">
         {name && <span className="text-blue-400 mr-1">"{name}":</span>}
         {isEmpty ? (
            <span className="text-text-primary">
              {isArray ? '[]' : '{}'}{!isLast && ','}
            </span>
         ) : (
            <span>
              {renderValue(value)}
              <span className="text-text-primary">{!isLast && ','}</span>
            </span>
         )}
       </div>
    </div>
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

const calculateJsonStats = (obj: any, text: string): JsonStats => {
   let keys = 0;
   let objects = 0;
   let arrays = 0;
   let maxDepth = 0;

   const traverse = (o: any, depth: number) => {
      if (depth > maxDepth) maxDepth = depth;
      
      if (Array.isArray(o)) {
         arrays++;
         o.forEach(i => traverse(i, depth + 1));
      } else if (typeof o === 'object' && o !== null) {
         objects++;
         Object.keys(o).forEach(k => {
            keys++;
            traverse(o[k], depth + 1);
         });
      }
   };

   traverse(obj, 1);

   // Blob size for bytes
   const sizeBytes = new Blob([text]).size;
   const lines = text.split('\n').length;
   const chars = text.length;

   return { keys, maxDepth, objects, arrays, sizeBytes, lines, chars };
};

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// --- Component ---

export const JsonFormatter: React.FC<JsonFormatterProps> = ({ isSidebarOpen, toggleSidebar, toolLabel, initialValue }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  
  const [isValid, setIsValid] = useState(true);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  
  // View State
  const [diffMode, setDiffMode] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'tree'>('code');
  const [repairedJson, setRepairedJson] = useState('');
  
  const [parsedObject, setParsedObject] = useState<any>(null);
  const [stats, setStats] = useState<JsonStats | null>(null);

  const [copyFeedback, setCopyFeedback] = useState(false);
  const [activeAction, setActiveAction] = useState<'format' | 'minify' | 'sort'>('format');

  // Initialize
  useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
    }
  }, [initialValue]);

  // Validation, Auto-Format & Stats Effect
  useEffect(() => {
    if (!input.trim()) {
      setIsValid(true);
      setErrorDetails(null);
      setStats(null);
      setParsedObject(null);
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setIsValid(true);
      setErrorDetails(null);
      setParsedObject(parsed);
      
      // Auto-populate output if valid & not diffing
      if (!diffMode) {
          const formatted = JSON.stringify(parsed, null, 2);
          setOutput(formatted);
          setStats(calculateJsonStats(parsed, formatted));
      }
      
    } catch (e) {
      setIsValid(false);
      setParsedObject(null);
      setStats(null); // Clear stats on invalid json
      setErrorDetails(parseJsonError(e as Error, input));
    }
  }, [input, diffMode]);

  // Actions
  const handleFormat = () => {
    try {
      setActiveAction('format');
      const obj = JSON.parse(input);
      setOutput(JSON.stringify(obj, null, 2));
      setDiffMode(false);
      setViewMode('code');
    } catch (e) { /* ignore */ }
  };

  const handleMinify = () => {
    try {
      setActiveAction('minify');
      const obj = JSON.parse(input);
      setOutput(JSON.stringify(obj));
      setDiffMode(false);
      setViewMode('code');
    } catch (e) { /* ignore */ }
  };

  const handleSort = () => {
    try {
      setActiveAction('sort');
      const obj = JSON.parse(input);
      const sorted = sortObjectKeys(obj);
      setOutput(JSON.stringify(sorted, null, 2));
      setDiffMode(false);
      setViewMode('code');
    } catch (e) { /* ignore */ }
  };

  const handleRepair = () => {
    try {
      const repaired = jsonrepair(input);
      const parsed = JSON.parse(repaired);
      const formatted = JSON.stringify(parsed, null, 2);
      
      setRepairedJson(formatted);
      setOutput(formatted);
      setParsedObject(parsed);
      setStats(calculateJsonStats(parsed, formatted));
      setDiffMode(true);
    } catch (e) {
      setErrorDetails({ message: "Failed to repair automatically: " + (e as Error).message, line: 0, column: 0 });
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
    setParsedObject(null);
    setStats(null);
  };

  // Diff Computation
  const diffRows = useMemo(() => {
    if (!diffMode) return [];
    const diffs = computeLineDiff(input, repairedJson);
    return processDiffToRows(diffs);
  }, [input, repairedJson, diffMode]);

  const runJsonAction = (action: 'format' | 'minify' | 'sort') => {
    if (action === 'format') handleFormat();
    if (action === 'minify') handleMinify();
    if (action === 'sort') handleSort();
  };

  return (
    <ToolShell>
      <ToolHeader icon={<Braces />} title={toolLabel} subtitle="format · minify · sort · repair · diff">
        <StatusBadge tone={isValid ? 'ok' : 'bad'} icon={isValid ? <CheckCircle2 size={11} /> : <XCircle size={11} />}>
          {isValid ? 'Valid' : 'Invalid'}
        </StatusBadge>
        <SegmentedControl
          value={activeAction}
          onChange={runJsonAction}
          options={[
            { value: 'format', label: 'Format', icon: <AlignLeft />, disabled: !isValid || !input },
            { value: 'minify', label: 'Minify', icon: <Minimize2 />, disabled: !isValid || !input },
            { value: 'sort', label: 'Sort', icon: <ArrowDownAZ />, disabled: !isValid || !input }
          ]}
        />
        <ToolButton
          onClick={handleRepair}
          disabled={isValid || !input}
          icon={<Wrench />}
          variant={!isValid && input ? 'primary' : 'default'}
          title="Attempt to repair invalid JSON"
        >
          Repair
        </ToolButton>
        <ToolButton
          onClick={handleCopy}
          disabled={!output && !repairedJson}
          icon={copyFeedback ? <CheckCircle2 /> : <Copy />}
          variant="primary"
        >
          {copyFeedback ? 'Copied' : 'Copy'}
        </ToolButton>
      </ToolHeader>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
          <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
            <PaneHeader
              title="Input"
              meta={`${input ? input.split('\n').length : 0} lines`}
              actions={
                <ToolButton onClick={handleClear} icon={<Trash2 />} variant="ghost" className="h-[22px] px-1.5">
                  Clear
                </ToolButton>
              }
            />
            <div className={`relative min-h-0 flex-1 overflow-hidden transition-colors ${
              !isValid && input ? 'border-l-2 border-[var(--red)]' : ''
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
                  <LineNumberTextarea
                    spellCheck={false}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder='Paste JSON here...'
                    className="text-text-primary placeholder-text-secondary"
                  />
              )}
            </div>
          </ToolPane>

          <ToolPane>
            <PaneHeader
              title="Output"
              meta={diffMode ? 'diff view' : viewMode}
              actions={
                !diffMode && parsedObject ? (
                  <SegmentedControl
                    value={viewMode}
                    onChange={(mode: 'code' | 'tree') => setViewMode(mode)}
                    options={[
                      { value: 'code', label: 'Code', icon: <Code2 /> },
                      { value: 'tree', label: 'Tree', icon: <Network /> }
                    ]}
                    className="h-[24px]"
                  />
                ) : diffMode ? (
                  <StatusBadge icon={<ArrowRightLeft size={10} />}>Diff</StatusBadge>
                ) : null
              }
            />
            <div className="relative min-h-0 flex-1 overflow-hidden transition-colors">
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
              ) : viewMode === 'tree' && parsedObject ? (
                  <div className="w-full h-full overflow-auto p-4 bg-app-bg select-text">
                     <JsonTreeNode value={parsedObject} isLast={true} level={0} />
                  </div>
              ) : (
                  <LineNumberTextarea
                    readOnly
                    spellCheck={false}
                    value={output}
                    placeholder='Result will appear here...'
                    className="text-accent placeholder-text-secondary"
                  />
              )}
            </div>
          </ToolPane>
        </div>

        {stats && !diffMode && isValid && (
          <StatusBar
            right={
              <>
                <span>keys <b className="font-medium text-text-primary">{stats.keys}</b></span>
                <span>depth <b className="font-medium text-text-primary">{stats.maxDepth}</b></span>
                <span>arrays <b className="font-medium text-text-primary">{stats.arrays}</b></span>
                <span>objects <b className="font-medium text-text-primary">{stats.objects}</b></span>
              </>
            }
          >
            <span><b className="font-medium text-text-primary">JSON</b></span>
            <span className="h-3 w-px bg-border-base" />
            <span>UTF-8</span>
            <span className="h-3 w-px bg-border-base" />
            <span>size <b className="font-medium text-text-primary">{formatBytes(stats.sizeBytes)}</b></span>
            <span>lines <b className="font-medium text-text-primary">{stats.lines}</b></span>
            <span>chars <b className="font-medium text-text-primary">{stats.chars}</b></span>
          </StatusBar>
        )}

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
    </ToolShell>
  );
};
