import React from 'react';
import { LayoutTemplate, PanelLeft } from 'lucide-react';

interface PlaceholderToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

export const PlaceholderTool: React.FC<PlaceholderToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#13141f]">
      {/* Tool Header */}
      <div className="h-12 border-b border-gray-800 flex items-center px-4 bg-[#13141f] electron-drag select-none shrink-0">
          {!isSidebarOpen && (
          <>
            <div className="w-[70px] h-full shrink-0 electron-drag" />
            <button 
              onClick={toggleSidebar} 
              className="electron-no-drag p-1 mr-3 rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <PanelLeft size={18} />
            </button>
          </>
        )}
        <h2 className="text-sm font-semibold text-gray-200 tracking-wide">{toolLabel}</h2>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
        <LayoutTemplate size={64} className="mb-4 opacity-20" />
        <h2 className="text-xl font-semibold mb-2">Tool Not Implemented</h2>
        <p className="text-sm">This prototype currently showcases the JSON Format tool.</p>
      </div>
    </div>
  );
};