import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppTheme, ThemeConfig, BackgroundMode, CardStyle } from '../types';
import {
  loadTheme,
  saveTheme,
  loadBgMode,
  saveBgMode,
  loadCardStyle,
  saveCardStyle,
  loadAnimateBg,
  saveAnimateBg
} from '../storage';

export const THEME_CONFIGS: Record<AppTheme, ThemeConfig> = {
  CARBON: {
    id: 'CARBON',
    label: 'Racing Carbon',
    subtitle: 'Гоночный карбон (Ferrari / Brembo)',
    badge: '🏎️',
    primaryHex: '#E11D48',
    primaryClass: 'bg-rose-600 hover:bg-rose-700 text-white',
    bgLightClass: 'bg-rose-50/70 border-rose-200',
    borderClass: 'border-rose-300',
    ringClass: 'focus:ring-rose-500'
  },
  BLUE: {
    id: 'BLUE',
    label: 'M-Sport Blue',
    subtitle: 'Королевский синий (BMW M / Спорт)',
    badge: '🔵',
    primaryHex: '#1D4ED8',
    primaryClass: 'bg-blue-700 hover:bg-blue-800 text-white',
    bgLightClass: 'bg-blue-50/70 border-blue-200',
    borderClass: 'border-blue-300',
    ringClass: 'focus:ring-blue-500'
  },
  ORANGE: {
    id: 'ORANGE',
    label: 'Garage Industrial',
    subtitle: 'Инструментальная сталь (Milwaukee)',
    badge: '🛠️',
    primaryHex: '#EA580C',
    primaryClass: 'bg-orange-600 hover:bg-orange-700 text-white',
    bgLightClass: 'bg-orange-50/70 border-orange-200',
    borderClass: 'border-orange-300',
    ringClass: 'focus:ring-orange-500'
  },
  GREEN: {
    id: 'GREEN',
    label: 'British Racing Green',
    subtitle: 'Благородный изумрудный спорт',
    badge: '🌲',
    primaryHex: '#047857',
    primaryClass: 'bg-emerald-700 hover:bg-emerald-800 text-white',
    bgLightClass: 'bg-emerald-50/70 border-emerald-200',
    borderClass: 'border-emerald-300',
    ringClass: 'focus:ring-emerald-500'
  },
  NEON: {
    id: 'NEON',
    label: 'Cyber Neon',
    subtitle: 'Неоновый киберпанк / Электрик',
    badge: '⚡',
    primaryHex: '#0891B2',
    primaryClass: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    bgLightClass: 'bg-cyan-50/70 border-cyan-200',
    borderClass: 'border-cyan-300',
    ringClass: 'focus:ring-cyan-500'
  },
  PURPLE: {
    id: 'PURPLE',
    label: 'Deep Amethyst',
    subtitle: 'Глубокий фиолетовый аметист',
    badge: '🟣',
    primaryHex: '#7E22CE',
    primaryClass: 'bg-purple-700 hover:bg-purple-800 text-white',
    bgLightClass: 'bg-purple-50/70 border-purple-200',
    borderClass: 'border-purple-300',
    ringClass: 'focus:ring-purple-500'
  },
  MONOCHROME: {
    id: 'MONOCHROME',
    label: 'Monochrome Stealth',
    subtitle: 'Строгий минималистичный графит',
    badge: '⚪',
    primaryHex: '#334155',
    primaryClass: 'bg-slate-800 hover:bg-slate-900 text-white',
    bgLightClass: 'bg-slate-100 border-slate-300',
    borderClass: 'border-slate-400',
    ringClass: 'focus:ring-slate-500'
  },
  RED: {
    id: 'RED',
    label: 'Brembo Red',
    subtitle: 'Классический красный автоспорт',
    badge: '🔴',
    primaryHex: '#B91C1C',
    primaryClass: 'bg-red-700 hover:bg-red-800 text-white',
    bgLightClass: 'bg-red-50/70 border-red-200',
    borderClass: 'border-red-300',
    ringClass: 'focus:ring-red-500'
  }
};

interface ThemeContextType {
  theme: AppTheme;
  bgMode: BackgroundMode;
  cardStyle: CardStyle;
  animateBackground: boolean;
  themeConfig: ThemeConfig;
  isLightMode: boolean;
  setAppTheme: (newTheme: AppTheme) => void;
  setBgMode: (mode: BackgroundMode) => void;
  setCardStyle: (style: CardStyle) => void;
  setAnimateBackground: (animate: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(loadTheme());
  const [bgMode, setBgModeState] = useState<BackgroundMode>(loadBgMode());
  const [cardStyle, setCardStyleState] = useState<CardStyle>(loadCardStyle());
  const [animateBackground, setAnimateBgState] = useState<boolean>(loadAnimateBg());

  const setAppTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    saveTheme(newTheme);
  };

  const setBgMode = (mode: BackgroundMode) => {
    setBgModeState(mode);
    saveBgMode(mode);

    // Update meta theme-color in head
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        'content',
        mode === 'LIGHT' ? '#f8fafc' : mode === 'DARK' ? '#0f172a' : '#090d16'
      );
    }
  };

  const setCardStyle = (style: CardStyle) => {
    setCardStyleState(style);
    saveCardStyle(style);
  };

  const setAnimateBackground = (animate: boolean) => {
    setAnimateBgState(animate);
    saveAnimateBg(animate);
  };

  const themeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS.CARBON;
  const isLightMode = bgMode === 'LIGHT';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        bgMode,
        cardStyle,
        animateBackground,
        themeConfig,
        isLightMode,
        setAppTheme,
        setBgMode,
        setCardStyle,
        setAnimateBackground
      }}
    >
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
