import React from 'react';
import { AppTheme } from '../types';
import { useAppTheme, THEME_CONFIGS } from './ThemeContext';
import { Palette, Check, X } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSelectTheme: (theme: AppTheme) => void;
}

export const ThemeModal: React.FC<Props> = ({ onClose, onSelectTheme }) => {
  const { theme: currentTheme } = useAppTheme();

  const themes: AppTheme[] = ['BLUE', 'GREEN', 'PURPLE', 'ORANGE', 'RED'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 text-slate-900">
        <div className="flex items-center justify-between pb-3 border-b border-slate-900/10 mb-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900">Тема оформления</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Выберите основной цвет приложения:</p>

        <div className="space-y-2">
          {themes.map(t => {
            const config = THEME_CONFIGS[t];
            const isSelected = t === currentTheme;
            return (
              <div
                key={t}
                onClick={() => {
                  onSelectTheme(t);
                  onClose();
                }}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all backdrop-blur-sm ${
                  isSelected
                    ? `${config.bgLightClass} ${config.borderClass} font-extrabold shadow-sm`
                    : 'bg-white/60 border-white/30 hover:bg-white/80 text-slate-900 font-bold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border border-white shadow-sm shrink-0"
                    style={{ backgroundColor: config.primaryHex }}
                  />
                  <span className="text-xs font-extrabold">{config.label}</span>
                </div>
                {isSelected && <Check className="w-5 h-5 text-current" />}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-800 bg-white/60 hover:bg-white/80 rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
