import React, { useState } from 'react';
import { ToolType } from './types';
import { Sidebar } from './components/Sidebar';
import { JsonFormatter } from './components/tools/JsonFormatter';
import { DedupeTool } from './components/tools/DedupeTool';
import { DiffTool } from './components/tools/DiffTool';
import { HashTool } from './components/tools/HashTool';
import { UrlEncoderTool } from './components/tools/UrlEncoderTool';
import { Base64Tool } from './components/tools/Base64Tool';
import { SqlFormatterTool } from './components/tools/SqlFormatterTool';
import { PlaceholderTool } from './components/tools/PlaceholderTool';
import { SettingsModal } from './components/modals/SettingsModal';

// --- Configuration ---

const TOOL_LABELS: Record<string, string> = {
  json: 'JSON Formatter',
  sql: 'SQL Formatter',
  url: 'URL Encoder',
  base64: 'Base64 Converter',
  hash: 'Hash/MD5 Generator',
  diff: 'Text Diff',
  dedupe: 'Dedupe Lines'
};

// --- Main App Layout ---

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('json');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const renderTool = () => {
    const commonProps = {
      isSidebarOpen,
      toggleSidebar: () => setIsSidebarOpen(!isSidebarOpen),
      toolLabel: TOOL_LABELS[activeTool] || activeTool
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
      default:
        return <PlaceholderTool {...commonProps} />;
    }
  };

  return (
    <div className="flex flex-row h-screen w-full bg-app-bg text-text-primary font-sans overflow-hidden selection:bg-accent/30">
      <Sidebar 
        activeTool={activeTool} 
        setActiveTool={setActiveTool} 
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
      {renderTool()}
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};

export default App;