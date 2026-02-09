import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeName = 'dark' | 'light' | 'graphite' | 'cream' | 'glass';

export interface FontSettings {
  interface: string;
  code: string;
}

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  fonts: FontSettings;
  setFonts: (fonts: FontSettings) => void;
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
  // Defaulting to JetBrains Mono for a developer-centric aesthetic as requested
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

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('devomni-theme', theme);
  }, [theme]);

  // Apply Fonts
  useEffect(() => {
    const root = window.document.documentElement;
    // Set CSS Variables
    // Check if the font needs quotes (if it has spaces)
    const quote = (f: string) => f.includes(' ') ? `"${f}"` : f;
    
    root.style.setProperty('--font-interface', `${quote(fonts.interface)}, system-ui, sans-serif`);
    root.style.setProperty('--font-code', `${quote(fonts.code)}, monospace`);
    
    localStorage.setItem('devomni-fonts', JSON.stringify(fonts));
  }, [fonts]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fonts, setFonts }}>
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