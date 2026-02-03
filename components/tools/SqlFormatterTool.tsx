import React, { useState } from 'react';
import { 
  PanelLeft, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  Copy,
  Database
} from 'lucide-react';
import { ActionButton } from '../common/ActionButton';

interface SqlFormatterToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
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

const isKeyword = (word: string) => {
  const upper = word.toUpperCase();
  return KEYWORDS_NEWLINE.includes(upper) || KEYWORDS_INDENT.includes(upper) || KEYWORDS_OTHER.includes(upper);
};

const formatSql = (sql: string): string => {
  // 1. Normalize whitespace
  let text = sql.replace(/\s+/g, ' ').trim();
  
  // 2. Insert newlines around major keywords and handling delimiters
  // We'll process by splitting tokens. This is a heuristic approach.
  
  // Escape special regex characters in keywords
  const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Pre-process: Add spaces around symbols to ensure tokenization
  text = text.replace(/([(),;])/g, ' $1 ');
  
  const tokens = text.split(/\s+/);
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

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const upper = token.toUpperCase();
    const nextToken = tokens[i + 1]?.toUpperCase();

    // Check for multi-word keywords (e.g. ORDER BY, GROUP BY, INSERT INTO)
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
      currentLine = '  ' + compoundToken + ' '; // Extra internal indent for joins
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
      // Logic operators often look better on new lines if line is long, 
      // but for simple formatting, let's keep them inline unless we want strict stacking.
      // Let's stack AND/OR for cleaner WHERE clauses
      flushLine();
      currentLine = '  ' + token + ' '; // Indent logic ops
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

  // Simple tokenizer for highlighting
  const parts = code.split(/(\s+|[(),;])/); // Split by whitespace and delimiters

  return (
    <code className="font-mono text-sm leading-6">
      {parts.map((part, index) => {
        const upper = part.toUpperCase();
        let colorClass = 'text-text-primary';

        if (KEYWORDS_NEWLINE.includes(upper) || KEYWORDS_INDENT.includes(upper) || KEYWORDS_OTHER.includes(upper)) {
          colorClass = 'text-accent font-semibold';
        } else if (FUNCTIONS.some(f => upper.startsWith(f))) {
          colorClass = 'text-yellow-400';
        } else if (/^['"`].*['"`]$/.test(part)) { // Basic string detection
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

export const SqlFormatterTool: React.FC<SqlFormatterToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [dialect, setDialect] = useState<Dialect>('Standard');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleFormat = () => {
    if (!input.trim()) {
      setOutput('');
      return;
    }
    const formatted = formatSql(input);
    setOutput(formatted);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
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
      <div className="flex-1 flex overflow-hidden">
        
        {/* Input Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg p-4 pr-0">
          <div className="flex items-center justify-between mb-2 pl-1 pr-4">
             <div className="text-sm font-medium text-text-secondary">Raw SQL</div>
             <button onClick={handleClear} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
               <Trash2 size={12} /> Clear
             </button>
          </div>
          <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden focus-within:border-accent transition-colors">
            <textarea
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-full bg-transparent resize-none focus:outline-none p-4 font-mono text-sm leading-6 text-text-primary placeholder-text-secondary"
              placeholder='SELECT * FROM table...'
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="w-16 flex flex-col items-center justify-center space-y-4 px-2 pt-8">
           <ActionButton onClick={handleFormat} icon={<ArrowRight size={18} />} label="Format" />
        </div>

        {/* Output Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg p-4 pl-0">
          <div className="text-sm font-medium text-text-secondary mb-2 pl-1">Formatted SQL</div>
          <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden relative group hover:border-border-hover transition-colors flex flex-col">
            
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
            
            {/* Copy Button */}
            {output && (
              <button 
                onClick={handleCopy}
                className="absolute bottom-4 right-4 bg-element-bg hover:brightness-110 text-text-primary px-4 py-2 rounded-md shadow-lg border border-border-base flex items-center space-x-2 transition-all active:scale-95"
              >
                {copyFeedback ? <CheckCircle2 size={16} className="text-green-500"/> : <Copy size={16} />}
                <span className="text-sm font-medium">{copyFeedback ? 'Copied!' : 'Copy'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};