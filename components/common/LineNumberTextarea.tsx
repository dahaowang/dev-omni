import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
}

export const LineNumberTextarea: React.FC<Props> = ({ value, className, onChange, ...props }) => {
    const { editorSettings } = useTheme();
    const showLineNumbers = editorSettings.lineNumbers;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const linesRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (linesRef.current && textareaRef.current) {
            linesRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const lines = value.split('\n');
    const lineCount = lines.length;

    // Common styles
    const baseClasses = "w-full h-full bg-transparent resize-none focus:outline-none font-mono text-sm leading-6";
    
    if (!showLineNumbers) {
        return (
            <textarea 
                value={value} 
                onChange={onChange}
                className={`${baseClasses} p-4 ${className || ''}`} 
                ref={textareaRef}
                {...props} 
            />
        );
    }

    return (
        <div className="flex h-full relative font-mono text-sm leading-6 group">
            <div 
                ref={linesRef} 
                className="bg-sidebar-bg/30 text-text-secondary/30 text-right pr-3 pl-2 pt-4 select-none overflow-hidden border-r border-border-base shrink-0 min-w-[3rem]"
            >
                {Array.from({length: Math.max(1, lineCount)}).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                ))}
            </div>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={onChange}
                onScroll={handleScroll}
                className={`${baseClasses} p-4 ${className || ''}`}
                style={{ lineHeight: '1.5rem' }}
                {...props}
            />
        </div>
    );
};