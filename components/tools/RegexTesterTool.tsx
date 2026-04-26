import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Copy, Regex, Sparkles, Trash2 } from 'lucide-react';
import { LineNumberTextarea } from '../common/LineNumberTextarea';
import {
  Field,
  FieldInput,
  GroupTitle,
  IconButton,
  MetricCard,
  PaneHeader,
  PresetPills,
  StatusBadge,
  ToolBody,
  ToolButton,
  ToolHeader,
  ToolPane,
  ToolShell
} from '../common/ToolChrome';

interface RegexTesterToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

interface MatchResult {
  index: number;
  match: string;
  groups: string[];
}

const PRESETS = [
  { label: 'Email', value: '[\\w.+-]+@([\\w-]+\\.)+[\\w-]{2,4}', flags: 'gm' },
  { label: 'Phone', value: '\\+?[\\d\\s-]{10,}', flags: 'gm' },
  { label: 'URL', value: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)', flags: 'gm' },
  { label: 'Date YYYY-MM-DD', value: '\\d{4}-\\d{2}-\\d{2}', flags: 'g' },
  { label: 'IPv4', value: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
  { label: 'Hex Color', value: '#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})', flags: 'gi' },
  { label: 'HTML tag', value: '<([a-z]+)([^<]+)*(?:>(.*)<\\/\\1>|\\s+\\/>)', flags: 'gim' },
  { label: 'Slug', value: '^[a-z0-9]+(?:-[a-z0-9]+)*$', flags: '' }
];

const FLAG_OPTIONS = [
  { char: 'g', label: 'global' },
  { char: 'i', label: 'ignore case' },
  { char: 'm', label: 'multiline' },
  { char: 's', label: 'dotall' },
  { char: 'u', label: 'unicode' }
];

export const RegexTesterTool: React.FC<RegexTesterToolProps> = ({ toolLabel }) => {
  const [pattern, setPattern] = useState('[\\w.+-]+@([\\w-]+\\.)+[\\w-]{2,4}');
  const [flags, setFlags] = useState('gm');
  const [testText, setTestText] = useState(
    'Hello world! contact@example.com is my email.\nCall me at +1-555-0123 today.\nOr write to noreply@devomni.app about the new release.\nCC: me+tag@gmail.com.'
  );
  const [replacement, setReplacement] = useState('<a href="mailto:$&">$&</a>');
  const [regexError, setRegexError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!pattern) {
      setMatches([]);
      setRegexError(null);
      setElapsedMs(0);
      return;
    }

    const started = performance.now();
    try {
      const regex = new RegExp(pattern, flags);
      const results: MatchResult[] = [];

      if (testText) {
        if (flags.includes('g')) {
          const matchesIter = testText.matchAll(regex);
          for (const match of matchesIter) {
            if (match.index !== undefined) {
              results.push({
                index: match.index,
                match: match[0],
                groups: match.slice(1)
              });
            }
          }
        } else {
          const match = testText.match(regex);
          if (match && match.index !== undefined) {
            results.push({
              index: match.index,
              match: match[0],
              groups: match.slice(1)
            });
          }
        }
      }

      setMatches(results);
      setRegexError(null);
    } catch (error) {
      setRegexError((error as Error).message);
      setMatches([]);
    } finally {
      setElapsedMs(performance.now() - started);
    }
  }, [pattern, flags, testText]);

  const regex = useMemo(() => {
    if (!pattern || regexError) return null;
    try {
      return new RegExp(pattern, flags);
    } catch (error) {
      return null;
    }
  }, [pattern, flags, regexError]);

  const replacementPreview = regex ? testText.replace(regex, replacement) : '';

  const toggleFlag = (char: string) => {
    setFlags((current) => {
      if (current.includes(char)) return current.replace(char, '');
      return `${current}${char}`;
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  const copyRegex = () => copyToClipboard(`/${pattern}/${flags}`, 'regex');
  const copyMatches = () => copyToClipboard(matches.map((match) => match.match).join('\n'), 'matches');

  return (
    <ToolShell>
      <ToolHeader icon={<Regex />} title={toolLabel} subtitle="live · matches · replacement">
        <StatusBadge tone={regexError ? 'bad' : 'ok'}>{regexError ? 'INVALID' : `${matches.length} MATCHES`}</StatusBadge>
        <ToolButton icon={copyFeedback === 'regex' ? <CheckCircle2 /> : <Copy />} onClick={copyRegex}>
          Copy regex
        </ToolButton>
      </ToolHeader>

      <ToolBody className="grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px]">
        <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
          <div className="border-b border-border-base bg-sidebar-bg p-[18px]">
            <div
              className={`flex h-[42px] items-center overflow-hidden rounded-[var(--radius)] border bg-input-bg font-mono transition-colors focus-within:border-border-hover focus-within:shadow-[0_0_0_2px_var(--selection)] ${
                regexError ? 'border-[color-mix(in_oklab,var(--red)_40%,var(--line))]' : 'border-border-base'
              }`}
            >
              <span className="select-none px-3 text-lg text-[var(--fg-3)]">/</span>
              <input
                value={pattern}
                onChange={(event) => setPattern(event.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-accent outline-none placeholder:text-text-secondary"
                placeholder="e.g. ^[a-z]+$"
                spellCheck={false}
              />
              <span className="select-none px-3 text-lg text-[var(--fg-3)]">/</span>
              <span className="flex h-full min-w-[56px] items-center border-l border-border-base px-3 text-sm text-accent">{flags || '-'}</span>
            </div>

            {regexError && (
              <div className="mt-2 flex items-center gap-1.5 font-mono text-xs text-[var(--red)]">
                <AlertCircle size={13} />
                {regexError}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-1.5">
              {FLAG_OPTIONS.map((flag) => (
                <button
                  key={flag.char}
                  type="button"
                  onClick={() => toggleFlag(flag.char)}
                  className={`inline-flex h-[26px] items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] transition-colors ${
                    flags.includes(flag.char)
                      ? 'border-[color-mix(in_oklab,var(--accent)_55%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-text-primary'
                      : 'border-border-base bg-panel-bg text-text-secondary hover:border-border-hover hover:text-text-primary'
                  }`}
                >
                  <span className="font-mono font-semibold text-accent">{flag.char}</span>
                  {flag.label}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <PresetPills
                items={PRESETS.map((preset) => ({ label: preset.label, value: preset.value, icon: <Sparkles /> }))}
                onSelect={(item) => {
                  const preset = PRESETS.find((entry) => entry.value === item.value);
                  if (!preset) return;
                  setPattern(preset.value);
                  setFlags(preset.flags);
                }}
              />
            </div>
          </div>

          <PaneHeader
            title="Test text"
            meta={`${testText.split('\n').length} lines`}
            actions={<IconButton icon={<Trash2 />} onClick={() => setTestText('')} title="Clear" />}
          />
          <div className="min-h-0 flex-1 bg-app-bg">
            <LineNumberTextarea
              value={testText}
              onChange={(event) => setTestText(event.target.value)}
              placeholder="Enter text to test regex against..."
              spellCheck={false}
              className="text-text-primary placeholder-text-secondary"
            />
          </div>
        </ToolPane>

        <ToolPane className="bg-sidebar-bg">
          <PaneHeader
            title="Matches"
            meta={`${matches.length}`}
            actions={
              <IconButton
                icon={copyFeedback === 'matches' ? <CheckCircle2 /> : <Copy />}
                onClick={copyMatches}
                disabled={matches.length === 0}
                title="Copy all matches"
              />
            }
          />
          <div className="min-h-0 flex-1 overflow-auto">
            {matches.length === 0 ? (
              <div className="flex h-44 flex-col items-center justify-center gap-2 p-6 text-center text-text-secondary opacity-60">
                <CheckCircle2 size={30} strokeWidth={1.4} />
                <span className="text-xs">{regexError ? 'Fix the pattern to resume matching.' : 'No matches found.'}</span>
              </div>
            ) : (
              matches.map((match, index) => (
                <div key={`${match.index}-${index}`} className="border-t border-border-base p-[14px] first:border-t-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 break-all font-mono text-sm text-accent">{match.match}</div>
                    <div className="shrink-0 font-mono text-[10.5px] text-[var(--fg-3)]">[{match.index}]</div>
                  </div>
                  <div className="mt-2 text-[11px] text-text-secondary">
                    match #{index + 1}
                    {match.groups.length > 0 && (
                      <span>
                        {' '}· groups ·{' '}
                        <b className="font-mono font-medium text-text-primary">{match.groups.map((group, groupIndex) => `$${groupIndex + 1}=${group || 'undefined'}`).join(' · ')}</b>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border-base p-[18px]">
            <GroupTitle className="mt-0">Substitute</GroupTitle>
            <Field label="Replacement" hint="supports $1, $2...">
              <FieldInput value={replacement} onChange={(event) => setReplacement(event.target.value)} className="text-[12.5px]" />
            </Field>
            <div className="mt-2 max-h-32 overflow-auto rounded-[var(--radius-sm)] border border-border-base bg-panel-bg p-3 font-mono text-[11.5px] leading-5 text-text-secondary">
              {replacementPreview || <span className="text-[var(--fg-3)]">Replacement preview will appear here.</span>}
            </div>
            <ToolButton
              icon={copyFeedback === 'replacement' ? <CheckCircle2 /> : <Copy />}
              onClick={() => copyToClipboard(replacementPreview, 'replacement')}
              className="mt-2 w-full"
              variant="primary"
              disabled={!replacementPreview}
            >
              Copy replacement
            </ToolButton>
          </div>

          <div className="border-t border-border-base p-[18px]">
            <GroupTitle className="mt-0">Performance</GroupTitle>
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="Matches" value={matches.length} />
              <MetricCard label="Time" value={`${elapsedMs.toFixed(2)} ms`} />
            </div>
          </div>
        </ToolPane>
      </ToolBody>
    </ToolShell>
  );
};
