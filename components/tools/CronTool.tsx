import React, { useState, useEffect } from 'react';
import { PanelLeft, Copy, CheckCircle2, Clock, Calendar, RefreshCw } from 'lucide-react';
// @ts-ignore
import { parseExpression } from 'cron-parser';

interface CronToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
  initialValue?: string;
}

type Tab = 'minute' | 'hour' | 'day' | 'month' | 'week';

interface CronState {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

const PRESETS = [
  { label: 'Every Minute', value: '* * * * *' },
  { label: 'Every Hour', value: '0 * * * *' },
  { label: 'Every Day at Midnight', value: '0 0 * * *' },
  { label: 'Every Sunday', value: '0 0 * * 0' },
  { label: 'Every Month (1st)', value: '0 0 1 * *' },
  { label: 'Mon-Fri at 9 AM', value: '0 9 * * 1-5' },
];

export const CronTool: React.FC<CronToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel, initialValue }) => {
  const [expression, setExpression] = useState('0 10 * * 1-5'); // Default: 10 AM Mon-Fri
  const [nextRuns, setNextRuns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // Visual Builder State
  const [activeTab, setActiveTab] = useState<Tab>('minute');
  const [builderState, setBuilderState] = useState<CronState>({
    minute: '0',
    hour: '10',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '1-5'
  });

  // Handle Smart Paste
  useEffect(() => {
    if (initialValue) {
        setExpression(initialValue);
    }
  }, [initialValue]);

  // Effect: When Expression Changes -> Calculate Next Runs
  useEffect(() => {
    try {
      const interval = parseExpression(expression);
      const runs = [];
      for (let i = 0; i < 5; i++) {
        runs.push(interval.next().toString());
      }
      setNextRuns(runs);
      setError(null);
      
      // Attempt to sync builder with simple expressions
      // This is a "best effort" sync to avoid overwriting user manual inputs with wrong visual state
      const parts = expression.trim().split(/\s+/);
      if (parts.length === 5) {
         setBuilderState({
            minute: parts[0],
            hour: parts[1],
            dayOfMonth: parts[2],
            month: parts[3],
            dayOfWeek: parts[4]
         });
      }
    } catch (err) {
      setNextRuns([]);
      setError('Invalid Cron Expression');
    }
  }, [expression]);

  const updateBuilder = (key: keyof CronState, value: string) => {
    const newState = { ...builderState, [key]: value };
    setBuilderState(newState);
    setExpression(`${newState.minute} ${newState.hour} ${newState.dayOfMonth} ${newState.month} ${newState.dayOfWeek}`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(expression);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // --- Builder UI Components ---

  const renderCheckboxGrid = (
    total: number, 
    currentVal: string, 
    update: (val: string) => void, 
    startFromZero: boolean = true,
    labels?: string[]
  ) => {
    // Logic: Parse current comma-separated values to find checked items
    const selected = currentVal === '*' ? [] : currentVal.split(',').map(s => parseInt(s));
    const isEvery = currentVal === '*';

    const toggle = (num: number) => {
      if (isEvery) {
        // Switch from * to specific
        update(num.toString());
      } else {
        // Toggle specific
        let newSelected;
        if (selected.includes(num)) {
          newSelected = selected.filter(n => n !== num);
        } else {
          newSelected = [...selected, num].sort((a, b) => a - b);
        }
        update(newSelected.length > 0 ? newSelected.join(',') : '*');
      }
    };

    return (
      <div className="mt-4">
        <div className="flex items-center gap-4 mb-4">
           <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                checked={isEvery} 
                onChange={() => update('*')}
                className="text-accent focus:ring-accent"
              />
              <span className="text-sm">Every {activeTab}</span>
           </label>
           <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                checked={!isEvery} 
                onChange={() => update(startFromZero ? '0' : '1')}
                className="text-accent focus:ring-accent"
              />
              <span className="text-sm">Specific {activeTab}s</span>
           </label>
        </div>

        {!isEvery && (
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {Array.from({ length: total }).map((_, i) => {
              const val = startFromZero ? i : i + 1;
              const isChecked = selected.includes(val);
              return (
                <button
                  key={val}
                  onClick={() => toggle(val)}
                  className={`text-xs py-1.5 rounded border transition-colors ${
                    isChecked 
                      ? 'bg-accent text-white border-accent' 
                      : 'bg-element-bg border-border-base text-text-secondary hover:border-accent/50'
                  }`}
                >
                  {labels ? labels[i] : val}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'minute':
        return renderCheckboxGrid(60, builderState.minute, (v) => updateBuilder('minute', v), true);
      case 'hour':
        return renderCheckboxGrid(24, builderState.hour, (v) => updateBuilder('hour', v), true);
      case 'day':
        return renderCheckboxGrid(31, builderState.dayOfMonth, (v) => updateBuilder('dayOfMonth', v), false);
      case 'month':
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return renderCheckboxGrid(12, builderState.month, (v) => updateBuilder('month', v), true, months); // cron-parser usually 1-12 or names, but standard cron is 1-12. simple inputs often use 1-12. Let's use 1-12 for output.
        // Wait, standard cron month is 1-12.
        // Re-implement for 1-based months
      case 'week':
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return renderCheckboxGrid(7, builderState.dayOfWeek, (v) => updateBuilder('dayOfWeek', v), true, days);
      default:
        return null;
    }
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
      <div className="flex-1 flex flex-col p-6 overflow-hidden gap-6">
        
        {/* Top: Expression Input & Presets */}
        <div className="flex flex-col gap-4">
           {/* Result Bar */}
           <div className="bg-panel-bg border border-border-base rounded-lg p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1 w-full">
                 <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Cron Expression</label>
                    <div className="flex gap-2">
                       {PRESETS.map(p => (
                          <button 
                             key={p.label}
                             onClick={() => setExpression(p.value)}
                             className="text-[10px] bg-element-bg hover:bg-hover-overlay border border-border-base rounded px-2 py-0.5 text-text-secondary transition-colors"
                          >
                             {p.label}
                          </button>
                       ))}
                    </div>
                 </div>
                 <div className="relative group">
                    <input 
                      type="text" 
                      value={expression}
                      onChange={(e) => setExpression(e.target.value)}
                      className={`w-full text-2xl font-mono bg-app-bg border rounded-md p-4 outline-none transition-colors ${
                         error ? 'border-red-500/50 text-red-400' : 'border-border-base focus:border-accent text-accent'
                      }`}
                    />
                    <button 
                      onClick={handleCopy}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary bg-element-bg p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                       {copyFeedback ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                 </div>
                 {error && <div className="text-xs text-red-400 mt-2 ml-1">{error}</div>}
              </div>
           </div>
        </div>

        {/* Bottom: Split View (Builder & Next Runs) */}
        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
           
           {/* Left: Visual Builder */}
           <div className="flex-1 flex flex-col bg-panel-bg border border-border-base rounded-lg shadow-sm min-h-0">
              <div className="flex border-b border-border-base overflow-x-auto shrink-0">
                 {(['minute', 'hour', 'day', 'month', 'week'] as Tab[]).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                         activeTab === tab 
                         ? 'border-accent text-text-primary bg-element-bg' 
                         : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-hover-overlay'
                      }`}
                    >
                       {tab}
                    </button>
                 ))}
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                 {activeTab === 'month' ? (
                     // Special case for Month (1-12)
                     renderCheckboxGrid(12, builderState.month, (v) => updateBuilder('month', v), false, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
                 ) : (
                     renderTabContent()
                 )}
                 <div className="mt-6 p-4 bg-app-bg/50 rounded-lg border border-border-base text-xs text-text-secondary leading-relaxed">
                    <strong className="text-text-primary">Tip:</strong> Use the visual builder to select specific values. 
                    For ranges (e.g., <code>1-5</code>) or steps (e.g., <code>*/15</code>), please edit the expression directly above.
                 </div>
              </div>
           </div>

           {/* Right: Next Executions */}
           <div className="w-full md:w-80 flex flex-col bg-panel-bg border border-border-base rounded-lg shadow-sm shrink-0">
              <div className="p-4 border-b border-border-base bg-sidebar-bg/30">
                 <div className="flex items-center gap-2 text-text-primary font-medium">
                    <Clock size={16} className="text-accent" />
                    <span>Next Executions</span>
                 </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                 {nextRuns.length > 0 ? (
                    <div className="space-y-3">
                       {nextRuns.map((run, idx) => {
                          const dateObj = new Date(run);
                          return (
                             <div key={idx} className="flex gap-3 items-start p-3 bg-element-bg/50 rounded-md border border-border-base/50">
                                <div className="mt-0.5 text-text-secondary">
                                   <Calendar size={14} />
                                </div>
                                <div>
                                   <div className="text-sm font-mono text-text-primary">
                                      {dateObj.toLocaleDateString()} <span className="text-accent">{dateObj.toLocaleTimeString()}</span>
                                   </div>
                                   <div className="text-[10px] text-text-secondary opacity-70 mt-0.5">
                                      {run}
                                   </div>
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center text-text-secondary opacity-50 gap-2">
                       <RefreshCw size={24} />
                       <span className="text-xs">Waiting for valid expression...</span>
                    </div>
                 )}
              </div>
           </div>

        </div>

      </div>
    </div>
  );
};