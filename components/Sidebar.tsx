import React, { useState } from 'react';
import { 
  Star, 
  Braces, 
  Database, 
  Link as LinkIcon, 
  Hash, 
  Scissors, 
  Files, 
  Plus, 
  User, 
  Settings, 
  Search,
  PanelLeft
} from 'lucide-react';
import { ToolType } from '../types';

interface SidebarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-all duration-200 ${
      active 
        ? 'bg-[#3b3e4a] text-white shadow-sm' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`}
  >
    <div className={`${active ? 'text-blue-400' : 'text-current'}`}>{icon}</div>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeTool, setActiveTool, isOpen, toggleSidebar }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const matchesSearch = (label: string) => label.toLowerCase().includes(searchTerm.toLowerCase());

  return (
    <div className="w-64 bg-[#1e1e2e] h-full flex flex-col border-r border-gray-800 flex-shrink-0 transition-all duration-300 ease-in-out">
      {/* Sidebar Header: Traffic Lights Spacer + Toggle Button */}
      <div className="h-12 flex items-center px-4 electron-drag select-none shrink-0">
        {/* Spacer for macOS Traffic Lights (approx 70px) */}
        <div className="w-[70px] h-full shrink-0"></div>
        
        {/* Toggle Sidebar Button */}
        <button 
          onClick={toggleSidebar} 
          className="electron-no-drag p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          title="Close Sidebar"
        >
          <PanelLeft size={18} />
        </button>
      </div>

      {/* Search Box */}
      <div className="px-4 mb-2 mt-2">
        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 group-hover:text-gray-400 transition-colors" size={14} />
          <input 
            type="text" 
            placeholder="Search tools..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#13141f] border border-gray-700 text-xs text-gray-200 rounded-md pl-8 pr-3 py-2 focus:outline-none focus:border-gray-600 focus:bg-[#1a1b23] transition-all placeholder-gray-600"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 space-y-6">
        
        {/* All Section */}
        {matchesSearch('favorites') && (
          <div className="px-2">
            <div className="text-xs font-semibold text-gray-500 px-3 mb-2 uppercase tracking-wider">All</div>
            <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
              <Star size={18} />
              <span className="text-sm">Favorites</span>
            </button>
          </div>
        )}

        {/* Converters Section */}
        <div className="px-2">
          {(matchesSearch('converters') || matchesSearch('json') || matchesSearch('sql') || matchesSearch('url')) && (
            <div className="text-xs font-semibold text-gray-500 px-3 mb-2 uppercase tracking-wider mt-2">Converters</div>
          )}
          <div className="space-y-1">
            {matchesSearch('json format') && (
              <NavItem 
                active={activeTool === 'json'} 
                onClick={() => setActiveTool('json')} 
                icon={<Braces size={18} />} 
                label="JSON Format" 
              />
            )}
            {matchesSearch('sql format') && (
              <NavItem 
                active={activeTool === 'sql'} 
                onClick={() => setActiveTool('sql')} 
                icon={<Database size={18} />} 
                label="SQL Format" 
              />
            )}
            {matchesSearch('url encode') && (
              <NavItem 
                active={activeTool === 'url'} 
                onClick={() => setActiveTool('url')} 
                icon={<LinkIcon size={18} />} 
                label="URL Encode" 
              />
            )}
          </div>
        </div>

        {/* Generators Section */}
        <div className="px-2">
          {(matchesSearch('generators') || matchesSearch('hash')) && (
             <div className="text-xs font-semibold text-gray-500 px-3 mb-2 uppercase tracking-wider mt-2">Generators</div>
          )}
          <div className="space-y-1">
             {matchesSearch('hash/md5') && (
              <NavItem 
                active={activeTool === 'hash'} 
                onClick={() => setActiveTool('hash')} 
                icon={<Hash size={18} />} 
                label="Hash/MD5" 
              />
             )}
          </div>
        </div>

        {/* Text Section */}
        <div className="px-2">
          {(matchesSearch('text') || matchesSearch('diff') || matchesSearch('dedupe')) && (
            <div className="text-xs font-semibold text-gray-500 px-3 mb-2 uppercase tracking-wider mt-2">Text</div>
          )}
          <div className="space-y-1">
            {matchesSearch('diff') && (
              <NavItem 
                active={activeTool === 'diff'} 
                onClick={() => setActiveTool('diff')} 
                icon={<Scissors size={18} />} 
                label="Diff" 
              />
            )}
            {matchesSearch('dedupe') && (
              <NavItem 
                active={activeTool === 'dedupe'} 
                onClick={() => setActiveTool('dedupe')} 
                icon={<Files size={18} />} 
                label="Dedupe" 
              />
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-800 space-y-4">
        <div className="flex flex-col space-y-4">
           <button className="text-gray-500 hover:text-white transition-colors">
            <User size={20} />
           </button>
           <button className="text-gray-500 hover:text-white transition-colors">
            <Settings size={20} />
           </button>
        </div>
      </div>
    </div>
  );
};