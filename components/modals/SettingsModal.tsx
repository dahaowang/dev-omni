import React from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useTheme, ThemeName } from '../../context/ThemeContext';

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
        <div className="flex items-center justify-between p-4 border-b border-border-base">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            
            {/* Appearance Section */}
            <div>
              <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">Appearance & Behavior</h3>
              
              <div className="bg-panel-bg rounded-lg border border-border-base p-4 transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">Theme</label>
                  <div className="relative">
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as ThemeName)}
                      className="appearance-none bg-element-bg border border-border-base text-text-primary text-sm rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:border-accent cursor-pointer transition-colors hover:border-border-hover min-w-[120px]"
                    >
                      <option value="dark">Dark (OLED)</option>
                      <option value="graphite">Graphite (Modern)</option>
                      <option value="cream">Cream (Warm)</option>
                      <option value="light">Light</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Other Settings Placeholders */}
            <div>
              <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">Editor</h3>
              <div className="bg-panel-bg rounded-lg border border-border-base p-4 space-y-3 transition-colors duration-300">
                 <div className="flex items-center justify-between">
                    <span className="text-sm text-text-primary">Line Numbers</span>
                    <input type="checkbox" defaultChecked className="toggle-checkbox" />
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm text-text-primary">Word Wrap</span>
                    <input type="checkbox" className="toggle-checkbox" />
                 </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-base flex justify-end">
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