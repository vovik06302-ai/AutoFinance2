import React, { useState } from 'react';
import { formatCurrency } from '../utils';
import { Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppTheme } from './ThemeContext';

interface Props {
  grandTotal: number;
  profit: number;
  serviceProfit?: number;
  partsProfit?: number;
  debtors: number;
  expenses: number;
  salaryTotal: number;
  netTotal: number;
  cashProfit?: number;
  sbpProfit?: number;
  cardProfit?: number;
  bankProfit?: number;
  netCashInRegister?: number;
}

export const TotalSummaryCard: React.FC<Props> = ({
  grandTotal,
  profit,
  serviceProfit = 0,
  partsProfit = 0,
  debtors,
  expenses,
  salaryTotal,
  netTotal,
  cashProfit = 0,
  sbpProfit = 0,
  cardProfit = 0,
  bankProfit = 0,
  netCashInRegister = 0
}) => {
  const [showCashDetails, setShowCashDetails] = useState(false);
  const { cardStyle, isLightMode } = useAppTheme();

  const containerClass = cardStyle === 'SOLID'
    ? isLightMode
      ? 'bg-white border-2 border-slate-300 shadow-lg text-slate-900'
      : 'bg-slate-900 border-2 border-slate-700 shadow-xl text-slate-100'
    : isLightMode
    ? 'bg-white/85 border border-slate-200/80 shadow-md backdrop-blur-md text-slate-900'
    : 'bg-white/60 border border-white/30 shadow-xl backdrop-blur-md text-slate-900';

  return (
    <div className={`p-4 rounded-2xl transition-all space-y-3 ${containerClass}`}>
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
          {(serviceProfit > 0 || partsProfit > 0) && (
            <span className="text-[9px] text-slate-600 font-semibold mt-0.5">
              🔧{formatCurrency(serviceProfit)} | ⚙️{formatCurrency(partsProfit)}
            </span>
          )}
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

      {/* 3. CASH DESK & PAYMENT BREAKDOWN TOGGLE */}
      <div className="pt-2 border-t border-slate-900/10">
        <button
          type="button"
          onClick={() => setShowCashDetails(!showCashDetails)}
          className="w-full flex items-center justify-between py-1 px-2 rounded-lg bg-white/40 hover:bg-white/60 text-xs font-bold text-slate-800 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-blue-700" />
            <span>Касса: нал в кассе <span className="font-extrabold text-emerald-800">{formatCurrency(netCashInRegister)}</span></span>
          </div>
          {showCashDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showCashDetails && (
          <div className="mt-2 p-2.5 bg-white/50 border border-white/40 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-medium">💵 Наличные (приход):</span>
              <span className="font-bold text-slate-900">{formatCurrency(cashProfit)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-medium">📲 СБП / Переводы:</span>
              <span className="font-bold text-slate-900">{formatCurrency(sbpProfit)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-medium">💳 Терминал (карты):</span>
              <span className="font-bold text-slate-900">{formatCurrency(cardProfit)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-medium">🏦 Безнал (по счёту):</span>
              <span className="font-bold text-slate-900">{formatCurrency(bankProfit)}</span>
            </div>
            <div className="pt-1.5 border-t border-slate-900/10 flex justify-between items-center font-extrabold text-slate-900">
              <span>Чистый остаток налички:</span>
              <span className={netCashInRegister >= 0 ? 'text-emerald-800' : 'text-red-800'}>
                {formatCurrency(netCashInRegister)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. SALARY & NET TOTAL SECTION */}
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
