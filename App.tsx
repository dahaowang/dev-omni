import React, { useState, useEffect, useRef } from 'react';
import { ToolType } from './types';
import { Sidebar } from './components/Sidebar';
import { JsonFormatter } from './components/tools/JsonFormatter';
import { DedupeTool } from './components/tools/DedupeTool';
import { DiffTool } from './components/tools/DiffTool';
import { HashTool } from './components/tools/HashTool';
import { UrlEncoderTool } from './components/tools/UrlEncoderTool';
import { Base64Tool } from './components/tools/Base64Tool';
import { SqlFormatterTool } from './components/tools/SqlFormatterTool';
import { NumberConverterTool } from './components/tools/NumberConverterTool';
import { JsonToYamlTool } from './components/tools/JsonToYamlTool';
import { TimestampTool } from './components/tools/TimestampTool';
import { ColorPickerTool } from './components/tools/ColorPickerTool';
import { RandomStringTool } from './components/tools/RandomStringTool';
import { QrCodeTool } from './components/tools/QrCodeTool';
import { TextJoinerTool } from './components/tools/TextJoinerTool';
import { ImageBase64Tool } from './components/tools/ImageBase64Tool';
import { UuidTool } from './components/tools/UuidTool';
import { RegexTesterTool } from './components/tools/RegexTesterTool';
import { CronTool } from './components/tools/CronTool';
import { CaseConverterTool } from './components/tools/CaseConverterTool';
import { JwtTool } from './components/tools/JwtTool';
import { OcrTool } from './components/tools/OcrTool';
import { PlaceholderTool } from './components/tools/PlaceholderTool';
import { SettingsModal } from './components/modals/SettingsModal';
import { analyzeClipboard } from './utils/clipboardDetection';
import { ChevronRight, Sparkles, Wand2, X } from 'lucide-react';

// --- Configuration ---

const TOOL_LABELS: Record<string, string> = {
  json: 'JSON',
  sql: 'SQL Formatter',
  url: 'URL Encoder',
  base64: 'Text Converter',
  number: 'Number Base',
  yaml: 'JSON <> YAML',
  timestamp: 'Timestamp Generator',
  color: 'Color Picker',
  'random-string': 'Random String',
  hash: 'Hash/MD5 Generator',
  diff: 'Text Diff',
  dedupe: 'Dedupe Lines',
  qrcode: 'QR Code Tool',
  'text-joiner': 'Text Joiner',
  'image-base64': 'Image <> Base64',
  uuid: 'UUID Generator',
  regex: 'Regex Tester',
  cron: 'Cron Expression',
  'case-converter': 'Case Converter',
  jwt: 'JWT Debugger',
  ocr: 'OCR'
};

const TOOL_CATEGORIES: Record<string, string> = {
  json: 'converters',
  jwt: 'converters',
  yaml: 'converters',
  sql: 'converters',
  ocr: 'converters',
  number: 'converters',
  'image-base64': 'converters',
  url: 'converters',
  base64: 'converters',
  cron: 'generators',
  uuid: 'generators',
  qrcode: 'generators',
  timestamp: 'generators',
  color: 'generators',
  'random-string': 'generators',
  hash: 'generators',
  'case-converter': 'text',
  regex: 'text',
  'text-joiner': 'text',
  diff: 'text',
  dedupe: 'text'
};

// --- Toast Component ---
const Toast: React.FC<{ message: string, onClose: () => void }> = ({ message, onClose }) => (
  <div className="fixed bottom-10 right-4 z-50 flex min-w-[280px] max-w-[360px] animate-fade-in items-start gap-2.5 rounded-[var(--radius)] border border-border-hover bg-panel-bg p-3 pr-9 shadow-[var(--shadow-md)]">
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
      <Wand2 size={14} />
    </div>
    <div className="min-w-0">
      <div className="text-xs font-semibold text-text-primary">Smart paste</div>
      <div className="mt-0.5 text-[11.5px] leading-5 text-text-secondary">{message.replace('Smart Paste: ', '')}</div>
    </div>
    <button onClick={onClose} className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md text-text-secondary hover:bg-hover-overlay hover:text-text-primary">
      <span className="sr-only">Close</span>
      <X size={12} />
    </button>
  </div>
);

const TitleBar: React.FC<{ activeTool: ToolType }> = ({ activeTool }) => (
  <div className="electron-drag flex h-[38px] shrink-0 items-center gap-2 border-b border-border-base bg-sidebar-bg px-3">
    <div className="flex items-center gap-1.5 font-mono text-xs text-text-secondary">
      <span>workspace</span>
      <ChevronRight size={11} />
      <span>{TOOL_CATEGORIES[activeTool] || 'tools'}</span>
      <ChevronRight size={11} />
      <b className="font-medium text-text-primary">{TOOL_LABELS[activeTool] || activeTool}</b>
    </div>
    <div className="ml-auto flex shrink-0 items-center gap-2 rounded-full border border-border-base bg-panel-bg py-1 pl-2 pr-2.5 text-[11px] text-text-secondary">
      <Sparkles size={11} />
      <span className="hidden whitespace-nowrap sm:inline">watching clipboard</span>
      <span className="rounded border border-border-hover bg-element-bg px-1.5 py-px font-mono text-[10px] text-text-secondary">⌥⌘V</span>
    </div>
  </div>
);

// --- Main App Layout ---

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('json');
  const [visitedTools, setVisitedTools] = useState<ToolType[]>(['json']);
  const [toolResetKeys, setToolResetKeys] = useState<Partial<Record<ToolType, number>>>({});
  const [isSidebarRail, setIsSidebarRail] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Smart Paste State
  const [smartPasteData, setSmartPasteData] = useState<{ tool: ToolType, content: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Track last processed clipboard content to prevent loops/re-pasting same content on focus
  const lastProcessedClipboard = useRef<string>('');
  
  // Favorites State with Persistence
  const [favorites, setFavorites] = useState<ToolType[]>(() => {
    try {
      const saved = localStorage.getItem('devomni-favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('devomni-favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    setVisitedTools(prev => prev.includes(activeTool) ? prev : [...prev, activeTool]);
  }, [activeTool]);

  const handleSmartPaste = async (isAutoTrigger: boolean = false) => {
    try {
      // In browser/Electron, readText might require focus. 
      // When this is triggered by 'focus' event, we naturally have focus.
      const text = await navigator.clipboard.readText();
      
      if (!text || !text.trim()) return;

      // If triggered automatically (by focus/startup), check if we already handled this exact text
      // This prevents overwriting the user's work if they just Alt-Tabbed out and back without copying anything new.
      if (isAutoTrigger && text === lastProcessedClipboard.current) {
        return;
      }

      const result = analyzeClipboard(text);
      if (result) {
        // Update the history tracker
        lastProcessedClipboard.current = text;
        
        // Switch tool and inject data
        setActiveTool(result.tool);
        setSmartPasteData({ tool: result.tool, content: result.content });
        setToolResetKeys(prev => ({ ...prev, [result.tool]: (prev[result.tool] || 0) + 1 }));
        setToastMessage(`Smart Paste: Detected ${result.label}`);
        
        // Auto-dismiss toast
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      // Clipboard might be empty or permission denied
      // console.warn('Clipboard check failed', err);
    }
  };

  // Initial Smart Paste Check on Mount
  useEffect(() => {
    handleSmartPaste(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check clipboard when window gains focus
  useEffect(() => {
    const onFocus = () => handleSmartPaste(true);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const toggleFavorite = (toolId: ToolType) => {
    setFavorites(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  const renderTool = (toolId: ToolType) => {
    const initialValue = (smartPasteData && smartPasteData.tool === toolId) ? smartPasteData.content : undefined;

    const commonProps = {
      isSidebarOpen: true,
      toggleSidebar: () => setIsSidebarRail(false),
      toolLabel: TOOL_LABELS[toolId] || toolId,
      initialValue
    };

    switch (toolId) {
      case 'json':
        return <JsonFormatter {...commonProps} />;
      case 'sql':
        return <SqlFormatterTool {...commonProps} />;
      case 'dedupe':
        return <DedupeTool {...commonProps} />;
      case 'diff':
        return <DiffTool {...commonProps} />;
      case 'hash':
        return <HashTool {...commonProps} />;
      case 'url':
        return <UrlEncoderTool {...commonProps} />;
      case 'base64':
        return <Base64Tool {...commonProps} />;
      case 'number':
        return <NumberConverterTool {...commonProps} />;
      case 'yaml':
        return <JsonToYamlTool {...commonProps} />;
      case 'timestamp':
        return <TimestampTool {...commonProps} />;
      case 'color':
        return <ColorPickerTool {...commonProps} />;
      case 'random-string':
        return <RandomStringTool {...commonProps} />;
      case 'qrcode':
        return <QrCodeTool {...commonProps} />;
      case 'text-joiner':
        return <TextJoinerTool {...commonProps} />;
      case 'image-base64':
        return <ImageBase64Tool {...commonProps} />;
      case 'uuid':
        return <UuidTool {...commonProps} />;
      case 'regex':
        return <RegexTesterTool {...commonProps} />;
      case 'cron':
        return <CronTool {...commonProps} />;
      case 'case-converter':
        return <CaseConverterTool {...commonProps} />;
      case 'jwt':
        return <JwtTool {...commonProps} />;
      case 'ocr':
        return <OcrTool {...commonProps} />;
      default:
        return <PlaceholderTool {...commonProps} />;
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-1 flex-col overflow-hidden bg-app-bg font-sans text-text-primary selection:bg-accent/30">
      <div className="flex flex-row h-full">
        <Sidebar 
          activeTool={activeTool} 
          setActiveTool={setActiveTool} 
          isRail={isSidebarRail}
          toggleSidebar={() => setIsSidebarRail(prev => !prev)}
          onSettingsClick={() => setIsSettingsOpen(true)}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onSmartPaste={() => handleSmartPaste(false)} // Manual trigger always processes
        />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-app-bg">
          <TitleBar activeTool={activeTool} />
          <div className="min-h-0 flex-1 overflow-hidden">
            {visitedTools.map(toolId => (
              <div
                key={`${toolId}-${toolResetKeys[toolId] || 0}`}
                className={`h-full flex-1 flex-col overflow-hidden ${toolId === activeTool ? 'flex animate-slide-up-fade' : 'hidden'}`}
              >
                {renderTool(toolId)}
              </div>
            ))}
          </div>
        </main>
      </div>
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
};

export default App;
