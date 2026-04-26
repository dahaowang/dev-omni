import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  CheckCircle2, 
  Copy, 
  Filter
} from 'lucide-react';
import { LineNumberTextarea } from '../common/LineNumberTextarea';
import {
  PaneHeader,
  StatusBadge,
  StatusBar,
  ToolButton,
  ToolHeader,
  ToolPane,
  ToolShell
} from '../common/ToolChrome';

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
    <ToolShell>
      <ToolHeader icon={<Filter />} title={toolLabel} subtitle="preserve first occurrence · one item per line">
        <StatusBadge>{stats.total} total</StatusBadge>
        <StatusBadge tone={stats.removed > 0 ? 'ok' : 'neutral'}>{stats.removed} removed</StatusBadge>
        <ToolButton
          onClick={handleCopy}
          disabled={!output}
          icon={copyFeedback ? <CheckCircle2 /> : <Copy />}
          variant="primary"
        >
          {copyFeedback ? 'Copied' : 'Copy'}
        </ToolButton>
      </ToolHeader>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
          <PaneHeader
            title="Input list"
            meta={`${input ? input.split('\n').length : 0} lines`}
            actions={
              <ToolButton onClick={handleClear} icon={<Trash2 />} variant="ghost" className="h-[22px] px-1.5">
                Clear
              </ToolButton>
            }
          />
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <LineNumberTextarea
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Paste your list here (one item per line)...'
              className="text-text-primary placeholder-text-secondary"
            />
          </div>
        </ToolPane>

        <ToolPane>
          <PaneHeader title="Unique lines" meta={`${stats.unique} lines`} />
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <LineNumberTextarea
              readOnly
              spellCheck={false}
              value={output}
              placeholder='Unique lines will appear here...'
              className="text-text-primary placeholder-text-secondary"
            />
          </div>
        </ToolPane>
      </div>

      <StatusBar>
        <span>Total <b className="font-medium text-text-primary">{stats.total}</b></span>
        <span className="h-3 w-px bg-border-base" />
        <span>Unique <b className="font-medium text-text-primary">{stats.unique}</b></span>
        <span className="h-3 w-px bg-border-base" />
        <span>Removed <b className="font-medium text-text-primary">{stats.removed}</b></span>
      </StatusBar>
    </ToolShell>
  );
};
