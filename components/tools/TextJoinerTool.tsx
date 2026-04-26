import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Copy, 
  CheckCircle2, 
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowDownUp
} from 'lucide-react';
import { LineNumberTextarea } from '../common/LineNumberTextarea';
import {
  PaneHeader,
  SegmentedControl,
  StatusBadge,
  ToolButton,
  ToolHeader,
  ToolPane,
  ToolShell
} from '../common/ToolChrome';

interface TextJoinerToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

type Mode = 'join' | 'split';

const PRESETS = [
  { label: 'Comma', val: ',' },
  { label: 'Semi', val: ';' },
  { label: 'Pipe', val: '|' },
  { label: 'Space', val: ' ' },
  { label: 'Tab', val: '\t' },
];

export const TextJoinerTool: React.FC<TextJoinerToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('join');
  const [delimiter, setDelimiter] = useState(',');
  
  // Options
  const [trim, setTrim] = useState(true);
  const [ignoreEmpty, setIgnoreEmpty] = useState(true);
  
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    processText();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, mode, delimiter, trim, ignoreEmpty]);

  const processText = () => {
    if (!input) {
      setOutput('');
      return;
    }

    let result = '';
    
    if (mode === 'join') {
      // Split by newline, join by delimiter
      const lines = input.split(/\r?\n/);
      
      const processed = lines.filter(line => {
        if (ignoreEmpty && !line.trim()) return false;
        return true;
      }).map(line => {
        return trim ? line.trim() : line;
      });

      result = processed.join(delimiter);

    } else {
      // Split by delimiter, join by newline
      const parts = input.split(delimiter);
      
      const processed = parts.filter(part => {
        if (ignoreEmpty && !part.trim()) return false;
        return true;
      }).map(part => {
        return trim ? part.trim() : part;
      });

      result = processed.join('\n');
    }

    setOutput(result);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleClear = () => {
    setInput('');
  };

  return (
    <ToolShell>
      <ToolHeader icon={<ArrowDownUp />} title={toolLabel} subtitle="join lines · split text · delimiter presets">
        <StatusBadge>{input ? `${input.length} chars` : 'Waiting'}</StatusBadge>
        <SegmentedControl
          value={mode}
          onChange={(value: Mode) => setMode(value)}
          options={[
            { value: 'join', label: 'Join Lines', icon: <ArrowUpFromLine /> },
            { value: 'split', label: 'Split Text', icon: <ArrowDownToLine /> }
          ]}
        />
        <ToolButton
          onClick={handleCopy}
          disabled={!output}
          icon={copyFeedback ? <CheckCircle2 /> : <Copy />}
          variant="primary"
        >
          {copyFeedback ? 'Copied' : 'Copy'}
        </ToolButton>
      </ToolHeader>

      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border-base bg-sidebar-bg px-4 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--fg-3)]">Delimiter</span>
        <input
          type="text"
          value={delimiter}
          onChange={(e) => setDelimiter(e.target.value)}
          placeholder=","
          className="h-7 w-24 rounded-[var(--radius-sm)] border border-border-base bg-input-bg px-2 text-center font-mono text-xs outline-none focus:border-accent"
        />
        <div className="flex items-center gap-1">
          {PRESETS.map((preset) => (
            <ToolButton
              key={preset.label}
              onClick={() => setDelimiter(preset.val)}
              variant={delimiter === preset.val ? 'primary' : 'default'}
              className="h-7 px-2"
              title={`Use ${preset.label} as delimiter`}
            >
              {preset.label}
            </ToolButton>
          ))}
        </div>
        <span className="h-5 w-px bg-border-base" />
        <label className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary hover:text-text-primary">
          <input
            type="checkbox"
            checked={trim}
            onChange={() => setTrim(!trim)}
            className="toggle-checkbox"
          />
          Trim whitespace
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary hover:text-text-primary">
          <input
            type="checkbox"
            checked={ignoreEmpty}
            onChange={() => setIgnoreEmpty(!ignoreEmpty)}
            className="toggle-checkbox"
          />
          Ignore empty
        </label>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ToolPane className="border-b border-border-base">
          <PaneHeader
            title="Input"
            meta={mode === 'join' ? 'list' : 'single line'}
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
              placeholder={mode === 'join' ? "Paste lines here..." : "Paste text to split here..."}
              className="text-text-primary placeholder-text-secondary"
            />
          </div>
        </ToolPane>

        <ToolPane>
          <PaneHeader title="Output" meta={mode === 'join' ? 'single line' : 'list'} />
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <LineNumberTextarea
              readOnly
              value={output}
              placeholder="Result..."
              className="text-accent placeholder-text-secondary"
            />
          </div>
        </ToolPane>
      </div>
    </ToolShell>
  );
};
