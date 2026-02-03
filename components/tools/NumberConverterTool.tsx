import React, { useState, useEffect } from 'react';
import { 
  PanelLeft, 
  Copy, 
  CheckCircle2, 
  Trash2,
  ArrowRightLeft,
  ArrowDownUp
} from 'lucide-react';

interface NumberConverterToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

const BASES = [
  { label: 'Binary (Base 2)', value: 2 },
  { label: 'Octal (Base 8)', value: 8 },
  { label: 'Decimal (Base 10)', value: 10 },
  { label: 'Hexadecimal (Base 16)', value: 16 },
];

export const NumberConverterTool: React.FC<NumberConverterToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [fromBase, setFromBase] = useState(10);
  const [toBase, setToBase] = useState(16); // Default Dec -> Hex
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      // Validation logic based on fromBase
      const isValid = validateInput(input, fromBase);
      if (!isValid) {
        throw new Error(`Invalid characters for Base ${fromBase}`);
      }

      // Convert logic: Input String -> Integer -> Output String
      // remove spaces for processing
      const cleanInput = input.replace(/\s/g, '');
      const integerValue = parseInt(cleanInput, fromBase);

      if (isNaN(integerValue)) {
        throw new Error('Invalid number');
      }

      const result = integerValue.toString(toBase).toUpperCase();
      setOutput(result);
      setError(null);
    } catch (err) {
      setOutput('');
      setError((err as Error).message);
    }
  }, [input, fromBase, toBase]);

  const validateInput = (value: string, base: number): boolean => {
    // Remove whitespace for check
    const val = value.replace(/\s/g, '');
    if (!val) return true;

    const regexMap: Record<number, RegExp> = {
      2: /^[01]+$/,
      8: /^[0-7]+$/,
      10: /^[0-9]+$/,
      16: /^[0-9a-fA-F]+$/
    };
    return regexMap[base].test(val);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleClear = () => {
    setInput('');
  };

  const handleSwap = () => {
    setFromBase(toBase);
    setToBase(fromBase);
    setInput(output); // Optional: preserve the value flow
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
          <h2 className="text-sm font-semibold text-text-primary tracking-wide mr-6">{toolLabel}</h2>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-3 electron-no-drag">
           <button 
              onClick={handleSwap}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-hover-overlay rounded transition-colors flex items-center gap-2 px-3 border border-transparent hover:border-border-base"
              title="Swap Bases"
           >
              <ArrowDownUp size={14} />
              <span className="text-xs font-medium">Swap</span>
           </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-4">
        
        {/* Input Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 pl-1">
             <div className="flex items-center space-x-2">
               <span className="text-sm font-medium text-text-secondary">Input</span>
               <select 
                 value={fromBase}
                 onChange={(e) => setFromBase(Number(e.target.value))}
                 className="bg-element-bg border border-border-base text-xs text-text-primary rounded px-2 py-1 outline-none focus:border-accent"
               >
                 {BASES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
               </select>
             </div>
             <button onClick={handleClear} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
               <Trash2 size={12} /> Clear
             </button>
          </div>
          <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden focus-within:border-accent transition-colors">
            <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               className="w-full h-full bg-transparent resize-none p-4 font-mono text-xl leading-relaxed focus:outline-none placeholder-text-secondary"
               placeholder={`Enter Base ${fromBase} number...`}
               spellCheck={false}
            />
          </div>
        </div>

        {/* Output Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 pl-1">
             <div className="flex items-center space-x-2">
               <span className="text-sm font-medium text-text-secondary">Output</span>
               <select 
                 value={toBase}
                 onChange={(e) => setToBase(Number(e.target.value))}
                 className="bg-element-bg border border-border-base text-xs text-text-primary rounded px-2 py-1 outline-none focus:border-accent"
               >
                 {BASES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
               </select>
             </div>
            {error && (
              <span className="text-xs text-red-400 font-medium">{error}</span>
            )}
          </div>
          <div className={`flex-1 bg-panel-bg rounded-lg border overflow-hidden relative group transition-colors ${
            error ? 'border-red-900/50' : 'border-border-base'
          }`}>
             <textarea 
               readOnly
               value={output}
               className={`w-full h-full bg-transparent resize-none p-4 font-mono text-xl leading-relaxed focus:outline-none ${
                 error ? 'text-red-400' : 'text-accent'
               } placeholder-text-secondary`}
               placeholder="Result will appear here..."
            />
             
             {output && !error && (
                <button 
                  onClick={handleCopy}
                  className="absolute bottom-4 right-4 bg-element-bg hover:brightness-110 text-text-primary px-4 py-2 rounded-md shadow-lg border border-border-base flex items-center space-x-2 transition-all active:scale-95"
                >
                  {copyFeedback ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                  <span className="text-sm font-medium">{copyFeedback ? 'Copied' : 'Copy'}</span>
                </button>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};