import React, { useState, useEffect } from 'react';
import { 
  PanelLeft, 
  Trash2, 
  Copy, 
  CheckCircle2,
  ArrowRight,
  Type
} from 'lucide-react';

interface CaseConverterToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

interface CaseOption {
  id: string;
  label: string;
  example: string;
  transform: (words: string[]) => string;
}

// Helper to split text into words
const splitWords = (text: string): string[] => {
  if (!text) return [];
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Split camelCase
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Split acronyms
    .replace(/[_-]+/g, ' ') // Split snake/kebab
    .replace(/\./g, ' ') // Split dot
    .replace(/\//g, ' ') // Split path
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(w => w.toLowerCase());
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const CONVERTERS: CaseOption[] = [
  { 
    id: 'camel', 
    label: 'camelCase', 
    example: 'myVariableName', 
    transform: (words) => words.map((w, i) => i === 0 ? w : capitalize(w)).join('') 
  },
  { 
    id: 'pascal', 
    label: 'PascalCase', 
    example: 'MyVariableName', 
    transform: (words) => words.map(capitalize).join('') 
  },
  { 
    id: 'snake', 
    label: 'snake_case', 
    example: 'my_variable_name', 
    transform: (words) => words.join('_') 
  },
  { 
    id: 'kebab', 
    label: 'kebab-case', 
    example: 'my-variable-name', 
    transform: (words) => words.join('-') 
  },
  { 
    id: 'constant', 
    label: 'CONSTANT_CASE', 
    example: 'MY_VARIABLE_NAME', 
    transform: (words) => words.join('_').toUpperCase() 
  },
  { 
    id: 'title', 
    label: 'Title Case', 
    example: 'My Variable Name', 
    transform: (words) => words.map(capitalize).join(' ') 
  },
  { 
    id: 'sentence', 
    label: 'Sentence case', 
    example: 'My variable name', 
    transform: (words) => {
        if (words.length === 0) return '';
        const first = capitalize(words[0]);
        return [first, ...words.slice(1)].join(' ');
    }
  },
  { 
    id: 'dot', 
    label: 'dot.case', 
    example: 'my.variable.name', 
    transform: (words) => words.join('.') 
  },
  { 
    id: 'path', 
    label: 'path/case', 
    example: 'my/variable/name', 
    transform: (words) => words.join('/') 
  },
  { 
    id: 'lower', 
    label: 'lowercase', 
    example: 'myvariablename', 
    transform: (words) => words.join('') 
  },
  { 
    id: 'upper', 
    label: 'UPPERCASE', 
    example: 'MYVARIABLENAME', 
    transform: (words) => words.join('').toUpperCase() 
  },
];

export const CaseConverterTool: React.FC<CaseConverterToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [input, setInput] = useState<string>('helloWorld_example');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  const words = splitWords(input);

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
      <div className="flex-1 flex overflow-hidden p-6 gap-6 flex-col md:flex-row">
        
        {/* Left: Input */}
        <div className="w-full md:w-1/3 flex flex-col min-h-0">
           <div className="flex items-center justify-between mb-2 px-1">
             <div className="text-sm font-medium text-text-secondary">Input Variable</div>
             <button onClick={() => setInput('')} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
               <Trash2 size={12} /> Clear
             </button>
           </div>
           <div className="bg-panel-bg rounded-lg border border-border-base overflow-hidden focus-within:border-accent transition-colors flex-1 min-h-[120px] shadow-sm">
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               className="w-full h-full bg-transparent resize-none p-4 font-mono text-lg text-text-primary focus:outline-none placeholder-text-secondary"
               placeholder="Paste variable name here..."
               spellCheck={false}
             />
           </div>
           <div className="mt-4 bg-element-bg rounded-lg p-4 border border-border-base">
              <div className="flex items-center gap-2 text-text-secondary mb-2">
                 <Type size={14} />
                 <span className="text-xs font-bold uppercase tracking-wider">Detected Words</span>
              </div>
              <div className="flex flex-wrap gap-2">
                 {words.length > 0 ? (
                    words.map((w, i) => (
                      <span key={i} className="px-2 py-1 bg-panel-bg border border-border-base rounded text-xs font-mono text-accent">
                        {w}
                      </span>
                    ))
                 ) : (
                    <span className="text-xs text-text-secondary italic">No words detected</span>
                 )}
              </div>
           </div>
        </div>

        {/* Right: Output Grid */}
        <div className="flex-1 flex flex-col min-h-0">
           <div className="flex items-center justify-between mb-2 px-1">
             <div className="text-sm font-medium text-text-secondary">Converted Results</div>
           </div>
           <div className="flex-1 overflow-y-auto pr-2 -mr-2">
              <div className="grid grid-cols-1 gap-3">
                 {CONVERTERS.map((fmt) => {
                    const result = input.trim() ? fmt.transform(words) : '';
                    return (
                      <div 
                        key={fmt.id} 
                        className="group bg-panel-bg border border-border-base rounded-lg p-4 flex items-center justify-between hover:border-accent/50 transition-colors shadow-sm"
                      >
                        <div className="min-w-0 flex-1 mr-4">
                           <div className="flex items-center gap-2 mb-1">
                             <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                               {fmt.label}
                             </div>
                             {/* Optional: Example pill? Maybe too cluttered */}
                           </div>
                           <div className="font-mono text-base text-text-primary truncate select-all">
                             {result || <span className="text-text-secondary opacity-30">{fmt.example}</span>}
                           </div>
                        </div>
                        
                        <button
                          onClick={() => result && handleCopy(result, fmt.id)}
                          disabled={!result}
                          className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-element-bg border border-transparent hover:border-border-base transition-all active:scale-95 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Copy"
                        >
                          {copyFeedback === fmt.id ? (
                            <CheckCircle2 size={18} className="text-green-500" />
                          ) : (
                            <Copy size={18} />
                          )}
                        </button>
                      </div>
                    );
                 })}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};