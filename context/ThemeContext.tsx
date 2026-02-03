import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeName = 'dark' | 'light' | 'graphite';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from localStorage or default to 'dark'
  const [theme, setTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('devomni-theme');
    // Basic validation to fallback if saved theme is no longer supported
    if (saved === 'dark' || saved === 'light' || saved === 'graphite') {
      return saved as ThemeName;
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove previous theme attributes if any (though logic handles simple switch)
    root.setAttribute('data-theme', theme);
    localStorage.setItem('devomni-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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