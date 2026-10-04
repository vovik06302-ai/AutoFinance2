import React, { useState } from 'react';
import { TransactionEntity, EmployeeEntity, SalaryPayoutEntity, DebtorSummaryGroup } from '../types';
import { formatCurrency, MONTH_NAMES_RU } from '../utils';
import { exportAndShareCsv } from '../csvExporter';
import { ArrowLeft, Download, ChevronLeft, ChevronRight, Calendar, TrendingUp, CreditCard, Users, ArrowDownRight, FileText, CheckCircle2 } from 'lucide-react';

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

  // Filter functions for selected period
  const isInPeriod = (timestamp: number) => {
    if (isAllTime) return true;
    const d = new Date(timestamp);
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
  };

  // Filtered transactions for the chosen month/period
  const periodTransactions = transactions.filter(t => isInPeriod(t.date));
  const periodPayouts = payouts.filter(p => isInPeriod(p.date));

  // 1. Profit for period (includes PROFIT transactions, including debt write-offs/repayments)
  const profitTransactions = periodTransactions.filter(t => t.type === 'PROFIT');
  const periodProfit = profitTransactions.reduce((sum, t) => sum + t.amount, 0);

  // 2. Debtors statistics
  // Unpaid active debt total across system
  const activeDebtors = debtorSummaries.filter(d => d.remainingDebt > 0);
  const totalUnpaidDebt = activeDebtors.reduce((sum, d) => sum + d.remainingDebt, 0);

  // Debt repayments in selected period
  const periodDebtRepayments = profitTransactions.filter(
    t => t.note.toLowerCase().includes('погашение долга') || t.note.toLowerCase().includes('списание долга')
  );
  const periodRepaidDebtTotal = periodDebtRepayments.reduce((sum, t) => sum + t.amount, 0);

  // 3. Salary total in selected period
  const periodSalaryTotal = periodPayouts.reduce((sum, p) => sum + p.amount, 0);

  // 4. Expenses total in selected period
  const periodExpenses = periodTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);

  // Grand Total Net Cash Flow for Period = Profit - Expenses
  const periodNetTotal = periodProfit - periodExpenses;

  // Period display title
  const periodTitle = isAllTime
    ? 'За всё время'
    : `${MONTH_NAMES_RU[selectedMonth]} ${selectedYear} г.`;

  const handleExportCsv = () => {
    exportAndShareCsv(periodTransactions, periodPayouts, periodTitle);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      {/* Top Bar */}
      <div className="bg-slate-800 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateBack}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
              title="Назад"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">Подробный отчёт</h1>
          </div>

          <button
            onClick={handleExportCsv}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Экспорт в CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Month / Period Selector Bar */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex items-center justify-between gap-2">
          {!isAllTime ? (
            <div className="flex items-center justify-between w-full">
              <button
                onClick={handlePrevMonth}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                title="Предыдущий месяц"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 font-black text-slate-900 text-base">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>{MONTH_NAMES_RU[selectedMonth]} {selectedYear}</span>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                title="Следующий месяц"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full py-1 text-slate-900 font-extrabold text-base gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>За всё время</span>
            </div>
          )}

          <button
            onClick={() => setIsAllTime(!isAllTime)}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors shadow-sm ${
              isAllTime
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isAllTime ? 'По месяцам' : 'За всё время'}
          </button>
        </div>

        {/* 1. BLOCK: ПРИБЫЛЬ */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-emerald-950 text-base">Прибыль</span>
            </div>
            <span className="text-2xl font-black text-emerald-700">
              {formatCurrency(periodProfit)}
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Записей за {periodTitle}: {profitTransactions.length}
          </div>
        </div>

        {/* 2. BLOCK: ДОЛЖНИКИ */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-600" />
              <span className="font-bold text-slate-900 text-base">Должники</span>
            </div>
            <button
              onClick={onOpenDebtorsModal}
              className="text-xs font-bold text-orange-600 hover:text-orange-800 underline"
            >
              Управление
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <span className="text-slate-500 block text-[11px]">Непогашенные долги:</span>
              <span className="text-base font-black text-orange-600">
                {formatCurrency(totalUnpaidDebt)}
              </span>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-slate-500 block text-[11px]">Списано/погашено за период:</span>
              <span className="text-base font-black text-emerald-700">
                {formatCurrency(periodRepaidDebtTotal)}
              </span>
            </div>
          </div>

          {/* List of active debtors with balances */}
          {activeDebtors.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              <div className="text-xs font-bold text-slate-600">
                Список активных должников ({activeDebtors.length}):
              </div>
              {activeDebtors.map(debtor => (
                <div
                  key={debtor.name}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-800 truncate pr-2">{debtor.name}</span>
                  <span className="font-black text-orange-600 whitespace-nowrap">
                    {formatCurrency(debtor.remainingDebt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-2">
              Нет активных должников
            </div>
          )}
        </div>

        {/* 3. BLOCK: ЗАРПЛАТА */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-red-600" />
              <span className="font-bold text-slate-900 text-base">Зарплата</span>
            </div>
            <span className="text-xl font-black text-red-700">
              {formatCurrency(periodSalaryTotal)}
            </span>
          </div>

          <div className="text-xs text-slate-500">
            Всего выплат за {periodTitle}: {periodPayouts.length}
          </div>

          {/* Breakdown per employee */}
          {employees.length > 0 ? (
            <div className="space-y-2 pt-1">
              {employees.map(emp => {
                const empPayouts = periodPayouts.filter(p => p.employeeId === emp.id);
                const empTotal = empPayouts.reduce((sum, p) => sum + p.amount, 0);

                return (
                  <div key={emp.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span className="text-slate-900">{emp.name}</span>
                      <span className="text-red-700">{formatCurrency(empTotal)}</span>
                    </div>

                    {empPayouts.length > 0 ? (
                      <div className="space-y-1 text-[11px] text-slate-600 pl-2 border-l-2 border-red-200">
                        {empPayouts.map(p => (
                          <div key={p.id} className="flex justify-between">
                            <span>
                              {new Date(p.date).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(p.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">Выплат в этом периоде не было</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-2">Сотрудники не добавлены</div>
          )}
        </div>

        {/* 4. BLOCK: РАСХОДЫ (ТРАТЫ) */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-red-600" />
              <span className="font-bold text-red-950 text-base">Расходы (траты)</span>
            </div>
            <span className="text-2xl font-black text-red-700">
              {formatCurrency(periodExpenses)}
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Записей расходов за {periodTitle}: {periodTransactions.filter(t => t.type === 'EXPENSE').length}
          </div>
        </div>

        {/* GRAND TOTAL CASH FLOW CARD */}
        <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-md space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            ЧИСТЫЙ ИТОГ ЗА ПЕРИОД (Прибыль − Расходы)
          </div>
          <div className={`text-3xl font-black ${periodNetTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(periodNetTotal)}
          </div>
        </div>

        {/* 5. BLOCK: ПОДРОБНЫЙ ОТЧЁТ (FULL TRANSACTIONS LOG) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-slate-900 text-base">Подробный отчёт</span>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {periodTransactions.length} операций
            </span>
          </div>

          {periodTransactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              За {periodTitle} нет записанных операций.
            </div>
          ) : (
            <div className="space-y-2">
              {periodTransactions
                .sort((a, b) => b.date - a.date)
                .map(item => {
                  const isProfit = item.type === 'PROFIT';
                  const isExpense = item.type === 'EXPENSE';
                  const isDebtor = item.type === 'DEBTOR';

                  const isRepayment = isProfit && item.note.toLowerCase().includes('погашение долга');

                  const colorClass = isRepayment
                    ? 'text-emerald-700'
                    : isProfit
                    ? 'text-emerald-700'
                    : isExpense
                    ? 'text-red-700'
                    : 'text-orange-600';

                  const badgeBg = isRepayment
                    ? 'bg-emerald-600'
                    : isProfit
                    ? 'bg-emerald-500'
                    : isExpense
                    ? 'bg-red-500'
                    : 'bg-orange-500';

                  const typeTag = isRepayment
                    ? 'Погашение долга'
                    : isProfit
                    ? 'Прибыль'
                    : isExpense
                    ? 'Расходники'
                    : 'Долг';

                  return (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white ${badgeBg}`}>
                          {typeTag}
                        </span>
                        <span className="text-[10px] text-slate-400">
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
                            <div className="text-[11px] text-slate-500">{item.clientInfo}</div>
                          )}
                        </div>
                        <div className={`font-black text-sm whitespace-nowrap ${colorClass}`}>
                          {isExpense ? '- ' : '+ '}{formatCurrency(item.amount)}
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
          className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-2xl shadow transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Download className="w-5 h-5" />
          <span>Экспортировать отчёт в CSV ({periodTitle})</span>
        </button>
      </div>
    </div>
  );
};
