import React from 'react';
import { UpdateStatus } from '../types';
import { RainbowProgressBar } from './RainbowProgressBar';
import { openInExternalBrowser } from '../updateChecker';
import { RefreshCw, CheckCircle2, Download, AlertTriangle, X, ExternalLink } from 'lucide-react';

interface Props {
  updateStatus: UpdateStatus;
  onClose: () => void;
  onCheckUpdate: () => void;
  onStartDownload: () => void;
}

export const UpdateModal: React.FC<Props> = ({
  updateStatus,
  onClose,
  onCheckUpdate,
  onStartDownload
}) => {
  const handleOpenBrowser = () => {
    let url = 'https://github.com/vovik06302-ai/AutoFinance2/releases/latest';
    if (updateStatus.status === 'update_available' && updateStatus.downloadUrl) {
      url = updateStatus.downloadUrl;
    } else if (updateStatus.status === 'error' && updateStatus.downloadUrl) {
      url = updateStatus.downloadUrl;
    }
    openInExternalBrowser(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h2 className="text-xl font-bold text-slate-800">Обновление приложения</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-3 text-center">
          {updateStatus.status === 'checking' && (
            <div className="flex flex-col items-center justify-center py-4">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-700">Проверка обновлений с GitHub...</p>
            </div>
          )}

          {updateStatus.status === 'up_to_date' && (
            <div className="flex flex-col items-center justify-center py-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-2" />
              <p className="text-base font-bold text-slate-800">Установлена последняя версия</p>
              <p className="text-xs text-slate-500 mt-1">Версия {updateStatus.currentVersion} (актуальная)</p>
            </div>
          )}

          {updateStatus.status === 'update_available' && (
            <div className="text-left space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="font-bold text-blue-900 text-sm">
                  Доступно обновление {updateStatus.latestVersion}
                </span>
                <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                  {updateStatus.releaseNotes}
                </p>
              </div>
            </div>
          )}

          {updateStatus.status === 'downloading' && (
            <div className="space-y-3 py-2">
              <p className="text-sm font-semibold text-slate-700">Скачивание обновления ({updateStatus.progress}%)...</p>
              <RainbowProgressBar progress={updateStatus.progress} />
              <p className="text-[11px] text-slate-400">Файл сохраняется в кэш и откроется для установки</p>
            </div>
          )}

          {updateStatus.status === 'downloaded' && (
            <div className="flex flex-col items-center justify-center py-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-2" />
              <p className="text-base font-bold text-slate-800">Загрузка завершена!</p>
              <p className="text-xs text-slate-500 mt-1">Открытие программы установки...</p>
            </div>
          )}

          {updateStatus.status === 'error' && (
            <div className="flex flex-col items-center justify-center py-2 text-center space-y-2">
              <AlertTriangle className="w-10 h-10 text-amber-600 mb-1" />
              <p className="text-sm font-bold text-slate-800">Не удалось выполнить обновление</p>
              <p className="text-xs text-slate-600 bg-red-50 border border-red-200 p-2.5 rounded-xl w-full text-left">
                Причина: {updateStatus.message}
              </p>
              <p className="text-[11px] text-slate-500 pt-1">
                Вы можете скачать и установить новый APK прямо в браузере:
              </p>
            </div>
          )}

          {updateStatus.status === 'idle' && (
            <p className="text-sm text-slate-600">
              Нажмите «Проверить», чтобы узнать о наличии свежей версии.
            </p>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
          {updateStatus.status === 'update_available' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onStartDownload}
                className="py-2.5 px-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Скачать и установить</span>
              </button>

              <button
                onClick={handleOpenBrowser}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4 text-slate-500" />
                <span>В браузере</span>
              </button>
            </div>
          )}

          {updateStatus.status === 'error' && (
            <button
              onClick={handleOpenBrowser}
              className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow transition-colors flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Скачать через браузер</span>
            </button>
          )}

          <div className="flex justify-end gap-2 pt-1">
            {(updateStatus.status === 'error' || updateStatus.status === 'up_to_date' || updateStatus.status === 'idle') && (
              <button
                onClick={onCheckUpdate}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors"
              >
                Проверить снова
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
