import React, { useState } from 'react';
import {
  ArrowDownUp,
  Binary,
  Braces,
  Calculator,
  CalendarClock,
  CaseSensitive,
  ChevronDown,
  Clock,
  Database,
  Dices,
  FileCode,
  FileImage,
  Files,
  Fingerprint,
  Hash,
  Link as LinkIcon,
  PanelLeft,
  Palette,
  QrCode,
  Regex,
  ScanText,
  Scissors,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Wand2
} from 'lucide-react';
import { ToolType } from '../types';

interface SidebarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  isRail: boolean;
  toggleSidebar: () => void;
  onSettingsClick: () => void;
  favorites: ToolType[];
  onToggleFavorite: (toolId: ToolType) => void;
  onSmartPaste: () => void;
}

interface ToolConfig {
  id: ToolType;
  label: string;
  icon: React.ReactNode;
  category: 'converters' | 'generators' | 'text';
  keywords: string[];
}

const TOOLS: ToolConfig[] = [
  { id: 'json', label: 'JSON', icon: <Braces size={14} />, category: 'converters', keywords: ['json', 'format', 'lint'] },
  { id: 'jwt', label: 'JWT Debugger', icon: <ShieldCheck size={14} />, category: 'converters', keywords: ['jwt', 'token', 'decode', 'security'] },
  { id: 'yaml', label: 'JSON <> YAML', icon: <FileCode size={14} />, category: 'converters', keywords: ['yaml', 'convert'] },
  { id: 'sql', label: 'SQL Format', icon: <Database size={14} />, category: 'converters', keywords: ['sql', 'format', 'query'] },
  { id: 'ocr', label: 'OCR', icon: <ScanText size={14} />, category: 'converters', keywords: ['ocr', 'image', 'text', 'recognize', 'scan', 'tesseract'] },
  { id: 'number', label: 'Number Base', icon: <Calculator size={14} />, category: 'converters', keywords: ['hex', 'binary', 'decimal'] },
  { id: 'image-base64', label: 'Image <> Base64', icon: <FileImage size={14} />, category: 'converters', keywords: ['image', 'picture', 'base64', 'encode'] },
  { id: 'url', label: 'URL Encode', icon: <LinkIcon size={14} />, category: 'converters', keywords: ['url', 'encode', 'decode'] },
  { id: 'base64', label: 'Text Converter', icon: <Binary size={14} />, category: 'converters', keywords: ['base64', 'encode', 'decode', 'text', 'unicode', 'utf8', 'hex'] },
  { id: 'cron', label: 'Cron Parser', icon: <CalendarClock size={14} />, category: 'generators', keywords: ['cron', 'schedule', 'time', 'job'] },
  { id: 'uuid', label: 'UUID Generator', icon: <Fingerprint size={14} />, category: 'generators', keywords: ['uuid', 'guid', 'id', 'unique'] },
  { id: 'qrcode', label: 'QR Code', icon: <QrCode size={14} />, category: 'generators', keywords: ['qr', 'barcode', 'scan', 'read'] },
  { id: 'timestamp', label: 'Timestamp', icon: <Clock size={14} />, category: 'generators', keywords: ['time', 'date', 'epoch'] },
  { id: 'color', label: 'Color Picker', icon: <Palette size={14} />, category: 'generators', keywords: ['color', 'hex', 'rgb'] },
  { id: 'random-string', label: 'Random String', icon: <Dices size={14} />, category: 'generators', keywords: ['random', 'password', 'string'] },
  { id: 'hash', label: 'Hash/MD5', icon: <Hash size={14} />, category: 'generators', keywords: ['hash', 'md5', 'sha'] },
  { id: 'case-converter', label: 'Case Converter', icon: <CaseSensitive size={14} />, category: 'text', keywords: ['case', 'camel', 'snake', 'pascal', 'kebab'] },
  { id: 'regex', label: 'Regex Tester', icon: <Regex size={14} />, category: 'text', keywords: ['regex', 'regexp', 'match', 'pattern'] },
  { id: 'text-joiner', label: 'Join / Split', icon: <ArrowDownUp size={14} />, category: 'text', keywords: ['join', 'split', 'csv', 'list', 'line'] },
  { id: 'diff', label: 'Diff', icon: <Scissors size={14} />, category: 'text', keywords: ['diff', 'compare'] },
  { id: 'dedupe', label: 'Dedupe', icon: <Files size={14} />, category: 'text', keywords: ['dedupe', 'unique', 'list'] }
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTool,
  setActiveTool,
  isRail,
  toggleSidebar,
  onSettingsClick,
  favorites,
  onToggleFavorite,
  onSmartPaste
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    favorites: true,
    converters: true,
    generators: true,
    text: true
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredTools = normalizedSearch
    ? TOOLS.filter((tool) =>
        tool.label.toLowerCase().includes(normalizedSearch) ||
        tool.keywords.some((keyword) => keyword.includes(normalizedSearch))
      )
    : TOOLS;
  const favoriteTools = TOOLS.filter((tool) => favorites.includes(tool.id));

  const toggleSection = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderNavItem = (tool: ToolConfig) => {
    const active = activeTool === tool.id;
    const isFav = favorites.includes(tool.id);

    return (
      <div key={tool.id} className="group relative">
        <button
          type="button"
          onClick={() => setActiveTool(tool.id)}
          title={isRail ? tool.label : undefined}
          className={`relative flex h-[var(--row-h)] w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2 text-left text-[12.5px] transition-colors ${
            isRail ? 'justify-center' : ''
          } ${
            active
              ? 'bg-active-item font-medium text-text-primary'
              : 'text-text-secondary hover:bg-hover-overlay hover:text-text-primary'
          }`}
        >
          {active && <span className="absolute -left-2 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" />}
          <span className={`shrink-0 ${active ? 'text-accent' : 'text-[var(--fg-3)] group-hover:text-text-primary'}`}>
            {tool.icon}
          </span>
          {!isRail && <span className="min-w-0 flex-1 truncate">{tool.label}</span>}
        </button>
        {!isRail && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(tool.id);
            }}
            className={`absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 transition-opacity hover:bg-hover-overlay ${
              isFav ? 'text-accent opacity-100' : 'text-[var(--fg-3)] opacity-0 group-hover:opacity-100'
            }`}
            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={11} className={isFav ? 'fill-current' : ''} />
          </button>
        )}
      </div>
    );
  };

  const renderSection = (title: string, tools: ToolConfig[], sectionKey: string) => {
    if (tools.length === 0) return null;
    const isExpanded = isRail || normalizedSearch ? true : expanded[sectionKey];

    return (
      <section className="mb-1">
        {!isRail && (
          <button
            type="button"
            onClick={() => !normalizedSearch && toggleSection(sectionKey)}
            className={`flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-3)] ${
              normalizedSearch ? 'cursor-default' : ''
            }`}
          >
            <span>{title}</span>
            <span className="flex items-center gap-1 font-mono text-[9px] tracking-normal">
              {tools.length}
              {!normalizedSearch && (
                <ChevronDown size={12} className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
              )}
            </span>
          </button>
        )}
        {isExpanded && <div className="space-y-0.5">{tools.map(renderNavItem)}</div>}
      </section>
    );
  };

  return (
    <aside
      className={`electron-drag flex h-full shrink-0 flex-col border-r border-border-base bg-sidebar-bg transition-[width] duration-200 ${
        isRail ? 'w-14' : 'w-[var(--side-w)]'
      }`}
    >
      <div className={`flex shrink-0 flex-col gap-2 px-3 pb-2 pt-12 ${isRail ? 'items-center px-2' : ''}`}>
        <div className={`flex w-full items-center gap-2.5 px-1 pb-1 ${isRail ? 'justify-center px-0' : ''}`}>
          <div className="relative flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-text-primary font-mono text-xs font-bold tracking-[-0.05em] text-app-bg">
            D
            <span className="absolute right-[3px] top-[3px] h-1.5 w-1.5 rounded-full bg-accent" />
          </div>
          {!isRail && (
            <div className="flex min-w-0 flex-col">
              <span className="text-[13px] font-semibold tracking-[-0.01em]">DevOmni</span>
              <span className="font-mono text-[10px] text-[var(--fg-3)]">v1.0.0 · local</span>
            </div>
          )}
        </div>

        {!isRail && (
          <label className="electron-no-drag relative flex h-[30px] items-center rounded-[var(--radius-sm)] border border-border-base bg-input-bg pl-7 pr-2 text-text-secondary focus-within:border-border-hover">
            <Search size={13} className="absolute left-2.5 text-[var(--fg-3)]" />
            <input
              type="text"
              placeholder="Search tools, paste anything..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent text-xs outline-none placeholder:text-text-secondary"
            />
            <span className="rounded border border-border-base bg-panel-bg px-1.5 py-px font-mono text-[10px] text-[var(--fg-3)]">⌘K</span>
          </label>
        )}

        <button
          type="button"
          onClick={onSmartPaste}
          title="Smart Paste from Clipboard"
          className={`electron-no-drag flex h-8 items-center gap-2 rounded-[var(--radius-sm)] border px-2.5 text-xs font-medium shadow-sm transition-opacity hover:opacity-90 ${
            isRail ? 'w-full justify-center px-0' : 'w-full'
          }`}
          style={{
            background: 'var(--accent)',
            borderColor: 'color-mix(in oklab, var(--accent) 60%, black)',
            color: 'var(--accent-fg)'
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
          <Wand2 size={13} />
          {!isRail && <span className="truncate">Smart paste from clipboard</span>}
        </button>
      </div>

      <nav className={`electron-no-drag flex-1 overflow-y-auto px-2 py-1 ${isRail ? 'space-y-1' : ''}`}>
        {!normalizedSearch && !isRail && favoriteTools.length > 0 && renderSection('Pinned', favoriteTools, 'favorites')}
        {renderSection('Converters', filteredTools.filter((tool) => tool.category === 'converters'), 'converters')}
        {renderSection('Generators', filteredTools.filter((tool) => tool.category === 'generators'), 'generators')}
        {renderSection('Text', filteredTools.filter((tool) => tool.category === 'text'), 'text')}
      </nav>

      <div className={`electron-no-drag flex shrink-0 items-center gap-2 border-t border-border-base p-2 ${isRail ? 'flex-col' : ''}`}>
        {!isRail && (
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-sm)] p-1">
            <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-accent font-mono text-[10px] font-bold text-[var(--accent-fg)]">
              LO
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-text-primary">local workspace</div>
              <div className="font-mono text-[10px] text-[var(--fg-3)]">{TOOLS.length} tools · offline</div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onSettingsClick}
          className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary transition-colors hover:bg-hover-overlay hover:text-text-primary"
          title="Settings"
        >
          <Settings size={15} />
        </button>
        <button
          type="button"
          onClick={toggleSidebar}
          className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary transition-colors hover:bg-hover-overlay hover:text-text-primary"
          title={isRail ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <PanelLeft size={15} className={isRail ? 'rotate-180' : ''} />
        </button>
      </div>
    </aside>
  );
};
