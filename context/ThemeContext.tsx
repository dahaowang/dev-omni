import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeName = 'dark' | 'light' | 'graphite' | 'cream' | 'glass';

export interface FontSettings {
  interface: string;
  code: string;
}

export interface EditorSettings {
  lineNumbers: boolean;
  wordWrap: boolean;
  miniMap: boolean;
}

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  fonts: FontSettings;
  setFonts: (fonts: FontSettings) => void;
  editorSettings: EditorSettings;
  setEditorSettings: (settings: EditorSettings) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize Theme
  const [theme, setTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('devomni-theme');
    if (saved === 'dark' || saved === 'light' || saved === 'graphite' || saved === 'cream' || saved === 'glass') {
      return saved as ThemeName;
    }
    return 'dark';
  });

  // Initialize Fonts
  const [fonts, setFonts] = useState<FontSettings>(() => {
    try {
      const saved = localStorage.getItem('devomni-fonts');
      if (saved) return JSON.parse(saved);
    } catch(e) {
      // ignore
    }
    return {
      interface: 'JetBrains Mono',
      code: 'JetBrains Mono'
    };
  });

  // Initialize Editor Settings
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(() => {
    try {
      const saved = localStorage.getItem('devomni-editor-settings');
      if (saved) return JSON.parse(saved);
    } catch(e) {
      // ignore
    }
    return {
      lineNumbers: true,
      wordWrap: true,
      miniMap: false
    };
  });

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('devomni-theme', theme);
  }, [theme]);

  // Apply Fonts
  useEffect(() => {
    const root = window.document.documentElement;
    const quote = (f: string) => f.includes(' ') ? `"${f}"` : f;
    
    root.style.setProperty('--font-interface', `${quote(fonts.interface)}, system-ui, sans-serif`);
    root.style.setProperty('--font-code', `${quote(fonts.code)}, monospace`);
    
    localStorage.setItem('devomni-fonts', JSON.stringify(fonts));
  }, [fonts]);

  // Save Editor Settings
  useEffect(() => {
    localStorage.setItem('devomni-editor-settings', JSON.stringify(editorSettings));
  }, [editorSettings]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fonts, setFonts, editorSettings, setEditorSettings }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};