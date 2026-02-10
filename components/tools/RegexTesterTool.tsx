import React, { useState, useEffect, useRef } from 'react';
import { 
  PanelLeft, 
  AlertCircle, 
  CheckCircle2, 
  Trash2,
  BookTemplate,
  ChevronDown,
  Check
} from 'lucide-react';
import { LineNumberTextarea } from '../common/LineNumberTextarea';

interface RegexTesterToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

interface MatchResult {
  index: number;
  match: string;
  groups: string[];
}

const PRESETS = [
  { name: 'Email Address', pattern: '[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}', flags: 'gm' },
  { name: 'Phone Number (Simple)', pattern: '\\+?[\\d\\s-]{10,}', flags: 'gm' },
  { name: 'URL / Website', pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)', flags: 'gm' },
  { name: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}', flags: 'g' },
  { name: 'IPv4 Address', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
  { name: 'Hex Color', pattern: '#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})', flags: 'gi' },
  { name: 'HTML Tag', pattern: '<([a-z]+)([^<]+)*(?:>(.*)<\\/\\1>|\\s+\\/>)', flags: 'gim' },
  { name: 'Slug', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', flags: '' },
];

const FLAG_OPTIONS = [
  { char: 'g', label: '全局搜索 (Global)', desc: '查找所有匹配项，而非首个' },
  { char: 'i', label: '忽略大小写 (Insensitive)', desc: '匹配时不区分大小写' },
  { char: 'm', label: '多行模式 (Multiline)', desc: '^ 和 $ 匹配行首行尾' },
  { char: 's', label: '点号匹配换行 (DotAll)', desc: '. 匹配包括换行符的所有字符' },
];

export const RegexTesterTool: React.FC<RegexTesterToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('gm');
  const [testText, setTestText] = useState('Hello world! contact@example.com is my email.\nCall me at +1-555-0123 today.');
  const [regexError, setRegexError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  
  const [isFlagsOpen, setIsFlagsOpen] = useState(false);
  const flagsRef = useRef<HTMLDivElement>(null);

  // Close flags dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (flagsRef.current && !flagsRef.current.contains(event.target as Node)) {
        setIsFlagsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Apply Regex
  useEffect(() => {
    if (!pattern) {
      setMatches([]);
      setRegexError(null);
      return;
    }

    try {
      const regex = new RegExp(pattern, flags);
      const results: MatchResult[] = [];
      
      if (!testText) {
        setMatches([]);
        setRegexError(null);
        return;
      }

      // Handle global vs non-global
      if (flags.includes('g')) {
        const matchesIter = testText.matchAll(regex);
        for (const m of matchesIter) {
          if (m.index !== undefined) {
             results.push({
               index: m.index,
               match: m[0],
               groups: m.slice(1)
             });
          }
        }
      } else {
        const m = testText.match(regex);
        if (m && m.index !== undefined) {
          results.push({
            index: m.index,
            match: m[0],
            groups: m.slice(1)
          });
        }
      }

      setMatches(results);
      setRegexError(null);
    } catch (e) {
      setRegexError((e as Error).message);
      setMatches([]);
    }
  }, [pattern, flags, testText]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value);
    if (idx >= 0 && idx < PRESETS.length) {
      const p = PRESETS[idx];
      setPattern(p.pattern);
      setFlags(p.flags);
    }
  };

  const handleFlagToggle = (char: string) => {
    if (flags.includes(char)) {
      setFlags(flags.replace(char, ''));
    } else {
      setFlags(flags + char);
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

        {/* Templates Dropdown */}
        <div className="flex items-center space-x-3 electron-no-drag">
           <div className="relative group min-w-[160px]">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
                <BookTemplate size={14} />
              </div>
              <select 
                onChange={handlePresetChange}
                defaultValue="-1"
                className="w-full appearance-none bg-panel-bg text-text-primary text-xs font-medium rounded-md pl-8 pr-8 py-1.5 border border-border-base focus:border-accent outline-none cursor-pointer"
              >
                <option value="-1" disabled>Load Template...</option>
                {PRESETS.map((p, i) => (
                  <option key={i} value={i}>{p.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden gap-4">
        
        {/* Top: Pattern & Flags */}
        <div className="bg-panel-bg border border-border-base rounded-lg p-4 shrink-0 shadow-sm">
           <div className="flex flex-col md:flex-row gap-4">
              
              {/* Pattern Input */}
              <div className="flex-1 flex flex-col gap-1.5">
                 <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Regex Pattern</label>
                    {regexError && (
                      <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                        <AlertCircle size={12} /> Invalid Regex
                      </span>
                    )}
                 </div>
                 <div className={`flex items-center bg-input-bg border rounded-md px-3 py-2 transition-colors focus-within:ring-1 focus-within:ring-accent/50 ${
                   regexError ? 'border-red-500/50' : 'border-border-base focus-within:border-accent'
                 }`}>
                    <span className="text-text-secondary font-mono mr-1 text-lg select-none">/</span>
                    <input 
                      type="text" 
                      value={pattern}
                      onChange={(e) => setPattern(e.target.value)}
                      placeholder="e.g. ^[a-z]+$"
                      className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-accent placeholder-text-secondary/50"
                      spellCheck={false}
                    />
                    <span className="text-text-secondary font-mono ml-1 text-lg select-none">/</span>
                 </div>
              </div>

              {/* Flags Dropdown */}
              <div className="flex flex-col gap-1.5 shrink-0 relative" ref={flagsRef}>
                 <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Flags</label>
                 
                 <button
                    onClick={() => setIsFlagsOpen(!isFlagsOpen)}
                    className={`h-[42px] px-3 flex items-center gap-2 bg-input-bg border rounded-md transition-colors min-w-[100px] justify-between ${
                        isFlagsOpen ? 'border-accent ring-1 ring-accent/20' : 'border-border-base hover:border-accent/50'
                    }`}
                  >
                    <span className="font-mono text-sm text-accent">{flags ? `/${flags}` : '/'}</span>
                    <ChevronDown size={14} className={`text-text-secondary transition-transform duration-200 ${isFlagsOpen ? 'rotate-180' : ''}`} />
                 </button>

                 {isFlagsOpen && (
                    <div className="absolute top-full right-0 mt-2 w-72 bg-panel-bg border border-border-base rounded-lg shadow-xl z-20 overflow-hidden flex flex-col p-1 animate-fade-in">
                        {FLAG_OPTIONS.map(opt => {
                            const isSelected = flags.includes(opt.char);
                            return (
                                <button
                                    key={opt.char}
                                    onClick={() => handleFlagToggle(opt.char)}
                                    className={`flex items-start gap-3 p-2 rounded-md hover:bg-hover-overlay transition-colors text-left group ${isSelected ? 'bg-accent/5' : ''}`}
                                >
                                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                                        isSelected ? 'bg-accent border-accent' : 'border-text-secondary/50 bg-transparent group-hover:border-accent/50'
                                    }`}>
                                        {isSelected && <Check size={10} className="text-app-bg stroke-[3]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-mono font-bold text-accent text-xs bg-accent/10 px-1 rounded">-{opt.char}</span>
                                            <span className={`text-xs font-medium ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>{opt.label}</span>
                                        </div>
                                        <div className="text-[10px] text-text-secondary/70 leading-tight">{opt.desc}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                 )}
              </div>
           </div>
           {regexError && (
              <div className="text-xs text-red-400 mt-2 font-mono">
                Error: {regexError}
              </div>
           )}
        </div>

        {/* Bottom: Split View */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
           
           {/* Left: Test String */}
           <div className="flex-1 flex flex-col min-h-0 bg-app-bg">
              <div className="flex items-center justify-between mb-2 pl-1">
                 <div className="text-sm font-medium text-text-secondary">Test String</div>
                 <button onClick={() => setTestText('')} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
                   <Trash2 size={12} /> Clear
                 </button>
              </div>
              <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden focus-within:border-accent transition-colors">
                 <LineNumberTextarea
                   value={testText}
                   onChange={(e) => setTestText(e.target.value)}
                   placeholder="Enter text to test regex against..."
                   spellCheck={false}
                   className="text-text-primary placeholder-text-secondary"
                 />
              </div>
           </div>

           {/* Right: Match Results */}
           <div className="w-full md:w-1/3 flex flex-col min-h-0 bg-app-bg">
              <div className="flex items-center justify-between mb-2 pl-1">
                 <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-secondary">Match Results</span>
                    {matches.length > 0 && (
                      <span className="bg-accent/10 text-accent text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {matches.length}
                      </span>
                    )}
                 </div>
              </div>
              
              <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden flex flex-col">
                 {matches.length === 0 ? (
                   <div className="flex-1 flex flex-col items-center justify-center text-text-secondary opacity-40 p-6 text-center">
                      <CheckCircle2 size={32} className="mb-2" />
                      <p className="text-sm">No matches found</p>
                   </div>
                 ) : (
                   <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {matches.map((m, idx) => (
                        <div key={idx} className="bg-element-bg/50 border border-border-base rounded-md p-3 hover:border-accent/30 transition-colors">
                           <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Match {idx + 1}</span>
                              <span className="text-[10px] text-text-secondary font-mono">Index: {m.index}</span>
                           </div>
                           <div className="font-mono text-sm text-accent break-all bg-app-bg/50 p-1.5 rounded border border-border-base/50 mb-2">
                             {m.match}
                           </div>
                           
                           {/* Capture Groups */}
                           {m.groups.length > 0 && (
                             <div className="space-y-1 mt-2 border-t border-border-base/50 pt-2">
                               {m.groups.map((g, gIdx) => (
                                 <div key={gIdx} className="flex gap-2 text-xs">
                                   <span className="text-text-secondary font-mono shrink-0 select-none">#{gIdx + 1}:</span>
                                   <span className="text-text-primary font-mono break-all">{g || <i className="text-text-secondary opacity-50">undefined</i>}</span>
                                 </div>
                               ))}
                             </div>
                           )}
                        </div>
                      ))}
                   </div>
                 )}
              </div>
           </div>

        </div>

      </div>
    </div>
  );
};