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
  Dices,
  Star,
  ChevronDown
} from 'lucide-react';
import { ToolType } from '../types';

interface SidebarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  onSettingsClick: () => void;
  favorites: ToolType[];
  onToggleFavorite: (toolId: ToolType) => void;
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
  { id: 'json', label: 'JSON Format', icon: <Braces size={16} />, category: 'converters', keywords: ['json', 'format', 'lint'] },
  { id: 'yaml', label: 'JSON <> YAML', icon: <FileCode size={16} />, category: 'converters', keywords: ['yaml', 'convert'] },
  { id: 'sql', label: 'SQL Format', icon: <Database size={16} />, category: 'converters', keywords: ['sql', 'format', 'query'] },
  { id: 'number', label: 'Number Base', icon: <Calculator size={16} />, category: 'converters', keywords: ['hex', 'binary', 'decimal'] },
  { id: 'url', label: 'URL Encode', icon: <LinkIcon size={16} />, category: 'converters', keywords: ['url', 'encode', 'decode'] },
  { id: 'base64', label: 'Base64', icon: <Binary size={16} />, category: 'converters', keywords: ['base64', 'encode', 'decode'] },
  
  // Generators
  { id: 'timestamp', label: 'Timestamp', icon: <Clock size={16} />, category: 'generators', keywords: ['time', 'date', 'epoch'] },
  { id: 'color', label: 'Color Picker', icon: <Palette size={16} />, category: 'generators', keywords: ['color', 'hex', 'rgb'] },
  { id: 'random-string', label: 'Random String', icon: <Dices size={16} />, category: 'generators', keywords: ['random', 'password', 'string'] },
  { id: 'hash', label: 'Hash/MD5', icon: <Hash size={16} />, category: 'generators', keywords: ['hash', 'md5', 'sha'] },
  
  // Text
  { id: 'diff', label: 'Diff', icon: <Scissors size={16} />, category: 'text', keywords: ['diff', 'compare'] },
  { id: 'dedupe', label: 'Dedupe', icon: <Files size={16} />, category: 'text', keywords: ['dedupe', 'unique', 'list'] },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTool, setActiveTool, isOpen, toggleSidebar, onSettingsClick, favorites, onToggleFavorite }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    favorites: true,
    converters: true,
    generators: true,
    text: true
  });

  if (!isOpen) return null;

  const toggleSection = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredTools = TOOLS.filter(t => 
    t.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.keywords.some(k => k.includes(searchTerm.toLowerCase()))
  );

  const renderNavItem = (tool: ToolConfig) => {
    const active = activeTool === tool.id;
    const isFav = favorites.includes(tool.id);

    return (
      <button 
        key={tool.id}
        onClick={() => setActiveTool(tool.id)}
        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-all duration-200 group ${
          active 
            ? 'bg-active-item text-text-primary font-medium' 
            : 'text-text-secondary hover:text-text-primary hover:bg-hover-overlay'
        }`}
      >
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className={`transition-colors shrink-0 ${active ? 'text-accent' : 'text-text-secondary group-hover:text-text-primary'}`}>
            {tool.icon}
          </div>
          <span className="text-xs font-medium truncate">{tool.label}</span>
        </div>

        {/* Favorite Star */}
        <div 
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(tool.id);
          }}
          className={`p-1 rounded-md hover:bg-hover-overlay transition-all duration-200 shrink-0 ${
            isFav 
              ? 'text-accent opacity-100' 
              : 'text-text-secondary opacity-0 group-hover:opacity-100 hover:!opacity-100'
          }`}
          title={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          <Star size={12} className={isFav ? "fill-current" : ""} />
        </div>
      </button>
    );
  };

  const renderSection = (title: string, tools: ToolConfig[], sectionKey: string) => {
    if (tools.length === 0) return null;
    
    // Force expand if searching, otherwise use state
    const isExpanded = searchTerm ? true : expanded[sectionKey];

    return (
      <div className="mb-2">
        <button 
          onClick={() => !searchTerm && toggleSection(sectionKey)}
          className={`w-full flex items-center justify-between px-3 py-1.5 mb-0.5 group focus:outline-none ${searchTerm ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider opacity-80 group-hover:opacity-100 transition-opacity select-none">
            {title}
          </div>
          {!searchTerm && (
            <ChevronDown 
              size={12} 
              className={`text-text-secondary opacity-50 group-hover:opacity-100 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} 
            />
          )}
        </button>
        
        {isExpanded && (
          <div className="space-y-0.5 px-2 animate-fade-in">
            {tools.map(renderNavItem)}
          </div>
        )}
      </div>
    );
  };

  const favoriteTools = TOOLS.filter(t => favorites.includes(t.id));

  return (
    <div className="w-64 bg-sidebar-bg h-full flex flex-col border-r border-border-base flex-shrink-0 transition-colors duration-200">
      
      {/* Top Region: Drag + Search */}
      <div className="pt-14 pb-2 px-3 electron-drag flex flex-col gap-2 shrink-0">
         {/* Search Box - Compacted */}
         <div className="relative group electron-no-drag">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-text-secondary group-focus-within:text-accent transition-colors" size={13} />
          <input 
            type="text" 
            placeholder="Search tools..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-input-bg border border-border-base text-xs text-text-primary rounded-md pl-8 pr-2 py-1.5 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all placeholder-text-secondary shadow-sm"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Favorites Section */}
        {!searchTerm && favoriteTools.length > 0 && (
          renderSection('Favorites', favoriteTools, 'favorites')
        )}

        {/* Categories */}
        {renderSection('Converters', filteredTools.filter(t => t.category === 'converters'), 'converters')}
        {renderSection('Generators', filteredTools.filter(t => t.category === 'generators'), 'generators')}
        {renderSection('Text', filteredTools.filter(t => t.category === 'text'), 'text')}
      </div>

      {/* Bottom Actions */}
      <div className="p-2 border-t border-border-base flex items-center justify-between bg-sidebar-bg shrink-0">
         <button 
          onClick={onSettingsClick}
          className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-hover-overlay rounded-md transition-colors"
          title="Settings"
        >
          <Settings size={18} />
         </button>
         
         <button 
          onClick={toggleSidebar}
          className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-hover-overlay rounded-md transition-colors"
          title="Collapse Sidebar"
        >
          <PanelLeft size={18} />
         </button>
      </div>
    </div>
  );
};