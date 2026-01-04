import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = '@music_player_theme';

type ThemeStore = {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  toggleTheme: () => Promise<void>;
  loadTheme: () => Promise<void>;
};

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'dark',
  
  setTheme: async (theme: Theme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      set({ theme });
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  },
  
  toggleTheme: async () => {
    const currentTheme = useThemeStore.getState().theme;
    const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
    await useThemeStore.getState().setTheme(newTheme);
  },
  
  loadTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        set({ theme: stored });
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    }
  },
}));

