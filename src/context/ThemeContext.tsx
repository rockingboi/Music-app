import React, { createContext, useContext, ReactNode } from 'react';
import { useThemeStore, Theme } from '../store/themeStore';

export type { Theme };

type Colors = {
  background: string;
  card: string;
  primary: string;
  textPrimary: string;
  textSecondary: string;
  divider: string;
};

type ThemeContextType = {
  theme: Theme;
  colors: Colors;
  toggleTheme: () => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
};

const lightColors: Colors = {
  background: '#FFFFFF',
  card: '#F5F5F5',
  primary: '#F28B38',
  textPrimary: '#000000',
  textSecondary: '#666666',
  divider: '#E0E0E0',
};

const darkColors: Colors = {
  background: '#0F1115',
  card: '#181A20',
  primary: '#F28B38',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1A1',
  divider: '#2A2A2A',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const theme = useThemeStore((state) => state.theme);
  const toggleThemeStore = useThemeStore((state) => state.toggleTheme);
  const setThemeStore = useThemeStore((state) => state.setTheme);
  const loadThemeStore = useThemeStore((state) => state.loadTheme);

  // Load theme on mount
  React.useEffect(() => {
    loadThemeStore();
  }, []);

  const toggleTheme = async () => {
    await toggleThemeStore();
  };

  const setTheme = async (newTheme: Theme) => {
    await setThemeStore(newTheme);
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
