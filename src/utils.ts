import { TransactionEntity, SalaryPayoutEntity, PaymentMethod, RevenueCategory, EmployeeEntity } from './types';

export function formatCurrency(val: number): string {
  const formatted = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0
  }).format(Math.round(val || 0));
  return `${formatted} ₽`;
}

export const PAYMENT_METHODS: Record<PaymentMethod, { label: string; short: string; icon: string }> = {
  CASH: { label: 'Наличные', short: 'Нал', icon: '💵' },
  SBP: { label: 'Перевод (СБП)', short: 'СБП', icon: '📲' },
  CARD: { label: 'Терминал (карта)', short: 'Карта', icon: '💳' },
  BANK_ACCOUNT: { label: 'Безнал (счёт)', short: 'Счёт', icon: '🏦' }
};

export const REVENUE_CATEGORIES: Record<RevenueCategory, { label: string; icon: string }> = {
  SERVICE: { label: 'Работы / Услуги', icon: '🔧' },
  SPARE_PARTS: { label: 'Запчасти / Детали', icon: '⚙️' }
};

export const MONTH_NAMES_RU = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь'
];

export function isLegacySalaryTransaction(t: TransactionEntity): boolean {
  if (t.type !== 'EXPENSE') return false;
  const client = (t.clientInfo || '').toLowerCase();
  const note = (t.note || '').toLowerCase();
  return client === 'зарплата' || note.startsWith('выплата зарплаты') || note.includes('зарплата');
}

export interface UnifiedFeedItem {
  id: string;
  originalId: number;
  date: number;
  category: 'PROFIT' | 'REPAYMENT' | 'DEBTOR' | 'EXPENSE' | 'CONSUMABLE' | 'SALARY';
  categoryLabel: string;
  amount: number;
  note: string;
  clientInfo: string;
  isPayoutObj?: boolean;
  originalTx?: TransactionEntity;
  paymentMethod?: PaymentMethod;
  revenueCategory?: RevenueCategory;
  phone?: string;
  dueDate?: number;
  isOverdue?: boolean;
  employeeId?: number;
  employeeName?: string;
}

export function getUnifiedFeed(
  transactions: TransactionEntity[],
  payouts: SalaryPayoutEntity[],
  filterFn?: (timestamp: number) => boolean
): UnifiedFeedItem[] {
  const isInPeriod = filterFn || (() => true);
  const items: UnifiedFeedItem[] = [];

  const filteredTx = transactions.filter(t => isInPeriod(t.date));
  const filteredPayouts = payouts.filter(p => isInPeriod(p.date));

  // Process transactions
  filteredTx.forEach(t => {
    const paymentMethod = t.paymentMethod || 'CASH';
    const revenueCategory = t.revenueCategory || (t.type === 'PROFIT' ? 'SERVICE' : undefined);

    if (t.type === 'SALARY' || isLegacySalaryTransaction(t)) {
      items.push({
        id: `tx-${t.id}`,
        originalId: t.id,
        date: t.date,
        category: 'SALARY',
        categoryLabel: 'Зарплата',
        amount: t.amount,
        note: t.note || 'Выплата зарплаты',
        clientInfo: t.clientInfo || t.employeeName || 'Сотрудник',
        originalTx: t,
        paymentMethod,
        employeeId: t.employeeId,
        employeeName: t.employeeName || t.clientInfo
      });
    } else if (t.type === 'CONSUMABLE') {
      items.push({
        id: `tx-${t.id}`,
        originalId: t.id,
        date: t.date,
        category: 'CONSUMABLE',
        categoryLabel: 'Расходники',
        amount: t.amount,
        note: t.note || 'Расходники',
        clientInfo: t.clientInfo,
        originalTx: t,
        paymentMethod
      });
    } else if (t.type === 'PROFIT') {
      const isRepayment = t.note.toLowerCase().includes('погашение долга') || t.note.toLowerCase().includes('списание долга');
      items.push({
        id: `tx-${t.id}`,
        originalId: t.id,
        date: t.date,
        category: isRepayment ? 'REPAYMENT' : 'PROFIT',
        categoryLabel: isRepayment ? 'Погашение долга' : (revenueCategory === 'SPARE_PARTS' ? 'Запчасти' : 'Прибыль'),
        amount: t.amount,
        note: t.note,
        clientInfo: t.clientInfo,
        originalTx: t,
        paymentMethod,
        revenueCategory,
        employeeId: t.employeeId,
        employeeName: t.employeeName
      });
    } else if (t.type === 'DEBTOR') {
      const isOverdue = !!t.dueDate && t.dueDate > 0 && Date.now() > new Date(t.dueDate).setHours(23, 59, 59, 999);
      items.push({
        id: `tx-${t.id}`,
        originalId: t.id,
        date: t.date,
        category: 'DEBTOR',
        categoryLabel: 'Долг',
        amount: t.amount,
        note: t.note,
        clientInfo: t.clientInfo,
        originalTx: t,
        paymentMethod,
        phone: t.phone,
        dueDate: t.dueDate,
        isOverdue
      });
    } else if (t.type === 'EXPENSE') {
      items.push({
        id: `tx-${t.id}`,
        originalId: t.id,
        date: t.date,
        category: 'EXPENSE',
        categoryLabel: 'Траты',
        amount: t.amount,
        note: t.note,
        clientInfo: t.clientInfo,
        originalTx: t,
        paymentMethod
      });
    }
  });

  // Process payouts
  filteredPayouts.forEach(p => {
    const isAlreadyInTx = filteredTx.some(
      t => (t.type === 'SALARY' || isLegacySalaryTransaction(t)) && Math.abs(t.date - p.date) < 3000
    );

    if (!isAlreadyInTx) {
      items.push({
        id: `payout-${p.id}`,
        originalId: p.id,
        date: p.date,
        category: 'SALARY',
        categoryLabel: 'Зарплата',
        amount: p.amount,
        note: `Выплата зарплаты (${p.employeeName})`,
        clientInfo: p.employeeName,
        isPayoutObj: true,
        paymentMethod: 'CASH',
        employeeId: p.employeeId,
        employeeName: p.employeeName
      });
    }
  });

  items.sort((a, b) => b.date - a.date);
  return items;
}

export function calculateFinancialSummary(
  transactions: TransactionEntity[],
  payouts: SalaryPayoutEntity[],
  debtorSummaries: { remainingDebt: number }[],
  filterFn?: (timestamp: number) => boolean
) {
  const isInPeriod = filterFn || (() => true);

  const periodTx = transactions.filter(t => isInPeriod(t.date));
  const periodPayouts = payouts.filter(p => isInPeriod(p.date));

  // 1. Profit Breakdown
  const profit = periodTx.filter(t => t.type === 'PROFIT').reduce((sum, t) => sum + t.amount, 0);

  const serviceProfit = periodTx
    .filter(t => t.type === 'PROFIT' && (t.revenueCategory === 'SERVICE' || !t.revenueCategory))
    .reduce((sum, t) => sum + t.amount, 0);

  const partsProfit = periodTx
    .filter(t => t.type === 'PROFIT' && t.revenueCategory === 'SPARE_PARTS')
    .reduce((sum, t) => sum + t.amount, 0);

  // 2. Active Debtors
  const activeDebtorsSum = debtorSummaries.reduce((sum, d) => sum + d.remainingDebt, 0);

  // 3. Consumables (Расходники)
  const consumables = periodTx
    .filter(t => t.type === 'CONSUMABLE')
    .reduce((sum, t) => sum + t.amount, 0);

  // 4. Other Expenses (Прочие траты)
  const otherExpenses = periodTx
    .filter(t => t.type === 'EXPENSE' && !isLegacySalaryTransaction(t))
    .reduce((sum, t) => sum + t.amount, 0);

  const materialExpenses = otherExpenses; // for backwards compatibility

  // 5. Cash Desk & Payment Breakdown
  const cashProfit = periodTx
    .filter(t => t.type === 'PROFIT' && (t.paymentMethod === 'CASH' || !t.paymentMethod))
    .reduce((sum, t) => sum + t.amount, 0);

  const sbpProfit = periodTx
    .filter(t => t.type === 'PROFIT' && t.paymentMethod === 'SBP')
    .reduce((sum, t) => sum + t.amount, 0);

  const cardProfit = periodTx
    .filter(t => t.type === 'PROFIT' && t.paymentMethod === 'CARD')
    .reduce((sum, t) => sum + t.amount, 0);

  const bankProfit = periodTx
    .filter(t => t.type === 'PROFIT' && t.paymentMethod === 'BANK_ACCOUNT')
    .reduce((sum, t) => sum + t.amount, 0);

  const directSalaryTxs = periodTx.filter(t => t.type === 'SALARY');
  const directSalaryTotal = directSalaryTxs.reduce((sum, t) => sum + t.amount, 0);

  const legacySalaryTxs = periodTx.filter(t => isLegacySalaryTransaction(t));
  const orphanLegacyTxs = legacySalaryTxs.filter(tx => {
    return !periodPayouts.some(p => Math.abs(p.date - tx.date) < 3000 || (p.amount === tx.amount && Math.abs(p.date - tx.date) < 60000));
  });
  const salaryFromOrphans = orphanLegacyTxs.reduce((sum, t) => sum + t.amount, 0);
  const salaryFromPayouts = periodPayouts.reduce((sum, p) => sum + p.amount, 0);

  const salaryTotal = salaryFromPayouts + directSalaryTotal + salaryFromOrphans;

  // Breakdown by employee
  const salaryByEmployeeMap: Record<string, number> = {};
  periodPayouts.forEach(p => {
    const name = p.employeeName || 'Сотрудник';
    salaryByEmployeeMap[name] = (salaryByEmployeeMap[name] || 0) + p.amount;
  });
  directSalaryTxs.forEach(t => {
    const name = t.clientInfo || t.employeeName || 'Сотрудник';
    salaryByEmployeeMap[name] = (salaryByEmployeeMap[name] || 0) + t.amount;
  });
  orphanLegacyTxs.forEach(t => {
    const name = t.clientInfo || 'Сотрудник';
    salaryByEmployeeMap[name] = (salaryByEmployeeMap[name] || 0) + t.amount;
  });

  const salaryByEmployee = Object.entries(salaryByEmployeeMap).map(([name, amount]) => ({
    name,
    amount
  })).sort((a, b) => b.amount - a.amount);

  const cashOutflow = periodTx
    .filter(t => (t.type === 'EXPENSE' || t.type === 'CONSUMABLE' || t.type === 'SALARY') && (t.paymentMethod === 'CASH' || !t.paymentMethod))
    .reduce((sum, t) => sum + t.amount, 0) + salaryFromPayouts;

  const netCashInRegister = cashProfit - cashOutflow;
  const cashExpenses = cashOutflow;
  const nonCashExpenses = (otherExpenses + consumables + salaryTotal) - cashExpenses;

  // Итог по-прежнему считается по всем записям сразу:
  // прибыль + должники − траты − зарплата − расходники
  const grandTotal = profit + activeDebtorsSum - otherExpenses - consumables - salaryTotal;
  const netTotal = grandTotal;

  return {
    profit,
    serviceProfit,
    partsProfit,
    activeDebtorsSum,
    consumables,
    otherExpenses,
    materialExpenses,
    cashExpenses,
    nonCashExpenses,
    cashProfit,
    sbpProfit,
    cardProfit,
    bankProfit,
    netCashInRegister,
    salaryTotal,
    salaryByEmployee,
    grandTotal,
    netTotal
  };
}

export interface EmployeeEarningsSummary {
  employee: EmployeeEntity;
  assignedTransactions: TransactionEntity[];
  pieceRateEarned: number; // Начислено по сделке (%)
  baseSalary: number; // Фиксированный оклад
  totalEarned: number; // Итого начислено
  totalPaid: number; // Выплачено
  balanceDue: number; // Остаток к выплате
}

export function calculateEmployeeEarnings(
  employee: EmployeeEntity,
  transactions: TransactionEntity[],
  payouts: SalaryPayoutEntity[],
  filterFn?: (timestamp: number) => boolean
): EmployeeEarningsSummary {
  const isInPeriod = filterFn || (() => true);

  // Profit transactions assigned to this employee in period
  const assignedTxs = transactions.filter(
    t => t.type === 'PROFIT' && t.employeeId === employee.id && isInPeriod(t.date)
  );

  const rate = (employee.percentageRate || 0) / 100;
  let pieceRateEarned = 0;

  if (employee.salaryType === 'PERCENTAGE' || employee.salaryType === 'HYBRID') {
    pieceRateEarned = assignedTxs.reduce((sum, t) => {
      return sum + Math.round(t.amount * rate);
    }, 0);
  }

  let baseSalary = 0;
  if (employee.salaryType === 'FIXED' || employee.salaryType === 'HYBRID') {
    baseSalary = employee.baseSalary || employee.salary || 0;
  }

  const totalEarned = pieceRateEarned + baseSalary;

  // Payouts for this employee in period
  const empPayouts = payouts.filter(p => p.employeeId === employee.id && isInPeriod(p.date));
  const directSalaryTxs = transactions.filter(
    t => t.type === 'SALARY' &&
      (t.employeeId === employee.id ||
       (t.employeeName && t.employeeName.trim().toLowerCase() === employee.name.trim().toLowerCase()) ||
       (t.clientInfo && t.clientInfo.trim().toLowerCase() === employee.name.trim().toLowerCase())) &&
      isInPeriod(t.date)
  );
  const directSalaryNonDup = directSalaryTxs.filter(
    t => !empPayouts.some(p => Math.abs(p.date - t.date) < 3000)
  );

  const totalPaid = empPayouts.reduce((sum, p) => sum + p.amount, 0) + directSalaryNonDup.reduce((sum, t) => sum + t.amount, 0);
  const balanceDue = Math.max(0, totalEarned - totalPaid);

  return {
    employee,
    assignedTransactions: assignedTxs,
    pieceRateEarned,
    baseSalary,
    totalEarned,
    totalPaid,
    balanceDue
  };
}
