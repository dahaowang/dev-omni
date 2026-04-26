import React, { useEffect, useState } from 'react';
import { CheckCircle2, Copy, Dices, RefreshCw, Settings2 } from 'lucide-react';
import {
  Field,
  FieldInput,
  GroupTitle,
  MetricCard,
  PaneHeader,
  StatusBadge,
  StatusBar,
  ToggleRow,
  ToolBody,
  ToolButton,
  ToolHeader,
  ToolPane,
  ToolShell
} from '../common/ToolChrome';

interface RandomStringToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
};

type OptionKey = keyof typeof CHAR_SETS;

export const RandomStringTool: React.FC<RandomStringToolProps> = ({ toolLabel }) => {
  const [length, setLength] = useState(32);
  const [options, setOptions] = useState<Record<OptionKey, boolean>>({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });
  const [output, setOutput] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const selectedSets = Object.entries(options).filter(([, enabled]) => enabled) as Array<[OptionKey, boolean]>;
  const charsetLength = selectedSets.reduce((sum, [key]) => sum + CHAR_SETS[key].length, 0);

  const generateString = () => {
    let charset = '';
    if (options.uppercase) charset += CHAR_SETS.uppercase;
    if (options.lowercase) charset += CHAR_SETS.lowercase;
    if (options.numbers) charset += CHAR_SETS.numbers;
    if (options.symbols) charset += CHAR_SETS.symbols;

    if (!charset) {
      setOutput('');
      return;
    }

    let result = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    for (let index = 0; index < length; index += 1) {
      result += charset.charAt(array[index] % charset.length);
    }

    setOutput(result);
  };

  useEffect(() => {
    generateString();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  };

  const toggleOption = (key: OptionKey, checked: boolean) => {
    setOptions((current) => {
      const next = { ...current, [key]: checked };
      if (!Object.values(next).some(Boolean)) return current;
      return next;
    });
  };

  return (
    <ToolShell>
      <ToolHeader icon={<Dices />} title={toolLabel} subtitle="cryptographic random · configurable charset">
        <StatusBadge tone={output ? 'ok' : 'neutral'}>{length} CHARS</StatusBadge>
        <ToolButton icon={<RefreshCw />} onClick={generateString}>
          Regenerate
        </ToolButton>
        <ToolButton icon={copyFeedback ? <CheckCircle2 /> : <Copy />} onClick={handleCopy} disabled={!output} variant="primary">
          {copyFeedback ? 'Copied' : 'Copy'}
        </ToolButton>
      </ToolHeader>

      <ToolBody className="grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
          <PaneHeader title="Generated string" meta={`${output.length} chars`} />
          <div className="flex min-h-0 flex-1 items-center justify-center bg-app-bg p-6">
            <div className="w-full rounded-[var(--radius-lg)] border border-border-base bg-panel-bg p-6 shadow-[var(--shadow-sm)]">
              <div className="min-h-[220px] rounded-[var(--radius-sm)] border border-border-base bg-input-bg p-5">
                <p className="break-all text-center font-mono text-sm leading-7 text-text-primary selection:bg-[var(--selection)]">
                  {output || <span className="text-text-secondary">Select options to generate.</span>}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="font-mono text-[11px] text-[var(--fg-3)]">
                  charset {charsetLength} symbols · {selectedSets.length} sets
                </div>
                <div className="flex items-center gap-2">
                  <ToolButton icon={<RefreshCw />} onClick={generateString}>
                    Regenerate
                  </ToolButton>
                  <ToolButton icon={copyFeedback ? <CheckCircle2 /> : <Copy />} onClick={handleCopy} disabled={!output} variant="primary">
                    Copy string
                  </ToolButton>
                </div>
              </div>
            </div>
          </div>
          <StatusBar>
            <span>crypto.getRandomValues</span>
            <span>length <b className="font-medium text-text-primary">{length}</b></span>
            <span>charset <b className="font-medium text-text-primary">{charsetLength}</b></span>
          </StatusBar>
        </ToolPane>

        <ToolPane className="bg-sidebar-bg">
          <PaneHeader title="Configuration" actions={<Settings2 size={14} />} />
          <div className="min-h-0 flex-1 overflow-auto p-[18px]">
            <Field label="Length" hint={`${length} characters`}>
              <div className="flex gap-2">
                <FieldInput
                  type="number"
                  value={length}
                  onChange={(event) => setLength(Math.max(1, Math.min(1024, parseInt(event.target.value, 10) || 1)))}
                  containerClassName="w-24"
                  className="text-right"
                />
                <input
                  type="range"
                  min="4"
                  max="128"
                  value={Math.min(length, 128)}
                  onChange={(event) => setLength(parseInt(event.target.value, 10))}
                  className="min-w-0 flex-1 accent-[var(--accent)]"
                />
              </div>
            </Field>

            <GroupTitle>Character sets</GroupTitle>
            <ToggleRow label="Uppercase" description="A-Z" checked={options.uppercase} onChange={(checked) => toggleOption('uppercase', checked)} />
            <ToggleRow label="Lowercase" description="a-z" checked={options.lowercase} onChange={(checked) => toggleOption('lowercase', checked)} />
            <ToggleRow label="Numbers" description="0-9" checked={options.numbers} onChange={(checked) => toggleOption('numbers', checked)} />
            <ToggleRow label="Symbols" description="punctuation and operators" checked={options.symbols} onChange={(checked) => toggleOption('symbols', checked)} />

            <GroupTitle>Stats</GroupTitle>
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="Sets" value={selectedSets.length} />
              <MetricCard label="Charset" value={charsetLength} />
            </div>
          </div>
        </ToolPane>
      </ToolBody>
    </ToolShell>
  );
};
