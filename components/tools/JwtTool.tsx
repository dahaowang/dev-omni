import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, Copy, ShieldCheck, Trash2 } from 'lucide-react';
import {
  PaneHeader,
  StatusBadge,
  ToolButton,
  ToolHeader,
  ToolPane,
  ToolShell
} from '../common/ToolChrome';

interface JwtToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
  initialValue?: string;
}

// Color coding constants
const COLOR_HEADER = "text-[var(--red)]";
const COLOR_PAYLOAD = "text-[var(--purple)]";
const COLOR_SIGNATURE = "text-[var(--blue)]";

// Helper to decode Base64Url
function b64DecodeUnicode(str: string) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    // Replace URL safe chars
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Pad
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    
    return decodeURIComponent(atob(padded).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

const formatDate = (timestamp: number) => {
    // JWT uses seconds
    return new Date(timestamp * 1000).toLocaleString();
};

export const JwtTool: React.FC<JwtToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel, initialValue }) => {
  const [input, setInput] = useState('');
  const [header, setHeader] = useState<any>(null);
  const [payload, setPayload] = useState<any>(null);
  const [signature, setSignature] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    if (!input.trim()) {
      setHeader(null);
      setPayload(null);
      setSignature('');
      setError(null);
      return;
    }

    try {
      const parts = input.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format (must have 3 parts separated by dots)');
      }

      // Decode Header
      try {
        const decodedHeader = JSON.parse(b64DecodeUnicode(parts[0]));
        setHeader(decodedHeader);
      } catch (e) {
        throw new Error('Failed to decode Header');
      }

      // Decode Payload
      try {
        const decodedPayload = JSON.parse(b64DecodeUnicode(parts[1]));
        setPayload(decodedPayload);
      } catch (e) {
        throw new Error('Failed to decode Payload');
      }

      // Signature (keep as is)
      setSignature(parts[2]);
      setError(null);

    } catch (err) {
      setHeader(null);
      setPayload(null);
      setSignature('');
      setError((err as Error).message);
    }
  }, [input]);

  const handleClear = () => {
    setInput('');
  };

  const handleCopyClaims = () => {
    if (!payload) return;
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  };

  const renderJson = (data: any, colorClass: string) => {
    if (!data) return null;
    const jsonStr = JSON.stringify(data, null, 2);
    // Simple syntax highlighting: Keys
    // We could use a library, but let's just color the whole block primarily 
    // and maybe highlight standard keys if we want to get fancy.
    // For now, clean code block with the section color.
    return (
        <pre className={`font-mono text-sm whitespace-pre-wrap break-all ${colorClass}`}>
            {jsonStr}
        </pre>
    );
  };

  return (
    <ToolShell>
      <ToolHeader icon={<ShieldCheck />} title={toolLabel} subtitle="decoded locally · header · payload · signature">
        {error ? (
          <StatusBadge tone="bad" icon={<AlertCircle size={11} />}>Invalid</StatusBadge>
        ) : payload ? (
          <StatusBadge tone="ok" icon={<CheckCircle2 size={11} />}>Valid format</StatusBadge>
        ) : (
          <StatusBadge>Waiting</StatusBadge>
        )}
        {payload?.exp && <StatusBadge icon={<Clock size={11} />}>exp {formatDate(payload.exp)}</StatusBadge>}
        <ToolButton onClick={handleCopyClaims} disabled={!payload} icon={copyFeedback ? <CheckCircle2 /> : <Copy />}>
          {copyFeedback ? 'Copied' : 'Copy claims'}
        </ToolButton>
      </ToolHeader>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(280px,0.85fr)_1.35fr]">
        <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
          <PaneHeader
            title="Encoded token"
            meta={input ? `${input.length} chars` : 'empty'}
            actions={
              <ToolButton onClick={handleClear} icon={<Trash2 />} variant="ghost" className="h-[22px] px-1.5">
                Clear
              </ToolButton>
            }
          />
          <div className={`relative min-h-0 flex-1 overflow-hidden ${error ? 'border-l-2 border-[var(--red)]' : ''}`}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-full w-full resize-none bg-transparent p-4 font-mono text-sm leading-6 text-text-primary placeholder:text-text-secondary focus:outline-none"
              placeholder="Paste JWT here (eyJ...)"
              spellCheck={false}
            />
          </div>
          {error ? (
            <div className="flex items-start gap-2 border-t border-border-base bg-panel-bg p-3">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-[var(--red)]" />
              <span className="font-mono text-xs text-[var(--red)]">{error}</span>
            </div>
          ) : payload && (
            <div className="flex items-center gap-2 border-t border-border-base bg-panel-bg p-3">
              <CheckCircle2 size={15} className="text-[var(--green)]" />
              <span className="text-xs font-medium text-[var(--green)]">Valid JWT structure</span>
            </div>
          )}
        </ToolPane>

        <ToolPane className="bg-sidebar-bg">
          <PaneHeader title="Decoded output" meta={payload ? `${Object.keys(payload).length} claims` : 'waiting'} />
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            <section className="overflow-hidden rounded-[var(--radius)] border border-border-base bg-panel-bg">
              <div className="flex items-center gap-2 border-b border-border-base bg-sidebar-bg px-3 py-2 text-[11px] font-semibold">
                <span className="h-2 w-2 rounded-sm bg-[var(--red)]" />
                <span className={COLOR_HEADER}>Header</span>
                <span className="font-mono text-[var(--fg-3)]">Algorithm & token type</span>
              </div>
              <div className="p-3">
                {header ? renderJson(header, COLOR_HEADER) : <span className="text-sm italic text-text-secondary opacity-60">Waiting for input...</span>}
              </div>
            </section>

            <section className="overflow-hidden rounded-[var(--radius)] border border-border-base bg-panel-bg">
              <div className="flex items-center gap-2 border-b border-border-base bg-sidebar-bg px-3 py-2 text-[11px] font-semibold">
                <span className="h-2 w-2 rounded-sm bg-[var(--purple)]" />
                <span className={COLOR_PAYLOAD}>Payload</span>
                <span className="font-mono text-[var(--fg-3)]">Data & claims</span>
              </div>
              <div className="p-3">
                {payload ? (
                  <>
                    {renderJson(payload, COLOR_PAYLOAD)}
                    <div className="mt-4 space-y-1 border-t border-dashed border-border-base pt-3">
                      {['exp', 'iat', 'nbf'].map((key) => {
                        if (!payload[key]) return null;
                        return (
                          <div key={key} className="flex gap-3 font-mono text-xs">
                            <span className="w-8 text-text-secondary">{key}</span>
                            <span className="text-accent">{formatDate(payload[key])}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <span className="text-sm italic text-text-secondary opacity-60">Waiting for input...</span>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-[var(--radius)] border border-border-base bg-panel-bg">
              <div className="flex items-center gap-2 border-b border-border-base bg-sidebar-bg px-3 py-2 text-[11px] font-semibold">
                <span className="h-2 w-2 rounded-sm bg-[var(--blue)]" />
                <span className={COLOR_SIGNATURE}>Signature</span>
                <span className="font-mono text-[var(--fg-3)]">Verification hash</span>
              </div>
              <div className={`break-all p-3 font-mono text-sm ${COLOR_SIGNATURE}`}>
                {signature || <span className="italic text-text-secondary opacity-60">Waiting for input...</span>}
              </div>
            </section>
          </div>
        </ToolPane>
      </div>
    </ToolShell>
  );
};
