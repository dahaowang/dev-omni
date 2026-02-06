import React, { useState, useEffect } from 'react';
import { 
  PanelLeft, 
  Copy, 
  RefreshCw, 
  Dices, 
  CheckCircle2, 
  Settings2
} from 'lucide-react';

interface RandomStringToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
};

export const RandomStringTool: React.FC<RandomStringToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [length, setLength] = useState<number>(32);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });
  const [output, setOutput] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Generate on mount or when options change
  useEffect(() => {
    generateString();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount, user triggers subsequent gens

  const generateString = () => {
    let charset = '';
    if (options.uppercase) charset += CHAR_SETS.uppercase;
    if (options.lowercase) charset += CHAR_SETS.lowercase;
    if (options.numbers) charset += CHAR_SETS.numbers;
    if (options.symbols) charset += CHAR_SETS.symbols;

    if (!charset) {
      setOutput('');
      return;
    }

    let result = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += charset.charAt(array[i] % charset.length);
    }
    setOutput(result);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const toggleOption = (key: keyof typeof options) => {
    setOptions(prev => {
        const next = { ...prev, [key]: !prev[key] };
        // Prevent disabling all options
        if (!Object.values(next).some(Boolean)) {
            return prev;
        }
        return next;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-app-bg text-text-primary">
      {/* Header */}
      <div className="h-12 border-b border-border-base flex items-center px-4 bg-app-bg electron-drag select-none shrink-0 justify-between">
        <div className="flex items-center">
          {!isSidebarOpen && (
            <>
              <div className="w-[70px] h-full shrink-0 electron-drag" />
              <button 
                onClick={toggleSidebar} 
                className="electron-no-drag p-1 mr-3 rounded-md text-text-secondary hover:text-text-primary hover:bg-hover-overlay transition-colors"
                title="Open Sidebar"
              >
                <PanelLeft size={18} />
              </button>
            </>
          )}
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-text-primary tracking-wide mr-6">{toolLabel}</h2>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
          
          {/* Configuration Panel */}
          <div className="w-full md:w-80 flex flex-col gap-6 shrink-0">
             <div className="bg-panel-bg border border-border-base rounded-lg p-5 shadow-sm">
                <div className="flex items-center space-x-2 text-text-secondary mb-4 pb-2 border-b border-border-base">
                   <Settings2 size={16} />
                   <span className="text-xs font-semibold uppercase tracking-wider">Configuration</span>
                </div>

                {/* Length Slider */}
                <div className="mb-6">
                   <div className="flex justify-between items-center mb-2">
                     <label className="text-sm font-medium text-text-primary">Length</label>
                     <input 
                       type="number" 
                       value={length}
                       onChange={(e) => setLength(Math.max(1, Math.min(1024, parseInt(e.target.value) || 0)))}
                       className="w-16 bg-input-bg border border-border-base rounded px-2 py-1 text-xs text-right focus:border-accent outline-none"
                     />
                   </div>
                   <input 
                     type="range" 
                     min="4" 
                     max="128" 
                     value={Math.min(length, 128)} // Visual cap for slider
                     onChange={(e) => setLength(parseInt(e.target.value))}
                     className="w-full h-1.5 bg-element-bg rounded-lg appearance-none cursor-pointer accent-accent"
                   />
                </div>

                {/* Character Sets */}
                <div className="space-y-3">
                   <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Uppercase (A-Z)</span>
                      <input 
                        type="checkbox" 
                        checked={options.uppercase} 
                        onChange={() => toggleOption('uppercase')}
                        className="w-4 h-4 rounded border-border-base bg-input-bg text-accent focus:ring-offset-0 focus:ring-0 cursor-pointer"
                      />
                   </label>
                   <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Lowercase (a-z)</span>
                      <input 
                        type="checkbox" 
                        checked={options.lowercase} 
                        onChange={() => toggleOption('lowercase')}
                        className="w-4 h-4 rounded border-border-base bg-input-bg text-accent focus:ring-offset-0 focus:ring-0 cursor-pointer"
                      />
                   </label>
                   <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Numbers (0-9)</span>
                      <input 
                        type="checkbox" 
                        checked={options.numbers} 
                        onChange={() => toggleOption('numbers')}
                        className="w-4 h-4 rounded border-border-base bg-input-bg text-accent focus:ring-offset-0 focus:ring-0 cursor-pointer"
                      />
                   </label>
                   <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Symbols (!@#)</span>
                      <input 
                        type="checkbox" 
                        checked={options.symbols} 
                        onChange={() => toggleOption('symbols')}
                        className="w-4 h-4 rounded border-border-base bg-input-bg text-accent focus:ring-offset-0 focus:ring-0 cursor-pointer"
                      />
                   </label>
                </div>
             </div>
          </div>

          {/* Output Panel */}
          <div className="flex-1 flex flex-col gap-4">
             <div className="bg-panel-bg border border-border-base rounded-lg p-6 flex flex-col h-full shadow-sm">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center space-x-2 text-text-secondary">
                      <Dices size={16} />
                      <span className="text-xs font-semibold uppercase tracking-wider">Generated String</span>
                   </div>
                   <button 
                     onClick={generateString}
                     className="flex items-center space-x-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-md hover:bg-accent/20 transition-colors text-xs font-medium"
                   >
                     <RefreshCw size={14} />
                     <span>Regenerate</span>
                   </button>
                </div>

                <div className="flex-1 relative bg-app-bg rounded-md border border-border-base p-6 flex items-center justify-center overflow-hidden group">
                   <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={handleCopy}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-element-bg rounded transition-colors"
                        title="Copy to clipboard"
                      >
                         {copyFeedback ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                      </button>
                   </div>
                   
                   <p className="font-mono text-2xl text-text-primary break-all text-center leading-relaxed selection:bg-accent/30">
                     {output || <span className="text-text-secondary opacity-50 text-base">Select options to generate</span>}
                   </p>
                </div>
                
                <div className="mt-4 flex justify-end">
                   <button 
                     onClick={handleCopy}
                     className="w-full md:w-auto flex items-center justify-center space-x-2 px-6 py-2 bg-element-bg border border-border-base text-text-primary rounded-md hover:border-accent hover:text-accent transition-all shadow-sm active:scale-95"
                   >
                     {copyFeedback ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                     <span className="font-medium">{copyFeedback ? 'Copied' : 'Copy String'}</span>
                   </button>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};