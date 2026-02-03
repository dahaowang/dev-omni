import React, { useState } from 'react';
import { 
  ArrowRight, 
  Trash2, 
  CheckCircle2, 
  Copy, 
  PanelLeft,
  Filter,
  Star
} from 'lucide-react';
import { ActionButton } from '../common/ActionButton';

interface DedupeToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const DedupeTool: React.FC<DedupeToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel, isFavorite, onToggleFavorite }) => {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [stats, setStats] = useState({ total: 0, unique: 0, removed: 0 });
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleDedupe = () => {
    if (!input) {
      setOutput('');
      setStats({ total: 0, unique: 0, removed: 0 });
      return;
    }

    const lines = input.split(/\r?\n/);
    const uniqueSet = new Set(lines);
    const uniqueLines = Array.from(uniqueSet);
    const result = uniqueLines.join('\n');

    setOutput(result);
    setStats({
      total: lines.length,
      unique: uniqueLines.length,
      removed: lines.length - uniqueLines.length
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setStats({ total: 0, unique: 0, removed: 0 });
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
          <button 
            onClick={onToggleFavorite} 
            className="electron-no-drag text-text-secondary hover:text-accent transition-colors p-1 rounded-md hover:bg-hover-overlay"
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
             <Star size={16} className={isFavorite ? "fill-accent text-accent" : ""} />
          </button>
        </div>
        
        <div className="flex-1 electron-drag"></div>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Input Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg p-4 pr-0">
          <div className="flex items-center justify-between mb-2 pl-1 pr-4">
             <div className="text-sm font-medium text-text-secondary">Input List</div>
             <button onClick={handleClear} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
               <Trash2 size={12} /> Clear
             </button>
          </div>
          <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden hover:border-border-hover transition-colors">
            <textarea
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-full bg-transparent resize-none focus:outline-none p-4 font-mono text-sm leading-6 text-text-primary placeholder-text-secondary"
              placeholder='Paste your list here (one item per line)...'
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="w-16 flex flex-col items-center justify-center space-y-4 px-2 pt-8">
           <ActionButton onClick={handleDedupe} icon={<Filter size={18} />} label="Dedupe" />
        </div>

        {/* Output Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg p-4 pl-0">
          <div className="text-sm font-medium text-text-secondary mb-2 pl-1">Unique Lines</div>
          <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden relative group hover:border-border-hover transition-colors">
            <textarea
              readOnly
              spellCheck={false}
              value={output}
              className="w-full h-full bg-transparent resize-none focus:outline-none p-4 font-mono text-sm leading-6 text-text-primary placeholder-text-secondary"
              placeholder='Unique lines will appear here...'
            />
            
            {/* Copy Button */}
            {output && (
              <button 
                onClick={handleCopy}
                className="absolute bottom-4 right-4 bg-element-bg hover:brightness-110 text-text-primary px-4 py-2 rounded-md shadow-lg border border-border-base flex items-center space-x-2 transition-all active:scale-95"
              >
                {copyFeedback ? <CheckCircle2 size={16} className="text-green-500"/> : <Copy size={16} />}
                <span className="text-sm font-medium">{copyFeedback ? 'Copied!' : 'Copy Result'}</span>
              </button>
            )}
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