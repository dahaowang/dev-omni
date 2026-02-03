import React, { useState } from 'react';
import { ToolType } from './types';
import { Sidebar } from './components/Sidebar';
import { JsonFormatter } from './components/tools/JsonFormatter';
import { PlaceholderTool } from './components/tools/PlaceholderTool';

// --- Configuration ---

const TOOL_LABELS: Record<string, string> = {
  json: 'JSON Formatter',
  sql: 'SQL Formatter',
  url: 'URL Encoder',
  hash: 'Hash/MD5 Generator',
  diff: 'Text Diff',
  dedupe: 'Dedupe Lines'
};

// --- Main App Layout ---

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('json');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const renderTool = () => {
    const commonProps = {
      isSidebarOpen,
      toggleSidebar: () => setIsSidebarOpen(!isSidebarOpen),
      toolLabel: TOOL_LABELS[activeTool] || activeTool
    };

    switch (activeTool) {
      case 'json':
        return <JsonFormatter {...commonProps} />;
      default:
        return <PlaceholderTool {...commonProps} />;
    }
  };

  return (
    <div className="flex flex-row h-screen w-full bg-[#13141f] text-white font-sans overflow-hidden selection:bg-blue-500/30">
      <Sidebar 
        activeTool={activeTool} 
        setActiveTool={setActiveTool} 
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      {renderTool()}
    </div>
  );
};

export default App;