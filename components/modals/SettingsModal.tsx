import React from 'react';
import { X, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme, ThemeName } from '../../context/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[500px] bg-sidebar-bg border border-border-base rounded-lg shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-base">
          <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            
            {/* Appearance Section */}
            <div>
              <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">Appearance & Behavior</h3>
              
              <div className="bg-panel-bg rounded-lg border border-border-base p-4">
                <label className="text-sm font-medium text-text-primary block mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  <ThemeOption 
                    id="dark" 
                    label="Dark" 
                    currentTheme={theme} 
                    onSelect={setTheme} 
                    icon={<Moon size={18} />}
                    previewColor="#13141f"
                  />
                  <ThemeOption 
                    id="light" 
                    label="Light" 
                    currentTheme={theme} 
                    onSelect={setTheme} 
                    icon={<Sun size={18} />}
                    previewColor="#ffffff"
                  />
                  <ThemeOption 
                    id="midnight" 
                    label="Midnight" 
                    currentTheme={theme} 
                    onSelect={setTheme} 
                    icon={<Monitor size={18} />} // Representing high contrast/OLED
                    previewColor="#000000"
                  />
                </div>
              </div>
            </div>

            {/* Other Settings Placeholders */}
            <div>
              <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">Editor</h3>
              <div className="bg-panel-bg rounded-lg border border-border-base p-4 space-y-3">
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
            className="px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const ThemeOption: React.FC<{ 
  id: ThemeName; 
  label: string; 
  currentTheme: ThemeName; 
  onSelect: (t: ThemeName) => void;
  icon: React.ReactNode;
  previewColor: string;
}> = ({ id, label, currentTheme, onSelect, icon, previewColor }) => {
  const isSelected = currentTheme === id;
  return (
    <button
      onClick={() => onSelect(id)}
      className={`relative flex flex-col items-center p-3 rounded-md border-2 transition-all ${
        isSelected 
          ? 'border-accent bg-active-item' 
          : 'border-transparent hover:bg-hover-overlay'
      }`}
    >
      <div 
        className="w-full h-8 rounded mb-2 border border-gray-600/20 shadow-sm"
        style={{ backgroundColor: previewColor }}
      ></div>
      <div className="flex items-center space-x-2 text-text-primary">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {isSelected && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent"></div>
      )}
    </button>
  );
};