import React, { useState, useEffect } from 'react';
import { PanelLeft, AlertCircle, CheckCircle2, Copy, Trash2 } from 'lucide-react';

interface JwtToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

// Color coding constants
const COLOR_HEADER = "text-red-400";
const COLOR_PAYLOAD = "text-purple-400";
const COLOR_SIGNATURE = "text-blue-400";

// Helper to decode Base64Url
function b64DecodeUnicode(str: string) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    // Replace URL safe chars
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Pad
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    
    return decodeURIComponent(atob(padded).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

const formatDate = (timestamp: number) => {
    // JWT uses seconds
    return new Date(timestamp * 1000).toLocaleString();
};

export const JwtTool: React.FC<JwtToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [input, setInput] = useState('');
  const [header, setHeader] = useState<any>(null);
  const [payload, setPayload] = useState<any>(null);
  const [signature, setSignature] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!input.trim()) {
      setHeader(null);
      setPayload(null);
      setSignature('');
      setError(null);
      return;
    }

    try {
      const parts = input.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format (must have 3 parts separated by dots)');
      }

      // Decode Header
      try {
        const decodedHeader = JSON.parse(b64DecodeUnicode(parts[0]));
        setHeader(decodedHeader);
      } catch (e) {
        throw new Error('Failed to decode Header');
      }

      // Decode Payload
      try {
        const decodedPayload = JSON.parse(b64DecodeUnicode(parts[1]));
        setPayload(decodedPayload);
      } catch (e) {
        throw new Error('Failed to decode Payload');
      }

      // Signature (keep as is)
      setSignature(parts[2]);
      setError(null);

    } catch (err) {
      setHeader(null);
      setPayload(null);
      setSignature('');
      setError((err as Error).message);
    }
  }, [input]);

  const handleClear = () => {
    setInput('');
  };

  const renderJson = (data: any, colorClass: string) => {
    if (!data) return null;
    const jsonStr = JSON.stringify(data, null, 2);
    // Simple syntax highlighting: Keys
    // We could use a library, but let's just color the whole block primarily 
    // and maybe highlight standard keys if we want to get fancy.
    // For now, clean code block with the section color.
    return (
        <pre className={`font-mono text-sm whitespace-pre-wrap break-all ${colorClass}`}>
            {jsonStr}
        </pre>
    );
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
      <div className="flex-1 flex flex-col md:flex-row p-6 overflow-hidden gap-6">
         
         {/* Left: Input */}
         <div className="w-full md:w-1/3 flex flex-col min-h-0 gap-2">
            <div className="flex items-center justify-between">
                 <div className="text-sm font-medium text-text-secondary">Encoded Token</div>
                 <button onClick={handleClear} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
                   <Trash2 size={12} /> Clear
                 </button>
            </div>
            
            <div className={`flex-1 bg-panel-bg rounded-lg border overflow-hidden focus-within:border-accent transition-colors relative ${error ? 'border-red-500/30' : 'border-border-base'}`}>
               <textarea 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 className="w-full h-full bg-transparent resize-none p-4 font-mono text-sm leading-6 text-text-primary focus:outline-none placeholder-text-secondary break-all"
                 placeholder="Paste JWT here (eyJ...)"
                 spellCheck={false}
               />
               {/* Color coded overlay logic is complex for textarea, keeping it simple plain text input */}
            </div>

            {error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 flex gap-2 items-start">
                    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-red-300 font-mono">{error}</span>
                </div>
            ) : payload && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3 flex gap-2 items-center">
                     <CheckCircle2 size={16} className="text-green-500" />
                     <span className="text-xs text-green-300 font-medium">Valid Format</span>
                </div>
            )}
         </div>

         {/* Right: Decoded Output */}
         <div className="flex-1 flex flex-col min-h-0 bg-panel-bg border border-border-base rounded-lg shadow-sm overflow-hidden">
             
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Header Section */}
                <div>
                   <div className="flex items-center gap-2 mb-2 border-b border-border-base/50 pb-1">
                      <span className={`text-xs font-bold uppercase tracking-wider ${COLOR_HEADER}`}>Header</span>
                      <span className="text-[10px] text-text-secondary">Algorithm & Token Type</span>
                   </div>
                   <div className="bg-app-bg border border-border-base rounded-md p-3">
                      {header ? renderJson(header, COLOR_HEADER) : <span className="text-text-secondary opacity-50 text-sm italic">Waiting for input...</span>}
                   </div>
                </div>

                {/* Payload Section */}
                <div>
                   <div className="flex items-center gap-2 mb-2 border-b border-border-base/50 pb-1">
                      <span className={`text-xs font-bold uppercase tracking-wider ${COLOR_PAYLOAD}`}>Payload</span>
                      <span className="text-[10px] text-text-secondary">Data & Claims</span>
                   </div>
                   <div className="bg-app-bg border border-border-base rounded-md p-3 relative group">
                      {payload ? (
                          <>
                            {renderJson(payload, COLOR_PAYLOAD)}
                            
                            {/* Standard Claims Human Readable Overlay */}
                            <div className="mt-4 pt-4 border-t border-border-base border-dashed space-y-1">
                                {['exp', 'iat', 'nbf'].map(key => {
                                    if (payload[key]) {
                                        return (
                                            <div key={key} className="flex gap-2 text-xs font-mono">
                                                <span className="text-text-secondary w-8">{key}:</span>
                                                <span className="text-accent">{formatDate(payload[key])}</span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                          </>
                      ) : (
                          <span className="text-text-secondary opacity-50 text-sm italic">Waiting for input...</span>
                      )}
                   </div>
                </div>

                {/* Signature Section */}
                <div>
                   <div className="flex items-center gap-2 mb-2 border-b border-border-base/50 pb-1">
                      <span className={`text-xs font-bold uppercase tracking-wider ${COLOR_SIGNATURE}`}>Signature</span>
                      <span className="text-[10px] text-text-secondary">Verification Hash</span>
                   </div>
                   <div className="bg-app-bg border border-border-base rounded-md p-3 break-all font-mono text-sm text-blue-400 opacity-80">
                      {signature || <span className="text-text-secondary opacity-50 italic">Waiting for input...</span>}
                   </div>
                </div>

             </div>
         </div>

      </div>
    </div>
  );
};