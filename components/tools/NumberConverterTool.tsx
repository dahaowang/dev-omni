import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  CheckCircle2, 
  Trash2,
  ArrowDownUp,
  Calculator
} from 'lucide-react';
import {
  PaneHeader,
  StatusBadge,
  ToolButton,
  ToolHeader,
  ToolPane,
  ToolShell
} from '../common/ToolChrome';

interface NumberConverterToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

const BASES = [
  { label: 'Binary (Base 2)', value: 2 },
  { label: 'Octal (Base 8)', value: 8 },
  { label: 'Decimal (Base 10)', value: 10 },
  { label: 'Hexadecimal (Base 16)', value: 16 },
];

export const NumberConverterTool: React.FC<NumberConverterToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [fromBase, setFromBase] = useState(10);
  const [toBase, setToBase] = useState(16); // Default Dec -> Hex
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      // Validation logic based on fromBase
      const isValid = validateInput(input, fromBase);
      if (!isValid) {
        throw new Error(`Invalid characters for Base ${fromBase}`);
      }

      // Convert logic: Input String -> Integer -> Output String
      // remove spaces for processing
      const cleanInput = input.replace(/\s/g, '');
      const integerValue = parseInt(cleanInput, fromBase);

      if (isNaN(integerValue)) {
        throw new Error('Invalid number');
      }

      const result = integerValue.toString(toBase).toUpperCase();
      setOutput(result);
      setError(null);
    } catch (err) {
      setOutput('');
      setError((err as Error).message);
    }
  }, [input, fromBase, toBase]);

  const validateInput = (value: string, base: number): boolean => {
    // Remove whitespace for check
    const val = value.replace(/\s/g, '');
    if (!val) return true;

    const regexMap: Record<number, RegExp> = {
      2: /^[01]+$/,
      8: /^[0-7]+$/,
      10: /^[0-9]+$/,
      16: /^[0-9a-fA-F]+$/
    };
    return regexMap[base].test(val);
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

  const handleSwap = () => {
    setFromBase(toBase);
    setToBase(fromBase);
    setInput(output); // Optional: preserve the value flow
  };

  return (
    <ToolShell>
      <ToolHeader icon={<Calculator />} title={toolLabel} subtitle="binary · octal · decimal · hexadecimal">
        {error ? <StatusBadge tone="bad">{error}</StatusBadge> : <StatusBadge>{input ? `${input.replace(/\s/g, '').length} digits` : 'waiting'}</StatusBadge>}
        <ToolButton onClick={handleSwap} icon={<ArrowDownUp />}>
          Swap
        </ToolButton>
      </ToolHeader>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
          <PaneHeader
            title="Input"
            actions={
              <div className="flex items-center gap-2">
                <select
                  value={fromBase}
                  onChange={(e) => setFromBase(Number(e.target.value))}
                  className="h-[24px] rounded-[var(--radius-sm)] border border-border-base bg-element-bg px-2 text-[11px] outline-none focus:border-accent"
                >
                  {BASES.map((base) => <option key={base.value} value={base.value}>{base.label}</option>)}
                </select>
                <ToolButton onClick={handleClear} icon={<Trash2 />} variant="ghost" className="h-[22px] px-1.5">
                  Clear
                </ToolButton>
              </div>
            }
          />
          <div className="min-h-0 flex-1 overflow-hidden">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-full w-full resize-none bg-transparent p-4 font-mono text-sm leading-6 placeholder:text-text-secondary focus:outline-none"
              placeholder={`Enter Base ${fromBase} number...`}
              spellCheck={false}
            />
          </div>
        </ToolPane>

        <ToolPane>
          <PaneHeader
            title="Output"
            actions={
              <select
                value={toBase}
                onChange={(e) => setToBase(Number(e.target.value))}
                className="h-[24px] rounded-[var(--radius-sm)] border border-border-base bg-element-bg px-2 text-[11px] outline-none focus:border-accent"
              >
                {BASES.map((base) => <option key={base.value} value={base.value}>{base.label}</option>)}
              </select>
            }
          />
          <div className={`relative min-h-0 flex-1 overflow-hidden ${error ? 'border-l-2 border-[var(--red)]' : ''}`}>
            <textarea
              readOnly
              value={output}
              className={`h-full w-full resize-none bg-transparent p-4 font-mono text-sm leading-6 placeholder:text-text-secondary focus:outline-none ${
                error ? 'text-[var(--red)]' : 'text-accent'
              }`}
              placeholder="Result will appear here..."
            />
            {output && !error && (
              <ToolButton
                onClick={handleCopy}
                icon={copyFeedback ? <CheckCircle2 /> : <Copy />}
                variant="primary"
                className="absolute bottom-4 right-4"
              >
                {copyFeedback ? 'Copied' : 'Copy'}
              </ToolButton>
            )}
          </div>
        </ToolPane>
      </div>
    </ToolShell>
  );
};
