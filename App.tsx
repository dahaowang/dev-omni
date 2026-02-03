import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, 
  Braces, 
  Database, 
  Link as LinkIcon, 
  Hash, 
  Scissors, 
  Files, 
  Plus, 
  User, 
  Settings, 
  Search,
  Trash2,
  ArrowRight,
  Minimize2,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Copy,
  LayoutTemplate,
  Code2
} from 'lucide-react';
import { ToolType } from './types';

// --- Sidebar Component ---

interface SidebarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTool, setActiveTool }) => {
  return (
    <div className="w-64 bg-[#1e1e2e] h-full flex flex-col border-r border-gray-800 flex-shrink-0">
      {/* App Header with Drag Region */}
      <div className="h-12 flex items-center px-4 border-b border-gray-800 space-x-2 electron-drag select-none">
        <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
          <Code2 size={16} className="text-white" />
        </div>
        <span className="font-semibold text-gray-200 tracking-wide">DevOmni</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        
        {/* All Section */}
        <div className="px-2">
          <div className="text-xs font-semibold text-gray-500 px-3 mb-2 uppercase tracking-wider">All</div>
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors">
            <Star size={18} />
            <span className="text-sm">Favorites</span>
          </button>
        </div>

        {/* Converters Section */}
        <div className="px-2">
          <div className="flex items-center justify-between px-3 mb-2 cursor-pointer group">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-gray-300">Converters</div>
          </div>
          <div className="space-y-1">
            <NavItem 
              active={activeTool === 'json'} 
              onClick={() => setActiveTool('json')} 
              icon={<Braces size={18} />} 
              label="JSON Format" 
            />
            <NavItem 
              active={activeTool === 'sql'} 
              onClick={() => setActiveTool('sql')} 
              icon={<Database size={18} />} 
              label="SQL Format" 
            />
            <NavItem 
              active={activeTool === 'url'} 
              onClick={() => setActiveTool('url')} 
              icon={<LinkIcon size={18} />} 
              label="URL Encode" 
            />
          </div>
        </div>

        {/* Generators Section */}
        <div className="px-2">
          <div className="text-xs font-semibold text-gray-500 px-3 mb-2 uppercase tracking-wider">Generators</div>
          <div className="space-y-1">
             <NavItem 
              active={activeTool === 'hash'} 
              onClick={() => setActiveTool('hash')} 
              icon={<Hash size={18} />} 
              label="Hash/MD5" 
            />
          </div>
        </div>

        {/* Text Section */}
        <div className="px-2">
          <div className="text-xs font-semibold text-gray-500 px-3 mb-2 uppercase tracking-wider">Text</div>
          <div className="space-y-1">
            <NavItem 
              active={activeTool === 'diff'} 
              onClick={() => setActiveTool('diff')} 
              icon={<Scissors size={18} />} 
              label="Diff" 
            />
            <NavItem 
              active={activeTool === 'dedupe'} 
              onClick={() => setActiveTool('dedupe')} 
              icon={<Files size={18} />} 
              label="Dedupe" 
            />
          </div>
        </div>
        
         <div className="px-4">
           <button className="text-gray-500 hover:text-gray-300 transition-colors">
             <Plus size={20} />
           </button>
         </div>

      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-800 space-y-4">
        <div className="flex flex-col space-y-4">
           <button className="text-gray-500 hover:text-white transition-colors">
            <User size={20} />
           </button>
           <button className="text-gray-500 hover:text-white transition-colors">
            <Settings size={20} />
           </button>
        </div>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string; 
}> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-all duration-200 ${
      active 
        ? 'bg-[#3b3e4a] text-white shadow-sm' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`}
  >
    <div className={`${active ? 'text-blue-400' : 'text-current'}`}>{icon}</div>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

// --- Main Tool Logic (JSON Formatter) ---

const JsonFormatter = () => {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [stats, setStats] = useState({ chars: 0, lines: 0 });
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Load initial placeholder
  useEffect(() => {
    const placeholder = JSON.stringify({
      name: "DevOmni",
      type: "Application",
      features: ["JSON Format", "SQL Format", "Converters"],
      meta: {
        version: "1.0.0",
        author: "AI Engineer"
      }
    }, null, 4);
    setInput(placeholder);
    handleFormat(placeholder);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStats = (text: string) => {
    setStats({
      chars: text.length,
      lines: text.split('\n').length
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setInput(newVal);
    updateStats(newVal);
    
    // Auto-validate on type (optional, could be debounced)
    try {
      if (newVal.trim() === '') {
        setIsValid(true);
        return;
      }
      JSON.parse(newVal);
      setIsValid(true);
    } catch (err) {
      setIsValid(false);
    }
  };

  const handleFormat = (textToFormat: string = input) => {
    try {
      const parsed = JSON.parse(textToFormat);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutput(formatted);
      setIsValid(true);
    } catch (error) {
      setOutput((error as Error).message);
      setIsValid(false);
    }
  };

  const handleCompact = () => {
    try {
      const parsed = JSON.parse(input);
      const compacted = JSON.stringify(parsed);
      setOutput(compacted);
      setIsValid(true);
    } catch (error) {
      setOutput((error as Error).message);
      setIsValid(false);
    }
  };

  const handleEscape = () => {
    // Simple JSON string escape
    try {
      const escaped = JSON.stringify(input);
      // Remove the surrounding quotes added by stringify to just get the escaped content
      setOutput(escaped.slice(1, -1));
    } catch (error) {
      setOutput("Error escaping text");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    updateStats('');
    setIsValid(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#13141f] text-gray-300">
      {/* Tool Header - Drag Region enabled */}
      <div className="h-12 border-b border-gray-800 flex items-center justify-between px-6 bg-[#13141f] electron-drag select-none">
        <div className="relative w-96 group electron-no-drag">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-hover:text-gray-400 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search tools..." 
            className="w-full bg-[#1a1b23] border border-gray-700 text-sm text-gray-200 rounded-md pl-10 pr-12 py-1.5 focus:outline-none focus:border-gray-600 focus:bg-[#20212b] transition-all"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 font-mono">⌘K</span>
        </div>
        
        <div className="flex items-center space-x-4 electron-no-drag">
          <button onClick={handleClear} className="flex flex-col items-center text-gray-500 hover:text-red-400 transition-colors group">
            <Trash2 size={16} />
            <span className="text-[10px] mt-0.5 font-medium group-hover:text-red-400">Clear</span>
          </button>
          <button className="flex flex-col items-center text-gray-500 hover:text-gray-300 transition-colors group">
            <Settings size={16} />
            <span className="text-[10px] mt-0.5 font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Input Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#13141f] p-4 pr-0">
          <div className="text-sm font-medium text-gray-400 mb-2 pl-1">Input (Paste JSON)</div>
          <div className="flex-1 bg-[#0d0e16] rounded-lg border border-gray-800 overflow-hidden relative group hover:border-gray-700 transition-colors">
            {/* Line Numbers Fake (Visual only for simplicity) */}
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#1a1b23] border-r border-gray-800 pt-4 text-right pr-2 text-gray-600 font-mono text-xs select-none">
              {Array.from({ length: Math.min(stats.lines, 20) }).map((_, i) => (
                <div key={i} className="leading-6">{i + 1}</div>
              ))}
              {stats.lines > 20 && <div>...</div>}
            </div>
            
            <textarea
              spellCheck={false}
              value={input}
              onChange={handleInputChange}
              className="w-full h-full bg-transparent resize-none focus:outline-none p-4 pl-12 font-mono text-sm leading-6 text-gray-300 placeholder-gray-700"
              placeholder='Paste your JSON here...'
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="w-16 flex flex-col items-center justify-center space-y-4 px-2 pt-8">
           <ActionButton onClick={() => handleFormat(input)} icon={<ArrowRight size={18} />} label="Format" />
           <ActionButton onClick={handleCompact} icon={<Minimize2 size={18} />} label="Compact" />
           <ActionButton onClick={handleEscape} icon={<Maximize2 size={18} />} label="Escape" />
        </div>

        {/* Output Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#13141f] p-4 pl-0">
          <div className="text-sm font-medium text-gray-400 mb-2 pl-1">Output (Result)</div>
          <div className="flex-1 bg-[#0d0e16] rounded-lg border border-gray-800 overflow-hidden relative group hover:border-gray-700 transition-colors">
            <textarea
              readOnly
              spellCheck={false}
              value={output}
              className={`w-full h-full bg-transparent resize-none focus:outline-none p-4 font-mono text-sm leading-6 ${isValid ? 'text-blue-300' : 'text-red-400'}`}
              placeholder='Result will appear here...'
            />
            
            {/* Copy Button */}
            <button 
              onClick={handleCopy}
              className="absolute bottom-4 right-4 bg-[#2d2d39] hover:bg-[#3d3d4d] text-gray-200 px-4 py-2 rounded-md shadow-lg border border-gray-700 flex items-center space-x-2 transition-all active:scale-95"
            >
              {copyFeedback ? <CheckCircle2 size={16} className="text-green-500"/> : <Copy size={16} />}
              <span className="text-sm font-medium">{copyFeedback ? 'Copied!' : 'Copy Result'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-8 bg-[#1a1b23] border-t border-gray-800 flex items-center px-4 justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>Characters: <span className="text-gray-300">{stats.chars}</span></span>
          <span className="w-px h-3 bg-gray-700"></span>
          <span>Lines: <span className="text-gray-300">{stats.lines}</span></span>
        </div>
        
        <div className="flex items-center space-x-2">
           {input.trim() !== '' && (
             isValid ? (
               <div className="flex items-center space-x-1 text-green-500">
                 <CheckCircle2 size={12} />
                 <span className="font-medium">Valid JSON</span>
               </div>
             ) : (
               <div className="flex items-center space-x-1 text-red-500">
                 <AlertCircle size={12} />
                 <span className="font-medium">Invalid JSON</span>
               </div>
             )
           )}
           <span className="w-px h-3 bg-gray-700 mx-2"></span>
           <span className="text-gray-500">UTF-8</span>
           <span className="w-px h-3 bg-gray-700 mx-2"></span>
           <span className="text-gray-500">JSON</span>
        </div>
      </div>
    </div>
  );
};

const ActionButton: React.FC<{ onClick: () => void; icon: React.ReactNode; label: string }> = ({ onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center w-12 h-14 bg-[#2d2d39] rounded-md border border-gray-700 hover:bg-[#363642] hover:border-gray-500 hover:shadow-md transition-all active:scale-95 group"
  >
    <div className="text-gray-400 group-hover:text-white mb-1">{icon}</div>
    <span className="text-[10px] text-gray-500 font-medium group-hover:text-gray-300">{label}</span>
  </button>
);


// --- Main App Layout ---

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('json');

  return (
    <div className="flex flex-row h-screen w-full bg-[#13141f] text-white font-sans overflow-hidden selection:bg-blue-500/30">
      <Sidebar activeTool={activeTool} setActiveTool={setActiveTool} />
      
      {activeTool === 'json' ? (
        <JsonFormatter />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#13141f]">
          <LayoutTemplate size={64} className="mb-4 opacity-20" />
          <h2 className="text-xl font-semibold mb-2">Tool Not Implemented</h2>
          <p className="text-sm">This prototype currently showcases the JSON Format tool.</p>
        </div>
      )}
    </div>
  );
};

export default App;