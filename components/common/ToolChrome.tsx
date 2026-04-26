import React from 'react';

type Tone = 'neutral' | 'ok' | 'bad';
type ButtonVariant = 'default' | 'primary' | 'ghost' | 'danger';

const toneVars: Record<Tone, { color: string; background: string; borderColor: string }> = {
  neutral: {
    color: 'var(--fg-2)',
    background: 'var(--bg-3)',
    borderColor: 'var(--line)'
  },
  ok: {
    color: 'var(--green)',
    background: 'color-mix(in oklab, var(--green) 12%, transparent)',
    borderColor: 'color-mix(in oklab, var(--green) 30%, var(--line))'
  },
  bad: {
    color: 'var(--red)',
    background: 'color-mix(in oklab, var(--red) 12%, transparent)',
    borderColor: 'color-mix(in oklab, var(--red) 30%, var(--line))'
  }
};

const buttonVars: Record<ButtonVariant, React.CSSProperties> = {
  default: {
    background: 'var(--bg-3)',
    borderColor: 'var(--line)',
    color: 'var(--fg)'
  },
  primary: {
    background: 'var(--accent)',
    borderColor: 'color-mix(in oklab, var(--accent) 70%, black)',
    color: 'var(--accent-fg)'
  },
  ghost: {
    background: 'transparent',
    borderColor: 'transparent',
    color: 'var(--fg-2)'
  },
  danger: {
    background: 'var(--bg-3)',
    borderColor: 'var(--line)',
    color: 'var(--fg)'
  }
};

export const ToolShell: React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`flex h-full flex-1 flex-col bg-app-bg text-text-primary ${className}`} {...props}>
    {children}
  </div>
);

export const ToolHeader: React.FC<React.PropsWithChildren<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}>> = ({ icon, title, subtitle, actions, children }) => (
  <div className="electron-drag flex min-h-12 shrink-0 flex-wrap items-center gap-3 border-b border-border-base bg-app-bg px-4 py-2">
    <div className="flex min-w-0 items-center gap-2">
      <span className="text-accent [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <h2 className="m-0 text-sm font-semibold tracking-[-0.01em] text-text-primary">{title}</h2>
      {subtitle && <span className="hidden truncate font-mono text-[11.5px] text-[var(--fg-3)] md:block">{subtitle}</span>}
    </div>
    <div className="electron-no-drag ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
      {children}
      {actions}
    </div>
  </div>
);

export const ToolPane: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <section className={`flex min-h-0 min-w-0 flex-1 flex-col bg-app-bg ${className}`}>
    {children}
  </section>
);

export const ToolBody: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <div className={`grid min-h-0 flex-1 overflow-hidden ${className}`}>
    {children}
  </div>
);

export const PaneHeader: React.FC<React.PropsWithChildren<{ title: string; meta?: string; actions?: React.ReactNode }>> = ({
  title,
  meta,
  actions,
  children
}) => (
  <div className="flex h-8 shrink-0 items-center justify-between border-b border-border-base bg-sidebar-bg px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-3)]">
    <span className="truncate">{meta ? `${title} · ${meta}` : title}</span>
    <div className="flex items-center gap-1 normal-case tracking-normal">
      {children}
      {actions}
    </div>
  </div>
);

export const StatusBadge: React.FC<React.PropsWithChildren<{ tone?: Tone; icon?: React.ReactNode; className?: string }>> = ({
  tone = 'neutral',
  icon,
  children,
  className = ''
}) => (
  <span
    className={`inline-flex h-[22px] items-center gap-1.5 rounded-full border px-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.02em] ${className}`}
    style={toneVars[tone]}
  >
    {icon || (tone !== 'neutral' && <span className="h-1.5 w-1.5 rounded-full bg-current" />)}
    {children}
  </span>
);

export const ToolButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode;
  variant?: ButtonVariant;
}> = ({ icon, variant = 'default', className = '', children, disabled, style, ...props }) => (
  <button
    type="button"
    disabled={disabled}
    className={`inline-flex h-7 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border px-3 text-xs font-medium transition-colors hover:border-border-hover disabled:cursor-not-allowed disabled:opacity-40 [&>svg]:h-[13px] [&>svg]:w-[13px] ${className}`}
    style={{ ...buttonVars[variant], ...style }}
    {...props}
  >
    {icon}
    {children}
  </button>
);

export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: React.ReactNode }> = ({
  icon,
  className = '',
  ...props
}) => (
  <button
    type="button"
    className={`inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-transparent text-text-secondary transition-colors hover:bg-hover-overlay hover:text-text-primary [&>svg]:h-[14px] [&>svg]:w-[14px] ${className}`}
    {...props}
  >
    {icon}
  </button>
);

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className = ''
}: {
  value: T;
  options: Array<{ value: T; label: string; icon?: React.ReactNode; disabled?: boolean }>;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={`flex h-7 items-center rounded-[var(--radius-sm)] border border-border-base bg-panel-bg p-0.5 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
          className={`flex h-[22px] items-center gap-1.5 rounded-[calc(var(--radius-sm)-2px)] px-2.5 text-[11.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 [&>svg]:h-[13px] [&>svg]:w-[13px] ${
            value === option.value
              ? 'bg-element-bg text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export const StatusBar: React.FC<React.PropsWithChildren<{ right?: React.ReactNode }>> = ({ children, right }) => (
  <div className="flex h-[26px] shrink-0 items-center gap-3 border-t border-border-base bg-sidebar-bg px-3 font-mono text-[11px] text-[var(--fg-3)]">
    {children}
    {right && <div className="ml-auto flex items-center gap-3">{right}</div>}
  </div>
);

export const GroupTitle: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <div className={`mt-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-3)] first:mt-0 ${className}`}>
    <span>{children}</span>
    <span className="h-px flex-1 bg-border-base" />
  </div>
);

export const Field: React.FC<React.PropsWithChildren<{ label: string; hint?: React.ReactNode; className?: string }>> = ({
  label,
  hint,
  children,
  className = ''
}) => (
  <label className={`flex flex-col gap-1.5 ${className}`}>
    <span className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--fg-3)]">
      <span>{label}</span>
      {hint && <span className="font-normal normal-case tracking-normal text-[var(--fg-3)]">{hint}</span>}
    </span>
    {children}
  </label>
);

export const FieldInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode; containerClassName?: string }> = ({
  icon,
  containerClassName = '',
  className = '',
  ...props
}) => (
  <div className={`flex h-[34px] items-center gap-2 rounded-[var(--radius-sm)] border border-border-base bg-input-bg px-2.5 font-mono text-[12.5px] transition-colors focus-within:border-border-hover focus-within:shadow-[0_0_0_2px_var(--selection)] ${containerClassName}`}>
    {icon && <span className="text-[var(--fg-3)] [&>svg]:h-[14px] [&>svg]:w-[14px]">{icon}</span>}
    <input
      className={`min-w-0 flex-1 border-0 bg-transparent outline-none placeholder:text-text-secondary ${className}`}
      {...props}
    />
  </div>
);

export const ToggleRow: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <label className="flex cursor-pointer items-center justify-between gap-3 border-t border-border-base py-2 first:border-t-0 first:pt-0">
    <span className="min-w-0 text-xs text-text-primary">
      {label}
      {description && <span className="mt-0.5 block text-[10.5px] text-[var(--fg-3)]">{description}</span>}
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="toggle-checkbox shrink-0"
    />
  </label>
);

export const PresetPills: React.FC<{ items: Array<{ label: string; value?: string; icon?: React.ReactNode }>; onSelect: (item: { label: string; value?: string }) => void }> = ({
  items,
  onSelect
}) => (
  <div className="flex flex-wrap gap-1.5">
    {items.map((item) => (
      <button
        key={`${item.label}-${item.value || ''}`}
        type="button"
        onClick={() => onSelect(item)}
        className="inline-flex h-[26px] items-center gap-1.5 rounded-full border border-border-base bg-panel-bg px-2.5 text-[11.5px] font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary [&>svg]:h-3 [&>svg]:w-3"
      >
        {item.icon}
        {item.label}
        {item.value && <span className="font-mono text-[10px] text-[var(--fg-3)]">{item.value}</span>}
      </button>
    ))}
  </div>
);

export function OutputTabs<T extends string>({
  value,
  options,
  onChange,
  right,
  className = ''
}: {
  value: T;
  options: Array<{ value: T; label: string; icon?: React.ReactNode }>;
  onChange: (value: T) => void;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex h-8 shrink-0 items-center border-b border-border-base bg-sidebar-bg px-3 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex h-8 items-center gap-1.5 px-3 font-mono text-[11.5px] transition-colors [&>svg]:h-[11px] [&>svg]:w-[11px] ${
            value === option.value
              ? 'text-text-primary shadow-[inset_0_-2px_0_var(--accent)]'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
      {right && <div className="ml-auto flex items-center gap-2 font-mono text-[10.5px] text-[var(--fg-3)]">{right}</div>}
    </div>
  );
}

export const CheckerboardSurface: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <div
    className={`flex min-h-0 flex-1 items-center justify-center p-6 ${className}`}
    style={{
      background:
        'repeating-conic-gradient(var(--bg-2) 0% 25%, var(--bg) 0% 50%) 50% / 14px 14px'
    }}
  >
    {children}
  </div>
);

export const MetricCard: React.FC<{ label: string; value: React.ReactNode; tone?: 'neutral' | 'amber' }> = ({
  label,
  value,
  tone = 'neutral'
}) => (
  <div className="rounded-[var(--radius-sm)] border border-border-base bg-panel-bg px-3 py-2">
    <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--fg-3)]">{label}</div>
    <div className={`font-mono text-lg font-semibold ${tone === 'amber' ? 'text-[var(--amber)]' : 'text-text-primary'}`}>{value}</div>
  </div>
);
