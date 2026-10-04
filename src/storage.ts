import { TransactionEntity, EmployeeEntity, SalaryPayoutEntity, AppTheme, DebtorSummaryGroup } from './types';

const STORAGE_KEYS = {
  TRANSACTIONS: 'autofinance_transactions',
  EMPLOYEES: 'autofinance_employees',
  SALARY_PAYOUTS: 'autofinance_salary_payouts',
  THEME: 'autofinance_theme'
};

const INITIAL_TRANSACTIONS: TransactionEntity[] = [
  {
    id: 101,
    type: 'PROFIT',
    amount: 15000,
    note: 'Замена ГРМ и масляного сервиса',
    clientInfo: 'Toyota Camry A777AA77',
    date: Date.now() - 3600000 * 5
  },
  {
    id: 102,
    type: 'EXPENSE',
    amount: 4500,
    note: 'Покупка моторного масла и фильтров',
    clientInfo: 'Запчасти',
    date: Date.now() - 3600000 * 24
  },
  {
    id: 103,
    type: 'DEBTOR',
    amount: 8000,
    note: 'Диагностика подвески и замена рычагов',
    clientInfo: 'Сергей Kia Rio B123BB',
    date: Date.now() - 3600000 * 48
  }
];

const INITIAL_EMPLOYEES: EmployeeEntity[] = [
  { id: 1, name: 'Алексей (Механик)', salary: 70000 },
  { id: 2, name: 'Михаил (Электрик)', salary: 85000 }
];

export function loadTransactions(): TransactionEntity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      saveTransactions(INITIAL_TRANSACTIONS);
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load transactions', e);
    return INITIAL_TRANSACTIONS;
  }
}

export function saveTransactions(items: TransactionEntity[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save transactions', e);
  }
}

export function loadEmployees(): EmployeeEntity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (!raw) {
      saveEmployees(INITIAL_EMPLOYEES);
      return INITIAL_EMPLOYEES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_EMPLOYEES;
  }
}

export function saveEmployees(items: EmployeeEntity[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save employees', e);
  }
}

export function loadSalaryPayouts(): SalaryPayoutEntity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SALARY_PAYOUTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveSalaryPayouts(items: SalaryPayoutEntity[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SALARY_PAYOUTS, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save salary payouts', e);
  }
}

export function loadTheme(): AppTheme {
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME) as AppTheme;
    if (theme && ['BLUE', 'GREEN', 'PURPLE', 'ORANGE', 'RED'].includes(theme)) {
      return theme;
    }
  } catch (e) {}
  return 'BLUE';
}

export function saveTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (e) {}
}

export function groupDebtors(transactions: TransactionEntity[]): DebtorSummaryGroup[] {
  const map = new Map<string, { debtTxs: TransactionEntity[]; repaymentTxs: TransactionEntity[] }>();

  const getOrCreate = (key: string) => {
    const k = key.trim();
    if (!map.has(k)) map.set(k, { debtTxs: [], repaymentTxs: [] });
    return map.get(k)!;
  };

  transactions.forEach(t => {
    if (t.type === 'DEBTOR') {
      const key = (t.clientInfo || t.note || 'Без имени').trim();
      getOrCreate(key).debtTxs.push(t);
    } else if (t.type === 'PROFIT') {
      const noteLower = t.note.toLowerCase();
      const isRepayment = noteLower.includes('погашение долга') || 
                          noteLower.includes('списание долга') || 
                          noteLower.includes('оплата долга');
      if (isRepayment) {
        const extractedName = t.clientInfo || t.note.replace(/^(Погашение|Списание|Оплата)\s+долга:\s*/i, '');
        const key = (extractedName || 'Без имени').trim();
        getOrCreate(key).repaymentTxs.push(t);
      }
    }
  });

  const result: DebtorSummaryGroup[] = [];
  map.forEach((data, name) => {
    const totalInitialDebt = data.debtTxs.reduce((sum, item) => sum + item.amount, 0);
    const totalRepaid = data.repaymentTxs.reduce((sum, item) => sum + item.amount, 0);
    const remainingDebt = Math.max(0, totalInitialDebt - totalRepaid);

    if (totalInitialDebt > 0) {
      result.push({
        name,
        totalInitialDebt,
        totalRepaid,
        remainingDebt,
        debtTransactions: data.debtTxs.sort((a, b) => b.date - a.date),
        repaymentTransactions: data.repaymentTxs.sort((a, b) => b.date - a.date)
      });
    }
  });

  return result.sort((a, b) => b.remainingDebt - a.remainingDebt);
}
