import React, { useState, useEffect } from 'react';
import {
  TransactionEntity,
  EmployeeEntity,
  SalaryPayoutEntity,
  AppScreen,
  TransactionType,
  UpdateStatus
} from './types';
import {
  loadTransactions,
  saveTransactions,
  loadEmployees,
  saveEmployees,
  loadSalaryPayouts,
  saveSalaryPayouts,
  groupDebtors
} from './storage';
import { formatCurrency } from './utils';
import { parseVoiceCommand } from './voiceParser';
import { startHybridSpeechRecognition } from './speech';
import { checkForAppUpdates, downloadAndInstallApk, CURRENT_VERSION } from './updateChecker';
import { ThemeProvider, useAppTheme } from './components/ThemeContext';
import { Navbar } from './components/Navbar';
import { MainScreen } from './components/MainScreen';
import { ReportScreen } from './components/ReportScreen';
import { AddEditModal } from './components/AddEditModal';
import { DebtorSearchModal } from './components/DebtorSearchModal';
import { SalaryModal } from './components/SalaryModal';
import { ThemeModal } from './components/ThemeModal';
import { UpdateModal } from './components/UpdateModal';
import { Starfield } from './components/Starfield';
import { Mic, Send, X } from 'lucide-react';

const MainContent: React.FC = () => {
  const { setAppTheme } = useAppTheme();

  // State
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('MAIN');
  const [transactions, setTransactions] = useState<TransactionEntity[]>(loadTransactions);
  const [employees, setEmployees] = useState<EmployeeEntity[]>(loadEmployees);
  const [payouts, setPayouts] = useState<SalaryPayoutEntity[]>(loadSalaryPayouts);

  // Modals state
  const [activeDialogType, setActiveDialogType] = useState<TransactionType | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<TransactionEntity | null>(null);
  const [showDebtorSearch, setShowDebtorSearch] = useState(false);
  const [showSalary, setShowSalary] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

  // Voice state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [manualVoiceInput, setManualVoiceInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Update status state
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ status: 'idle' });

  // Sync state to LocalStorage
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveEmployees(employees);
  }, [employees]);

  useEffect(() => {
    saveSalaryPayouts(payouts);
  }, [payouts]);

  // Toast clear timer
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Voice processing logic
  const handleProcessVoiceText = (text: string) => {
    if (!text.trim()) return;
    const command = parseVoiceCommand(text);

    switch (command.kind) {
      case 'add_transaction': {
        const newTx: TransactionEntity = {
          id: Date.now(),
          type: command.type,
          amount: command.amount,
          note: command.note,
          clientInfo: command.clientInfo,
          date: Date.now()
        };
        setTransactions(prev => [newTx, ...prev]);
        const typeName = command.type === 'PROFIT' ? 'Прибыль' : command.type === 'EXPENSE' ? 'Расходники' : 'Должник';
        setToastMessage(`Добавлена ${typeName}: ${formatCurrency(command.amount)} (${command.note})`);
        break;
      }
      case 'navigate_report': {
        setCurrentScreen('REPORT');
        setToastMessage('Переход в отчёт');
        break;
      }
      case 'navigate_main': {
        setCurrentScreen('MAIN');
        setToastMessage('Переход на главный экран');
        break;
      }
      case 'navigate_back': {
        if (currentScreen === 'REPORT') {
          setCurrentScreen('MAIN');
          setToastMessage('Возврат на главный экран');
        } else {
          setToastMessage('Вы на главном экране');
        }
        break;
      }
      case 'delete_last': {
        if (transactions.length > 0) {
          setTransactions(prev => prev.slice(1));
          setToastMessage('Последняя запись удалена');
        } else {
          setToastMessage('Нет записей для удаления');
        }
        break;
      }
      case 'check_update': {
        triggerUpdateCheck();
        setToastMessage('Запущена проверка обновлений');
        break;
      }
      case 'unknown': {
        setToastMessage(`Понято: «${command.rawText}». Команда не распознана`);
        break;
      }
    }
    setManualVoiceInput('');
    setIsVoiceModalOpen(false);
  };

  // Hybrid Speech Recognition
  const startVoiceInput = async () => {
    await startHybridSpeechRecognition({
      onStart: () => setIsListening(true),
      onResult: (transcript) => {
        setIsListening(false);
        handleProcessVoiceText(transcript);
      },
      onError: () => {
        setIsListening(false);
        setIsVoiceModalOpen(true);
      },
      onEnd: () => setIsListening(false)
    });
  };

  // Update check logic
  const triggerUpdateCheck = async () => {
    setUpdateStatus({ status: 'checking' });
    const status = await checkForAppUpdates();
    setUpdateStatus(status);
  };

  const handleStartDownloadUpdate = async () => {
    if (updateStatus.status !== 'update_available') return;
    const downloadUrl = updateStatus.downloadUrl;

    try {
      setUpdateStatus({ status: 'downloading', progress: 10 });
      await downloadAndInstallApk(downloadUrl, (p) => {
        setUpdateStatus({ status: 'downloading', progress: p });
      });
      setUpdateStatus({ status: 'downloaded' });
      setTimeout(() => {
        setUpdateStatus({ status: 'up_to_date', currentVersion: CURRENT_VERSION });
      }, 2000);
    } catch {
      setUpdateStatus({ status: 'error', message: 'Не удалось скачать обновление' });
    }
  };

  // Transactions Actions
  const handleAddTransaction = (type: TransactionType, amount: number, note: string, clientInfo: string) => {
    const newTx: TransactionEntity = {
      id: Date.now(),
      type,
      amount,
      note,
      clientInfo,
      date: Date.now()
    };
    setTransactions(prev => [newTx, ...prev]);
    setActiveDialogType(null);
  };

  const handleUpdateTransaction = (updated: TransactionEntity) => {
    setTransactions(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (tx: TransactionEntity) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      setTransactions(prev => prev.filter(t => t.id !== tx.id));
      setToastMessage('Запись удалена');
    }
  };

  const handleMarkDebtorPaid = (tx: TransactionEntity) => {
    const clientName = tx.clientInfo || tx.note || 'Без имени';
    const profitTx: TransactionEntity = {
      id: Date.now(),
      type: 'PROFIT',
      amount: tx.amount,
      note: `Погашение долга: ${clientName}`,
      clientInfo: clientName,
      date: Date.now()
    };
    setTransactions(prev => [profitTx, ...prev]);
    setToastMessage(`Погашение долга: +${formatCurrency(tx.amount)} (${clientName})`);
  };

  const handleWriteOffDebtor = (clientName: string, amount: number, onError: (msg: string) => void) => {
    const debtorGroup = debtorSummaries.find(d => d.name === clientName);
    const remainingDebt = debtorGroup ? debtorGroup.remainingDebt : 0;

    if (amount <= 0) {
      onError('Сумма списания должна быть больше 0 ₽');
      return;
    }
    if (amount > remainingDebt) {
      onError(`Сумма списания (${formatCurrency(amount)}) не может быть больше остатка долга (${formatCurrency(remainingDebt)})`);
      return;
    }

    // Add profit record with specified note format: "Погашение долга: имя клиента"
    const profitRecord: TransactionEntity = {
      id: Date.now(),
      type: 'PROFIT',
      amount: amount,
      note: `Погашение долга: ${clientName}`,
      clientInfo: clientName,
      date: Date.now()
    };

    setTransactions(prev => [profitRecord, ...prev]);
    setShowDebtorSearch(false);
    setToastMessage(`Погашение долга: +${formatCurrency(amount)} (${clientName})`);
  };

  // Salary Actions
  const handleAddEmployee = (name: string, salary: number, onError: (msg: string) => void) => {
    if (!name.trim()) {
      onError('Имя сотрудника не может быть пустым');
      return;
    }
    if (salary <= 0) {
      onError('Зарплата должна быть больше 0 ₽');
      return;
    }

    const newEmp: EmployeeEntity = {
      id: Date.now(),
      name: name.trim(),
      salary
    };
    setEmployees(prev => [...prev, newEmp]);
    setToastMessage(`Добавлен сотрудник: ${name}`);
  };

  const handleUpdateEmployee = (updated: EmployeeEntity, onError: (msg: string) => void) => {
    if (!updated.name.trim()) {
      onError('Имя не может быть пустым');
      return;
    }
    if (updated.salary <= 0) {
      onError('Зарплата должна быть больше 0 ₽');
      return;
    }

    setEmployees(prev => prev.map(e => (e.id === updated.id ? updated : e)));
    setToastMessage(`Обновлён сотрудник: ${updated.name}`);
  };

  const handleDeleteEmployee = (employee: EmployeeEntity) => {
    if (window.confirm(`Удалить сотрудника ${employee.name}?`)) {
      setEmployees(prev => prev.filter(e => e.id !== employee.id));
      setPayouts(prev => prev.filter(p => p.employeeId !== employee.id));
      setToastMessage(`Сотрудник ${employee.name} удалён`);
    }
  };

  const handleAddSalaryPayout = (employee: EmployeeEntity, amount: number, onError: (msg: string) => void) => {
    if (amount <= 0) {
      onError('Сумма выплаты должна быть больше 0 ₽');
      return;
    }

    const newPayout: SalaryPayoutEntity = {
      id: Date.now(),
      employeeId: employee.id,
      employeeName: employee.name,
      amount,
      date: Date.now()
    };
    setPayouts(prev => [newPayout, ...prev]);

    // Record expense transaction
    const expenseTx: TransactionEntity = {
      id: Date.now() + 1,
      type: 'EXPENSE',
      amount,
      note: `Выплата зарплаты: ${employee.name}`,
      clientInfo: 'Зарплата',
      date: Date.now()
    };
    setTransactions(prev => [expenseTx, ...prev]);
    setToastMessage(`Выплачено ${formatCurrency(amount)} (${employee.name})`);
  };

  const debtorSummaries = groupDebtors(transactions);

  return (
    <div className="min-h-screen flex flex-col antialiased select-none relative text-slate-900">
      {/* Animated Starfield background */}
      <Starfield />

      {/* Navbar on Main Screen */}
      {currentScreen === 'MAIN' && (
        <Navbar
          onOpenTheme={() => setShowTheme(true)}
          onOpenUpdate={() => setShowUpdate(true)}
          onOpenReport={() => setCurrentScreen('REPORT')}
          hasUpdateAvailable={updateStatus.status === 'update_available'}
        />
      )}

      {/* Screen Views */}
      <main className="flex-1 relative z-10">
        {currentScreen === 'MAIN' ? (
          <MainScreen
            transactions={transactions}
            debtorSummaries={debtorSummaries}
            updateStatus={updateStatus}
            isVoiceListening={isListening}
            onStartVoiceInput={startVoiceInput}
            onOpenReport={() => setCurrentScreen('REPORT')}
            onOpenDebtorSearch={() => setShowDebtorSearch(true)}
            onOpenSalary={() => setShowSalary(true)}
            onOpenUpdate={() => setShowUpdate(true)}
            onOpenAddModal={(type) => setActiveDialogType(type)}
            onEditTransaction={(tx) => setEditingTransaction(tx)}
            onDeleteTransaction={handleDeleteTransaction}
            onMarkPaid={handleMarkDebtorPaid}
          />
        ) : (
          <ReportScreen
            transactions={transactions}
            payouts={payouts}
            employees={employees}
            debtorSummaries={debtorSummaries}
            onNavigateBack={() => setCurrentScreen('MAIN')}
            onMarkPaid={handleMarkDebtorPaid}
            onOpenDebtorsModal={() => setShowDebtorSearch(true)}
          />
        )}
      </main>

      {/* Modals */}
      {activeDialogType && (
        <AddEditModal
          type={activeDialogType}
          onClose={() => setActiveDialogType(null)}
          onSave={(amount, note, clientInfo) => handleAddTransaction(activeDialogType, amount, note, clientInfo)}
        />
      )}

      {editingTransaction && (
        <AddEditModal
          type={editingTransaction.type}
          existingTransaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={(amount, note, clientInfo) =>
            handleUpdateTransaction({ ...editingTransaction, amount, note, clientInfo })
          }
        />
      )}

      {showDebtorSearch && (
        <DebtorSearchModal
          debtorSummaries={debtorSummaries}
          onClose={() => setShowDebtorSearch(false)}
          onWriteOff={handleWriteOffDebtor}
        />
      )}

      {showSalary && (
        <SalaryModal
          employees={employees}
          payouts={payouts}
          onClose={() => setShowSalary(false)}
          onAddEmployee={handleAddEmployee}
          onUpdateEmployee={handleUpdateEmployee}
          onDeleteEmployee={handleDeleteEmployee}
          onAddSalaryPayout={handleAddSalaryPayout}
        />
      )}

      {showTheme && (
        <ThemeModal
          onClose={() => setShowTheme(false)}
          onSelectTheme={(theme) => setAppTheme(theme)}
        />
      )}

      {showUpdate && (
        <UpdateModal
          updateStatus={updateStatus}
          onClose={() => setShowUpdate(false)}
          onCheckUpdate={triggerUpdateCheck}
          onStartDownload={handleStartDownloadUpdate}
        />
      )}

      {/* Voice Fallback Modal */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-800">Голосовая команда</h2>
              </div>
              <button onClick={() => setIsVoiceModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-2">
              Произнесите или введите текстовую команду:
            </p>
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
              Примеры:<br />
              • «Прибыль 5000 замена масла Ford»<br />
              • «Расходники 1200 покупка антифриза»<br />
              • «Должник 3500 Иван диагностика»<br />
              • «Отчёт» / «Главная» / «Удали последнее»
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessVoiceText(manualVoiceInput);
              }}
              className="space-y-3"
            >
              <input
                type="text"
                value={manualVoiceInput}
                onChange={(e) => setManualVoiceInput(e.target.value)}
                placeholder="Введите команду..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                autoFocus
              />

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={startVoiceInput}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Микрофон</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVoiceModalOpen(false)}
                    className="px-3 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-xs"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Отправить</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-900/90 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur border border-slate-700/50 animate-in fade-in slide-in-from-bottom-2 text-center max-w-[90vw] truncate">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <MainContent />
    </ThemeProvider>
  );
};
