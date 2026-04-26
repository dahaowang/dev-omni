import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Copy, Info, Play, RefreshCw } from 'lucide-react';
// @ts-ignore
import { parseExpression } from 'cron-parser';
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

interface CronToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
  initialValue?: string;
}

type CronField = 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek';

interface CronState {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

const PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Daily 00:00', value: '0 0 * * *' },
  { label: 'Weekly Sun', value: '0 0 * * 0' },
  { label: 'Monthly 1st', value: '0 0 1 * *' },
  { label: 'Mon-Fri 9 AM', value: '0 9 * * 1-5' }
];

const QUICK_VALUES = ['*', '0', '5', '10', '15', '30', '*/5', '*/10', '*/15', '*/30', '9-17', '1-5'];

const CRON_FIELDS: Array<{ key: CronField; label: string; range: string }> = [
  { key: 'minute', label: 'Minute', range: '0-59' },
  { key: 'hour', label: 'Hour', range: '0-23' },
  { key: 'dayOfMonth', label: 'Day', range: '1-31' },
  { key: 'month', label: 'Month', range: '1-12' },
  { key: 'dayOfWeek', label: 'Weekday', range: '0-6' }
];

const parseParts = (expression: string): CronState | null => {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4]
  };
};

const toExpression = (state: CronState) =>
  `${state.minute} ${state.hour} ${state.dayOfMonth} ${state.month} ${state.dayOfWeek}`;

const describeExpression = (state: CronState) => {
  if (state.minute === '0' && state.hour !== '*' && state.dayOfWeek === '1-5') {
    return `At minute 0 past hour ${state.hour}, Monday through Friday.`;
  }
  if (state.minute === '0' && state.hour === '*') {
    return 'At minute 0 past every hour.';
  }
  if (state.minute === '*' && state.hour === '*') {
    return 'Every minute while the remaining date fields match.';
  }
  return 'Runs whenever all five cron fields match.';
};

const formatRun = (run: string) => {
  const date = new Date(run);
  return {
    date,
    dateLabel: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    timeLabel: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
};

const getApproxFrequency = (nextRuns: string[]) => {
  if (nextRuns.length < 2) return { perWeek: 'n/a', perYear: 'n/a' };
  const delta = new Date(nextRuns[1]).getTime() - new Date(nextRuns[0]).getTime();
  if (delta <= 0) return { perWeek: 'n/a', perYear: 'n/a' };
  return {
    perWeek: Math.max(1, Math.round((7 * 24 * 60 * 60 * 1000) / delta)).toLocaleString(),
    perYear: Math.max(1, Math.round((365 * 24 * 60 * 60 * 1000) / delta)).toLocaleString()
  };
};

export const CronTool: React.FC<CronToolProps> = ({ toolLabel, initialValue }) => {
  const [expression, setExpression] = useState('0 10 * * 1-5');
  const [nextRuns, setNextRuns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [activeField, setActiveField] = useState<CronField>('hour');
  const [builderState, setBuilderState] = useState<CronState>({
    minute: '0',
    hour: '10',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '1-5'
  });

  useEffect(() => {
    if (initialValue) {
      setExpression(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    try {
      const interval = parseExpression(expression);
      const runs = [];
      for (let index = 0; index < 5; index += 1) {
        runs.push(interval.next().toString());
      }
      setNextRuns(runs);
      setError(null);

      const parsed = parseParts(expression);
      if (parsed) setBuilderState(parsed);
    } catch (err) {
      setNextRuns([]);
      setError('Invalid Cron Expression');
    }
  }, [expression]);

  const updateBuilder = (key: CronField, value: string) => {
    const nextState = { ...builderState, [key]: value };
    setBuilderState(nextState);
    setExpression(toExpression(nextState));
  };

  const applyPreset = (value: string) => {
    const parsed = parseParts(value);
    if (parsed) setBuilderState(parsed);
    setExpression(value);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(expression);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  };

  const activeConfig = CRON_FIELDS.find((field) => field.key === activeField) || CRON_FIELDS[0];
  const frequency = getApproxFrequency(nextRuns);

  return (
    <ToolShell>
      <ToolHeader icon={<Clock />} title={toolLabel} subtitle="visual builder · next 5 runs">
        <StatusBadge tone={error ? 'bad' : 'ok'}>{error ? 'INVALID' : 'VALID'}</StatusBadge>
        <ToolButton icon={copyFeedback ? <CheckCircle2 /> : <Copy />} onClick={handleCopy}>
          Copy expression
        </ToolButton>
      </ToolHeader>

      <ToolBody className="grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
          <div className="flex gap-1.5 border-b border-border-base bg-sidebar-bg p-[18px]">
            {CRON_FIELDS.map((field) => (
              <button
                key={field.key}
                type="button"
                onClick={() => setActiveField(field.key)}
                className={`min-w-0 flex-1 rounded-[var(--radius-sm)] border bg-input-bg px-3 py-2 text-left transition-colors ${
                  activeField === field.key
                    ? 'border-accent shadow-[0_0_0_2px_var(--selection)]'
                    : 'border-border-base hover:border-border-hover'
                }`}
              >
                <div className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-3)]">{field.label}</div>
                <div className={`mt-1 truncate font-mono text-lg font-semibold ${activeField === field.key ? 'text-accent' : 'text-text-primary'}`}>
                  {builderState[field.key]}
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-[var(--fg-3)]">{field.range}</div>
              </button>
            ))}
          </div>

          <div className="flex items-start gap-2 border-b border-border-base bg-panel-bg px-[18px] py-3">
            <Info size={16} className="mt-0.5 shrink-0 text-accent" />
            <div className="text-sm leading-6 text-text-secondary">
              <b className="font-semibold text-text-primary">{describeExpression(builderState)}</b>
              <div className="mt-1 font-mono text-[11px] text-[var(--fg-3)]">{expression}</div>
              {error && <div className="mt-1 font-mono text-[11px] text-[var(--red)]">{error}</div>}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-[18px]">
            <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-3)]">
              <span>Editing · {activeConfig.label.toLowerCase()}</span>
              <span className="font-normal normal-case tracking-normal">tap a quick value or write a range</span>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-1.5">
              {QUICK_VALUES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateBuilder(activeField, value)}
                  className={`h-8 rounded-[var(--radius-sm)] border text-[11.5px] transition-colors ${
                    builderState[activeField] === value
                      ? 'border-[color-mix(in_oklab,var(--accent)_60%,black)] bg-accent text-[var(--accent-fg)]'
                      : 'border-border-base bg-panel-bg text-text-secondary hover:border-border-hover hover:text-text-primary'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <FieldInput
                value={builderState[activeField]}
                onChange={(event) => updateBuilder(activeField, event.target.value)}
                containerClassName="flex-1"
                className="text-[13px]"
              />
              <ToolButton icon={<RefreshCw />} onClick={() => updateBuilder(activeField, '*')} className="h-[34px]">
                Reset
              </ToolButton>
            </div>

            <GroupTitle>Presets</GroupTitle>
            <PresetPills items={PRESETS} onSelect={(item) => item.value && applyPreset(item.value)} />

            <GroupTitle>Manual expression</GroupTitle>
            <Field label="Cron expression" hint="5 fields">
              <div className="flex gap-2">
                <FieldInput value={expression} onChange={(event) => setExpression(event.target.value)} containerClassName="flex-1" className="text-[13px]" />
                <ToolButton icon={<Play />} onClick={() => setExpression(expression.trim())} className="h-[34px]" variant="primary">
                  Parse
                </ToolButton>
              </div>
            </Field>
          </div>
        </ToolPane>

        <ToolPane className="bg-sidebar-bg">
          <PaneHeader
            title="Next runs"
            meta={`${nextRuns.length}`}
            actions={<span className="rounded-full border border-border-base bg-panel-bg px-2 py-1 font-mono text-[10.5px] text-text-secondary">local time</span>}
          />
          <div className="min-h-0 flex-1 overflow-auto">
            {nextRuns.length > 0 ? (
              nextRuns.map((run, index) => {
                const formatted = formatRun(run);
                return (
                  <div key={`${run}-${index}`} className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 border-t border-border-base px-[18px] py-3 first:border-t-0">
                    <div className="font-mono text-[10px] tracking-[0.06em] text-[var(--fg-3)]">#{String(index + 1).padStart(2, '0')}</div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-text-primary">{formatted.dateLabel}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-[var(--fg-3)]">{formatted.timeLabel}</div>
                    </div>
                    <Calendar size={14} className="text-text-secondary" />
                  </div>
                );
              })
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-text-secondary opacity-60">
                <RefreshCw size={26} strokeWidth={1.4} />
                <span className="text-xs">Waiting for a valid expression.</span>
              </div>
            )}
          </div>

          <div className="border-t border-border-base p-[18px]">
            <GroupTitle className="mt-0">Frequency</GroupTitle>
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="Approx/week" value={frequency.perWeek} />
              <MetricCard label="Approx/year" value={frequency.perYear} />
            </div>
          </div>
        </ToolPane>
      </ToolBody>
    </ToolShell>
  );
};
