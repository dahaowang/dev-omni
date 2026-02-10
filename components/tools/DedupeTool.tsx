import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  CheckCircle2, 
  Copy, 
  PanelLeft,
  Filter
} from 'lucide-react';
import { LineNumberTextarea } from '../common/LineNumberTextarea';

interface DedupeToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

export const DedupeTool: React.FC<DedupeToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [stats, setStats] = useState({ total: 0, unique: 0, removed: 0 });
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Automatic execution when input changes
  useEffect(() => {
    if (!input) {
      setOutput('');
      setStats({ total: 0, unique: 0, removed: 0 });
      return;
    }

    const lines = input.split(/\r?\n/);
    // Filter out empty last line if it exists to avoid false count? 
    // Standard dedupe usually treats empty lines as valid duplicates.
    const uniqueSet = new Set(lines);
    const uniqueLines = Array.from(uniqueSet);
    const result = uniqueLines.join('\n');

    setOutput(result);
    setStats({
      total: lines.length,
      unique: uniqueLines.length,
      removed: lines.length - uniqueLines.length
    });
  }, [input]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleClear = () => {
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-app-bg text-text-primary">
      {/* Tool Header */}
      <div className="h-12 border-b border-border-base flex items-center px-4 bg-app-bg electron-drag select-none shrink-0">
        
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
        
        <div className="flex-1 electron-drag"></div>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Input Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg p-4 pr-2 border-r border-border-base">
          <div className="flex items-center justify-between mb-2 px-1">
             <div className="text-sm font-medium text-text-secondary">Input List</div>
             <button onClick={handleClear} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
               <Trash2 size={12} /> Clear
             </button>
          </div>
          <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden hover:border-border-hover transition-colors">
            <LineNumberTextarea
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Paste your list here (one item per line)...'
              className="text-text-primary placeholder-text-secondary"
            />
          </div>
        </div>

        {/* Output Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg p-4 pl-2">
          <div className="flex items-center justify-between mb-2 px-1">
             <div className="text-sm font-medium text-text-secondary">Unique Lines</div>
             {output && (
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
            <LineNumberTextarea
              readOnly
              spellCheck={false}
              value={output}
              placeholder='Unique lines will appear here...'
              className="text-text-primary placeholder-text-secondary"
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-8 bg-sidebar-bg border-t border-border-base flex items-center px-4 justify-between text-xs text-text-secondary shrink-0">
        <div className="flex items-center space-x-4">
          <span>Total: <span className="text-text-primary">{stats.total}</span></span>
          <span className="w-px h-3 bg-border-base"></span>
          <span>Unique: <span className="text-text-primary">{stats.unique}</span></span>
          <span className="w-px h-3 bg-border-base"></span>
          <span>Removed: <span className="text-text-primary">{stats.removed}</span></span>
        </div>
      </div>
    </div>
  );
};