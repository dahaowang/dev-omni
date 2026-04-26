import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  CheckCircle2, 
  Copy,
  Database
} from 'lucide-react';
import { LineNumberTextarea } from '../common/LineNumberTextarea';
import { useTheme } from '../../context/ThemeContext';
import {
  PaneHeader,
  SegmentedControl,
  StatusBadge,
  ToolButton,
  ToolHeader,
  ToolPane,
  ToolShell
} from '../common/ToolChrome';

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
    <ToolShell>
      <ToolHeader icon={<Database />} title={toolLabel} subtitle="format · keywords · indentation">
        <StatusBadge>{input ? `${input.length} chars` : 'Waiting'}</StatusBadge>
        <SegmentedControl
          value={dialect}
          onChange={(value: Dialect) => setDialect(value)}
          options={(['Standard', 'PostgreSQL', 'MySQL'] as Dialect[]).map((value) => ({ value, label: value }))}
        />
        <ToolButton
          onClick={handleCopy}
          disabled={!output}
          icon={copyFeedback ? <CheckCircle2 /> : <Copy />}
          variant="primary"
        >
          {copyFeedback ? 'Copied' : 'Copy'}
        </ToolButton>
      </ToolHeader>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
          <PaneHeader
            title="Raw SQL"
            meta={`${input ? input.split('\n').length : 0} lines`}
            actions={
              <ToolButton onClick={handleClear} icon={<Trash2 />} variant="ghost" className="h-[22px] px-1.5">
                Clear
              </ToolButton>
            }
          />
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <LineNumberTextarea
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='SELECT * FROM table...'
              className="text-text-primary placeholder-text-secondary"
            />
          </div>
        </ToolPane>

        <ToolPane>
          <PaneHeader title="Formatted SQL" meta={`${lineCount} lines`} />
          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            {editorSettings.lineNumbers && output && (
              <div className="min-w-[3rem] shrink-0 select-none overflow-hidden border-r border-border-base bg-sidebar-bg/30 py-4 pl-2 pr-3 text-right font-mono text-sm leading-6 text-text-secondary/30">
                {Array.from({ length: Math.max(1, lineCount) }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
            )}

            <div className="h-full w-full flex-1 overflow-auto bg-transparent p-4">
              {output ? (
                <div className="whitespace-pre">
                  <SqlHighlight code={output} />
                </div>
              ) : (
                <span className="select-none font-mono text-sm text-text-secondary opacity-50">Result will appear here...</span>
              )}
            </div>
          </div>
        </ToolPane>
      </div>
    </ToolShell>
  );
};
