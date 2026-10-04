import React, { useState, useEffect } from 'react';
import { TransactionEntity, TransactionType, PaymentMethod, RevenueCategory, EmployeeEntity } from '../types';
import { PAYMENT_METHODS, REVENUE_CATEGORIES, formatCurrency } from '../utils';
import { useAppTheme } from './ThemeContext';

interface Props {
  type: TransactionType;
  existingTransaction?: TransactionEntity | null;
  employees?: EmployeeEntity[];
  suggestedEmployeeNames?: string[];
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
    employeeName?: string,
    customDate?: number
  ) => void;
}

export const AddEditModal: React.FC<Props> = ({
  type,
  existingTransaction,
  employees = [],
  suggestedEmployeeNames = [],
  onClose,
  onSave
}) => {
  const { themeConfig } = useAppTheme();
  const [amountText, setAmountText] = useState(existingTransaction?.amount.toString() || '');
  const [noteText, setNoteText] = useState(existingTransaction?.note || '');
  const [clientInfoText, setClientInfoText] = useState(existingTransaction?.clientInfo || existingTransaction?.employeeName || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(existingTransaction?.paymentMethod || 'CASH');
  const [revenueCategory, setRevenueCategory] = useState<RevenueCategory>(existingTransaction?.revenueCategory || 'SERVICE');
  const [phoneText, setPhoneText] = useState(existingTransaction?.phone || '');
  const [dueDateText, setDueDateText] = useState(
    existingTransaction?.dueDate
      ? new Date(existingTransaction.dueDate).toISOString().slice(0, 10)
      : ''
  );
  const [dateText, setDateText] = useState(
    existingTransaction?.date
      ? new Date(existingTransaction.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(existingTransaction?.employeeId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingTransaction) {
      setAmountText(existingTransaction.amount.toString());
      setNoteText(existingTransaction.note);
      setClientInfoText(existingTransaction.clientInfo || existingTransaction.employeeName || '');
      setPaymentMethod(existingTransaction.paymentMethod || 'CASH');
      setRevenueCategory(existingTransaction.revenueCategory || 'SERVICE');
      setPhoneText(existingTransaction.phone || '');
      setDueDateText(
        existingTransaction.dueDate
          ? new Date(existingTransaction.dueDate).toISOString().slice(0, 10)
          : ''
      );
      setDateText(new Date(existingTransaction.date).toISOString().slice(0, 10));
      setSelectedEmployeeId(existingTransaction.employeeId);
    }
  }, [existingTransaction]);

  const title = existingTransaction
    ? 'Редактировать запись'
    : type === 'PROFIT'
    ? 'Добавить прибыль'
    : type === 'CONSUMABLE'
    ? 'Добавить расходники'
    : type === 'SALARY'
    ? 'Выплата зарплаты'
    : type === 'EXPENSE'
    ? 'Добавить трату (прочие)'
    : 'Добавить должника';

  const noteLabel = type === 'PROFIT'
    ? 'Работа / услуга'
    : type === 'CONSUMABLE'
    ? 'Название (масло, фильтры, перчатки и т. д.)'
    : type === 'SALARY'
    ? 'Комментарий (аванс, за неделю, премия...)'
    : type === 'EXPENSE'
    ? 'Описание траты (аренда, инструмент, реклама...)'
    : 'Работа / за что';

  const clientLabel = type === 'PROFIT'
    ? 'Авто / госномер / клиент'
    : type === 'SALARY'
    ? 'Сотрудник (имя)'
    : type === 'CONSUMABLE'
    ? 'Авто / заказ-наряд (опционально)'
    : type === 'EXPENSE'
    ? 'Примечание / поставщик (опционально)'
    : 'Клиент, авто, номер';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amountText.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      setError('Введите корректную сумму больше 0 ₽');
      return;
    }

    if (type === 'SALARY' && !clientInfoText.trim()) {
      setError('Укажите имя сотрудника');
      return;
    }

    if (type === 'CONSUMABLE' && !noteText.trim()) {
      setError('Укажите название расходника (масло, фильтры, перчатки и т. д.)');
      return;
    }

    const parsedDueDate = dueDateText ? new Date(dueDateText).getTime() : undefined;
    const parsedDate = dateText ? new Date(dateText).getTime() : Date.now();
    const selectedEmployee = employees?.find(emp => emp.id === selectedEmployeeId || emp.name.toLowerCase() === clientInfoText.trim().toLowerCase());

    onSave(
      parsed,
      noteText.trim() || (type === 'SALARY' ? 'Зарплата' : type === 'CONSUMABLE' ? 'Расходники' : ''),
      clientInfoText.trim(),
      paymentMethod,
      type === 'PROFIT' ? revenueCategory : undefined,
      type === 'DEBTOR' ? phoneText.trim() || undefined : undefined,
      type === 'DEBTOR' ? parsedDueDate : undefined,
      type === 'PROFIT' ? selectedEmployeeId : (type === 'SALARY' ? selectedEmployee?.id : undefined),
      type === 'PROFIT' ? selectedEmployee?.name : (type === 'SALARY' ? clientInfoText.trim() : undefined),
      parsedDate
    );
  };

  const selectedEmployee = employees?.find(emp => emp.id === selectedEmployeeId);
  const parsedAmountForPreview = parseFloat(amountText.replace(',', '.')) || 0;

  // List of distinct known employee names (from props + employees list)
  const knownEmployeeNames = Array.from(
    new Set([...suggestedEmployeeNames, ...employees.map(e => e.name)].map(n => n.trim()).filter(Boolean))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="bg-white/80 backdrop-blur-lg border border-white/40 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 text-slate-900 max-h-[92vh] overflow-y-auto">
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

          {/* Employee name input & suggestions for SALARY */}
          {type === 'SALARY' && (
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                {clientLabel}
              </label>
              <input
                type="text"
                value={clientInfoText}
                onChange={e => {
                  setClientInfoText(e.target.value);
                  setError(null);
                }}
                placeholder="Имя мастера / сотрудника (например, Иван, Алексей)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 text-sm shadow-sm font-bold"
                autoFocus
              />
              {knownEmployeeNames.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-slate-600 font-semibold">Выбрать из списка:</span>
                  {knownEmployeeNames.map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setClientInfoText(name);
                        setError(null);
                      }}
                      className={`text-xs py-0.5 px-2 rounded-lg border transition-colors font-bold ${
                        clientInfoText === name
                          ? 'bg-purple-700 text-white border-purple-800 shadow'
                          : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONSUMABLE: Name first */}
          {type === 'CONSUMABLE' && (
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">{noteLabel}</label>
              <input
                type="text"
                value={noteText}
                onChange={e => {
                  setNoteText(e.target.value);
                  setError(null);
                }}
                placeholder="Масло моторное, масляный фильтр, перчатки..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm shadow-sm font-medium"
                autoFocus
              />
              <div className="mt-1.5 flex flex-wrap gap-1">
                {['Масло 5W-40', 'Масляный фильтр', 'Воздушный фильтр', 'Перчатки', 'Очиститель тормозов', 'WD-40', 'Антифриз'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setNoteText(prev => prev ? `${prev}, ${tag}` : tag);
                      setError(null);
                    }}
                    className="text-[11px] py-0.5 px-2 bg-white/70 hover:bg-white text-slate-800 border border-slate-300 rounded-lg font-medium"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              {type === 'SALARY' ? 'Сумма выплаты (₽)' : 'Сумма (₽)'}
            </label>
            <input
              type="number"
              step="any"
              value={amountText}
              onChange={e => {
                setAmountText(e.target.value);
                setError(null);
              }}
              placeholder="0"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 text-base shadow-sm"
              autoFocus={type !== 'SALARY' && type !== 'CONSUMABLE'}
            />
            {error && <p className="text-xs text-red-600 font-bold mt-1">{error}</p>}
          </div>

          {/* Quick note chips for SALARY */}
          {type === 'SALARY' && (
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">{noteLabel}</label>
              <input
                type="text"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Аванс, за неделю, премия, под расчет..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 text-sm shadow-sm font-medium"
              />
              <div className="mt-1.5 flex flex-wrap gap-1">
                {['Аванс', 'За неделю', 'Премия', 'Под расчет', 'Оклад'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNoteText(tag)}
                    className={`text-[11px] py-0.5 px-2 rounded-lg font-bold border transition-colors ${
                      noteText === tag ? 'bg-purple-700 text-white border-purple-800' : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Normal note input for other types */}
          {type !== 'CONSUMABLE' && type !== 'SALARY' && (
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">{noteLabel}</label>
              <input
                type="text"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder={type === 'EXPENSE' ? 'Например: аренда бокса, коммуналка, инструмент' : 'Например: Замена масла и фильтров'}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm shadow-sm font-medium"
              />
            </div>
          )}

          {/* Client Info Field for non-salary types */}
          {type !== 'SALARY' && (
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">{clientLabel}</label>
              <input
                type="text"
                value={clientInfoText}
                onChange={e => setClientInfoText(e.target.value)}
                placeholder={type === 'CONSUMABLE' ? 'Например: под Toyota Camry A777AA' : 'Например: Иван Ford Focus A123AA'}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm shadow-sm font-medium"
              />
            </div>
          )}

          {/* Payment Method Selector */}
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
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                    }`}
                  >
                    <span>{info.icon}</span>
                    <span className="truncate">{info.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Дата операции
            </label>
            <input
              type="date"
              value={dateText}
              onChange={e => setDateText(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm shadow-sm font-medium"
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
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm shadow-sm font-medium"
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
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm shadow-sm font-medium"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-900/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-800 bg-white hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors shadow-sm border border-slate-200"
            >
              Отмена
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors shadow ${
                type === 'SALARY' ? 'bg-purple-700 hover:bg-purple-800 text-white' :
                type === 'CONSUMABLE' ? 'bg-red-700 hover:bg-red-800 text-white' :
                themeConfig.primaryClass
              }`}
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
