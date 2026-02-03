import React, { useState } from 'react';
import { X, ChevronDown, Moon, Type } from 'lucide-react';
import { useTheme, ThemeName } from '../../context/ThemeContext';

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border-base rounded-lg bg-panel-bg overflow-hidden transition-all duration-200 shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-panel-bg hover:bg-hover-overlay transition-colors text-left focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="text-text-secondary">{icon}</div>
          <span className="text-sm font-medium text-text-primary">{title}</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 border-t border-border-base/50 bg-panel-bg/50 animate-fade-in">
          <div className="pt-4 space-y-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-[500px] bg-sidebar-bg border border-border-base rounded-lg shadow-2xl flex flex-col max-h-[80vh] text-text-primary transition-colors duration-300 animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-base shrink-0">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-4">
            
            {/* Appearance Section */}
            <SettingsSection title="Appearance" icon={<Moon size={18} />} defaultOpen={true}>
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-secondary font-medium">Theme</label>
                <div className="relative">
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as ThemeName)}
                    className="appearance-none bg-element-bg border border-border-base text-text-primary text-sm rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:border-accent cursor-pointer transition-colors hover:border-border-hover min-w-[140px]"
                  >
                    <option value="dark">Dark (OLED)</option>
                    <option value="graphite">Graphite (Modern)</option>
                    <option value="glass">Glass (Frost)</option>
                    <option value="cream">Cream (Warm)</option>
                    <option value="light">Light</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                </div>
              </div>
            </SettingsSection>

            {/* Editor Section */}
            <SettingsSection title="Editor" icon={<Type size={18} />}>
               <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary font-medium">Line Numbers</span>
                  <input type="checkbox" defaultChecked className="toggle-checkbox" />
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary font-medium">Word Wrap</span>
                  <input type="checkbox" className="toggle-checkbox" />
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary font-medium">Mini Map</span>
                  <input type="checkbox" className="toggle-checkbox" />
               </div>
            </SettingsSection>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-base flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:opacity-90 transition-all shadow-sm active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};