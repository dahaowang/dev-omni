import React, { useState, useMemo } from 'react';
import { 
  PanelLeft, 
  Split, 
  Eye, 
  Edit3, 
  ArrowRightLeft,
  Trash2,
  Check,
  X
} from 'lucide-react';

interface DiffToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

type DiffLine = {
  type: 'same' | 'added' | 'removed';
  content: string;
};

// Simple LCS based Diff Algorithm
const computeLineDiff = (text1: string, text2: string): DiffLine[] => {
  const lines1 = text1.split(/\r?\n/);
  const lines2 = text2.split(/\r?\n/);
  
  // Trimming for empty input edge case
  if (text1 === '' && text2 === '') return [];
  if (text1 === '') return lines2.map(l => ({ type: 'added', content: l }));
  if (text2 === '') return lines1.map(l => ({ type: 'removed', content: l }));

  const m = lines1.length;
  const n = lines2.length;
  
  // Use a 1D array approach for space optimization if needed, 
  // but standard 2D is easier for backtracking. 
  // Limit text size in UI if necessary, but modern JS handles 2k*2k fine.
  const dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (lines1[i - 1] === lines2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  let i = m, j = n;
  const diffs: DiffLine[] = [];
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
      diffs.unshift({ type: 'same', content: lines1[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffs.unshift({ type: 'added', content: lines2[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diffs.unshift({ type: 'removed', content: lines1[i - 1] });
      i--;
    }
  }
  
  return diffs;
};

export const DiffTool: React.FC<DiffToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');
  const [mode, setMode] = useState<'edit' | 'view'>('edit');

  const diffResult = useMemo(() => {
    if (mode === 'view') {
      return computeLineDiff(original, modified);
    }
    return [];
  }, [original, modified, mode]);

  const handleSwap = () => {
    setOriginal(modified);
    setModified(original);
  };

  const handleClear = () => {
    setOriginal('');
    setModified('');
    setMode('edit');
  };

  const stats = useMemo(() => {
    if (mode !== 'view') return null;
    const added = diffResult.filter(l => l.type === 'added').length;
    const removed = diffResult.filter(l => l.type === 'removed').length;
    return { added, removed, total: diffResult.length };
  }, [diffResult, mode]);

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
          <h2 className="text-sm font-semibold text-text-primary tracking-wide mr-6">{toolLabel}</h2>
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
             <button 
              onClick={() => setMode('edit')} 
              className="flex items-center space-x-2 px-3 py-1.5 bg-element-bg border border-border-base text-text-primary rounded-md text-xs font-medium hover:bg-hover-overlay shadow-sm"
             >
               <Edit3 size={14} />
               <span>Edit</span>
             </button>
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
            <div className="flex-1 overflow-auto p-4">
              <div className="bg-panel-bg border border-border-base rounded-lg overflow-hidden font-mono text-sm">
                 {diffResult.length === 0 && (
                   <div className="p-8 text-center text-text-secondary">No differences found or empty inputs.</div>
                 )}
                 {diffResult.map((line, idx) => (
                   <div 
                    key={idx} 
                    className={`flex ${
                      line.type === 'added' ? 'bg-green-500/10' : 
                      line.type === 'removed' ? 'bg-red-500/10' : ''
                    }`}
                   >
                     {/* Gutter / Line Marker */}
                     <div className={`w-8 shrink-0 select-none text-right pr-2 border-r border-border-base/50 text-xs py-0.5 opacity-50 ${
                       line.type === 'added' ? 'text-green-500' : 
                       line.type === 'removed' ? 'text-red-500' : 'text-text-secondary'
                     }`}>
                       {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ''}
                     </div>
                     
                     {/* Content */}
                     <div className={`flex-1 px-3 py-0.5 whitespace-pre-wrap break-all ${
                        line.type === 'added' ? 'text-green-400' : 
                        line.type === 'removed' ? 'text-red-400 line-through decoration-red-400/50' : 'text-text-secondary'
                     }`}>
                       {line.content || ' '} 
                       {/* Ensure empty lines have height */}
                     </div>
                   </div>
                 ))}
              </div>
            </div>
            
            {/* Diff Stats Bar */}
            <div className="h-8 bg-sidebar-bg border-t border-border-base flex items-center px-4 space-x-4 text-xs shrink-0">
               <div className="flex items-center space-x-1 text-green-500">
                 <Check size={12} />
                 <span>{stats?.added} Added</span>
               </div>
               <div className="flex items-center space-x-1 text-red-500">
                 <X size={12} />
                 <span>{stats?.removed} Removed</span>
               </div>
               <span className="text-text-secondary">Total Lines: {stats?.total}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
