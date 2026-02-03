import React, { useState } from 'react';
import { 
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

  const renderNavItem = (tool: ToolConfig) => {
    const active = activeTool === tool.id;
    return (
      <button 
        key={tool.id}
        onClick={() => setActiveTool(tool.id)}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-all duration-200 group ${
          active 
            ? 'bg-active-item text-text-primary font-medium' 
            : 'text-text-secondary hover:text-text-primary hover:bg-hover-overlay'
        }`}
      >
        <div className={`transition-colors ${active ? 'text-accent' : 'text-text-secondary group-hover:text-text-primary'}`}>
          {tool.icon}
        </div>
        <span className="text-sm truncate">{tool.label}</span>
      </button>
    );
  };

  const renderSection = (title: string, tools: ToolConfig[]) => {
    if (tools.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="text-xs font-bold text-text-secondary px-3 mb-2 uppercase tracking-wider">{title}</div>
        <div className="space-y-0.5 px-2">
          {tools.map(renderNavItem)}
        </div>
      </div>
    );
  };

  const favoriteTools = TOOLS.filter(t => favorites.includes(t.id));

  return (
    <div className="w-64 bg-sidebar-bg h-full flex flex-col border-r border-border-base flex-shrink-0 transition-colors duration-200">
      
      {/* Top Region: Drag + Search */}
      <div className="pt-8 pb-3 px-4 electron-drag flex flex-col gap-3 shrink-0">
         {/* Search Box - Matches screenshot style */}
         <div className="relative group electron-no-drag">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary group-focus-within:text-accent transition-colors" size={15} />
          <input 
            type="text" 
            placeholder="Search tools..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-input-bg border border-border-base text-sm text-text-primary rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all placeholder-text-secondary shadow-sm"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Favorites Section */}
        {!searchTerm && favoriteTools.length > 0 && (
          renderSection('Favorites', favoriteTools)
        )}

        {/* Categories */}
        {renderSection('Converters', filteredTools.filter(t => t.category === 'converters'))}
        {renderSection('Generators', filteredTools.filter(t => t.category === 'generators'))}
        {renderSection('Text', filteredTools.filter(t => t.category === 'text'))}
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-border-base flex items-center justify-between bg-sidebar-bg">
         <button 
          onClick={onSettingsClick}
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-hover-overlay rounded-md transition-colors"
          title="Settings"
        >
          <Settings size={20} />
         </button>
         
         <button 
          onClick={toggleSidebar}
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-hover-overlay rounded-md transition-colors md:hidden"
        >
          <PanelLeft size={20} />
         </button>
      </div>
    </div>
  );
};