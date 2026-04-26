import React, { useState } from 'react';
import { CheckCircle2, Copy, Trash2, Type } from 'lucide-react';
import {
  GroupTitle,
  IconButton,
  MetricCard,
  PaneHeader,
  StatusBadge,
  ToolBody,
  ToolButton,
  ToolHeader,
  ToolPane,
  ToolShell
} from '../common/ToolChrome';

interface CaseConverterToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

interface CaseOption {
  id: string;
  label: string;
  example: string;
  transform: (words: string[]) => string;
}

const splitWords = (text: string): string[] => {
  if (!text) return [];
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\./g, ' ')
    .replace(/\//g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => word.toLowerCase());
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const CONVERTERS: CaseOption[] = [
  {
    id: 'camel',
    label: 'camelCase',
    example: 'myVariableName',
    transform: (words) => words.map((word, index) => (index === 0 ? word : capitalize(word))).join('')
  },
  {
    id: 'pascal',
    label: 'PascalCase',
    example: 'MyVariableName',
    transform: (words) => words.map(capitalize).join('')
  },
  {
    id: 'snake',
    label: 'snake_case',
    example: 'my_variable_name',
    transform: (words) => words.join('_')
  },
  {
    id: 'kebab',
    label: 'kebab-case',
    example: 'my-variable-name',
    transform: (words) => words.join('-')
  },
  {
    id: 'constant',
    label: 'CONSTANT_CASE',
    example: 'MY_VARIABLE_NAME',
    transform: (words) => words.join('_').toUpperCase()
  },
  {
    id: 'title',
    label: 'Title Case',
    example: 'My Variable Name',
    transform: (words) => words.map(capitalize).join(' ')
  },
  {
    id: 'sentence',
    label: 'Sentence case',
    example: 'My variable name',
    transform: (words) => {
      if (words.length === 0) return '';
      return [capitalize(words[0]), ...words.slice(1)].join(' ');
    }
  },
  {
    id: 'dot',
    label: 'dot.case',
    example: 'my.variable.name',
    transform: (words) => words.join('.')
  },
  {
    id: 'path',
    label: 'path/case',
    example: 'my/variable/name',
    transform: (words) => words.join('/')
  },
  {
    id: 'lower',
    label: 'lowercase',
    example: 'myvariablename',
    transform: (words) => words.join('')
  },
  {
    id: 'upper',
    label: 'UPPERCASE',
    example: 'MYVARIABLENAME',
    transform: (words) => words.join('').toUpperCase()
  }
];

export const CaseConverterTool: React.FC<CaseConverterToolProps> = ({ toolLabel }) => {
  const [input, setInput] = useState('helloWorld_example');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const words = splitWords(input);
  const results = CONVERTERS.map((converter) => ({
    ...converter,
    result: input.trim() ? converter.transform(words) : ''
  }));

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  return (
    <ToolShell>
      <ToolHeader icon={<Type />} title={toolLabel} subtitle="identifier case · live conversion">
        <StatusBadge tone={words.length > 0 ? 'ok' : 'neutral'}>{words.length} WORDS</StatusBadge>
        <ToolButton icon={<Trash2 />} onClick={() => setInput('')} variant="ghost">
          Clear
        </ToolButton>
      </ToolHeader>

      <ToolBody className="grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)]">
        <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
          <PaneHeader title="Input variable" meta={`${input.length} chars`} actions={<IconButton icon={<Trash2 />} onClick={() => setInput('')} title="Clear" />} />
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="min-h-[180px] shrink-0 resize-none border-b border-border-base bg-app-bg p-[18px] font-mono text-sm leading-6 text-text-primary outline-none placeholder:text-text-secondary"
            placeholder="Paste variable name here..."
            spellCheck={false}
          />

          <div className="min-h-0 flex-1 overflow-auto bg-sidebar-bg p-[18px]">
            <GroupTitle className="mt-0">Detected words</GroupTitle>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {words.length > 0 ? (
                words.map((word, index) => (
                  <span key={`${word}-${index}`} className="rounded-full border border-border-base bg-panel-bg px-2 py-1 font-mono text-[11.5px] text-accent">
                    {word}
                  </span>
                ))
              ) : (
                <span className="text-xs text-text-secondary">No words detected.</span>
              )}
            </div>

            <GroupTitle>Input stats</GroupTitle>
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="Words" value={words.length} />
              <MetricCard label="Chars" value={input.length} />
            </div>
          </div>
        </ToolPane>

        <ToolPane>
          <PaneHeader title="Converted results" meta={`${results.length} formats`} />
          <div className="min-h-0 flex-1 overflow-auto p-[18px]">
            <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
              {results.map((item) => (
                <div key={item.id} className="group flex min-w-0 items-center gap-3 rounded-[var(--radius-sm)] border border-border-base bg-panel-bg p-3 transition-colors hover:border-border-hover">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-3)]">{item.label}</span>
                      <Type size={12} className="text-text-secondary" />
                    </div>
                    <div className="truncate font-mono text-sm text-text-primary">
                      {item.result || <span className="text-text-secondary opacity-50">{item.example}</span>}
                    </div>
                  </div>
                  <IconButton
                    icon={copyFeedback === item.id ? <CheckCircle2 /> : <Copy />}
                    onClick={() => handleCopy(item.result, item.id)}
                    disabled={!item.result}
                    title={`Copy ${item.label}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </ToolPane>
      </ToolBody>
    </ToolShell>
  );
};
