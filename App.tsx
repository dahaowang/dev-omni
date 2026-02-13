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
import { Wand2 } from 'lucide-react';

// --- Configuration ---

const TOOL_LABELS: Record<string, string> = {
  json: 'JSON',
  sql: 'SQL Formatter',
  url: 'URL Encoder',
  base64: 'Base64 Converter',
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
  ocr: 'OCR (Ollama)'
};

// --- Toast Component ---
const Toast: React.FC<{ message: string, onClose: () => void }> = ({ message, onClose }) => (
  <div className="fixed bottom-6 right-6 z-50 bg-panel-bg border border-accent/20 shadow-lg rounded-lg p-3 flex items-center gap-3 animate-fade-in pr-8">
     <div className="bg-accent/10 p-1.5 rounded-full text-accent">
       <Wand2 size={16} />
     </div>
     <span className="text-sm font-medium text-text-primary">{message}</span>
     <button onClick={onClose} className="absolute top-2 right-2 text-text-secondary hover:text-text-primary">
       <span className="sr-only">Close</span>
       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
     </button>
  </div>
);

// --- Main App Layout ---

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('json');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

  const renderTool = () => {
    // Only pass initialValue if the current active tool matches the smart paste detected tool
    // AND we haven't 'consumed' it yet (though React key update handles reset usually, 
    // passing it as a prop that triggers useEffect in child is safer)
    const initialValue = (smartPasteData && smartPasteData.tool === activeTool) ? smartPasteData.content : undefined;

    const commonProps = {
      isSidebarOpen,
      toggleSidebar: () => setIsSidebarOpen(!isSidebarOpen),
      toolLabel: TOOL_LABELS[activeTool] || activeTool,
      initialValue // Pass this to all tools, they can choose to use it
    };

    switch (activeTool) {
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
    <div className="flex-1 flex flex-col h-screen w-full bg-app-bg text-text-primary font-sans overflow-hidden selection:bg-accent/30 relative">
      <div className="flex flex-row h-full">
        <Sidebar 
          activeTool={activeTool} 
          setActiveTool={setActiveTool} 
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onSettingsClick={() => setIsSettingsOpen(true)}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onSmartPaste={() => handleSmartPaste(false)} // Manual trigger always processes
        />
        
        {/* Tool Container with Animation Key */}
        {/* We add smartPasteData to key to force re-render if same tool is auto-selected with new data */}
        <div key={`${activeTool}-${smartPasteData?.content?.substring(0, 10)}`} className="flex-1 flex flex-col h-full animate-slide-up-fade overflow-hidden">
          {renderTool()}
        </div>
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