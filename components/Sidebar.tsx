import React, { useState } from 'react';
import { 
  Star, 
  Braces, 
  Database, 
  Link as LinkIcon, 
  Hash, 
  Scissors, 
  Files, 
  Settings, 
  Search,
  PanelLeft,
  Binary,
  Calculator,
  FileCode,
  Clock,
  Palette,
  Dices
} from 'lucide-react';
import { ToolType } from '../types';

interface SidebarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  onSettingsClick: () => void;
  favorites: ToolType[];
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
        ? 'bg-active-item text-text-primary shadow-sm' 
        : 'text-text-secondary hover:text-text-primary hover:bg-hover-overlay'
    }`}
  >
    <div className={`${active ? 'text-accent' : 'text-current'}`}>{icon}</div>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

interface ToolConfig {
  id: ToolType;
  label: string;
  icon: React.ReactNode;
  category: 'converters' | 'generators' | 'text';
  keywords: string[];
}

const TOOLS: ToolConfig[] = [
  // Converters
  { id: 'json', label: 'JSON Format', icon: <Braces size={18} />, category: 'converters', keywords: ['json', 'format', 'lint'] },
  { id: 'yaml', label: 'JSON <> YAML', icon: <FileCode size={18} />, category: 'converters', keywords: ['yaml', 'convert'] },
  { id: 'sql', label: 'SQL Format', icon: <Database size={18} />, category: 'converters', keywords: ['sql', 'format', 'query'] },
  { id: 'number', label: 'Number Base', icon: <Calculator size={18} />, category: 'converters', keywords: ['hex', 'binary', 'decimal'] },
  { id: 'url', label: 'URL Encode', icon: <LinkIcon size={18} />, category: 'converters', keywords: ['url', 'encode', 'decode'] },
  { id: 'base64', label: 'Base64', icon: <Binary size={18} />, category: 'converters', keywords: ['base64', 'encode', 'decode'] },
  
  // Generators
  { id: 'timestamp', label: 'Timestamp', icon: <Clock size={18} />, category: 'generators', keywords: ['time', 'date', 'epoch'] },
  { id: 'color', label: 'Color Picker', icon: <Palette size={18} />, category: 'generators', keywords: ['color', 'hex', 'rgb'] },
  { id: 'random-string', label: 'Random String', icon: <Dices size={18} />, category: 'generators', keywords: ['random', 'password', 'string'] },
  { id: 'hash', label: 'Hash/MD5', icon: <Hash size={18} />, category: 'generators', keywords: ['hash', 'md5', 'sha'] },
  
  // Text
  { id: 'diff', label: 'Diff', icon: <Scissors size={18} />, category: 'text', keywords: ['diff', 'compare'] },
  { id: 'dedupe', label: 'Dedupe', icon: <Files size={18} />, category: 'text', keywords: ['dedupe', 'unique', 'list'] },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTool, setActiveTool, isOpen, toggleSidebar, onSettingsClick, favorites }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredTools = TOOLS.filter(t => 
    t.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.keywords.some(k => k.includes(searchTerm.toLowerCase()))
  );

  const renderSection = (title: string, tools: ToolConfig[]) => {
    if (tools.length === 0) return null;
    return (
      <div className="px-2 mb-4">
        <div className="text-xs font-semibold text-text-secondary px-3 mb-2 uppercase tracking-wider">{title}</div>
        <div className="space-y-1">
          {tools.map(tool => (
            <NavItem 
              key={tool.id}
              active={activeTool === tool.id}
              onClick={() => setActiveTool(tool.id)}
              icon={tool.icon}
              label={tool.label}
            />
          ))}
        </div>
      </div>
    );
  };

  const favoriteTools = TOOLS.filter(t => favorites.includes(t.id));
  // If searching, we just show all matches in their categories, OR we could show a flat list. 
  // Let's stick to categories even in search, but if search is active, maybe hide favorites to avoid duplicates?
  // Let's keep Favorites visible if they match search, or simply always show favorites at top if not searching?
  // Common pattern: Favorites always at top.
  
  // Refined Logic:
  // 1. If searching: Show all matching tools grouped by category.
  // 2. If not searching: Show Favorites (if any), then all tools grouped by category.

  return (
    <div className="w-64 bg-sidebar-bg h-full flex flex-col border-r border-border-base flex-shrink-0 transition-all duration-300 ease-in-out">
      {/* Sidebar Header */}
      <div className="h-12 flex items-center px-4 electron-drag select-none shrink-0">
        <div className="w-[70px] h-full shrink-0"></div>
        <button 
          onClick={toggleSidebar} 
          className="electron-no-drag p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-hover-overlay transition-colors"
          title="Close Sidebar"
        >
          <PanelLeft size={18} />
        </button>
      </div>

      {/* Search Box */}
      <div className="px-4 mb-2 mt-2">
        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-text-secondary group-hover:text-text-primary transition-colors" size={14} />
          <input 
            type="text" 
            placeholder="Search tools..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-input-bg border border-border-base text-xs text-text-primary rounded-md pl-8 pr-3 py-2 focus:outline-none focus:border-border-hover transition-all placeholder-text-secondary"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 space-y-2">
        
        {/* Favorites Section */}
        {!searchTerm && favoriteTools.length > 0 && (
          <>
            {renderSection('Favorites', favoriteTools)}
            <div className="mx-4 my-2 border-b border-border-base opacity-50" />
          </>
        )}

        {/* Categories */}
        {renderSection('Converters', filteredTools.filter(t => t.category === 'converters'))}
        {renderSection('Generators', filteredTools.filter(t => t.category === 'generators'))}
        {renderSection('Text', filteredTools.filter(t => t.category === 'text'))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border-base space-y-4">
        <div className="flex flex-col space-y-4">
           <button 
            onClick={onSettingsClick}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <Settings size={20} />
           </button>
        </div>
      </div>
    </div>
  );
};