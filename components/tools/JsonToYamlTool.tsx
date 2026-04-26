import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Copy, 
  CheckCircle2, 
  FileJson, 
  FileCode,
  ArrowRightLeft
} from 'lucide-react';
// @ts-ignore
import { load, dump } from 'js-yaml';
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

interface JsonToYamlToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

type Mode = 'json2yaml' | 'yaml2json';

export const JsonToYamlTool: React.FC<JsonToYamlToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [mode, setMode] = useState<Mode>('json2yaml');
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      if (mode === 'json2yaml') {
        // JSON -> YAML
        const parsed = JSON.parse(input);
        const yaml = dump(parsed, { indent: 2, lineWidth: -1 });
        setOutput(yaml);
      } else {
        // YAML -> JSON
        const parsed = load(input);
        const json = JSON.stringify(parsed, null, 2);
        setOutput(json);
      }
      setError(null);
    } catch (err) {
      setError((err as Error).message);
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
    setOutput('');
    setError(null);
  };

  const toggleMode = () => {
    setMode(prev => prev === 'json2yaml' ? 'yaml2json' : 'json2yaml');
    setInput(output); // Optional: Swap content
    setOutput('');
    setError(null);
  };

  return (
    <ToolShell>
      <ToolHeader icon={<FileCode />} title={toolLabel} subtitle="JSON ↔ YAML · local conversion">
        {error ? <StatusBadge tone="bad">Invalid</StatusBadge> : <StatusBadge tone={input ? 'ok' : 'neutral'}>{input ? 'Ready' : 'Waiting'}</StatusBadge>}
        <SegmentedControl
          value={mode}
          onChange={(value: Mode) => setMode(value)}
          options={[
            { value: 'json2yaml', label: 'JSON → YAML', icon: <FileJson /> },
            { value: 'yaml2json', label: 'YAML → JSON', icon: <FileCode /> }
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

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
          <PaneHeader
            title={mode === 'json2yaml' ? 'JSON input' : 'YAML input'}
            meta={`${input ? input.split('\n').length : 0} lines`}
            actions={
              <ToolButton onClick={handleClear} icon={<Trash2 />} variant="ghost" className="h-[22px] px-1.5">
                Clear
              </ToolButton>
            }
          />
          <div className={`relative min-h-0 flex-1 overflow-hidden transition-colors ${
            error ? 'border-l-2 border-[var(--red)]' : ''
          }`}>
            <LineNumberTextarea
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'json2yaml' ? 'Paste JSON here...' : 'Paste YAML here...'}
              className="text-text-primary placeholder-text-secondary"
            />
          </div>
          {error && (
            <div className="border-t border-border-base bg-panel-bg px-3 py-2 font-mono text-xs text-[var(--red)]">
              {error}
            </div>
          )}
        </ToolPane>

        <ToolPane>
          <PaneHeader
            title={mode === 'json2yaml' ? 'YAML output' : 'JSON output'}
            meta={`${output ? output.split('\n').length : 0} lines`}
          />
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <LineNumberTextarea
              readOnly
              spellCheck={false}
              value={output}
              placeholder={mode === 'json2yaml' ? 'YAML result...' : 'JSON result...'}
              className="text-accent placeholder-text-secondary"
            />
          </div>
        </ToolPane>
      </div>
    </ToolShell>
  );
};
