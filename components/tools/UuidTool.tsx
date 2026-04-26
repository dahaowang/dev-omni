import React, { useEffect, useState } from 'react';
import { CheckCircle2, Copy, Fingerprint, Minus, Plus, RefreshCw, Settings2 } from 'lucide-react';
import { LineNumberTextarea } from '../common/LineNumberTextarea';
import {
  Field,
  FieldInput,
  GroupTitle,
  IconButton,
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

interface UuidToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

export const UuidTool: React.FC<UuidToolProps> = ({ toolLabel }) => {
  const [quantity, setQuantity] = useState(5);
  const [hyphens, setHyphens] = useState(true);
  const [uppercase, setUppercase] = useState(false);
  const [braces, setBraces] = useState(false);
  const [output, setOutput] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const getSingleUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = (Math.random() * 16) | 0;
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  };

  const generateUUIDs = () => {
    const count = Math.max(1, Math.min(2000, quantity));
    const result = [];

    for (let index = 0; index < count; index += 1) {
      let uuid = getSingleUUID();

      if (!hyphens) {
        uuid = uuid.replace(/-/g, '');
      }

      if (uppercase) {
        uuid = uuid.toUpperCase();
      }

      if (braces) {
        uuid = `{${uuid}}`;
      }

      result.push(uuid);
    }

    setOutput(result.join('\n'));
  };

  useEffect(() => {
    generateUUIDs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity, hyphens, uppercase, braces]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  };

  const adjustQuantity = (delta: number) => {
    setQuantity((current) => Math.max(1, Math.min(2000, current + delta)));
  };

  const lines = output ? output.split('\n').length : 0;
  const sampleLength = output.split('\n')[0]?.length || 0;

  return (
    <ToolShell>
      <ToolHeader icon={<Fingerprint />} title={toolLabel} subtitle="UUID v4 · batch generator">
        <StatusBadge tone="ok">{lines} ITEMS</StatusBadge>
        <ToolButton icon={<RefreshCw />} onClick={generateUUIDs}>
          Regenerate
        </ToolButton>
        <ToolButton icon={copyFeedback ? <CheckCircle2 /> : <Copy />} onClick={handleCopy} disabled={!output} variant="primary">
          {copyFeedback ? 'Copied' : 'Copy all'}
        </ToolButton>
      </ToolHeader>

      <ToolBody className="grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
          <PaneHeader
            title="Result list"
            meta={`${lines} items`}
            actions={
              <>
                <ToolButton icon={<RefreshCw />} onClick={generateUUIDs}>
                  Regenerate
                </ToolButton>
                <ToolButton icon={copyFeedback ? <CheckCircle2 /> : <Copy />} onClick={handleCopy} disabled={!output} variant="primary">
                  Copy all
                </ToolButton>
              </>
            }
          />
          <div className="min-h-0 flex-1 bg-app-bg">
            <LineNumberTextarea readOnly value={output} spellCheck={false} className="text-text-primary" />
          </div>
          <StatusBar>
            <span>version <b className="font-medium text-text-primary">v4</b></span>
            <span>quantity <b className="font-medium text-text-primary">{quantity}</b></span>
            <span>sample length <b className="font-medium text-text-primary">{sampleLength}</b></span>
          </StatusBar>
        </ToolPane>

        <ToolPane className="bg-sidebar-bg">
          <PaneHeader title="Configuration" actions={<Settings2 size={14} />} />
          <div className="min-h-0 flex-1 overflow-auto p-[18px]">
            <Field label="Quantity" hint="1-2000">
              <div className="flex items-center gap-2">
                <IconButton icon={<Minus />} onClick={() => adjustQuantity(-1)} title="Decrease quantity" />
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={Math.min(quantity, 100)}
                  onChange={(event) => setQuantity(parseInt(event.target.value, 10))}
                  className="min-w-0 flex-1 accent-[var(--accent)]"
                />
                <IconButton icon={<Plus />} onClick={() => adjustQuantity(1)} title="Increase quantity" />
              </div>
              <FieldInput
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Math.min(2000, parseInt(event.target.value, 10) || 1)))}
                className="text-center"
              />
            </Field>

            <GroupTitle>Format</GroupTitle>
            <ToggleRow label="Hyphens" description="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" checked={hyphens} onChange={setHyphens} />
            <ToggleRow label="Uppercase" description="Convert hexadecimal letters to A-F" checked={uppercase} onChange={setUppercase} />
            <ToggleRow label="Braces" description="{uuid}" checked={braces} onChange={setBraces} />

            <GroupTitle>Stats</GroupTitle>
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="Items" value={lines} />
              <MetricCard label="Length" value={sampleLength} />
            </div>
          </div>
        </ToolPane>
      </ToolBody>
    </ToolShell>
  );
};
