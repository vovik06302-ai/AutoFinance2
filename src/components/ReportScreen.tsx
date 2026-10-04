import React, { useState } from 'react';
import { TransactionEntity, EmployeeEntity, SalaryPayoutEntity, DebtorSummaryGroup } from '../types';
import { formatCurrency, MONTH_NAMES_RU, calculateFinancialSummary, getUnifiedFeed, PAYMENT_METHODS, REVENUE_CATEGORIES } from '../utils';
import { exportAndShareCsv } from '../csvExporter';
import { ArrowLeft, Download, ChevronLeft, ChevronRight, Calendar, TrendingUp, CreditCard, Users, ArrowDownRight, FileText, Wallet } from 'lucide-react';

interface Props {
  transactions: TransactionEntity[];
  payouts: SalaryPayoutEntity[];
  employees: EmployeeEntity[];
  debtorSummaries: DebtorSummaryGroup[];
  onNavigateBack: () => void;
  onMarkPaid: (tx: TransactionEntity) => void;
  onOpenDebtorsModal: () => void;
}

export const ReportScreen: React.FC<Props> = ({
  transactions,
  payouts,
  employees,
  debtorSummaries,
  onNavigateBack,
  onOpenDebtorsModal
}) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0..11
  const [isAllTime, setIsAllTime] = useState<boolean>(false);

  // Month navigation
  const handlePrevMonth = () => {
    setIsAllTime(false);
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    setIsAllTime(false);
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const isInPeriod = (timestamp: number) => {
    if (isAllTime) return true;
    const d = new Date(timestamp);
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
  };

  const periodTitle = isAllTime
    ? 'За всё время'
    : `${MONTH_NAMES_RU[selectedMonth]} ${selectedYear} г.`;

  // Calculated financial summaries for period
  const {
    profit: periodProfit,
    serviceProfit: periodServiceProfit,
    partsProfit: periodPartsProfit,
    activeDebtorsSum,
    materialExpenses: periodMaterialExpenses,
    cashExpenses: periodCashExpenses,
    cashProfit: periodCashProfit,
    sbpProfit: periodSbpProfit,
    cardProfit: periodCardProfit,
    bankProfit: periodBankProfit,
    netCashInRegister: periodNetCashInRegister,
    salaryTotal: periodSalaryTotal,
    grandTotal: periodGrandTotal,
    netTotal: periodNetTotal
  } = calculateFinancialSummary(transactions, payouts, debtorSummaries, isInPeriod);

  const activeDebtors = debtorSummaries.filter(d => d.remainingDebt > 0);
  const totalUnpaidDebt = activeDebtorsSum;

  const profitTransactions = transactions.filter(t => t.type === 'PROFIT' && isInPeriod(t.date));
  const periodDebtRepayments = profitTransactions.filter(
    t => t.note.toLowerCase().includes('погашение долга') || t.note.toLowerCase().includes('списание долга')
  );
  const periodRepaidDebtTotal = periodDebtRepayments.reduce((sum, t) => sum + t.amount, 0);

  const periodPayouts = payouts.filter(p => isInPeriod(p.date));

  // Unified operations log
  const feedItems = getUnifiedFeed(transactions, payouts, isInPeriod);

  const handleExportCsv = () => {
    exportAndShareCsv(
      transactions.filter(t => isInPeriod(t.date)),
      periodPayouts,
      periodTitle,
      {
        profit: periodProfit,
        serviceProfit: periodServiceProfit,
        partsProfit: periodPartsProfit,
        debtors: totalUnpaidDebt,
        materialExpenses: periodMaterialExpenses,
        grandTotal: periodGrandTotal,
        salaryTotal: periodSalaryTotal,
        netTotal: periodNetTotal,
        cashProfit: periodCashProfit,
        sbpProfit: periodSbpProfit,
        cardProfit: periodCardProfit,
        bankProfit: periodBankProfit,
        netCashInRegister: periodNetCashInRegister
      }
    );
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Top Bar */}
      <div className="bg-slate-900/60 backdrop-blur-md border-b border-white/10 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateBack}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="Назад"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">Подробный отчёт</h1>
          </div>

          <button
            onClick={handleExportCsv}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Экспорт в CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Month / Period Selector Bar */}
        <div className="bg-white/60 border border-white/30 rounded-2xl p-3 shadow-lg backdrop-blur-md flex items-center justify-between gap-2">
          {!isAllTime ? (
            <div className="flex items-center justify-between w-full">
              <button
                onClick={handlePrevMonth}
                className="p-2 bg-white/50 hover:bg-white/80 text-slate-900 rounded-xl transition-colors shadow-sm"
                title="Предыдущий месяц"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 font-black text-slate-900 text-base">
                <Calendar className="w-4 h-4 text-blue-700" />
                <span>{MONTH_NAMES_RU[selectedMonth]} {selectedYear}</span>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-2 bg-white/50 hover:bg-white/80 text-slate-900 rounded-xl transition-colors shadow-sm"
                title="Следующий месяц"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full py-1 text-slate-900 font-extrabold text-base gap-2">
              <Calendar className="w-4 h-4 text-blue-700" />
              <span>За всё время</span>
            </div>
          )}

          <button
            onClick={() => setIsAllTime(!isAllTime)}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors shadow-sm ${
              isAllTime
                ? 'bg-blue-700 text-white'
                : 'bg-white/70 hover:bg-white text-slate-900'
            }`}
          >
            {isAllTime ? 'По месяцам' : 'За всё время'}
          </button>
        </div>

        {/* 1. BLOCK: ПРИБЫЛЬ & НАПРАВЛЕНИЯ (РАБОТЫ / ЗАПЧАСТИ) */}
        <div className="p-4 bg-emerald-500/25 border border-emerald-300/30 rounded-2xl shadow-lg backdrop-blur-md space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-300" />
              <span className="font-bold text-white text-base">Выручка (Прибыль)</span>
            </div>
            <span className="text-2xl font-black text-emerald-300 drop-shadow">
              {formatCurrency(periodProfit)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-300/20">
            <div className="p-2.5 bg-emerald-900/30 border border-emerald-400/20 rounded-xl text-white">
              <span className="text-emerald-200 font-semibold block text-[11px]">🔧 Работы / Услуги:</span>
              <span className="text-sm font-black text-emerald-300">{formatCurrency(periodServiceProfit)}</span>
            </div>
            <div className="p-2.5 bg-emerald-900/30 border border-emerald-400/20 rounded-xl text-white">
              <span className="text-emerald-200 font-semibold block text-[11px]">⚙️ Запчасти / Детали:</span>
              <span className="text-sm font-black text-emerald-300">{formatCurrency(periodPartsProfit)}</span>
            </div>
          </div>

          <div className="text-xs text-emerald-100 font-medium">
            Записей за {periodTitle}: {profitTransactions.length}
          </div>
        </div>

        {/* 2. BLOCK: КАССА И СПОСОБЫ ОПЛАТЫ */}
        <div className="bg-white/60 border border-white/30 rounded-2xl p-4 shadow-lg backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-900/10 pb-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-700" />
              <span className="font-extrabold text-slate-900 text-base">Касса и способы оплаты</span>
            </div>
            <span className="text-xs font-black text-emerald-800">
              Нал: {formatCurrency(periodNetCashInRegister)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-white/50 border border-white/40 rounded-xl">
              <span className="text-slate-700 font-bold block text-[11px]">💵 Наличные (приход):</span>
              <span className="text-sm font-black text-emerald-800">{formatCurrency(periodCashProfit)}</span>
              {periodCashExpenses > 0 && (
                <div className="text-[10px] text-red-700 font-semibold">Расход налом: −{formatCurrency(periodCashExpenses)}</div>
              )}
            </div>

            <div className="p-2.5 bg-white/50 border border-white/40 rounded-xl">
              <span className="text-slate-700 font-bold block text-[11px]">📲 Переводы (СБП):</span>
              <span className="text-sm font-black text-blue-800">{formatCurrency(periodSbpProfit)}</span>
            </div>

            <div className="p-2.5 bg-white/50 border border-white/40 rounded-xl">
              <span className="text-slate-700 font-bold block text-[11px]">💳 Терминал (карта):</span>
              <span className="text-sm font-black text-purple-800">{formatCurrency(periodCardProfit)}</span>
            </div>

            <div className="p-2.5 bg-white/50 border border-white/40 rounded-xl">
              <span className="text-slate-700 font-bold block text-[11px]">🏦 Безнал (счёт):</span>
              <span className="text-sm font-black text-slate-900">{formatCurrency(periodBankProfit)}</span>
            </div>
          </div>
        </div>

        {/* 3. BLOCK: ДОЛЖНИКИ */}
        <div className="bg-white/60 border border-white/30 rounded-2xl p-4 shadow-lg backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-900/10 pb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-600" />
              <span className="font-extrabold text-slate-900 text-base">Должники</span>
            </div>
            <button
              onClick={onOpenDebtorsModal}
              className="text-xs font-extrabold text-orange-700 hover:text-orange-900 underline"
            >
              Управление
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-orange-500/20 border border-orange-300/30 rounded-xl backdrop-blur-sm">
              <span className="text-slate-800 font-bold block text-[11px]">Непогашенные долги:</span>
              <span className="text-base font-black text-orange-800">
                {formatCurrency(totalUnpaidDebt)}
              </span>
            </div>

            <div className="p-3 bg-emerald-500/20 border border-emerald-300/30 rounded-xl backdrop-blur-sm">
              <span className="text-slate-800 font-bold block text-[11px]">Списано/погашено за период:</span>
              <span className="text-base font-black text-emerald-800">
                {formatCurrency(periodRepaidDebtTotal)}
              </span>
            </div>
          </div>

          {/* List of active debtors with balances */}
          {activeDebtors.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              <div className="text-xs font-bold text-slate-800">
                Список активных должников ({activeDebtors.length}):
              </div>
              {activeDebtors.map(debtor => (
                <div
                  key={debtor.name}
                  className="p-2.5 bg-white/50 border border-white/30 rounded-xl flex items-center justify-between text-xs font-medium gap-2"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate">{debtor.name}</span>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {debtor.phone && (
                        <a
                          href={`tel:${debtor.phone}`}
                          className="text-[10px] text-blue-700 font-bold hover:underline"
                        >
                          {debtor.phone}
                        </a>
                      )}
                      {debtor.dueDate && (
                        debtor.isOverdue ? (
                          <span className="text-[10px] text-red-700 font-black">
                            ⚠️ Просрочен ({Math.abs(debtor.daysDiff ?? 0)} дн.)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-medium">
                            до {new Date(debtor.dueDate).toLocaleDateString('ru-RU')}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  <span className="font-black text-orange-700 whitespace-nowrap">
                    {formatCurrency(debtor.remainingDebt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-700 text-center py-2">
              Нет активных должников
            </div>
          )}
        </div>

        {/* 4. BLOCK: ЗАРПЛАТА */}
        <div className="bg-white/60 border border-white/30 rounded-2xl p-4 shadow-lg backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-900/10 pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-700" />
              <span className="font-extrabold text-slate-900 text-base">Зарплата сотрудников</span>
            </div>
            <span className="text-xl font-black text-purple-900">
              {formatCurrency(periodSalaryTotal)}
            </span>
          </div>

          <div className="text-xs font-bold text-slate-700">
            Всего выплат за {periodTitle}: {periodPayouts.length}
          </div>

          {/* Breakdown per employee */}
          {employees.length > 0 ? (
            <div className="space-y-2 pt-1">
              {employees.map(emp => {
                const empPayouts = periodPayouts.filter(p => p.employeeId === emp.id);
                const empTotal = empPayouts.reduce((sum, p) => sum + p.amount, 0);

                return (
                  <div key={emp.id} className="p-3 bg-white/50 border border-white/30 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span className="text-slate-900">{emp.name}</span>
                      <span className="text-purple-900 font-extrabold">{formatCurrency(empTotal)}</span>
                    </div>

                    {empPayouts.length > 0 ? (
                      <div className="space-y-1 text-[11px] font-medium text-slate-800 pl-2 border-l-2 border-purple-400">
                        {empPayouts.map(p => (
                          <div key={p.id} className="flex justify-between">
                            <span>
                              {new Date(p.date).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="font-extrabold text-slate-900">
                              {formatCurrency(p.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-600 italic">Выплат в этом периоде не было</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-700 font-medium text-center py-2">Сотрудники не добавлены</div>
          )}
        </div>

        {/* 5. BLOCK: РАСХОДЫ (ТРАТЫ НА МАТЕРИАЛЫ) */}
        <div className="p-4 bg-red-500/25 border border-red-300/30 rounded-2xl shadow-lg backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-red-300" />
              <span className="font-bold text-white text-base">Расходники (материалы)</span>
            </div>
            <span className="text-2xl font-black text-red-300 drop-shadow">
              {formatCurrency(periodMaterialExpenses)}
            </span>
          </div>
          <div className="text-xs text-red-100 font-medium">
            Записей материалов за {periodTitle}: {feedItems.filter(i => i.category === 'EXPENSE').length}
          </div>
        </div>

        {/* GRAND TOTAL & NET TOTAL CASH FLOW CARD */}
        <div className="p-5 bg-slate-900/75 border border-white/20 text-white rounded-2xl shadow-xl backdrop-blur-md space-y-3">
          <div className="text-xs font-black uppercase tracking-wider text-slate-300">
            Итоговый финансовый результат ({periodTitle})
          </div>

          <div className="space-y-2 text-xs pt-2 border-t border-slate-700/60 font-medium">
            <div className="flex justify-between items-center text-slate-200">
              <span className="font-bold">Прибыль:</span>
              <span className="font-black text-emerald-400">+{formatCurrency(periodProfit)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-200">
              <span className="font-bold">Расходники (материалы):</span>
              <span className="font-black text-red-400">− {formatCurrency(periodMaterialExpenses)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-200 pt-1 border-t border-slate-700/40">
              <span className="font-bold">Общий итог (Прибыль − Расходники):</span>
              <span className="font-extrabold text-emerald-300">{formatCurrency(periodGrandTotal)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-200">
              <span className="font-bold">Зарплата (всего за период):</span>
              <span className="font-black text-purple-300">− {formatCurrency(periodSalaryTotal)}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-700/60 text-sm">
              <span className="font-black uppercase tracking-wider text-white">Чистый итог:</span>
              <span className={`text-2xl font-black ${periodNetTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(periodNetTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* 6. BLOCK: ПОДРОБНЫЙ ОТЧЁТ (FULL TRANSACTIONS LOG) */}
        <div className="bg-white/60 border border-white/30 rounded-2xl p-4 shadow-lg backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-900/10 pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-700" />
              <span className="font-extrabold text-slate-900 text-base">Подробный отчёт</span>
            </div>
            <span className="text-xs font-extrabold text-slate-800">
              {feedItems.length} операций
            </span>
          </div>

          {feedItems.length === 0 ? (
            <div className="text-center py-8 text-slate-800 font-medium text-xs">
              За {periodTitle} нет записанных операций.
            </div>
          ) : (
            <div className="space-y-2">
              {feedItems.map(item => {
                const isProfit = item.category === 'PROFIT' || item.category === 'REPAYMENT';
                const isSalary = item.category === 'SALARY';
                const isExpense = item.category === 'EXPENSE';

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
                    className="p-3 bg-white/50 border border-white/30 rounded-xl space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white ${badgeBg}`}>
                          {item.categoryLabel}
                        </span>
                        {item.paymentMethod && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-900/10 text-slate-800 text-[10px] font-bold">
                            {PAYMENT_METHODS[item.paymentMethod]?.short || 'Нал'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-slate-600">
                        {new Date(item.date).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900">{item.note || 'Без описания'}</div>
                        {item.clientInfo && (
                          <div className="text-[11px] font-medium text-slate-700">{item.clientInfo}</div>
                        )}
                      </div>
                      <div className={`font-black text-sm whitespace-nowrap ${colorClass}`}>
                        {isProfit ? '+ ' : '- '}{formatCurrency(item.amount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Export CSV Button */}
        <button
          onClick={handleExportCsv}
          className="w-full py-3.5 bg-blue-700/90 hover:bg-blue-800 text-white font-bold rounded-2xl shadow-xl transition-colors flex items-center justify-center gap-2 text-sm backdrop-blur-md border border-blue-400/30"
        >
          <Download className="w-5 h-5" />
          <span>Экспортировать отчёт в CSV ({periodTitle})</span>
        </button>
      </div>
    </div>
  );
};
