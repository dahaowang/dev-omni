import React from 'react';
import { LayoutTemplate, PanelLeft } from 'lucide-react';

interface PlaceholderToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

export const PlaceholderTool: React.FC<PlaceholderToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-app-bg">
      {/* Tool Header */}
      <div className="h-12 border-b border-border-base flex items-center px-4 bg-app-bg electron-drag select-none shrink-0">
          {!isSidebarOpen && (
          <>
            <div className="w-[70px] h-full shrink-0 electron-drag" />
            <button 
              onClick={toggleSidebar} 
              className="electron-no-drag p-1 mr-3 rounded-md text-text-secondary hover:text-text-primary hover:bg-hover-overlay transition-colors"
            >
              <PanelLeft size={18} />
            </button>
          </>
        )}
        <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-text-primary tracking-wide mr-6">{toolLabel}</h2>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-text-secondary">
        <LayoutTemplate size={64} className="mb-4 opacity-20" />
        <h2 className="text-xl font-semibold mb-2">Tool Not Implemented</h2>
        <p className="text-sm">This prototype currently showcases the JSON Format tool.</p>
      </div>
    </div>
  );
};