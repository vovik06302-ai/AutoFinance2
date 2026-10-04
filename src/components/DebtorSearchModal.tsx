import React, { useState } from 'react';
import { DebtorSummaryGroup } from '../types';
import { formatCurrency } from '../utils';
import { UserSearch, Search, X, ArrowLeft, CheckCircle2, History, CreditCard } from 'lucide-react';

interface Props {
  debtorSummaries: DebtorSummaryGroup[];
  onClose: () => void;
  onWriteOff: (clientName: string, amount: number, onError: (msg: string) => void) => void;
}

export const DebtorSearchModal: React.FC<Props> = ({ debtorSummaries, onClose, onWriteOff }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [selectedDebtor, setSelectedDebtor] = useState<DebtorSummaryGroup | null>(null);
  const [writeOffText, setWriteOffText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeDebtors = debtorSummaries.filter(d => d.remainingDebt > 0);
  const historyDebtors = debtorSummaries.filter(d => d.remainingDebt === 0 && d.totalInitialDebt > 0);

  const currentList = tab === 'ACTIVE' ? activeDebtors : historyDebtors;

  const filteredDebtors = currentList.filter(d => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    if (d.name.toLowerCase().includes(q)) return true;
    const matchesDebtNote = d.debtTransactions.some(
      t => (t.note || '').toLowerCase().includes(q) || (t.clientInfo || '').toLowerCase().includes(q)
    );
    const matchesRepaymentNote = d.repaymentTransactions.some(
      t => (t.note || '').toLowerCase().includes(q) || (t.clientInfo || '').toLowerCase().includes(q)
    );
    return matchesDebtNote || matchesRepaymentNote;
  });

  const handleWriteOffFull = () => {
    if (!selectedDebtor) return;
    if (selectedDebtor.remainingDebt <= 0) {
      setErrorMessage('У должника нет остатка долга для списания');
      return;
    }

    onWriteOff(selectedDebtor.name, selectedDebtor.remainingDebt, (err) => {
      setErrorMessage(err);
    });
  };

  const handleWriteOffSpecified = () => {
    if (!selectedDebtor) return;
    const amount = parseFloat(writeOffText.replace(',', '.').trim());

    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('Введите корректную сумму для списания (больше 0 ₽)');
      return;
    }
    if (amount > selectedDebtor.remainingDebt) {
      setErrorMessage(`Сумма списания (${formatCurrency(amount)}) не может быть больше остатка долга (${formatCurrency(selectedDebtor.remainingDebt)})`);
      return;
    }

    onWriteOff(selectedDebtor.name, amount, (err) => {
      setErrorMessage(err);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl shadow-2xl max-w-md w-full p-5 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-900/10 mb-3">
          <div className="flex items-center gap-2">
            {selectedDebtor ? (
              <button
                onClick={() => {
                  setSelectedDebtor(null);
                  setErrorMessage(null);
                }}
                className="p-1 hover:bg-white/50 rounded-lg text-slate-800 transition-colors"
                title="Назад к списку"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <UserSearch className="w-6 h-6 text-orange-600" />
            )}
            <h2 className="text-lg font-extrabold text-slate-900">
              {selectedDebtor ? 'Карточка должника' : 'Должники'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!selectedDebtor ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск по имени, авто или госномеру..."
                className="w-full pl-9 pr-8 py-2 bg-white/85 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-slate-900 font-medium shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Active / History Tabs */}
            <div className="flex gap-2 mb-3 border-b border-slate-900/10 pb-2">
              <button
                onClick={() => setTab('ACTIVE')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-colors flex items-center justify-center gap-1.5 ${
                  tab === 'ACTIVE'
                    ? 'bg-orange-600 text-white shadow'
                    : 'bg-white/50 text-slate-800 hover:bg-white/80'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Активные ({activeDebtors.length})</span>
              </button>
              <button
                onClick={() => setTab('HISTORY')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-colors flex items-center justify-center gap-1.5 ${
                  tab === 'HISTORY'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-white/50 text-slate-800 hover:bg-white/80'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Погашенные ({historyDebtors.length})</span>
              </button>
            </div>

            {/* Debtor Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredDebtors.length === 0 ? (
                <div className="text-center py-10 text-slate-600 text-xs font-bold">
                  {searchQuery
                    ? `По запросу «${searchQuery}» ничего не найдено`
                    : tab === 'ACTIVE'
                    ? 'Активных должников нет'
                    : 'История полностью погашенных долгов пуста'}
                </div>
              ) : (
                filteredDebtors.map(debtor => (
                  <div
                    key={debtor.name}
                    className="p-3 bg-white/60 hover:bg-white/80 border border-white/40 rounded-xl transition-all flex items-center justify-between gap-2 shadow-sm backdrop-blur-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">{debtor.name}</div>
                      <div className="text-[11px] text-slate-700 flex items-center gap-2 mt-0.5">
                        <span>Всего долга: {formatCurrency(debtor.totalInitialDebt)}</span>
                        {debtor.totalRepaid > 0 && (
                          <span className="text-emerald-800 font-extrabold">
                            (Погашено: {formatCurrency(debtor.totalRepaid)})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div
                          className={`font-black text-sm ${
                            debtor.remainingDebt > 0 ? 'text-orange-700' : 'text-emerald-700'
                          }`}
                        >
                          {debtor.remainingDebt > 0 ? formatCurrency(debtor.remainingDebt) : 'Погашен'}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedDebtor(debtor);
                          setWriteOffText('');
                          setErrorMessage(null);
                        }}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                      >
                        {debtor.remainingDebt > 0 ? 'Списать' : 'История'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Single Debtor Detailed Card & Write-Off Form */
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="p-4 bg-orange-500/20 border border-orange-300/40 rounded-xl space-y-2 backdrop-blur-sm">
              <div className="font-bold text-orange-950 text-base">{selectedDebtor.name}</div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-orange-300/40">
                <div>
                  <span className="text-slate-800 font-medium block">Остаток долга:</span>
                  <span className="text-lg font-black text-orange-700">
                    {formatCurrency(selectedDebtor.remainingDebt)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-800 font-medium block">Уплачено ранее:</span>
                  <span className="text-lg font-black text-emerald-800">
                    {formatCurrency(selectedDebtor.totalRepaid)}
                  </span>
                </div>
              </div>
            </div>

            {/* Write-off controls if remainingDebt > 0 */}
            {selectedDebtor.remainingDebt > 0 ? (
              <div className="space-y-3 p-3.5 bg-white/60 border border-white/40 rounded-xl backdrop-blur-sm shadow-sm">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Списание / Оплата долга
                </label>

                <div>
                  <input
                    type="number"
                    step="any"
                    value={writeOffText}
                    onChange={e => {
                      setWriteOffText(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder={`Введите сумму (до ${selectedDebtor.remainingDebt} ₽)`}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-bold text-sm bg-white/85 shadow-sm"
                  />
                  {errorMessage && (
                    <p className="text-xs text-red-600 mt-1.5 font-bold">{errorMessage}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleWriteOffFull}
                    className="py-2.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow transition-colors text-center"
                  >
                    Списать всю сумму
                  </button>

                  <button
                    type="button"
                    onClick={handleWriteOffSpecified}
                    className="py-2.5 px-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow transition-colors text-center"
                  >
                    Списать указанную сумму
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-500/20 border border-emerald-300/40 text-emerald-950 rounded-xl flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>Долг полностью погашен! Клиент находится в истории.</span>
              </div>
            )}

            {/* History of Partial Write-Offs and Initial Debt */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                История долга и списаний ({selectedDebtor.debtTransactions.length + selectedDebtor.repaymentTransactions.length})
              </h3>

              <div className="space-y-1.5">
                {[
                  ...selectedDebtor.debtTransactions.map(t => ({ ...t, kind: 'DEBT' as const })),
                  ...selectedDebtor.repaymentTransactions.map(t => ({ ...t, kind: 'REPAYMENT' as const }))
                ]
                  .sort((a, b) => b.date - a.date)
                  .map(item => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between backdrop-blur-sm ${
                        item.kind === 'DEBT'
                          ? 'bg-orange-500/20 border-orange-300/30 text-slate-900'
                          : 'bg-emerald-500/20 border-emerald-300/30 text-slate-900'
                      }`}
                    >
                      <div>
                        <div className="font-bold">
                          {item.kind === 'DEBT' ? 'Запись долга: ' : 'Погашение долга: '}
                          {item.note || 'Замена деталей / услуга'}
                        </div>
                        <div className="text-[10px] text-slate-700 mt-0.5 font-medium">
                          {new Date(item.date).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      <div
                        className={`font-black text-sm ${
                          item.kind === 'DEBT' ? 'text-orange-700' : 'text-emerald-700'
                        }`}
                      >
                        {item.kind === 'DEBT' ? '+' : '-'}{formatCurrency(item.amount)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-slate-900/10 flex justify-end">
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
