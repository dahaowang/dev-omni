import React, { useState, useEffect } from 'react';
import { 
  PanelLeft, 
  Copy, 
  RefreshCw, 
  CheckCircle2, 
  Settings2,
  Fingerprint,
  Minus,
  Plus
} from 'lucide-react';

interface UuidToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

export const UuidTool: React.FC<UuidToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [quantity, setQuantity] = useState<number>(5);
  const [hyphens, setHyphens] = useState(true);
  const [uppercase, setUppercase] = useState(false);
  const [braces, setBraces] = useState(false);
  const [output, setOutput] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Generate on load and when options change
  useEffect(() => {
    generateUUIDs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity, hyphens, uppercase, braces]);

  const getSingleUUID = () => {
    // Robust UUID generation with fallback
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for environments where crypto.randomUUID is not available (older browsers/contexts)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const generateUUIDs = () => {
    // Basic validation for quantity
    const count = Math.max(1, Math.min(2000, quantity));
    
    let result = [];
    for (let i = 0; i < count; i++) {
        let uuid = getSingleUUID();
        
        if (!hyphens) {
            uuid = uuid.replace(/-/g, '');
        }
        
        if (uppercase) {
            uuid = uuid.toUpperCase();
        }
        
        if (braces) {
            uuid = `{${uuid}}`;
        }
        
        result.push(uuid);
    }
    setOutput(result.join('\n'));
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const adjustQuantity = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(2000, prev + delta)));
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

      {/* Content Container (Non-scrolling wrapper to allow flex-1 children to scroll) */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <div className="max-w-6xl mx-auto w-full flex flex-col h-full gap-4">
          
          {/* Top: Compact Configuration Panel */}
          <div className="shrink-0 bg-panel-bg border border-border-base rounded-lg p-4 shadow-sm flex flex-col md:flex-row gap-6 md:items-center justify-between">
             
             {/* Quantity Control */}
             <div className="flex-1 flex items-center gap-4 min-w-0">
                <div className="flex items-center gap-2 text-text-secondary shrink-0">
                   <Settings2 size={16} />
                   <span className="text-xs font-bold uppercase tracking-wider">Quantity</span>
                </div>
                
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                   <button onClick={() => adjustQuantity(-1)} className="p-1 rounded hover:bg-element-bg text-text-secondary hover:text-text-primary transition-colors">
                      <Minus size={14} />
                   </button>
                   <input 
                       type="range" 
                       min="1" 
                       max="100" 
                       value={Math.min(quantity, 100)} 
                       onChange={(e) => setQuantity(parseInt(e.target.value))}
                       className="flex-1 h-1.5 bg-element-bg rounded-lg appearance-none cursor-pointer accent-accent min-w-[100px]"
                   />
                   <button onClick={() => adjustQuantity(1)} className="p-1 rounded hover:bg-element-bg text-text-secondary hover:text-text-primary transition-colors">
                      <Plus size={14} />
                   </button>
                   <input 
                       type="number" 
                       value={quantity}
                       onChange={(e) => setQuantity(Math.max(1, Math.min(2000, parseInt(e.target.value) || 0)))}
                       className="w-16 bg-input-bg border border-border-base rounded px-2 py-1 text-sm text-center focus:border-accent outline-none font-mono"
                   />
                </div>
             </div>

             <div className="w-px h-8 bg-border-base hidden md:block"></div>

             {/* Toggles */}
             <div className="flex items-center gap-6 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                   <input 
                     type="checkbox" 
                     checked={hyphens} 
                     onChange={() => setHyphens(!hyphens)}
                     className="w-4 h-4 rounded border-border-base bg-input-bg text-accent focus:ring-offset-0 focus:ring-0 cursor-pointer"
                   />
                   <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Hyphens</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                   <input 
                     type="checkbox" 
                     checked={uppercase} 
                     onChange={() => setUppercase(!uppercase)}
                     className="w-4 h-4 rounded border-border-base bg-input-bg text-accent focus:ring-offset-0 focus:ring-0 cursor-pointer"
                   />
                   <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Uppercase</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                   <input 
                     type="checkbox" 
                     checked={braces} 
                     onChange={() => setBraces(!braces)}
                     className="w-4 h-4 rounded border-border-base bg-input-bg text-accent focus:ring-offset-0 focus:ring-0 cursor-pointer"
                   />
                   <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Braces {'{}'}</span>
                </label>
             </div>
          </div>

          {/* Bottom: Maximized Output Panel */}
          <div className="flex-1 min-h-0 bg-panel-bg border border-border-base rounded-lg flex flex-col shadow-sm">
             {/* Toolbar */}
             <div className="flex items-center justify-between p-3 border-b border-border-base bg-sidebar-bg/50 shrink-0">
                <div className="flex items-center space-x-2 text-text-secondary px-2">
                   <Fingerprint size={16} />
                   <span className="text-xs font-semibold uppercase tracking-wider">Result List</span>
                   <span className="text-xs opacity-50 font-mono">({output.split('\n').length} items)</span>
                </div>
                <div className="flex items-center gap-3">
                   <button 
                     onClick={generateUUIDs}
                     className="flex items-center space-x-1.5 px-3 py-1.5 bg-element-bg hover:bg-hover-overlay text-text-secondary hover:text-text-primary border border-border-base rounded-md transition-colors text-xs font-medium"
                   >
                     <RefreshCw size={14} />
                     <span>Regenerate</span>
                   </button>
                   <button 
                     onClick={handleCopy}
                     className="flex items-center space-x-1.5 px-4 py-1.5 bg-accent text-white rounded-md hover:bg-accent/90 transition-all shadow-sm active:scale-95 text-xs font-medium"
                   >
                     {copyFeedback ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                     <span>{copyFeedback ? 'Copied' : 'Copy All'}</span>
                   </button>
                </div>
             </div>

             {/* Text Area */}
             <div className="flex-1 relative bg-app-bg group">
                <textarea
                  readOnly
                  value={output}
                  className="absolute inset-0 w-full h-full resize-none p-4 font-mono text-sm leading-relaxed text-text-primary focus:outline-none bg-transparent"
                  spellCheck={false}
                />
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};