import React, { useState, useEffect } from 'react';
import { 
  PanelLeft, 
  Copy, 
  RefreshCw, 
  CheckCircle2, 
  Settings2,
  Fingerprint
} from 'lucide-react';

interface UuidToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

export const UuidTool: React.FC<UuidToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [quantity, setQuantity] = useState<number>(1);
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
    const count = Math.max(1, Math.min(1000, quantity));
    
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

                {/* Quantity */}
                <div className="mb-6">
                   <div className="flex justify-between items-center mb-2">
                     <label className="text-sm font-medium text-text-primary">Quantity</label>
                     <input 
                       type="number" 
                       value={quantity}
                       onChange={(e) => setQuantity(Math.max(1, Math.min(1000, parseInt(e.target.value) || 0)))}
                       className="w-16 bg-input-bg border border-border-base rounded px-2 py-1 text-xs text-right focus:border-accent outline-none"
                     />
                   </div>
                   <input 
                     type="range" 
                     min="1" 
                     max="100" 
                     value={Math.min(quantity, 100)} 
                     onChange={(e) => setQuantity(parseInt(e.target.value))}
                     className="w-full h-1.5 bg-element-bg rounded-lg appearance-none cursor-pointer accent-accent"
                   />
                </div>

                {/* Format Options */}
                <div className="space-y-3">
                   <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Hyphens</span>
                      <input 
                        type="checkbox" 
                        checked={hyphens} 
                        onChange={() => setHyphens(!hyphens)}
                        className="w-4 h-4 rounded border-border-base bg-input-bg text-accent focus:ring-offset-0 focus:ring-0 cursor-pointer"
                      />
                   </label>
                   <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Uppercase</span>
                      <input 
                        type="checkbox" 
                        checked={uppercase} 
                        onChange={() => setUppercase(!uppercase)}
                        className="w-4 h-4 rounded border-border-base bg-input-bg text-accent focus:ring-offset-0 focus:ring-0 cursor-pointer"
                      />
                   </label>
                   <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Braces {'{}'}</span>
                      <input 
                        type="checkbox" 
                        checked={braces} 
                        onChange={() => setBraces(!braces)}
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
                      <Fingerprint size={16} />
                      <span className="text-xs font-semibold uppercase tracking-wider">Generated UUIDs</span>
                   </div>
                   <button 
                     onClick={generateUUIDs}
                     className="flex items-center space-x-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-md hover:bg-accent/20 transition-colors text-xs font-medium"
                   >
                     <RefreshCw size={14} />
                     <span>Regenerate</span>
                   </button>
                </div>

                <div className="flex-1 relative bg-app-bg rounded-md border border-border-base p-0 flex flex-col overflow-hidden group">
                   <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button 
                        onClick={handleCopy}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-element-bg rounded transition-colors bg-panel-bg/80 backdrop-blur-sm border border-border-base shadow-sm"
                        title="Copy to clipboard"
                      >
                         {copyFeedback ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                      </button>
                   </div>
                   
                   <textarea
                     readOnly
                     value={output}
                     className="flex-1 w-full bg-transparent resize-none p-6 font-mono text-sm leading-relaxed text-text-primary focus:outline-none"
                   />
                </div>
                
                <div className="mt-4 flex justify-end">
                   <button 
                     onClick={handleCopy}
                     className="w-full md:w-auto flex items-center justify-center space-x-2 px-6 py-2 bg-element-bg border border-border-base text-text-primary rounded-md hover:border-accent hover:text-accent transition-all shadow-sm active:scale-95"
                   >
                     {copyFeedback ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                     <span className="font-medium">{copyFeedback ? 'Copied' : 'Copy List'}</span>
                   </button>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};