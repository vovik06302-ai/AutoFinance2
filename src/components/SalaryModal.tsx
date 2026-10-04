import React, { useState } from 'react';
import { EmployeeEntity, SalaryPayoutEntity, TransactionEntity, SalaryType } from '../types';
import { formatCurrency, calculateEmployeeEarnings } from '../utils';
import { BadgeCheck, Plus, Edit2, Trash2, ChevronDown, ChevronUp, X, Phone, Wrench, CheckCircle, Wallet, Percent } from 'lucide-react';

interface Props {
  employees: EmployeeEntity[];
  payouts: SalaryPayoutEntity[];
  transactions: TransactionEntity[];
  onClose: () => void;
  onAddEmployee: (employeeData: Omit<EmployeeEntity, 'id'>, onError: (msg: string) => void) => void;
  onUpdateEmployee: (employee: EmployeeEntity, onError: (msg: string) => void) => void;
  onDeleteEmployee: (employee: EmployeeEntity) => void;
  onAddSalaryPayout: (employee: EmployeeEntity, amount: number, onError: (msg: string) => void) => void;
}

export const SalaryModal: React.FC<Props> = ({
  employees,
  payouts,
  transactions,
  onClose,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onAddSalaryPayout
}) => {
  const [showAddEditSubModal, setShowAddEditSubModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeEntity | null>(null);

  // Compute total aggregates across all employees
  const earningsList = employees.map(emp =>
    calculateEmployeeEarnings(emp, transactions, payouts)
  );

  const totalEarnedAll = earningsList.reduce((sum, item) => sum + item.totalEarned, 0);
  const totalPaidAll = payouts.reduce((sum, p) => sum + p.amount, 0);
  const totalBalanceDueAll = earningsList.reduce((sum, item) => sum + item.balanceDue, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-900/10 mb-4">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-6 h-6 text-purple-700" />
            <h2 className="text-xl font-extrabold text-slate-900">Зарплатный модуль мастеров</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Salary Summary Across All Employees */}
        {employees.length > 0 && (
          <div className="bg-white/60 border border-white/30 rounded-xl p-3.5 mb-4 space-y-1.5 shadow-sm backdrop-blur-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Общая сводка по зарплате мастеров
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-700 font-medium block">Начислено</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {formatCurrency(totalEarnedAll)}
                </span>
              </div>
              <div>
                <span className="text-slate-700 font-medium block">Выдано всего</span>
                <span className="font-extrabold text-emerald-800 text-sm">
                  {formatCurrency(totalPaidAll)}
                </span>
              </div>
              <div>
                <span className="text-slate-700 font-medium block">Остаток к выплате</span>
                <span className="font-extrabold text-purple-900 text-sm">
                  {formatCurrency(totalBalanceDueAll)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => {
            setEditingEmployee(null);
            setShowAddEditSubModal(true);
          }}
          className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow mb-4 transition-colors text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить мастера (сдельная / оклад)</span>
        </button>

        {/* Employee List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
          {employees.length === 0 ? (
            <div className="text-center py-10 text-slate-700 font-bold text-xs">
              Список мастеров пуст.<br />
              Нажмите «Добавить мастера», чтобы настроить сдельную оплату или оклад.
            </div>
          ) : (
            employees.map(employee => {
              const summary = earningsList.find(s => s.employee.id === employee.id)!;
              const empPayouts = payouts.filter(p => p.employeeId === employee.id);
              return (
                <EmployeeCard
                  key={employee.id}
                  summary={summary}
                  payouts={empPayouts}
                  onEdit={() => {
                    setEditingEmployee(employee);
                    setShowAddEditSubModal(true);
                  }}
                  onDelete={() => onDeleteEmployee(employee)}
                  onAddPayout={(amount, onError) => onAddSalaryPayout(employee, amount, onError)}
                />
              );
            })
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-900/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-800 bg-white/60 hover:bg-white/80 rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Закрыть
          </button>
        </div>
      </div>

      {/* Sub-modal for Add/Edit Employee */}
      {showAddEditSubModal && (
        <AddEditEmployeeModal
          existingEmployee={editingEmployee}
          onClose={() => setShowAddEditSubModal(false)}
          onSave={(data, onError) => {
            if (editingEmployee) {
              onUpdateEmployee({ ...editingEmployee, ...data }, onError);
            } else {
              onAddEmployee(data, onError);
            }
            setShowAddEditSubModal(false);
          }}
        />
      )}
    </div>
  );
};

interface EmployeeCardProps {
  summary: ReturnType<typeof calculateEmployeeEarnings>;
  payouts: SalaryPayoutEntity[];
  onEdit: () => void;
  onDelete: () => void;
  onAddPayout: (amount: number, onError: (msg: string) => void) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  summary,
  payouts,
  onEdit,
  onDelete,
  onAddPayout
}) => {
  const { employee, assignedTransactions, pieceRateEarned, baseSalary, totalEarned, totalPaid, balanceDue } = summary;
  const [payoutInput, setPayoutInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showOrders, setShowOrders] = useState(false);

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payoutInput.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Введите сумму больше 0 ₽');
      return;
    }
    onAddPayout(amount, (err) => setErrorMsg(err));
    setPayoutInput('');
  };

  const handleQuickPayFull = () => {
    if (balanceDue <= 0) return;
    onAddPayout(balanceDue, (err) => setErrorMsg(err));
  };

  const salaryTypeBadge = employee.salaryType === 'PERCENTAGE'
    ? `📈 Сдельная (${employee.percentageRate || 40}%)`
    : employee.salaryType === 'HYBRID'
    ? `⚡ Оклад + ${employee.percentageRate || 40}%`
    : `💼 Оклад (${formatCurrency(employee.baseSalary || employee.salary)})`;

  return (
    <div className="p-4 bg-white/60 border border-white/30 rounded-xl space-y-3 shadow-sm backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-slate-900 text-base">{employee.name}</span>
            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-bold">
              {salaryTypeBadge}
            </span>
          </div>

          <div className="text-[11px] text-slate-600 font-medium mt-0.5 flex items-center gap-2">
            {employee.role && <span>Должность: {employee.role}</span>}
            {employee.phone && (
              <a href={`tel:${employee.phone}`} className="text-blue-700 font-bold hover:underline flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{employee.phone}</span>
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white/50 transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-slate-500 hover:text-red-700 rounded-lg hover:bg-red-50/50 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Financial Details */}
      <div className="grid grid-cols-2 gap-2 text-xs bg-white/50 p-2.5 rounded-xl border border-white/40 font-medium">
        <div>
          <span className="text-slate-600 block text-[11px]">Сдельно от работ:</span>
          <span className="font-extrabold text-emerald-800 text-sm">+{formatCurrency(pieceRateEarned)}</span>
          <span className="text-[10px] text-slate-500 block">({assignedTransactions.length} нарядов)</span>
        </div>

        {baseSalary > 0 && (
          <div>
            <span className="text-slate-600 block text-[11px]">Базовый оклад:</span>
            <span className="font-extrabold text-slate-800 text-sm">+{formatCurrency(baseSalary)}</span>
          </div>
        )}

        <div>
          <span className="text-slate-600 block text-[11px]">Выдано авансов:</span>
          <span className="font-extrabold text-purple-900 text-sm">−{formatCurrency(totalPaid)}</span>
        </div>

        <div>
          <span className="text-slate-700 font-bold block text-[11px]">Остаток к выдаче:</span>
          <span className={`text-base font-black ${balanceDue > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {formatCurrency(balanceDue)}
          </span>
        </div>
      </div>

      {/* Quick Payout Button */}
      {balanceDue > 0 && (
        <button
          type="button"
          onClick={handleQuickPayFull}
          className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center justify-center gap-1.5"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Выдать весь остаток ({formatCurrency(balanceDue)})</span>
        </button>
      )}

      {/* Manual Payout Form */}
      <form onSubmit={handlePayoutSubmit} className="flex gap-2 items-center">
        <input
          type="number"
          step="any"
          value={payoutInput}
          onChange={e => {
            setPayoutInput(e.target.value);
            setErrorMsg(null);
          }}
          placeholder="Сумма частичной выплаты"
          className="flex-1 px-3 py-1.5 text-xs bg-white/85 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 shadow-sm"
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap shadow"
        >
          Выдать
        </button>
      </form>
      {errorMsg && <p className="text-xs text-red-600 font-bold">{errorMsg}</p>}

      {/* Expandable Work Orders by this Master */}
      {assignedTransactions.length > 0 && (
        <div className="border-t border-slate-900/10 pt-2 text-xs">
          <div className="flex items-center justify-between text-slate-800">
            <span className="font-bold flex items-center gap-1">
              <Wrench className="w-3 h-3 text-blue-700" />
              <span>Выполненные работы ({assignedTransactions.length}):</span>
            </span>
            <button
              onClick={() => setShowOrders(!showOrders)}
              className="text-blue-700 font-bold hover:underline flex items-center gap-0.5"
            >
              <span>{showOrders ? 'Скрыть' : 'Показать'}</span>
              {showOrders ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showOrders && (
            <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {assignedTransactions.map(tx => {
                const earnedForThis = Math.round(tx.amount * ((employee.percentageRate || 40) / 100));
                return (
                  <div key={tx.id} className="p-2 bg-white/70 rounded-lg border border-slate-200 flex justify-between items-center text-[11px]">
                    <div>
                      <div className="font-bold text-slate-900">{tx.note}</div>
                      <div className="text-[10px] text-slate-600">
                        {tx.clientInfo && `${tx.clientInfo} • `}
                        {new Date(tx.date).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-emerald-800">+{formatCurrency(earnedForThis)}</div>
                      <div className="text-[9px] text-slate-500">из {formatCurrency(tx.amount)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Payouts history */}
      {payouts.length > 0 && (
        <div className="border-t border-slate-900/10 pt-2 text-xs">
          <div className="flex items-center justify-between text-slate-800">
            <span className="font-bold">История выплат зарплаты ({payouts.length}):</span>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-blue-700 font-bold hover:underline flex items-center gap-0.5"
            >
              <span>{showHistory ? 'Скрыть' : 'Показать'}</span>
              {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showHistory && (
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto pr-1">
              {payouts.map(p => (
                <div key={p.id} className="flex items-center justify-between text-xs p-1.5 bg-white/70 rounded-lg border border-slate-200">
                  <span className="text-slate-700 font-medium">
                    {new Date(p.date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="font-black text-purple-900">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface AddEditEmployeeModalProps {
  existingEmployee: EmployeeEntity | null;
  onClose: () => void;
  onSave: (data: Omit<EmployeeEntity, 'id'>, onError: (msg: string) => void) => void;
}

const AddEditEmployeeModal: React.FC<AddEditEmployeeModalProps> = ({
  existingEmployee,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(existingEmployee?.name || '');
  const [role, setRole] = useState(existingEmployee?.role || '');
  const [phone, setPhone] = useState(existingEmployee?.phone || '');
  const [salaryType, setSalaryType] = useState<SalaryType>(existingEmployee?.salaryType || 'PERCENTAGE');
  const [percentageRate, setPercentageRate] = useState(existingEmployee?.percentageRate?.toString() || '40');
  const [baseSalary, setBaseSalary] = useState(existingEmployee?.baseSalary?.toString() || (existingEmployee?.salary?.toString() || '0'));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Имя мастера не может быть пустым');
      return;
    }

    const parsedRate = parseFloat(percentageRate.replace(',', '.'));
    const parsedBase = parseFloat(baseSalary.replace(',', '.'));

    if (salaryType === 'PERCENTAGE' && (isNaN(parsedRate) || parsedRate <= 0 || parsedRate > 100)) {
      setError('Укажите процент от работ от 1% до 100%');
      return;
    }

    if (salaryType === 'FIXED' && (isNaN(parsedBase) || parsedBase <= 0)) {
      setError('Укажите корректный оклад больше 0 ₽');
      return;
    }

    if (salaryType === 'HYBRID' && (isNaN(parsedRate) || isNaN(parsedBase))) {
      setError('Укажите корректный оклад и процент');
      return;
    }

    onSave(
      {
        name: name.trim(),
        role: role.trim() || undefined,
        phone: phone.trim() || undefined,
        salaryType,
        percentageRate: isNaN(parsedRate) ? 40 : parsedRate,
        baseSalary: isNaN(parsedBase) ? 0 : parsedBase,
        salary: isNaN(parsedBase) ? 50000 : parsedBase
      },
      (err) => setError(err)
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 text-slate-900 max-h-[92vh] overflow-y-auto">
        <h3 className="text-lg font-extrabold text-slate-900 mb-4">
          {existingEmployee ? 'Редактировать мастера' : 'Добавить мастера'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Имя мастера
            </label>
            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="Алексей"
              className="w-full px-3 py-2 bg-white/85 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold text-sm shadow-sm"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Должность
              </label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="Механик"
                className="w-full px-3 py-2 bg-white/85 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-xs shadow-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Телефон
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+7..."
                className="w-full px-3 py-2 bg-white/85 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-xs shadow-sm font-medium"
              />
            </div>
          </div>

          {/* Salary Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Схема оплаты труда
            </label>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setSalaryType('PERCENTAGE')}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all text-center ${
                  salaryType === 'PERCENTAGE'
                    ? 'bg-purple-700 text-white border-purple-800 shadow'
                    : 'bg-white/60 hover:bg-white text-slate-800 border-slate-300'
                }`}
              >
                📈 Сдельная (%)
              </button>
              <button
                type="button"
                onClick={() => setSalaryType('FIXED')}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all text-center ${
                  salaryType === 'FIXED'
                    ? 'bg-purple-700 text-white border-purple-800 shadow'
                    : 'bg-white/60 hover:bg-white text-slate-800 border-slate-300'
                }`}
              >
                💼 Оклад (фикс)
              </button>
              <button
                type="button"
                onClick={() => setSalaryType('HYBRID')}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all text-center ${
                  salaryType === 'HYBRID'
                    ? 'bg-purple-700 text-white border-purple-800 shadow'
                    : 'bg-white/60 hover:bg-white text-slate-800 border-slate-300'
                }`}
              >
                ⚡ Оклад + %
              </button>
            </div>
          </div>

          {/* Conditional inputs */}
          {(salaryType === 'PERCENTAGE' || salaryType === 'HYBRID') && (
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Процент от работ (%)
              </label>
              <input
                type="number"
                step="any"
                value={percentageRate}
                onChange={e => {
                  setPercentageRate(e.target.value);
                  setError(null);
                }}
                placeholder="40"
                className="w-full px-3 py-2 bg-white/85 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 font-bold text-sm shadow-sm"
              />
              <span className="text-[10px] text-slate-600 font-medium">
                Мастер автоматически получает этот % от выполненных заказ-нарядов.
              </span>
            </div>
          )}

          {(salaryType === 'FIXED' || salaryType === 'HYBRID') && (
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Базовый оклад в месяц (₽)
              </label>
              <input
                type="number"
                step="any"
                value={baseSalary}
                onChange={e => {
                  setBaseSalary(e.target.value);
                  setError(null);
                }}
                placeholder="50000"
                className="w-full px-3 py-2 bg-white/85 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 font-bold text-sm shadow-sm"
              />
            </div>
          )}

          {error && <p className="text-xs text-red-600 font-bold">{error}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-900/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-800 bg-white/60 hover:bg-white/80 rounded-xl font-bold text-xs shadow-sm"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs shadow transition-colors"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
