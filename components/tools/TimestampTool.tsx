import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Copy, Play, RefreshCw } from 'lucide-react';
import {
  Field,
  FieldInput,
  GroupTitle,
  IconButton,
  MetricCard,
  PaneHeader,
  SegmentedControl,
  StatusBadge,
  ToolBody,
  ToolButton,
  ToolHeader,
  ToolPane,
  ToolShell
} from '../common/ToolChrome';

interface TimestampToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
  initialValue?: string;
}

type Mode = 'live' | 'manual';
type Unit = 'seconds' | 'milliseconds' | 'microseconds';

interface FormatRow {
  label: string;
  value: string;
}

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

const parseDateString = (value: string): Date | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    const number = parseInt(trimmed, 10);
    return trimmed.length <= 11 ? new Date(number * 1000) : new Date(number);
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getDayOfYear = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / 86400000);
};

const getIsoWeek = (date: Date) => {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  return Math.ceil(((copy.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const formatRfc3339 = (date: Date) => {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
};

const applyCustomFormat = (date: Date, pattern: string) => {
  const replacements: Record<string, string> = {
    '%Y': String(date.getFullYear()),
    '%m': pad(date.getMonth() + 1),
    '%d': pad(date.getDate()),
    '%H': pad(date.getHours()),
    '%M': pad(date.getMinutes()),
    '%S': pad(date.getSeconds()),
    '%z': formatRfc3339(date).slice(-6),
    '%Z': Intl.DateTimeFormat().resolvedOptions().timeZone || 'local'
  };

  return pattern.replace(/%[YmdHMSzZ]/g, (token) => replacements[token] || token);
};

const getRelative = (date: Date) => {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absolute = Math.abs(seconds);
  if (absolute < 2) return 'just now';
  const unit = absolute < 60 ? 'sec' : absolute < 3600 ? 'min' : absolute < 86400 ? 'hour' : 'day';
  const value =
    unit === 'sec'
      ? absolute
      : unit === 'min'
        ? Math.round(absolute / 60)
        : unit === 'hour'
          ? Math.round(absolute / 3600)
          : Math.round(absolute / 86400);
  return seconds < 0 ? `${value} ${unit} ago` : `in ${value} ${unit}`;
};

export const TimestampTool: React.FC<TimestampToolProps> = ({ toolLabel, initialValue }) => {
  const [mode, setMode] = useState<Mode>('live');
  const [unit, setUnit] = useState<Unit>('seconds');
  const [date, setDate] = useState(new Date());
  const [input, setInput] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [customFormat, setCustomFormat] = useState('%Y-%m-%d %H:%M:%S %Z');
  const timerRef = useRef<number | null>(null);
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'live') {
      setDate(new Date());
      timerRef.current = window.setInterval(() => setDate(new Date()), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode]);

  useEffect(() => {
    if (initialValue) {
      setMode('manual');
      setInput(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    if (mode !== 'manual') return;
    if (!input.trim()) {
      setParseError(null);
      return;
    }

    const parsed = parseDateString(input);
    if (parsed) {
      setDate(parsed);
      setParseError(null);
    } else {
      setParseError('Unable to parse timestamp');
    }
  }, [input, mode]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  const handleManualInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMode('manual');
    setInput(event.target.value);
  };

  const handleDatePickerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) return;
    setMode('manual');
    setInput(value.replace('T', ' '));
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) setDate(parsed);
    event.target.value = '';
  };

  const openDatePicker = () => {
    if (!hiddenDateInputRef.current) return;
    if ('showPicker' in HTMLInputElement.prototype) {
      hiddenDateInputRef.current.showPicker();
    } else {
      hiddenDateInputRef.current.click();
    }
  };

  const unixSeconds = Math.floor(date.getTime() / 1000);
  const milliseconds = date.getTime();
  const heroValue =
    unit === 'seconds'
      ? unixSeconds.toString()
      : unit === 'milliseconds'
        ? milliseconds.toString()
        : `${milliseconds}000`;

  const formats = useMemo<FormatRow[]>(
    () => [
      { label: 'Unix · seconds', value: unixSeconds.toString() },
      { label: 'Unix · ms', value: milliseconds.toString() },
      { label: 'ISO 8601', value: date.toISOString() },
      { label: 'RFC 3339', value: formatRfc3339(date) },
      { label: 'RFC 2822', value: date.toUTCString() },
      { label: 'UTC', value: date.toUTCString().replace('GMT', 'UTC') },
      { label: 'Local', value: date.toLocaleString() },
      { label: 'Relative', value: getRelative(date) }
    ],
    [date, milliseconds, unixSeconds]
  );

  const dayOfYear = getDayOfYear(date);
  const isoWeek = getIsoWeek(date);
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  const customOutput = applyCustomFormat(date, customFormat);

  return (
    <ToolShell>
      <ToolHeader icon={<Clock />} title={toolLabel} subtitle="Unix · ISO 8601 · live">
        <SegmentedControl<Mode>
          value={mode}
          onChange={(value) => {
            setMode(value);
            if (value === 'live') setInput('');
          }}
          options={[
            { value: 'live', label: 'Live', icon: <RefreshCw /> },
            { value: 'manual', label: 'Manual', icon: <Calendar /> }
          ]}
        />
        <StatusBadge tone={parseError ? 'bad' : 'ok'}>{parseError ? 'INVALID' : mode.toUpperCase()}</StatusBadge>
        <ToolButton icon={copyFeedback === 'current' ? <CheckCircle2 /> : <Copy />} onClick={() => copyToClipboard(heroValue, 'current')}>
          Copy current
        </ToolButton>
      </ToolHeader>

      <ToolBody className="grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
          <div className="border-b border-border-base bg-sidebar-bg px-6 py-5">
            <div className="font-mono text-[42px] font-semibold leading-none tracking-[-0.01em] text-text-primary">
              {heroValue}
              {unit === 'seconds' && <span className="text-2xl text-[var(--fg-3)]">.{pad(date.getMilliseconds(), 3)}</span>}
              {mode === 'live' && <span className="ml-3 inline-block h-2 w-2 rounded-full bg-[var(--green)] align-middle" />}
            </div>
            <div className="mt-3 text-sm text-text-secondary">
              <b className="font-medium text-text-primary">{date.toUTCString()}</b> · {unit} since epoch
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <SegmentedControl<Unit>
                value={unit}
                onChange={setUnit}
                options={[
                  { value: 'seconds', label: 'seconds' },
                  { value: 'milliseconds', label: 'milliseconds' },
                  { value: 'microseconds', label: 'microseconds' }
                ]}
              />
              <span className="rounded-full border border-border-base bg-panel-bg px-2 py-1 font-mono text-[10.5px] text-text-secondary">
                {Intl.DateTimeFormat().resolvedOptions().timeZone || 'local'}
              </span>
            </div>
          </div>

          <div className="border-b border-border-base p-[18px]">
            <GroupTitle className="mt-0">Parse any value</GroupTitle>
            <div className="mt-3 flex gap-2">
              <FieldInput
                icon={<Calendar />}
                value={mode === 'live' ? '' : input}
                onChange={handleManualInput}
                placeholder="1745655738 · 2026-04-26T09:42:18Z"
                containerClassName="flex-1"
                className="text-sm"
              />
              <ToolButton icon={<Calendar />} onClick={openDatePicker} className="h-[34px]">
                Date picker
              </ToolButton>
              <ToolButton icon={<Play />} onClick={() => setMode('manual')} className="h-[34px]" variant="primary">
                Parse
              </ToolButton>
              <input
                ref={hiddenDateInputRef}
                type="datetime-local"
                onChange={handleDatePickerChange}
                className="absolute h-0 w-0 opacity-0"
                tabIndex={-1}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {parseError ? (
                <StatusBadge tone="bad">{parseError}</StatusBadge>
              ) : (
                <>
                  <StatusBadge tone="ok">parsed</StatusBadge>
                  <StatusBadge>{date.getFullYear()} · day {dayOfYear} · week {isoWeek}</StatusBadge>
                  <StatusBadge>Q{quarter}</StatusBadge>
                </>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <div className="grid grid-cols-[150px_minmax(0,1fr)_44px] border-b border-border-base bg-sidebar-bg px-[18px] py-2 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-3)]">
              <div>Format</div>
              <div>Value</div>
              <div className="text-right">Action</div>
            </div>
            {formats.map((format) => (
              <div key={format.label} className="grid grid-cols-[150px_minmax(0,1fr)_44px] items-center gap-3 border-b border-border-base px-[18px] py-3">
                <div className="text-xs font-medium text-text-secondary">{format.label}</div>
                <div className="min-w-0 truncate font-mono text-[13px] text-text-primary">{format.value}</div>
                <IconButton
                  icon={copyFeedback === format.label ? <CheckCircle2 /> : <Copy />}
                  onClick={() => copyToClipboard(format.value, format.label)}
                  title={`Copy ${format.label}`}
                />
              </div>
            ))}
          </div>
        </ToolPane>

        <ToolPane className="bg-sidebar-bg">
          <PaneHeader title="Components" />
          <div className="min-h-0 flex-1 overflow-auto p-[18px]">
            <div className="grid grid-cols-3 gap-2">
              <MetricCard label="Year" value={date.getFullYear()} />
              <MetricCard label="Month" value={pad(date.getMonth() + 1)} />
              <MetricCard label="Day" value={pad(date.getDate())} />
              <MetricCard label="Hour" value={pad(date.getHours())} />
              <MetricCard label="Min" value={pad(date.getMinutes())} />
              <MetricCard label="Sec" value={pad(date.getSeconds())} />
            </div>

            <GroupTitle>Calendar context</GroupTitle>
            <div className="space-y-2">
              <MetricCard label="Day of year" value={`${dayOfYear} / 365`} />
              <MetricCard label="ISO week" value={`${date.getFullYear()}-W${pad(isoWeek)}`} />
              <MetricCard label="Quarter" value={`Q${quarter}`} />
              <MetricCard label="Leap year" value={new Date(date.getFullYear(), 1, 29).getMonth() === 1 ? 'yes' : 'no'} />
            </div>

            <GroupTitle>Custom format</GroupTitle>
            <Field label="Pattern" hint="strftime subset">
              <FieldInput value={customFormat} onChange={(event) => setCustomFormat(event.target.value)} className="text-[13px]" />
            </Field>
            <div className="mt-2 rounded-[var(--radius-sm)] border border-border-base bg-panel-bg p-3 font-mono text-[13px] leading-5 text-accent break-all">
              {customOutput}
            </div>
          </div>
        </ToolPane>
      </ToolBody>
    </ToolShell>
  );
};
