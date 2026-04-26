import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  CheckCircle2, 
  Trash2,
  ArrowRightLeft,
  Link
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

interface UrlEncoderToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
  initialValue?: string;
}

type Mode = 'encode' | 'decode';

export const UrlEncoderTool: React.FC<UrlEncoderToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel, initialValue }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    if (!input) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      let result = '';
      if (mode === 'encode') {
        result = encodeURIComponent(input);
      } else {
        result = decodeURIComponent(input);
      }
      setOutput(result);
      setError(null);
    } catch (err) {
      setOutput('');
      setError('Error: Malformed URL sequence.');
    }
  }, [input, mode]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleClear = () => {
    setInput('');
  };

  const toggleMode = () => {
    setMode(prev => prev === 'encode' ? 'decode' : 'encode');
  };

  return (
    <ToolShell>
      <ToolHeader icon={<Link />} title={toolLabel} subtitle="encode · decode · URL component">
        {error ? <StatusBadge tone="bad">Malformed</StatusBadge> : <StatusBadge tone={input ? 'ok' : 'neutral'}>{input ? `${input.length} chars` : 'Waiting'}</StatusBadge>}
        <SegmentedControl
          value={mode}
          onChange={(value: Mode) => setMode(value)}
          options={[
            { value: 'encode', label: 'Encode' },
            { value: 'decode', label: 'Decode' }
          ]}
        />
        <ToolButton onClick={toggleMode} icon={<ArrowRightLeft />} title="Switch mode">
          Swap
        </ToolButton>
        <ToolButton
          onClick={handleCopy}
          disabled={!output || !!error}
          icon={copyFeedback ? <CheckCircle2 /> : <Copy />}
          variant="primary"
        >
          {copyFeedback ? 'Copied' : 'Copy'}
        </ToolButton>
      </ToolHeader>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ToolPane className="border-b border-border-base">
          <PaneHeader
            title="Input"
            meta={mode === 'encode' ? 'plain text' : 'url encoded'}
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
              placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter URL-encoded text to decode...'}
              className="text-text-primary placeholder-text-secondary"
            />
          </div>
        </ToolPane>

        <ToolPane>
          <PaneHeader
            title="Output"
            meta={mode === 'encode' ? 'URL encoded' : 'decoded'}
            actions={error ? <StatusBadge tone="bad">{error}</StatusBadge> : null}
          />
          <div className={`relative min-h-0 flex-1 overflow-hidden ${error ? 'border-l-2 border-[var(--red)]' : ''}`}>
            <LineNumberTextarea
              readOnly
              spellCheck={false}
              value={output}
              placeholder="Result will appear here..."
              className={`${error ? 'text-[var(--red)]' : 'text-accent'} placeholder-text-secondary`}
            />
          </div>
        </ToolPane>
      </div>
    </ToolShell>
  );
};
