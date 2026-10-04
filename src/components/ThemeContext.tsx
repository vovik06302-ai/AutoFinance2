import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppTheme, ThemeConfig } from '../types';
import { loadTheme, saveTheme } from '../storage';

export const THEME_CONFIGS: Record<AppTheme, ThemeConfig> = {
  BLUE: {
    label: 'Синяя (по умолчанию)',
    primaryHex: '#1D4ED8',
    primaryClass: 'bg-blue-700 hover:bg-blue-800 text-white',
    bgLightClass: 'bg-blue-50/70 border-blue-200',
    borderClass: 'border-blue-300',
    ringClass: 'focus:ring-blue-500'
  },
  GREEN: {
    label: 'Изумрудная',
    primaryHex: '#047857',
    primaryClass: 'bg-emerald-700 hover:bg-emerald-800 text-white',
    bgLightClass: 'bg-emerald-50/70 border-emerald-200',
    borderClass: 'border-emerald-300',
    ringClass: 'focus:ring-emerald-500'
  },
  PURPLE: {
    label: 'Фиолетовая',
    primaryHex: '#7E22CE',
    primaryClass: 'bg-purple-700 hover:bg-purple-800 text-white',
    bgLightClass: 'bg-purple-50/70 border-purple-200',
    borderClass: 'border-purple-300',
    ringClass: 'focus:ring-purple-500'
  },
  ORANGE: {
    label: 'Оранжевая',
    primaryHex: '#C2410C',
    primaryClass: 'bg-orange-700 hover:bg-orange-800 text-white',
    bgLightClass: 'bg-orange-50/70 border-orange-200',
    borderClass: 'border-orange-300',
    ringClass: 'focus:ring-orange-500'
  },
  RED: {
    label: 'Красная',
    primaryHex: '#B91C1C',
    primaryClass: 'bg-red-700 hover:bg-red-800 text-white',
    bgLightClass: 'bg-red-50/70 border-red-200',
    borderClass: 'border-red-300',
    ringClass: 'focus:ring-red-500'
  }
};

interface ThemeContextType {
  theme: AppTheme;
  themeConfig: ThemeConfig;
  setAppTheme: (newTheme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(loadTheme());

  const setAppTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    saveTheme(newTheme);
  };

  const themeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS.BLUE;

  return (
    <ThemeContext.Provider value={{ theme, themeConfig, setAppTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
