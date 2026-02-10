import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
}

export const LineNumberTextarea: React.FC<Props> = ({ value, className, onChange, ...props }) => {
    const { editorSettings } = useTheme();
    const showLineNumbers = editorSettings.lineNumbers;
    const wordWrap = editorSettings.wordWrap;
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const linesRef = useRef<HTMLDivElement>(null);
    const mirrorRef = useRef<HTMLDivElement>(null);
    
    // Store calculated heights for each line
    const [lineHeights, setLineHeights] = useState<number[]>([]);

    const handleScroll = () => {
        if (linesRef.current && textareaRef.current) {
            linesRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const lines = value.split('\n');
    const lineCount = lines.length;

    // Calculate line heights when value, width, or wrap settings change
    useLayoutEffect(() => {
        if (!showLineNumbers || !wordWrap || !mirrorRef.current || !textareaRef.current) {
            return;
        }

        const textarea = textareaRef.current;
        const mirror = mirrorRef.current;
        
        // Sync width: clientWidth excludes scrollbar, which is what we want for content width
        mirror.style.width = `${textarea.clientWidth}px`;

        // Measure each line in the mirror
        const heights = Array.from(mirror.children).map(child => (child as HTMLElement).offsetHeight);
        setLineHeights(heights);

    }, [value, showLineNumbers, wordWrap]);

    // Re-measure on window resize to handle textarea width changes
    useEffect(() => {
        if (!textareaRef.current || !mirrorRef.current || !wordWrap) return;
        
        const observer = new ResizeObserver(() => {
             if (mirrorRef.current && textareaRef.current) {
                 mirrorRef.current.style.width = `${textareaRef.current.clientWidth}px`;
                 const heights = Array.from(mirrorRef.current.children).map(child => (child as HTMLElement).offsetHeight);
                 setLineHeights(heights);
             }
        });
        
        observer.observe(textareaRef.current);
        return () => observer.disconnect();
    }, [wordWrap, value]);

    // Common styles
    const baseClasses = "w-full h-full bg-transparent resize-none focus:outline-none font-mono text-sm leading-6";
    // Tailwind 'break-words' applies overflow-wrap: break-word. 'whitespace-pre-wrap' preserves whitespace but wraps.
    const wrapClass = wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre overflow-x-auto"; 

    if (!showLineNumbers) {
        return (
            <textarea 
                value={value} 
                onChange={onChange}
                className={`${baseClasses} p-4 ${wrapClass} ${className || ''}`} 
                ref={textareaRef}
                {...props} 
            />
        );
    }

    return (
        <div className="flex h-full relative font-mono text-sm leading-6 group overflow-hidden">
            {/* Line Numbers Column */}
            <div 
                ref={linesRef} 
                className="bg-sidebar-bg/30 text-text-secondary/30 text-right pr-3 pl-2 pt-4 select-none overflow-hidden border-r border-border-base shrink-0 min-w-[3rem]"
            >
                {lines.map((_, i) => (
                    <div 
                        key={i} 
                        style={{ height: (wordWrap && lineHeights[i]) ? lineHeights[i] : '1.5rem' }}
                        className="flex justify-end"
                    >
                        {i + 1}
                    </div>
                ))}
            </div>

            {/* Actual Textarea */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={onChange}
                onScroll={handleScroll}
                className={`${baseClasses} p-4 ${wrapClass} ${className || ''}`}
                {...props}
            />

            {/* Hidden Mirror for Height Calculation */}
            {wordWrap && (
                <div 
                    ref={mirrorRef}
                    className={`${baseClasses} p-4 ${wrapClass} absolute top-0 left-0 -z-10 invisible pointer-events-none h-auto overflow-hidden`}
                    aria-hidden="true"
                    style={{ visibility: 'hidden', height: 'auto', minHeight: '0' }}
                >
                    {lines.map((line, i) => (
                        // Use non-breaking space for empty lines to ensure they have height
                        <div key={i}>{line || '\u00A0'}</div> 
                    ))}
                    {/* Add extra character to handle trailing newline visualization if needed, but split behavior usually covers standard cases */}
                </div>
            )}
        </div>
    );
};