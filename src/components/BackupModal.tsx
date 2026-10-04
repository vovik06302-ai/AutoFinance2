import React, { useState, useRef } from 'react';
import { TransactionEntity, EmployeeEntity, SalaryPayoutEntity, AppTheme, BackupData } from '../types';
import { exportBackupJson, parseAndValidateBackup } from '../storage';
import { useAppTheme } from './ThemeContext';
import { Database, Download, Upload, X, AlertTriangle, CheckCircle, FileText, RefreshCw } from 'lucide-react';

interface Props {
  transactions: TransactionEntity[];
  employees: EmployeeEntity[];
  payouts: SalaryPayoutEntity[];
  currentTheme: AppTheme;
  onClose: () => void;
  onRestore: (data: BackupData, mode: 'REPLACE' | 'MERGE') => void;
}

export const BackupModal: React.FC<Props> = ({
  transactions,
  employees,
  payouts,
  currentTheme,
  onClose,
  onRestore
}) => {
  const { themeConfig } = useAppTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  const [stagedBackup, setStagedBackup] = useState<BackupData | null>(null);
  const [restoreMode, setRestoreMode] = useState<'REPLACE' | 'MERGE'>('REPLACE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setErrorMsg(null);
      const fileName = await exportBackupJson(transactions, employees, payouts, currentTheme);
      setExportSuccessMsg(`Резервная копия сохранена: ${fileName}`);
      setTimeout(() => setExportSuccessMsg(null), 5000);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Ошибка экспорта файла');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseAndValidateBackup(text);
        setStagedBackup(parsed);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Не удалось прочитать или проверить файл.');
        setStagedBackup(null);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Ошибка чтения выбранного файла.');
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleConfirmRestore = () => {
    if (!stagedBackup) return;

    if (restoreMode === 'REPLACE') {
      const confirm = window.confirm(
        'Внимание! Режим «Заменить» полностью перезапишет текущую базу данных автосервиса данными из бэкапа. Продолжить?'
      );
      if (!confirm) return;
    }

    onRestore(stagedBackup, restoreMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 text-slate-900 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-900/10 mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-700" />
            <h2 className="text-xl font-extrabold text-slate-900">Резервное копирование</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Data Stats */}
        <div className="p-3.5 bg-white/60 border border-white/40 rounded-xl mb-4 text-xs space-y-1.5 shadow-sm">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
            Текущая база данных:
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Операций (прибыль/расход/долги):</span>
            <span className="font-extrabold text-slate-900">{transactions.length}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Сотрудников (мастеров):</span>
            <span className="font-extrabold text-slate-900">{employees.length}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Записей зарплатных выплат:</span>
            <span className="font-extrabold text-slate-900">{payouts.length}</span>
          </div>
        </div>

        {/* Error or Success notification */}
        {errorMsg && (
          <div className="p-3 bg-red-500/20 border border-red-300 text-red-900 rounded-xl text-xs font-bold mb-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {exportSuccessMsg && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-bold mb-3 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>{exportSuccessMsg}</span>
          </div>
        )}

        {/* Export Action */}
        <div className="space-y-3 mb-5">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all shadow flex items-center justify-center gap-2 ${themeConfig.primaryClass}`}
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Скачать резервную копию базы (.json)</span>
          </button>
          <p className="text-[11px] text-slate-600 font-medium text-center">
            Сохраняет всю базу автосервиса в файл на устройство или в облако.
          </p>
        </div>

        {/* Restore Section */}
        <div className="pt-4 border-t border-slate-900/10 space-y-3">
          <div className="font-bold text-slate-900 text-sm">
            Восстановление из файла:
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          {!stagedBackup ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-white/70 hover:bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4 text-blue-700" />
              <span>Выбрать файл бэкапа (.json)...</span>
            </button>
          ) : (
            <div className="p-3.5 bg-blue-500/15 border border-blue-300/40 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between font-bold text-blue-950">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-700" />
                  <span>Файл готов к восстановлению</span>
                </span>
                <button
                  type="button"
                  onClick={() => setStagedBackup(null)}
                  className="text-slate-600 hover:text-slate-900 text-[11px] underline"
                >
                  Отменить
                </button>
              </div>

              <div className="space-y-1 text-slate-700 font-medium text-[11px] bg-white/60 p-2.5 rounded-lg border border-white/50">
                <div>Дата создания бэкапа: <strong>{new Date(stagedBackup.exportedAt).toLocaleString('ru-RU')}</strong></div>
                <div>Операций в файле: <strong>{stagedBackup.transactions.length}</strong></div>
                <div>Сотрудников: <strong>{stagedBackup.employees.length}</strong></div>
                <div>Выплат зарплат: <strong>{stagedBackup.payouts.length}</strong></div>
              </div>

              {/* Restore Mode selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Режим восстановления:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRestoreMode('REPLACE')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      restoreMode === 'REPLACE'
                        ? 'bg-red-800 text-white border-red-900 shadow'
                        : 'bg-white/60 hover:bg-white text-slate-800 border-slate-300'
                    }`}
                  >
                    Заменить всё
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestoreMode('MERGE')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      restoreMode === 'MERGE'
                        ? 'bg-blue-800 text-white border-blue-900 shadow'
                        : 'bg-white/60 hover:bg-white text-slate-800 border-slate-300'
                    }`}
                  >
                    Объединить
                  </button>
                </div>
                <div className="text-[10px] text-slate-600 mt-1 font-medium">
                  {restoreMode === 'REPLACE'
                    ? '⚠️ Текущие данные будут стёрты и полностью заменены данными из файла.'
                    : '✅ Новые операции и сотрудники добавятся к текущим (без удаления существующих).'}
                </div>
              </div>

              {/* Confirm Restore Button */}
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Подтвердить восстановление базы</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
