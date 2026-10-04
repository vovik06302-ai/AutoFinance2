import React, { useState, useEffect } from 'react';
import { TransactionEntity, TransactionType, PaymentMethod, RevenueCategory, EmployeeEntity } from '../types';
import { PAYMENT_METHODS, REVENUE_CATEGORIES, formatCurrency } from '../utils';
import { useAppTheme } from './ThemeContext';

interface Props {
  type: TransactionType;
  existingTransaction?: TransactionEntity | null;
  employees?: EmployeeEntity[];
  onClose: () => void;
  onSave: (
    amount: number,
    note: string,
    clientInfo: string,
    paymentMethod?: PaymentMethod,
    revenueCategory?: RevenueCategory,
    phone?: string,
    dueDate?: number,
    employeeId?: number,
    employeeName?: string
  ) => void;
}

export const AddEditModal: React.FC<Props> = ({ type, existingTransaction, employees, onClose, onSave }) => {
  const { themeConfig } = useAppTheme();
  const [amountText, setAmountText] = useState(existingTransaction?.amount.toString() || '');
  const [noteText, setNoteText] = useState(existingTransaction?.note || '');
  const [clientInfoText, setClientInfoText] = useState(existingTransaction?.clientInfo || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(existingTransaction?.paymentMethod || 'CASH');
  const [revenueCategory, setRevenueCategory] = useState<RevenueCategory>(existingTransaction?.revenueCategory || 'SERVICE');
  const [phoneText, setPhoneText] = useState(existingTransaction?.phone || '');
  const [dueDateText, setDueDateText] = useState(
    existingTransaction?.dueDate
      ? new Date(existingTransaction.dueDate).toISOString().slice(0, 10)
      : ''
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(existingTransaction?.employeeId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingTransaction) {
      setAmountText(existingTransaction.amount.toString());
      setNoteText(existingTransaction.note);
      setClientInfoText(existingTransaction.clientInfo);
      setPaymentMethod(existingTransaction.paymentMethod || 'CASH');
      setRevenueCategory(existingTransaction.revenueCategory || 'SERVICE');
      setPhoneText(existingTransaction.phone || '');
      setDueDateText(
        existingTransaction.dueDate
          ? new Date(existingTransaction.dueDate).toISOString().slice(0, 10)
          : ''
      );
      setSelectedEmployeeId(existingTransaction.employeeId);
    }
  }, [existingTransaction]);

  const title = existingTransaction
    ? 'Редактировать запись'
    : type === 'PROFIT'
    ? 'Добавить прибыль'
    : type === 'EXPENSE'
    ? 'Добавить расходники'
    : 'Добавить должника';

  const noteLabel = type === 'PROFIT' ? 'Работа / услуга' : type === 'EXPENSE' ? 'Что куплено (детали, масло, химия)' : 'Работа / за что';
  const clientLabel = type === 'PROFIT' ? 'Авто / госномер / клиент' : type === 'EXPENSE' ? 'Авто / заказ-наряд (под какую машину)' : 'Клиент, авто, номер';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amountText.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      setError('Введите корректную сумму больше 0 ₽');
      return;
    }

    const parsedDueDate = dueDateText ? new Date(dueDateText).getTime() : undefined;
    const selectedEmployee = employees?.find(emp => emp.id === selectedEmployeeId);

    onSave(
      parsed,
      noteText.trim(),
      clientInfoText.trim(),
      paymentMethod,
      type === 'PROFIT' ? revenueCategory : undefined,
      type === 'DEBTOR' ? phoneText.trim() || undefined : undefined,
      type === 'DEBTOR' ? parsedDueDate : undefined,
      type === 'PROFIT' ? selectedEmployeeId : undefined,
      type === 'PROFIT' ? selectedEmployee?.name : undefined
    );
  };

  const selectedEmployee = employees?.find(emp => emp.id === selectedEmployeeId);
  const parsedAmountForPreview = parseFloat(amountText.replace(',', '.')) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 text-slate-900 max-h-[92vh] overflow-y-auto">
        <h2 className="text-xl font-extrabold text-slate-900 mb-4">{title}</h2>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Revenue Category selector for PROFIT */}
          {type === 'PROFIT' && (
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Направление выручки
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['SERVICE', 'SPARE_PARTS'] as RevenueCategory[]).map(cat => {
                  const cfg = REVENUE_CATEGORIES[cat];
                  const isSelected = revenueCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setRevenueCategory(cat)}
                      className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-blue-700 text-white border-blue-800 shadow'
                          : 'bg-white/60 hover:bg-white text-slate-800 border-slate-300'
                      }`}
                    >
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Master / Employee selector for PROFIT */}
          {type === 'PROFIT' && employees && employees.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Мастер / Исполнитель работ
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedEmployeeId(undefined)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    selectedEmployeeId === undefined
                      ? 'bg-slate-900 text-white border-slate-950 shadow'
                      : 'bg-white/60 hover:bg-white text-slate-800 border-slate-300'
                  }`}
                >
                  Без мастера (общий)
                </button>
                {employees.map(emp => {
                  const isSel = selectedEmployeeId === emp.id;
                  const label = emp.percentageRate ? `${emp.name} (${emp.percentageRate}%)` : emp.name;
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setSelectedEmployeeId(emp.id)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all truncate text-center ${
                        isSel
                          ? 'bg-blue-700 text-white border-blue-800 shadow'
                          : 'bg-white/60 hover:bg-white text-slate-800 border-slate-300'
                      }`}
                      title={emp.name}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Instant calculation preview for master */}
              {selectedEmployee && parsedAmountForPreview > 0 && (
                <div className="mt-1.5 text-[11px] font-bold text-blue-900 bg-blue-50/70 p-2 rounded-lg border border-blue-200">
                  {selectedEmployee.percentageRate ? (
                    <span>
                      👨‍🔧 Начисление мастеру ({selectedEmployee.percentageRate}%): +{formatCurrency(Math.round(parsedAmountForPreview * (selectedEmployee.percentageRate / 100)))}
                    </span>
                  ) : (
                    <span>👨‍🔧 Мастер на окладе ({formatCurrency(selectedEmployee.salary)})</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Сумма (₽)</label>
            <input
              type="number"
              step="any"
              value={amountText}
              onChange={e => {
                setAmountText(e.target.value);
                setError(null);
              }}
              placeholder="0"
              className="w-full px-3 py-2 bg-white/85 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 text-sm shadow-sm"
              autoFocus
            />
            {error && <p className="text-xs text-red-600 font-bold mt-1">{error}</p>}
          </div>

          {/* Payment Method Selector (Касса / Способ оплаты) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Способ оплаты / Касса
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['CASH', 'SBP', 'CARD', 'BANK_ACCOUNT'] as PaymentMethod[]).map(method => {
                const info = PAYMENT_METHODS[method];
                const isSelected = paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-950 shadow'
                        : 'bg-white/60 hover:bg-white text-slate-800 border-slate-300'
                    }`}
                  >
                    <span>{info.icon}</span>
                    <span className="truncate">{info.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">{noteLabel}</label>
            <input
              type="text"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder={type === 'EXPENSE' ? 'Например: Тормозные колодки Brembo, масло 5W-40' : 'Например: Замена масла и фильтров'}
              className="w-full px-3 py-2 bg-white/85 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm shadow-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">{clientLabel}</label>
            <input
              type="text"
              value={clientInfoText}
              onChange={e => setClientInfoText(e.target.value)}
              placeholder="Например: Иван Ford Focus A123AA"
              className="w-full px-3 py-2 bg-white/85 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm shadow-sm font-medium"
            />
          </div>

          {/* Debtor Phone & Deadline */}
          {type === 'DEBTOR' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-900/10">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Телефон клиента
                </label>
                <input
                  type="tel"
                  value={phoneText}
                  onChange={e => setPhoneText(e.target.value)}
                  placeholder="+7 999 123-45-67"
                  className="w-full px-3 py-2 bg-white/85 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm shadow-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Срок возврата (Дедлайн)
                </label>
                <input
                  type="date"
                  value={dueDateText}
                  onChange={e => setDueDateText(e.target.value)}
                  className="w-full px-3 py-2 bg-white/85 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm shadow-sm font-medium"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-900/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-800 bg-white/60 hover:bg-white/80 rounded-xl font-bold text-xs transition-colors shadow-sm"
            >
              Отмена
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors shadow ${themeConfig.primaryClass}`}
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
