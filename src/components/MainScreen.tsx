import React, { useState } from 'react';
import { TransactionEntity, TransactionType, DebtorSummaryGroup, SalaryPayoutEntity, UpdateStatus, EmployeeEntity, PaymentMethod } from '../types';
import { formatCurrency, calculateFinancialSummary, getUnifiedFeed, PAYMENT_METHODS, REVENUE_CATEGORIES } from '../utils';
import { TotalSummaryCard } from './TotalSummaryCard';
import {
  TrendingUp,
  ArrowDownRight,
  PlusCircle,
  UserSearch,
  BadgeCheck,
  Mic,
  Edit2,
  Trash2,
  CheckCircle,
  RefreshCw,
  Banknote,
  Phone,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  X,
  RotateCcw
} from 'lucide-react';

interface Props {
  transactions: TransactionEntity[];
  payouts: SalaryPayoutEntity[];
  employees?: EmployeeEntity[];
  debtorSummaries: DebtorSummaryGroup[];
  updateStatus: UpdateStatus;
  isVoiceListening: boolean;
  onStartVoiceInput: () => void;
  onOpenReport: () => void;
  onOpenDebtorSearch: () => void;
  onOpenSalary: () => void;
  onOpenUpdate: () => void;
  onOpenAddModal: (type: TransactionType) => void;
  onEditTransaction: (tx: TransactionEntity) => void;
  onDeleteTransaction: (tx: TransactionEntity) => void;
  onMarkPaid: (tx: TransactionEntity) => void;
}

export const MainScreen: React.FC<Props> = ({
  transactions,
  payouts,
  employees = [],
  debtorSummaries,
  updateStatus,
  isVoiceListening,
  onStartVoiceInput,
  onOpenReport,
  onOpenDebtorSearch,
  onOpenSalary,
  onOpenUpdate,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onMarkPaid
}) => {
  const summary = calculateFinancialSummary(transactions, payouts, debtorSummaries);
  const allFeedItems = getUnifiedFeed(transactions, payouts);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PROFIT' | 'EXPENSE' | 'DEBTOR' | 'SALARY'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [masterFilter, setMasterFilter] = useState<'ALL' | number>('ALL');
  const [showExtendedFilters, setShowExtendedFilters] = useState(false);

  // Category counts
  const countProfit = allFeedItems.filter(i => i.category === 'PROFIT' || i.category === 'REPAYMENT').length;
  const countExpense = allFeedItems.filter(i => i.category === 'EXPENSE').length;
  const countDebtor = allFeedItems.filter(i => i.category === 'DEBTOR').length;
  const countSalary = allFeedItems.filter(i => i.category === 'SALARY').length;

  // Filtered feed
  const filteredFeedItems = allFeedItems.filter(item => {
    // 1. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNote = (item.note || '').toLowerCase().includes(q);
      const matchClient = (item.clientInfo || '').toLowerCase().includes(q);
      const matchEmployee = (item.employeeName || '').toLowerCase().includes(q);
      const matchPhone = (item.phone || '').toLowerCase().includes(q);
      const matchAmount = item.amount.toString().includes(q);
      if (!matchNote && !matchClient && !matchEmployee && !matchPhone && !matchAmount) {
        return false;
      }
    }

    // 2. Category Filter
    if (categoryFilter !== 'ALL') {
      if (categoryFilter === 'PROFIT') {
        if (item.category !== 'PROFIT' && item.category !== 'REPAYMENT') return false;
      } else {
        if (item.category !== categoryFilter) return false;
      }
    }

    // 3. Payment Method Filter
    if (paymentFilter !== 'ALL') {
      if (item.paymentMethod !== paymentFilter) return false;
    }

    // 4. Master Filter
    if (masterFilter !== 'ALL') {
      if (item.employeeId !== masterFilter) return false;
    }

    return true;
  });

  const filteredProfitSum = filteredFeedItems
    .filter(i => i.category === 'PROFIT' || i.category === 'REPAYMENT')
    .reduce((s, i) => s + i.amount, 0);

  const filteredExpenseSum = filteredFeedItems
    .filter(i => i.category === 'EXPENSE' || i.category === 'SALARY')
    .reduce((s, i) => s + i.amount, 0);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    categoryFilter !== 'ALL' ||
    paymentFilter !== 'ALL' ||
    masterFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setPaymentFilter('ALL');
    setMasterFilter('ALL');
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-20 space-y-4 relative">
      {/* 1. TOTAL SUMMARY CARD */}
      <TotalSummaryCard
        grandTotal={summary.grandTotal}
        profit={summary.profit}
        serviceProfit={summary.serviceProfit}
        partsProfit={summary.partsProfit}
        debtors={summary.activeDebtorsSum}
        expenses={summary.materialExpenses}
        salaryTotal={summary.salaryTotal}
        netTotal={summary.netTotal}
        cashProfit={summary.cashProfit}
        sbpProfit={summary.sbpProfit}
        cardProfit={summary.cardProfit}
        bankProfit={summary.bankProfit}
        netCashInRegister={summary.netCashInRegister}
      />

      {/* Update Availability Banner */}
      {updateStatus.status === 'update_available' && (
        <div
          onClick={onOpenUpdate}
          className="p-3 bg-amber-500/60 backdrop-blur-md border border-amber-300/40 rounded-xl cursor-pointer hover:bg-amber-500/70 transition-colors flex items-center justify-between shadow-lg text-white"
        >
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-5 h-5 text-amber-200 animate-spin" />
            <div>
              <div className="text-xs font-bold text-white">
                Есть обновление {updateStatus.latestVersion}
              </div>
              <div className="text-[11px] text-amber-100">Нажмите, чтобы обновить приложение</div>
            </div>
          </div>
          <button className="px-3 py-1 bg-amber-600 text-white font-bold text-xs rounded-lg shadow">
            Обновить
          </button>
        </div>
      )}

      {/* ACTION ROW: «Найти должника» & «Зарплата» */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onOpenDebtorSearch}
          className="p-3 bg-white/60 hover:bg-white/80 border border-white/20 text-slate-900 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md backdrop-blur-md"
        >
          <UserSearch className="w-4 h-4 text-orange-600" />
          <span>Должники</span>
        </button>

        <button
          onClick={onOpenSalary}
          className="p-3 bg-purple-500/30 hover:bg-purple-500/40 border border-purple-200/30 text-white rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md backdrop-blur-md"
        >
          <BadgeCheck className="w-4 h-4 text-purple-200" />
          <span>Зарплата</span>
        </button>
      </div>

      {/* 2. THREE QUICK ACTION BUTTONS */}
      <div>
        <div className="text-xs font-extrabold text-slate-200 uppercase tracking-wider mb-2 drop-shadow-sm">
          Быстрый ввод
        </div>
        <div className="grid grid-cols-3 gap-2">
          {/* Profit Button */}
          <button
            onClick={() => onOpenAddModal('PROFIT')}
            className="p-3 bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-300/30 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all shadow-md group backdrop-blur-md"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-200">Прибыль</span>
          </button>

          {/* Expense Button */}
          <button
            onClick={() => onOpenAddModal('EXPENSE')}
            className="p-3 bg-red-500/25 hover:bg-red-500/35 border border-red-300/30 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all shadow-md group backdrop-blur-md"
          >
            <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-red-200">Расходники</span>
          </button>

          {/* Debtor Button */}
          <button
            onClick={() => onOpenAddModal('DEBTOR')}
            className="p-3 bg-orange-500/25 hover:bg-orange-500/35 border border-orange-300/30 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all shadow-md group backdrop-blur-md"
          >
            <div className="w-9 h-9 rounded-full bg-orange-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-orange-200">Должники</span>
          </button>
        </div>
      </div>

      {/* 3. RECENT TRANSACTIONS LIST & FILTERS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100 drop-shadow-sm">
              Все записи
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">
              {filteredFeedItems.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExtendedFilters(!showExtendedFilters)}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                showExtendedFilters || paymentFilter !== 'ALL' || masterFilter !== 'ALL'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white/20 text-slate-200 hover:bg-white/30'
              }`}
              title="Фильтры по кассам и мастерам"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Фильтры</span>
            </button>
            <button
              onClick={onOpenReport}
              className="text-xs font-bold text-blue-300 hover:text-white underline"
            >
              Подробный отчёт
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по авто, клиенту, номеру или работе..."
            className="w-full pl-9 pr-8 py-2 bg-white/80 border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-xs shadow-sm font-medium placeholder-slate-500 backdrop-blur-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`py-1 px-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              categoryFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow'
                : 'bg-white/40 hover:bg-white/60 text-slate-900 border border-white/20'
            }`}
          >
            Все ({allFeedItems.length})
          </button>
          <button
            onClick={() => setCategoryFilter('PROFIT')}
            className={`py-1 px-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              categoryFilter === 'PROFIT'
                ? 'bg-emerald-700 text-white shadow'
                : 'bg-white/40 hover:bg-white/60 text-emerald-950 border border-white/20'
            }`}
          >
            Прибыль ({countProfit})
          </button>
          <button
            onClick={() => setCategoryFilter('EXPENSE')}
            className={`py-1 px-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              categoryFilter === 'EXPENSE'
                ? 'bg-red-700 text-white shadow'
                : 'bg-white/40 hover:bg-white/60 text-red-950 border border-white/20'
            }`}
          >
            Расходники ({countExpense})
          </button>
          <button
            onClick={() => setCategoryFilter('DEBTOR')}
            className={`py-1 px-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              categoryFilter === 'DEBTOR'
                ? 'bg-orange-700 text-white shadow'
                : 'bg-white/40 hover:bg-white/60 text-orange-950 border border-white/20'
            }`}
          >
            Должники ({countDebtor})
          </button>
          <button
            onClick={() => setCategoryFilter('SALARY')}
            className={`py-1 px-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              categoryFilter === 'SALARY'
                ? 'bg-purple-700 text-white shadow'
                : 'bg-white/40 hover:bg-white/60 text-purple-950 border border-white/20'
            }`}
          >
            Зарплата ({countSalary})
          </button>
        </div>

        {/* Extended filters (Payment Method & Master) */}
        {showExtendedFilters && (
          <div className="p-3 bg-white/70 border border-white/40 rounded-xl space-y-2.5 backdrop-blur-md shadow-sm text-xs animate-in fade-in zoom-in-95">
            {/* Payment Method filter */}
            <div>
              <span className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                Касса / Способ оплаты:
              </span>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setPaymentFilter('ALL')}
                  className={`py-1 px-2 rounded-lg font-bold ${
                    paymentFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white/60 text-slate-800 hover:bg-white border border-slate-300'
                  }`}
                >
                  Все кассы
                </button>
                {(['CASH', 'SBP', 'CARD', 'BANK_ACCOUNT'] as PaymentMethod[]).map(pm => {
                  const info = PAYMENT_METHODS[pm];
                  const isSel = paymentFilter === pm;
                  return (
                    <button
                      key={pm}
                      onClick={() => setPaymentFilter(pm)}
                      className={`py-1 px-2 rounded-lg font-bold flex items-center gap-1 ${
                        isSel
                          ? 'bg-blue-700 text-white shadow'
                          : 'bg-white/60 text-slate-800 hover:bg-white border border-slate-300'
                      }`}
                    >
                      <span>{info.icon}</span>
                      <span>{info.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Master filter (if employees exist) */}
            {employees.length > 0 && (
              <div>
                <span className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Мастер / Исполнитель:
                </span>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setMasterFilter('ALL')}
                    className={`py-1 px-2 rounded-lg font-bold ${
                      masterFilter === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white/60 text-slate-800 hover:bg-white border border-slate-300'
                    }`}
                  >
                    Все мастера
                  </button>
                  {employees.map(emp => {
                    const isSel = masterFilter === emp.id;
                    return (
                      <button
                        key={emp.id}
                        onClick={() => setMasterFilter(emp.id)}
                        className={`py-1 px-2 rounded-lg font-bold flex items-center gap-1 ${
                          isSel
                            ? 'bg-purple-700 text-white shadow'
                            : 'bg-white/60 text-slate-800 hover:bg-white border border-slate-300'
                        }`}
                      >
                        <span>👨‍🔧</span>
                        <span>{emp.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results summary bar if filter active */}
        {hasActiveFilters && (
          <div className="p-2 bg-blue-500/25 border border-blue-300/40 rounded-xl flex items-center justify-between text-xs backdrop-blur-md">
            <div className="text-white font-medium text-[11px]">
              <span>Найдено: <strong>{filteredFeedItems.length}</strong> из {allFeedItems.length}</span>
              {(filteredProfitSum > 0 || filteredExpenseSum > 0) && (
                <span className="ml-2 font-bold">
                  {filteredProfitSum > 0 && <span className="text-emerald-200">+{formatCurrency(filteredProfitSum)} </span>}
                  {filteredExpenseSum > 0 && <span className="text-red-200">−{formatCurrency(filteredExpenseSum)}</span>}
                </span>
              )}
            </div>
            <button
              onClick={resetFilters}
              className="py-0.5 px-2 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Сбросить</span>
            </button>
          </div>
        )}

        {filteredFeedItems.length === 0 ? (
          <div className="text-center py-10 bg-white/60 border border-white/20 rounded-2xl p-6 text-slate-800 font-medium text-xs backdrop-blur-md shadow-lg space-y-2">
            <div>
              {hasActiveFilters
                ? 'По вашему фильтру или поисковому запросу ничего не найдено.'
                : 'Записей пока нет.'}
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="py-1.5 px-3 bg-blue-700 text-white font-bold rounded-xl text-xs shadow"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredFeedItems.map(item => {
              const isProfit = item.category === 'PROFIT' || item.category === 'REPAYMENT';
              const isSalary = item.category === 'SALARY';
              const isExpense = item.category === 'EXPENSE';
              const isDebtor = item.category === 'DEBTOR';

              const colorClass = isSalary
                ? 'text-purple-900'
                : isProfit
                ? 'text-emerald-800'
                : isExpense
                ? 'text-red-800'
                : 'text-orange-800';

              const badgeBg = isSalary
                ? 'bg-purple-600'
                : isProfit
                ? 'bg-emerald-600'
                : isExpense
                ? 'bg-red-600'
                : 'bg-orange-600';

              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-white/60 border border-white/30 rounded-xl shadow-lg space-y-2 hover:bg-white/70 transition-colors backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`w-2.5 h-2.5 rounded-full ${badgeBg}`} />
                      <span className={`text-xs font-extrabold uppercase tracking-wider ${colorClass}`}>
                        {item.categoryLabel}
                      </span>
                      {item.paymentMethod && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-900/10 text-slate-800 text-[10px] font-bold">
                          {PAYMENT_METHODS[item.paymentMethod]?.short || 'Нал'}
                        </span>
                      )}
                      {item.employeeName && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-bold flex items-center gap-0.5">
                          <span>👨‍🔧</span>
                          <span>{item.employeeName}</span>
                        </span>
                      )}
                      {item.dueDate && (
                        item.isOverdue ? (
                          <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold flex items-center gap-0.5 shadow-sm">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>Просрочен</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-900 text-[10px] font-bold flex items-center gap-0.5 border border-amber-300">
                            <Clock className="w-2.5 h-2.5 text-amber-800" />
                            <span>до {new Date(item.dueDate).toLocaleDateString('ru-RU')}</span>
                          </span>
                        )
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-600">
                      {new Date(item.date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-sm leading-snug">
                        {item.note || 'Без описания'}
                      </div>
                      {item.clientInfo && (
                        <div className="text-xs text-slate-700 font-medium mt-0.5">{item.clientInfo}</div>
                      )}
                    </div>
                    <div className={`font-black text-lg whitespace-nowrap ${colorClass}`}>
                      {isProfit ? '+ ' : '- '}{formatCurrency(item.amount)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-900/10 flex-wrap">
                    {isDebtor && item.originalTx && (
                      <button
                        onClick={() => onMarkPaid(item.originalTx!)}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm mr-auto"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Должник оплатил</span>
                      </button>
                    )}

                    {isDebtor && item.phone && (
                      <a
                        href={`tel:${item.phone}`}
                        className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                        title={`Позвонить ${item.phone}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{item.phone}</span>
                      </a>
                    )}

                    {isSalary && (
                      <button
                        onClick={onOpenSalary}
                        className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm mr-auto"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Раздел зарплат</span>
                      </button>
                    )}

                    {item.originalTx && (
                      <>
                        <button
                          onClick={() => onEditTransaction(item.originalTx!)}
                          className="p-1.5 text-slate-700 hover:text-slate-950 rounded-lg hover:bg-white/50 transition-colors"
                          title="Редактировать"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteTransaction(item.originalTx!)}
                          className="p-1.5 text-slate-600 hover:text-red-700 rounded-lg hover:bg-red-50/50 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Voice Button */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={onStartVoiceInput}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all transform active:scale-95 border border-white/30 backdrop-blur-md ${
            isVoiceListening
              ? 'bg-red-600 animate-pulse ring-4 ring-red-300'
              : 'bg-blue-700/90 hover:bg-blue-800 ring-2 ring-blue-400/50'
          }`}
          title="Голосовая команда"
        >
          <Mic className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
