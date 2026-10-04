export type TransactionType = 'PROFIT' | 'EXPENSE' | 'DEBTOR';

export type PaymentMethod = 'CASH' | 'SBP' | 'CARD' | 'BANK_ACCOUNT';

export type RevenueCategory = 'SERVICE' | 'SPARE_PARTS';

export interface TransactionEntity {
  id: number;
  type: TransactionType;
  amount: number;
  note: string;
  clientInfo: string;
  date: number; // Timestamp in ms
  paymentMethod?: PaymentMethod;
  revenueCategory?: RevenueCategory;
  phone?: string;
  dueDate?: number; // Timestamp in ms (срок возврата долга)
}

export interface EmployeeEntity {
  id: number;
  name: string;
  salary: number;
}

export interface SalaryPayoutEntity {
  id: number;
  employeeId: number;
  employeeName: string;
  amount: number;
  date: number;
}

export type AppTheme = 'BLUE' | 'GREEN' | 'PURPLE' | 'ORANGE' | 'RED';

export interface ThemeConfig {
  label: string;
  primaryHex: string;
  primaryClass: string;
  bgLightClass: string;
  borderClass: string;
  ringClass: string;
}

export type FilterPeriod = 'TODAY' | 'WEEK' | 'MONTH' | 'ALL_TIME';

export interface DebtorSummaryGroup {
  name: string;
  phone?: string;
  dueDate?: number;
  isOverdue?: boolean;
  daysDiff?: number;
  totalInitialDebt: number;
  totalRepaid: number;
  remainingDebt: number;
  debtTransactions: TransactionEntity[];
  repaymentTransactions: TransactionEntity[];
}

export interface BackupData {
  version: number;
  exportedAt: string;
  appName: string;
  transactions: TransactionEntity[];
  employees: EmployeeEntity[];
  payouts: SalaryPayoutEntity[];
  theme?: AppTheme;
}

export type AppScreen = 'MAIN' | 'REPORT';

export type UpdateStatus = 
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'up_to_date'; currentVersion: string }
  | { status: 'update_available'; latestVersion: string; releaseNotes: string; downloadUrl: string }
  | { status: 'downloading'; progress: number }
  | { status: 'downloaded' }
  | { status: 'error'; message: string; downloadUrl?: string };

export type VoiceCommand = 
  | { kind: 'add_transaction'; type: TransactionType; amount: number; note: string; clientInfo: string; paymentMethod?: PaymentMethod; revenueCategory?: RevenueCategory }
  | { kind: 'navigate_report' }
  | { kind: 'navigate_main' }
  | { kind: 'navigate_back' }
  | { kind: 'delete_last' }
  | { kind: 'check_update' }
  | { kind: 'unknown'; rawText: string };
