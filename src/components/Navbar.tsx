import React from 'react';
import { Palette, RefreshCw, BarChart3, Database } from 'lucide-react';
import { useAppTheme } from './ThemeContext';

interface Props {
  onOpenTheme: () => void;
  onOpenUpdate: () => void;
  onOpenReport: () => void;
  onOpenBackup: () => void;
  hasUpdateAvailable: boolean;
}

export const Navbar: React.FC<Props> = ({
  onOpenTheme,
  onOpenUpdate,
  onOpenReport,
  onOpenBackup,
  hasUpdateAvailable
}) => {
  const { themeConfig, isLightMode } = useAppTheme();

  return (
    <header
      className={`border-b shadow-md sticky top-0 z-30 transition-colors backdrop-blur-md ${
        isLightMode
          ? 'bg-white/85 border-slate-200 text-slate-900 shadow-slate-200/50'
          : 'bg-slate-900/60 border-white/10 text-white shadow-black/40'
      }`}
    >
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
          <span style={{ color: themeConfig.primaryHex }}>Авто</span>Финансы
        </h1>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenBackup}
            className={`p-2 rounded-lg transition-colors ${
              isLightMode
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Резервная копия (Бэкап)"
          >
            <Database className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenTheme}
            className={`p-2 rounded-lg transition-colors ${
              isLightMode
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Тема оформления"
          >
            <Palette className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenUpdate}
            className={`p-2 rounded-lg transition-colors relative ${
              hasUpdateAvailable
                ? 'text-amber-500 hover:bg-amber-100/40 animate-pulse'
                : isLightMode
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Проверить обновления"
          >
            <RefreshCw className="w-5 h-5" />
            {hasUpdateAvailable && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
            )}
          </button>

          <button
            onClick={onOpenReport}
            className={`p-2 rounded-lg transition-colors ${
              isLightMode
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Отчёт"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

