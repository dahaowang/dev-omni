import React, { useState, useEffect, useRef } from 'react';
import { 
  PanelLeft, 
  Clock, 
  Copy, 
  CheckCircle2, 
  RefreshCw, 
  Calendar,
  Play,
  Pause
} from 'lucide-react';

interface TimestampToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

interface FormatRow {
  label: string;
  value: string;
  desc?: string;
}

export const TimestampTool: React.FC<TimestampToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [mode, setMode] = useState<'live' | 'manual'>('live');
  const [date, setDate] = useState<Date>(new Date());
  const [input, setInput] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  
  // Timer ref for live clock
  const timerRef = useRef<number | null>(null);

  // Initialize/Clear Live Timer
  useEffect(() => {
    if (mode === 'live') {
      // Update immediately
      setDate(new Date());
      // Set interval
      timerRef.current = window.setInterval(() => {
        setDate(new Date());
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode]);

  // Handle Manual Input
  useEffect(() => {
    if (mode === 'manual') {
      if (!input.trim()) {
        // Fallback to now if empty, or keep last valid? Let's keep last valid or now.
        return;
      }
      
      const parsed = parseDateString(input);
      if (parsed) {
        setDate(parsed);
        setParseError(null);
      } else {
        setParseError('Invalid format');
      }
    }
  }, [input, mode]);

  const parseDateString = (str: string): Date | null => {
    const trimmed = str.trim();
    
    // Check for numeric (Unix Timestamp)
    if (/^\d+$/.test(trimmed)) {
      const num = parseInt(trimmed, 10);
      // Guess seconds vs milliseconds based on length
      // Unix seconds usually 10 digits (until year 2286), MS are 13
      if (trimmed.length <= 11) {
        return new Date(num * 1000);
      } else {
        return new Date(num);
      }
    }

    // Try standard date parse
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d;
    }

    return null;
  };

  const switchToLive = () => {
    setMode('live');
    setInput('');
    setParseError(null);
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMode('manual');
    setInput(e.target.value);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  // Generate Formats
  const formats: FormatRow[] = [
    { label: 'Unix Timestamp (Seconds)', value: Math.floor(date.getTime() / 1000).toString(), desc: 'Epoch seconds' },
    { label: 'Unix Timestamp (Millis)', value: date.getTime().toString(), desc: 'Epoch milliseconds' },
    { label: 'ISO 8601', value: date.toISOString(), desc: 'Standard interchange format' },
    { label: 'UTC String', value: date.toUTCString(), desc: 'Human readable UTC' },
    { label: 'Locale String', value: date.toLocaleString(), desc: 'Local time representation' },
    { label: 'Date Only', value: date.toISOString().split('T')[0], desc: 'YYYY-MM-DD' },
    { label: 'Time Only', value: date.toLocaleTimeString(), desc: 'Local time' },
  ];

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
          <h2 className="text-sm font-semibold text-text-primary tracking-wide mr-6">{toolLabel}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Controls Card */}
          <div className="bg-panel-bg border border-border-base rounded-lg p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              
              {/* Input Group */}
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                  <Calendar size={16} />
                </div>
                <input 
                  type="text" 
                  value={mode === 'live' ? '' : input}
                  placeholder={mode === 'live' ? "Paused on Live Time (Type to convert custom...)" : "Enter timestamp or date..."}
                  onChange={handleManualInput}
                  className={`w-full bg-input-bg border rounded-md py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-colors ${
                    parseError 
                      ? 'border-red-900/50 text-red-400 placeholder-red-400/50' 
                      : 'border-border-base focus:border-accent text-text-primary placeholder-text-secondary'
                  }`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={switchToLive}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                    mode === 'live'
                      ? 'bg-accent/10 text-accent border border-accent/20'
                      : 'bg-element-bg text-text-secondary border border-border-base hover:text-text-primary hover:border-border-hover'
                  }`}
                >
                  {mode === 'live' ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                  <span>{mode === 'live' ? 'Live Mode' : 'Resume Live'}</span>
                </button>
              </div>
            </div>
            
            {/* Status / Error Message */}
            <div className="mt-2 min-h-[20px]">
               {parseError ? (
                 <span className="text-xs text-red-400">{parseError}</span>
               ) : (
                 <span className="text-xs text-text-secondary">
                   {mode === 'live' 
                     ? 'Updates every second. Type above to convert a specific date.' 
                     : 'Showing conversions for input date.'}
                 </span>
               )}
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 gap-4">
             {formats.map((item, idx) => (
               <div 
                 key={idx} 
                 className="group bg-panel-bg border border-border-base rounded-lg p-4 flex items-center justify-between hover:border-accent/50 transition-colors"
               >
                 <div className="min-w-0 flex-1 mr-4">
                    <div className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1 flex items-center gap-2">
                      {item.label}
                      {/* Optional: Add badge for type if needed */}
                    </div>
                    <div className="font-mono text-lg text-text-primary truncate select-all">
                      {item.value}
                    </div>
                    <div className="text-[10px] text-text-secondary mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.desc}
                    </div>
                 </div>
                 
                 <button
                   onClick={() => copyToClipboard(item.value, item.label)}
                   className="p-2.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-element-bg border border-transparent hover:border-border-base transition-all active:scale-95 shrink-0"
                   title="Copy"
                 >
                   {copyFeedback === item.label ? (
                     <CheckCircle2 size={20} className="text-green-500" />
                   ) : (
                     <Copy size={20} />
                   )}
                 </button>
               </div>
             ))}
          </div>

        </div>
      </div>
    </div>
  );
};