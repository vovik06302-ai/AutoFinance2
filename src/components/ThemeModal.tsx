import React from 'react';
import { AppTheme, BackgroundMode, CardStyle } from '../types';
import { useAppTheme, THEME_CONFIGS } from './ThemeContext';
import { Palette, Check, X, Sun, Moon, Sparkles, Layers, Zap, BatteryCharging } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSelectTheme: (theme: AppTheme) => void;
}

export const ThemeModal: React.FC<Props> = ({ onClose, onSelectTheme }) => {
  const {
    theme: currentTheme,
    bgMode,
    cardStyle,
    animateBackground,
    setBgMode,
    setCardStyle,
    setAnimateBackground
  } = useAppTheme();

  const themes: AppTheme[] = [
    'CARBON',
    'BLUE',
    'ORANGE',
    'GREEN',
    'NEON',
    'PURPLE',
    'MONOCHROME',
    'RED'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="bg-white/75 backdrop-blur-lg border border-white/40 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 text-slate-900 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-900/10 mb-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-700" />
            <h2 className="text-xl font-extrabold text-slate-900">Оформление и темы</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 1. Режим освещения фона */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Режим освещения фона
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setBgMode('STARFIELD')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                  bgMode === 'STARFIELD'
                    ? 'bg-slate-950 text-white border-blue-500 shadow-md'
                    : 'bg-white/60 hover:bg-white text-slate-800 border-slate-300'
                }`}
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Космос</span>
              </button>

              <button
                type="button"
                onClick={() => setBgMode('DARK')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                  bgMode === 'DARK'
                    ? 'bg-slate-900 text-white border-blue-500 shadow-md'
                    : 'bg-white/60 hover:bg-white text-slate-800 border-slate-300'
                }`}
              >
                <Moon className="w-4 h-4 text-purple-400" />
                <span>Тёмный</span>
              </button>

              <button
                type="button"
                onClick={() => setBgMode('LIGHT')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                  bgMode === 'LIGHT'
                    ? 'bg-amber-100 text-amber-950 border-amber-500 shadow-md'
                    : 'bg-white/60 hover:bg-white text-slate-800 border-slate-300'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Светлый</span>
              </button>
            </div>
          </div>

          {/* 2. Стиль карточек и батарея */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Стиль карточек
              </label>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setCardStyle('GLASS')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                    cardStyle === 'GLASS'
                      ? 'bg-blue-700 text-white border-blue-800 shadow'
                      : 'bg-white/60 hover:bg-white text-slate-800 border-slate-300'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Стекло</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCardStyle('SOLID')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                    cardStyle === 'SOLID'
                      ? 'bg-blue-700 text-white border-blue-800 shadow'
                      : 'bg-white/60 hover:bg-white text-slate-800 border-slate-300'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Контраст</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Анимация фона
              </label>
              <button
                type="button"
                onClick={() => setAnimateBackground(!animateBackground)}
                className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  animateBackground
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow'
                    : 'bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                <BatteryCharging className="w-3.5 h-3.5" />
                <span>{animateBackground ? 'Анимация ON' : 'Эконом (OFF)'}</span>
              </button>
            </div>
          </div>

          {/* 3. Автомобильные цветовые стили */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Автомобильные стили (акцентный цвет):
            </label>
            <div className="space-y-1.5">
              {themes.map(t => {
                const config = THEME_CONFIGS[t];
                const isSelected = t === currentTheme;
                return (
                  <div
                    key={t}
                    onClick={() => {
                      onSelectTheme(t);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all backdrop-blur-sm ${
                      isSelected
                        ? 'bg-white border-blue-600 ring-2 ring-blue-500 shadow-sm'
                        : 'bg-white/60 border-white/40 hover:bg-white/85 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="text-lg">{config.badge}</div>
                      <div>
                        <div className="text-xs font-extrabold flex items-center gap-1.5">
                          <span>{config.label}</span>
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block border border-black/10"
                            style={{ backgroundColor: config.primaryHex }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-600 font-medium">
                          {config.subtitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-900/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow"
          >
            Применить и закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
