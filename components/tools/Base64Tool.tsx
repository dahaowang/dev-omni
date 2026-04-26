import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  CheckCircle2, 
  Trash2,
  ArrowRightLeft,
  Binary
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

interface Base64ToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
  initialValue?: string;
}

type Mode = 'encode' | 'decode';
type TransformType = 'base64' | 'unicode' | 'utf8';

export const Base64Tool: React.FC<Base64ToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel, initialValue }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [transformType, setTransformType] = useState<TransformType>('base64');
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
      
      if (transformType === 'base64') {
        if (mode === 'encode') {
          // UTF-8 safe encoding
          const encoder = new TextEncoder();
          const data = encoder.encode(input);
          const binString = Array.from(data, (byte) => String.fromCodePoint(byte)).join("");
          result = btoa(binString);
        } else {
          // UTF-8 safe decoding
          const binString = atob(input);
          const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0) || 0);
          const decoder = new TextDecoder();
          result = decoder.decode(bytes);
        }
      } 
      else if (transformType === 'unicode') {
        if (mode === 'encode') {
          // Text to Unicode Escape (\uXXXX)
          result = input.split('').map(char => {
            const code = char.charCodeAt(0).toString(16).padStart(4, '0');
            return '\\u' + code;
          }).join('');
        } else {
          // Unicode Escape to Text
          result = input.replace(/\\u[\dA-F]{4}/gi, (match) => 
            String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
          );
        }
      } 
      else if (transformType === 'utf8') {
        if (mode === 'encode') {
          // Text to Hex (UTF-8 bytes) with \x prefix
          const encoder = new TextEncoder();
          const data = encoder.encode(input);
          result = Array.from(data).map(b => '\\x' + b.toString(16).padStart(2, '0')).join('');
        } else {
          // Hex (\xHH) to Text
          // Match all \xHH sequences
          const hexMatches = input.match(/\\x([0-9A-Fa-f]{2})/g);
          
          if (!hexMatches && input.trim().length > 0) {
             // If input exists but doesn't match pattern, try to be lenient if it's just raw hex or space separated
             // But per requirement, we focus on \x format. Let's fallback to strict or error.
             throw new Error("Invalid Hex format. Expected \\xHH sequences.");
          }

          if (hexMatches) {
             const bytes = new Uint8Array(hexMatches.map(h => parseInt(h.substring(2), 16)));
             const decoder = new TextDecoder();
             result = decoder.decode(bytes);
          } else {
             result = '';
          }
        }
      }

      setOutput(result);
      setError(null);
    } catch (err) {
      setOutput(''); // Clear output on error
      setError(`Error: Invalid input for ${transformType} ${mode}.`);
    }
  }, [input, mode, transformType]);

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

  const getOutputLabel = () => {
    if (mode === 'encode') {
       switch (transformType) {
         case 'base64': return 'Base64';
         case 'unicode': return 'Unicode Escaped';
         case 'utf8': return 'Hex (\\xHH)';
       }
    } else {
      return 'Plain Text';
    }
  };

  const getPlaceholder = () => {
    if (mode === 'encode') return `Enter text to encode to ${transformType}...`;
    switch (transformType) {
      case 'base64': return "Enter Base64 string to decode...";
      case 'unicode': return "Enter Unicode escape sequence (\\uXXXX) to decode...";
      case 'utf8': return "Enter Hex string (e.g. \\x48\\x65\\x6c\\x6c\\x6f) to decode...";
    }
  };

  return (
    <ToolShell>
      <ToolHeader icon={<Binary />} title={toolLabel} subtitle="base64 · unicode · UTF-8 hex">
        {error ? <StatusBadge tone="bad">Invalid</StatusBadge> : <StatusBadge tone={input ? 'ok' : 'neutral'}>{input ? `${input.length} chars` : 'Waiting'}</StatusBadge>}
        <select
          value={transformType}
          onChange={(e) => setTransformType(e.target.value as TransformType)}
          className="h-7 rounded-[var(--radius-sm)] border border-border-base bg-panel-bg px-2 text-xs outline-none focus:border-accent"
        >
          <option value="base64">Base64</option>
          <option value="unicode">Unicode</option>
          <option value="utf8">UTF-8 (Hex)</option>
        </select>
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
            meta={`${mode} · ${transformType}`}
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
              placeholder={getPlaceholder()}
              className="text-text-primary placeholder-text-secondary"
            />
          </div>
        </ToolPane>

        <ToolPane>
          <PaneHeader
            title="Output"
            meta={getOutputLabel()}
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
