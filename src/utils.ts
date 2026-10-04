import { TransactionEntity, SalaryPayoutEntity } from './types';

export function formatCurrency(val: number): string {
  const formatted = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0
  }).format(Math.round(val || 0));
  return `${formatted} ₽`;
}

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
  category: 'PROFIT' | 'REPAYMENT' | 'DEBTOR' | 'EXPENSE' | 'SALARY';
  categoryLabel: string;
  amount: number;
  note: string;
  clientInfo: string;
  isPayoutObj?: boolean;
  originalTx?: TransactionEntity;
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
    if (isLegacySalaryTransaction(t)) {
      items.push({
        id: `tx-${t.id}`,
        originalId: t.id,
        date: t.date,
        category: 'SALARY',
        categoryLabel: 'Зарплата',
        amount: t.amount,
        note: t.note,
        clientInfo: t.clientInfo || 'Сотрудник',
        originalTx: t
      });
    } else if (t.type === 'PROFIT') {
      const isRepayment = t.note.toLowerCase().includes('погашение долга') || t.note.toLowerCase().includes('списание долга');
      items.push({
        id: `tx-${t.id}`,
        originalId: t.id,
        date: t.date,
        category: isRepayment ? 'REPAYMENT' : 'PROFIT',
        categoryLabel: isRepayment ? 'Погашение долга' : 'Прибыль',
        amount: t.amount,
        note: t.note,
        clientInfo: t.clientInfo,
        originalTx: t
      });
    } else if (t.type === 'DEBTOR') {
      items.push({
        id: `tx-${t.id}`,
        originalId: t.id,
        date: t.date,
        category: 'DEBTOR',
        categoryLabel: 'Долг',
        amount: t.amount,
        note: t.note,
        clientInfo: t.clientInfo,
        originalTx: t
      });
    } else if (t.type === 'EXPENSE') {
      items.push({
        id: `tx-${t.id}`,
        originalId: t.id,
        date: t.date,
        category: 'EXPENSE',
        categoryLabel: 'Расходники',
        amount: t.amount,
        note: t.note,
        clientInfo: t.clientInfo,
        originalTx: t
      });
    }
  });

  // Process payouts
  filteredPayouts.forEach(p => {
    const isAlreadyInTx = filteredTx.some(
      t => isLegacySalaryTransaction(t) && Math.abs(t.date - p.date) < 3000
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
        isPayoutObj: true
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

  // 1. Profit
  const profit = periodTx.filter(t => t.type === 'PROFIT').reduce((sum, t) => sum + t.amount, 0);

  // 2. Active Debtors
  const activeDebtorsSum = debtorSummaries.reduce((sum, d) => sum + d.remainingDebt, 0);

  // 3. Material Expenses ONLY (excluding legacy salary transactions)
  const materialExpenses = periodTx
    .filter(t => t.type === 'EXPENSE' && !isLegacySalaryTransaction(t))
    .reduce((sum, t) => sum + t.amount, 0);

  // 4. Salary Total (Payouts + Orphan Legacy Salary Transactions)
  const salaryFromPayouts = periodPayouts.reduce((sum, p) => sum + p.amount, 0);

  const legacySalaryTxs = periodTx.filter(t => isLegacySalaryTransaction(t));
  const orphanLegacyTxs = legacySalaryTxs.filter(tx => {
    return !periodPayouts.some(p => Math.abs(p.date - tx.date) < 3000 || (p.amount === tx.amount && Math.abs(p.date - tx.date) < 60000));
  });
  const salaryFromOrphans = orphanLegacyTxs.reduce((sum, t) => sum + t.amount, 0);

  const salaryTotal = salaryFromPayouts + salaryFromOrphans;

  // Formulas
  const grandTotal = profit + activeDebtorsSum - materialExpenses;
  const netTotal = grandTotal - salaryTotal;

  return {
    profit,
    activeDebtorsSum,
    materialExpenses,
    salaryTotal,
    grandTotal,
    netTotal
  };
}
