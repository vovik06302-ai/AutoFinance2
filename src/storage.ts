import { TransactionEntity, EmployeeEntity, SalaryPayoutEntity, AppTheme, BackgroundMode, CardStyle, DebtorSummaryGroup, BackupData } from './types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const STORAGE_KEYS = {
  TRANSACTIONS: 'autofinance_transactions',
  EMPLOYEES: 'autofinance_employees',
  SALARY_PAYOUTS: 'autofinance_salary_payouts',
  EMPLOYEE_NAMES: 'autofinance_employee_names',
  THEME: 'autofinance_theme',
  BG_MODE: 'autofinance_bg_mode',
  CARD_STYLE: 'autofinance_card_style',
  ANIMATE_BG: 'autofinance_animate_bg'
};

const INITIAL_TRANSACTIONS: TransactionEntity[] = [
  {
    id: 101,
    type: 'PROFIT',
    amount: 15000,
    note: 'Замена ГРМ и масляного сервиса',
    clientInfo: 'Toyota Camry A777AA77',
    date: Date.now() - 3600000 * 5,
    paymentMethod: 'CARD',
    revenueCategory: 'SERVICE',
    employeeId: 1,
    employeeName: 'Алексей (Механик)'
  },
  {
    id: 102,
    type: 'EXPENSE',
    amount: 4500,
    note: 'Покупка моторного масла и фильтров',
    clientInfo: 'Toyota Camry A777AA77',
    date: Date.now() - 3600000 * 24,
    paymentMethod: 'CASH'
  },
  {
    id: 103,
    type: 'DEBTOR',
    amount: 8000,
    note: 'Диагностика подвески и замена рычагов',
    clientInfo: 'Сергей Kia Rio B123BB',
    date: Date.now() - 3600000 * 48,
    paymentMethod: 'CASH',
    phone: '+7 999 123-45-67',
    dueDate: Date.now() + 86400000 * 3 // Deadline in 3 days
  }
];

const INITIAL_EMPLOYEES: EmployeeEntity[] = [
  {
    id: 1,
    name: 'Алексей (Механик)',
    salaryType: 'PERCENTAGE',
    percentageRate: 40,
    baseSalary: 0,
    salary: 70000,
    role: 'Механик',
    phone: '+7 916 111-22-33'
  },
  {
    id: 2,
    name: 'Михаил (Электрик)',
    salaryType: 'PERCENTAGE',
    percentageRate: 45,
    baseSalary: 0,
    salary: 85000,
    role: 'Электрик',
    phone: '+7 916 444-55-66'
  }
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
    const list: EmployeeEntity[] = JSON.parse(raw);
    return list.map(emp => ({
      ...emp,
      salaryType: emp.salaryType || (emp.percentageRate ? 'PERCENTAGE' : 'FIXED'),
      percentageRate: emp.percentageRate !== undefined ? emp.percentageRate : 40,
      baseSalary: emp.baseSalary !== undefined ? emp.baseSalary : emp.salary,
      salary: emp.salary || 0
    }));
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

export function loadSavedEmployeeNames(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_NAMES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return ['Алексей', 'Михаил', 'Иван', 'Сергей', 'Дмитрий'];
}

export function saveEmployeeName(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    const current = loadSavedEmployeeNames();
    if (!current.some(n => n.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [trimmed, ...current];
      localStorage.setItem(STORAGE_KEYS.EMPLOYEE_NAMES, JSON.stringify(updated));
    }
  } catch (e) {
    console.error('Failed to save employee name', e);
  }
}

const VALID_THEMES: AppTheme[] = ['BLUE', 'CARBON', 'ORANGE', 'GREEN', 'NEON', 'PURPLE', 'MONOCHROME', 'RED'];

export function loadTheme(): AppTheme {
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME) as AppTheme;
    if (theme && VALID_THEMES.includes(theme)) {
      return theme;
    }
  } catch (e) {}
  return 'CARBON';
}

export function saveTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (e) {}
}

export function loadBgMode(): BackgroundMode {
  try {
    const mode = localStorage.getItem(STORAGE_KEYS.BG_MODE) as BackgroundMode;
    if (mode && ['STARFIELD', 'DARK', 'LIGHT'].includes(mode)) {
      return mode;
    }
  } catch (e) {}
  return 'STARFIELD';
}

export function saveBgMode(mode: BackgroundMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BG_MODE, mode);
  } catch (e) {}
}

export function loadCardStyle(): CardStyle {
  try {
    const style = localStorage.getItem(STORAGE_KEYS.CARD_STYLE) as CardStyle;
    if (style && ['GLASS', 'SOLID'].includes(style)) {
      return style;
    }
  } catch (e) {}
  return 'GLASS';
}

export function saveCardStyle(style: CardStyle): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CARD_STYLE, style);
  } catch (e) {}
}

export function loadAnimateBg(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.ANIMATE_BG);
    if (val !== null) {
      return val === 'true';
    }
  } catch (e) {}
  return true;
}

export function saveAnimateBg(animate: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ANIMATE_BG, animate ? 'true' : 'false');
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
  const now = Date.now();

  map.forEach((data, name) => {
    const totalInitialDebt = data.debtTxs.reduce((sum, item) => sum + item.amount, 0);
    const totalRepaid = data.repaymentTxs.reduce((sum, item) => sum + item.amount, 0);
    const remainingDebt = Math.max(0, totalInitialDebt - totalRepaid);

    const sortedDebtTxs = data.debtTxs.sort((a, b) => b.date - a.date);
    const txWithPhone = sortedDebtTxs.find(t => !!t.phone && t.phone.trim().length > 0);
    const phone = txWithPhone?.phone?.trim();

    const txWithDueDate = sortedDebtTxs.find(t => !!t.dueDate && t.dueDate > 0);
    const dueDate = txWithDueDate?.dueDate;

    let isOverdue = false;
    let daysDiff: number | undefined = undefined;

    if (dueDate && remainingDebt > 0) {
      const dueEnd = new Date(dueDate).setHours(23, 59, 59, 999);
      isOverdue = now > dueEnd;
      daysDiff = Math.ceil((dueEnd - now) / (1000 * 60 * 60 * 24));
    }

    if (totalInitialDebt > 0) {
      result.push({
        name,
        phone,
        dueDate,
        isOverdue,
        daysDiff,
        totalInitialDebt,
        totalRepaid,
        remainingDebt,
        debtTransactions: sortedDebtTxs,
        repaymentTransactions: data.repaymentTxs.sort((a, b) => b.date - a.date)
      });
    }
  });

  return result.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return b.remainingDebt - a.remainingDebt;
  });
}

export async function exportBackupJson(
  transactions: TransactionEntity[],
  employees: EmployeeEntity[],
  payouts: SalaryPayoutEntity[],
  theme: AppTheme = 'BLUE'
): Promise<string> {
  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: 'Финансы автосервиса',
    transactions,
    employees,
    payouts,
    theme
  };

  const jsonString = JSON.stringify(data, null, 2);
  const fileName = `autofinance_backup_${new Date().toISOString().slice(0, 10)}.json`;

  if (Capacitor.isNativePlatform()) {
    try {
      const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: jsonString,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      await Share.share({
        title: 'Резервная копия базы автосервиса',
        text: 'Файл резервной копии базы данных (JSON)',
        url: writeResult.uri,
        dialogTitle: 'Сохранить резервную копию'
      });
      return fileName;
    } catch (e) {
      console.error('Error sharing backup file', e);
      fallbackBrowserDownload(jsonString, fileName);
      return fileName;
    }
  } else {
    fallbackBrowserDownload(jsonString, fileName);
    return fileName;
  }
}

function fallbackBrowserDownload(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseAndValidateBackup(jsonText: string): BackupData {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error('Файл не является корректным JSON документом.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Некорректная структура файла бэкапа.');
  }

  if (!Array.isArray(parsed.transactions)) {
    throw new Error('В файле отсутствует список транзакций (поле transactions).');
  }

  // Validate each transaction minimally
  for (const t of parsed.transactions) {
    if (!t.id || !t.type || typeof t.amount !== 'number') {
      throw new Error('Обнаружена некорректная запись операции в файле.');
    }
  }

  const employees: EmployeeEntity[] = Array.isArray(parsed.employees) ? parsed.employees : [];
  const payouts: SalaryPayoutEntity[] = Array.isArray(parsed.payouts) ? parsed.payouts : [];
  const theme: AppTheme = (parsed.theme && ['BLUE', 'GREEN', 'PURPLE', 'ORANGE', 'RED'].includes(parsed.theme))
    ? parsed.theme
    : 'BLUE';

  return {
    version: parsed.version || 1,
    exportedAt: parsed.exportedAt || new Date().toISOString(),
    appName: parsed.appName || 'Финансы автосервиса',
    transactions: parsed.transactions,
    employees,
    payouts,
    theme
  };
}
