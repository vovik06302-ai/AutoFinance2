import React from 'react';
import { formatCurrency } from '../utils';

interface Props {
  grandTotal: number;
  profit: number;
  debtors: number;
  expenses: number;
  salaryTotal: number;
  netTotal: number;
}

export const TotalSummaryCard: React.FC<Props> = ({
  grandTotal,
  profit,
  debtors,
  expenses,
  salaryTotal,
  netTotal
}) => {
  return (
    <div className="p-4 rounded-2xl border border-white/30 shadow-xl backdrop-blur-md bg-white/60 text-slate-900 space-y-3">
      {/* 1. GRAND TOTAL SECTION */}
      <div>
        <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1">
          Общий итог
        </div>
        <div
          className={`text-2xl font-black tracking-tight drop-shadow-sm ${
            grandTotal >= 0 ? 'text-emerald-800' : 'text-red-800'
          }`}
        >
          {formatCurrency(grandTotal)}
        </div>
      </div>

      {/* 2. THREE SUMMARY COLUMNS */}
      <div className="pt-2 border-t border-slate-900/10 grid grid-cols-3 gap-2 text-center">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-700 font-extrabold">Прибыль</span>
          <span className="text-sm font-black text-emerald-800">{formatCurrency(profit)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-700 font-extrabold">Должники</span>
          <span className="text-sm font-black text-orange-800">{formatCurrency(debtors)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-700 font-extrabold">Расходники</span>
          <span className="text-sm font-black text-red-800">{formatCurrency(expenses)}</span>
        </div>
      </div>

      {/* 3. SALARY & NET TOTAL SECTION */}
      <div className="pt-3 border-t border-slate-900/15 flex flex-col gap-1.5 bg-white/40 p-3 rounded-xl border border-white/40 shadow-inner">
        <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
          <span>Зарплата сотрудников:</span>
          <span className="text-red-800 font-black">− {formatCurrency(salaryTotal)}</span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-900/10">
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Чистый итог:</span>
          <span
            className={`text-xl font-black tracking-tight drop-shadow-sm ${
              netTotal >= 0 ? 'text-emerald-800' : 'text-red-800'
            }`}
          >
            {formatCurrency(netTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};
