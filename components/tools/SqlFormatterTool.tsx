import React, { useState, useEffect } from 'react';
import { 
  PanelLeft, 
  Trash2, 
  CheckCircle2, 
  Copy
} from 'lucide-react';
import { LineNumberTextarea } from '../common/LineNumberTextarea';
import { useTheme } from '../../context/ThemeContext';

interface SqlFormatterToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
  initialValue?: string;
}

type Dialect = 'Standard' | 'PostgreSQL' | 'MySQL' | 'SQLite';

// --- Simple SQL Formatter Logic ---

const KEYWORDS_NEWLINE = [
  "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET",
  "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM",
  "UNION", "UNION ALL", "EXCEPT", "INTERSECT",
  "CREATE TABLE", "DROP TABLE", "ALTER TABLE",
  "BEGIN", "COMMIT", "ROLLBACK"
];

const KEYWORDS_INDENT = [
  "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN", "JOIN", "CROSS JOIN"
];

const KEYWORDS_OTHER = [
  "AS", "ON", "AND", "OR", "IN", "IS", "NULL", "NOT", "DISTINCT", "CASE", "WHEN", "THEN", "ELSE", "END",
  "ASC", "DESC", "PRIMARY KEY", "FOREIGN KEY", "DEFAULT", "CONSTRAINT"
];

const FUNCTIONS = [
  "COUNT", "SUM", "AVG", "MIN", "MAX", "COALESCE", "CONCAT", "SUBSTRING", "CAST", "NOW", "DATE"
];

const formatSql = (sql: string): string => {
  // 1. Normalize whitespace
  let text = sql.replace(/\s+/g, ' ').trim();
  
  // 2. Insert newlines around major keywords and handling delimiters
  let formatted = '';
  let indentLevel = 0;
  const INDENT = '  ';
  
  let currentLine = '';
  
  const flushLine = () => {
    if (currentLine.trim()) {
      formatted += (INDENT.repeat(indentLevel) + currentLine.trim() + '\n');
    }
    currentLine = '';
  };

  // Pre-process: Add spaces around symbols to ensure tokenization
  text = text.replace(/([(),;])/g, ' $1 ');
  const splitTokens = text.split(/\s+/);

  for (let i = 0; i < splitTokens.length; i++) {
    const token = splitTokens[i];
    if(!token) continue;
    
    const upper = token.toUpperCase();
    const nextToken = splitTokens[i + 1]?.toUpperCase();

    // Check for multi-word keywords
    let compoundToken = upper;
    let skipNext = 0;
    
    if (upper === 'ORDER' && nextToken === 'BY') { compoundToken = 'ORDER BY'; skipNext = 1; }
    else if (upper === 'GROUP' && nextToken === 'BY') { compoundToken = 'GROUP BY'; skipNext = 1; }
    else if (upper === 'INSERT' && nextToken === 'INTO') { compoundToken = 'INSERT INTO'; skipNext = 1; }
    else if (upper === 'DELETE' && nextToken === 'FROM') { compoundToken = 'DELETE FROM'; skipNext = 1; }
    else if (upper === 'LEFT' && nextToken === 'JOIN') { compoundToken = 'LEFT JOIN'; skipNext = 1; }
    else if (upper === 'RIGHT' && nextToken === 'JOIN') { compoundToken = 'RIGHT JOIN'; skipNext = 1; }
    else if (upper === 'INNER' && nextToken === 'JOIN') { compoundToken = 'INNER JOIN'; skipNext = 1; }
    else if (upper === 'OUTER' && nextToken === 'JOIN') { compoundToken = 'OUTER JOIN'; skipNext = 1; }
    else if (upper === 'UNION' && nextToken === 'ALL') { compoundToken = 'UNION ALL'; skipNext = 1; }
    else if (upper === 'CREATE' && nextToken === 'TABLE') { compoundToken = 'CREATE TABLE'; skipNext = 1; }
    
    // Handle Token
    if (KEYWORDS_NEWLINE.includes(compoundToken)) {
      flushLine();
      currentLine = compoundToken + ' ';
      i += skipNext;
    } else if (KEYWORDS_INDENT.includes(compoundToken)) {
      flushLine();
      currentLine = '  ' + compoundToken + ' '; 
      i += skipNext;
    } else if (token === '(') {
      currentLine += token;
      flushLine();
      indentLevel++;
    } else if (token === ')') {
      flushLine();
      indentLevel = Math.max(0, indentLevel - 1);
      currentLine += token + ' ';
    } else if (token === ',') {
      currentLine += token;
      flushLine();
    } else if (token === ';') {
      currentLine += token;
      flushLine();
    } else if (upper === 'ON' || upper === 'AND' || upper === 'OR') {
      flushLine();
      currentLine = '  ' + token + ' '; 
    } else {
      currentLine += token + ' ';
    }
  }
  
  flushLine();
  return formatted.trim();
};

// --- Syntax Highlighter Component ---

const SqlHighlight: React.FC<{ code: string }> = ({ code }) => {
  if (!code) return null;

  const parts = code.split(/(\s+|[(),;])/); 

  return (
    <code className="font-mono text-sm leading-6">
      {parts.map((part, index) => {
        const upper = part.toUpperCase();
        let colorClass = 'text-text-primary';

        if (KEYWORDS_NEWLINE.includes(upper) || KEYWORDS_INDENT.includes(upper) || KEYWORDS_OTHER.includes(upper)) {
          colorClass = 'text-accent font-semibold';
        } else if (FUNCTIONS.some(f => upper.startsWith(f))) {
          colorClass = 'text-yellow-400';
        } else if (/^['"`].*['"`]$/.test(part)) {
          colorClass = 'text-green-400';
        } else if (/^\d+$/.test(part)) {
          colorClass = 'text-orange-400';
        } else if (['(', ')', ',', ';'].includes(part)) {
          colorClass = 'text-text-secondary';
        }

        return (
          <span key={index} className={colorClass}>
            {part}
          </span>
        );
      })}
    </code>
  );
};

export const SqlFormatterTool: React.FC<SqlFormatterToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel, initialValue }) => {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [dialect, setDialect] = useState<Dialect>('Standard');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const { editorSettings } = useTheme();

  // Initialize
  useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
    }
  }, [initialValue]);

  // Automatic Formatting Effect
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      return;
    }
    // Perform formatting whenever input or dialect changes
    const formatted = formatSql(input);
    setOutput(formatted);
  }, [input, dialect]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
  };

  const lineCount = output ? output.split('\n').length : 0;

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
            <h2 className="text-sm font-semibold text-text-primary tracking-wide mr-4">{toolLabel}</h2>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center space-x-3 electron-no-drag">
           <div className="flex bg-panel-bg rounded-md p-1 border border-border-base">
             {(['Standard', 'PostgreSQL', 'MySQL'] as Dialect[]).map((d) => (
               <button
                 key={d}
                 onClick={() => setDialect(d)}
                 className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                   dialect === d 
                     ? 'bg-element-bg text-text-primary shadow-sm' 
                     : 'text-text-secondary hover:text-text-primary'
                 }`}
               >
                 {d}
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Input Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg p-4 pr-2 border-r border-border-base">
          <div className="flex items-center justify-between mb-2 px-1">
             <div className="text-sm font-medium text-text-secondary">Raw SQL</div>
             <button onClick={handleClear} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
               <Trash2 size={12} /> Clear
             </button>
          </div>
          <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden focus-within:border-accent transition-colors">
            <LineNumberTextarea
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='SELECT * FROM table...'
              className="text-text-primary placeholder-text-secondary"
            />
          </div>
        </div>

        {/* Output Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg p-4 pl-2">
          <div className="flex items-center justify-between mb-2 px-1">
             <div className="text-sm font-medium text-text-secondary">Formatted SQL</div>
             {output && (
              <button 
                onClick={handleCopy}
                className="flex items-center space-x-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                {copyFeedback ? <CheckCircle2 size={12} className="text-green-500"/> : <Copy size={12} />}
                <span>{copyFeedback ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>
          <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden relative group hover:border-border-hover transition-colors flex flex-col">
            
            <div className="flex-1 flex overflow-hidden relative">
                {/* Line Numbers for Output */}
                {editorSettings.lineNumbers && output && (
                  <div className="bg-sidebar-bg/30 text-text-secondary/30 text-right pr-3 pl-2 pt-4 select-none overflow-hidden border-r border-border-base shrink-0 min-w-[3rem] font-mono text-sm leading-6">
                     {Array.from({length: Math.max(1, lineCount)}).map((_, i) => (
                        <div key={i}>{i + 1}</div>
                     ))}
                  </div>
                )}

                {/* Syntax Highlighted Output Container */}
                <div className="flex-1 overflow-auto p-4 w-full h-full bg-transparent">
                  {output ? (
                    <div className="whitespace-pre">
                      <SqlHighlight code={output} />
                    </div>
                  ) : (
                    <span className="font-mono text-sm text-text-secondary opacity-50 select-none">Result will appear here...</span>
                  )}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};