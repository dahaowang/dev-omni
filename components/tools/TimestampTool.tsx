import React, { useState, useEffect, useRef } from 'react';
import { 
  PanelLeft, 
  Calendar, 
  Copy, 
  CheckCircle2, 
  RefreshCw, 
  Play,
  Star
} from 'lucide-react';

interface TimestampToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

interface FormatRow {
  label: string;
  value: string;
  desc?: string;
}

export const TimestampTool: React.FC<TimestampToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel, isFavorite, onToggleFavorite }) => {
  const [mode, setMode] = useState<'live' | 'manual'>('live');
  const [date, setDate] = useState<Date>(new Date());
  const [input, setInput] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  
  const timerRef = useRef<number | null>(null);
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);

  // Initialize/Clear Live Timer
  useEffect(() => {
    if (mode === 'live') {
      setDate(new Date());
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

  // Handle Manual Input Parsing
  useEffect(() => {
    if (mode === 'manual' && input.trim()) {
      const parsed = parseDateString(input);
      if (parsed) setDate(parsed);
    }
  }, [input, mode]);

  const parseDateString = (str: string): Date | null => {
    const trimmed = str.trim();
    if (/^\d+$/.test(trimmed)) {
      const num = parseInt(trimmed, 10);
      return trimmed.length <= 11 ? new Date(num * 1000) : new Date(num);
    }
    const d = new Date(trimmed);
    return !isNaN(d.getTime()) ? d : null;
  };

  const switchToLive = () => {
    setMode('live');
    setInput('');
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMode('manual');
    setInput(e.target.value);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setMode('manual');
      setInput(val.replace('T', ' '));
      const newDate = new Date(val);
      if (!isNaN(newDate.getTime())) setDate(newDate);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  // Generate Formats
  const formats: FormatRow[] = [
    { label: 'Unix Timestamp (Seconds)', value: Math.floor(date.getTime() / 1000).toString() },
    { label: 'Unix Timestamp (Millis)', value: date.getTime().toString() },
    { label: 'ISO 8601', value: date.toISOString() },
    { label: 'UTC String', value: date.toUTCString() },
    { label: 'Locale String', value: date.toLocaleString() },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-app-bg text-text-primary">
      {/* Standard Header */}
      <div className="h-12 border-b border-border-base flex items-center px-4 bg-app-bg electron-drag select-none shrink-0 justify-between">
        <div className="flex items-center">
          {!isSidebarOpen && (
            <>
              {/* Traffic Light Spacer for macOS */}
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
            <button 
              onClick={onToggleFavorite} 
              className="electron-no-drag text-text-secondary hover:text-accent transition-colors p-1 rounded-md hover:bg-hover-overlay"
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
               <Star size={16} className={isFavorite ? "fill-accent text-accent" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 pt-2">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Main Control Card */}
          <div className="bg-panel-bg border border-border-base rounded-xl p-6 shadow-[var(--shadow-card)]">
             <div className="flex gap-4">
                <div className="flex-1 relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                      <Calendar size={18} />
                   </div>
                   <input 
                      type="text"
                      value={mode === 'live' ? '' : input}
                      onChange={handleManualInput}
                      placeholder={mode === 'live' ? "Paused on Live Time (Type to convert custom...)" : "Enter timestamp..."}
                      className="w-full bg-app-bg border border-border-base rounded-lg py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder-text-secondary/70"
                   />
                   {/* Hidden Date Picker Trigger */}
                   <input 
                      type="datetime-local"
                      ref={hiddenDateInputRef}
                      onChange={handleDatePickerChange}
                      className="absolute inset-0 opacity-0 pointer-events-none"
                   />
                </div>
                <button
                   onClick={() => mode === 'live' ? null : switchToLive()}
                   className={`px-6 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm ${
                     mode === 'live' 
                       ? 'bg-accent text-white hover:bg-accent/90' 
                       : 'bg-element-bg text-text-secondary hover:text-text-primary hover:bg-border-base'
                   }`}
                >
                   {mode === 'live' ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                   <span>Live Mode</span>
                </button>
             </div>
             <p className="text-xs text-text-secondary mt-3 ml-1">
                {mode === 'live' ? 'Updates every second. Type above or click calendar to convert a specific date.' : 'Showing conversions for custom date.'}
             </p>
          </div>

          {/* Result Cards */}
          <div className="space-y-4">
             {formats.map((item, idx) => (
               <div key={idx} className="bg-panel-bg border border-border-base rounded-xl p-5 shadow-[var(--shadow-card)] flex items-center justify-between group hover:border-accent/30 transition-colors">
                  <div className="min-w-0">
                     <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                       {item.label}
                     </div>
                     <div className="font-mono text-xl font-medium text-text-primary select-all">
                       {item.value}
                     </div>
                  </div>
                  <button
                     onClick={() => copyToClipboard(item.value, item.label)}
                     className={`p-2 rounded-lg border transition-all ${
                        copyFeedback === item.label
                          ? 'bg-green-50 border-green-200 text-green-600'
                          : 'bg-transparent border-border-base text-text-secondary hover:text-accent hover:border-accent'
                     }`}
                  >
                     {copyFeedback === item.label ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                  </button>
               </div>
             ))}
          </div>

        </div>
      </div>
    </div>
  );
};