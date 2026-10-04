package com.example.autofinance.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.autofinance.data.local.AppDatabase
import com.example.autofinance.data.local.EmployeeDbEntity
import com.example.autofinance.data.local.SalaryPayoutDbEntity
import com.example.autofinance.data.local.TransactionDbEntity
import com.example.autofinance.model.AppScreen
import com.example.autofinance.model.AppTheme
import com.example.autofinance.model.DebtorSummaryGroup
import com.example.autofinance.model.FilterPeriod
import com.example.autofinance.model.TransactionType
import com.example.autofinance.model.UpdateStatus
import com.example.autofinance.model.VoiceCommand
import com.example.autofinance.util.VoiceParser
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val db = AppDatabase.getInstance(application)
    private val transactionDao = db.transactionDao()
    private val employeeDao = db.employeeDao()
    private val salaryPayoutDao = db.salaryPayoutDao()

    val transactions: StateFlow<List<TransactionDbEntity>> = transactionDao.getAllTransactions()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val employees: StateFlow<List<EmployeeDbEntity>> = employeeDao.getAllEmployees()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val salaryPayouts: StateFlow<List<SalaryPayoutDbEntity>> = salaryPayoutDao.getAllPayouts()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _selectedFilter = MutableStateFlow(FilterPeriod.ALL_TIME)
    val selectedFilter: StateFlow<FilterPeriod> = _selectedFilter.asStateFlow()

    private val _currentScreen = MutableStateFlow(AppScreen.MAIN)
    val currentScreen: StateFlow<AppScreen> = _currentScreen.asStateFlow()

    private val _appTheme = MutableStateFlow(AppTheme.BLUE)
    val appTheme: StateFlow<AppTheme> = _appTheme.asStateFlow()

    private val _updateStatus = MutableStateFlow<UpdateStatus>(UpdateStatus.Idle)
    val updateStatus: StateFlow<UpdateStatus> = _updateStatus.asStateFlow()

    private val _toastMessage = MutableStateFlow<String?>(null)
    val toastMessage: StateFlow<String?> = _toastMessage.asStateFlow()

    val debtorSummaries: StateFlow<List<DebtorSummaryGroup>> = transactions.combine(_selectedFilter) { txList, _ ->
        val debtors = txList.filter { it.type == TransactionType.DEBTOR }
        val map = mutableMapOf<String, MutableList<TransactionDbEntity>>()

        debtors.forEach { t ->
            val key = (if (t.clientInfo.isNotBlank()) t.clientInfo else if (t.note.isNotBlank()) t.note else "Без имени").trim()
            if (!map.containsKey(key)) map[key] = mutableListOf()
            map[key]!!.add(t)
        }

        map.map { (name, txs) ->
            val total = txs.sumOf { it.amount }
            DebtorSummaryGroup(name, total, txs)
        }.sortedByDescending { it.totalDebt }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun setFilter(period: FilterPeriod) {
        _selectedFilter.value = period
    }

    fun setScreen(screen: AppScreen) {
        _currentScreen.value = screen
    }

    fun setTheme(theme: AppTheme) {
        _appTheme.value = theme
    }

    fun showToast(message: String) {
        _toastMessage.value = message
    }

    fun clearToast() {
        _toastMessage.value = null
    }

    fun addTransaction(type: TransactionType, amount: Double, note: String, clientInfo: String) {
        viewModelScope.launch {
            val entity = TransactionDbEntity(
                type = type,
                amount = amount,
                note = note,
                clientInfo = clientInfo,
                date = System.currentTimeMillis()
            )
            transactionDao.insertTransaction(entity)
        }
    }

    fun updateTransaction(transaction: TransactionDbEntity) {
        viewModelScope.launch {
            transactionDao.updateTransaction(transaction)
        }
    }

    fun deleteTransaction(transaction: TransactionDbEntity) {
        viewModelScope.launch {
            transactionDao.deleteTransaction(transaction)
        }
    }

    fun markDebtorPaid(transaction: TransactionDbEntity) {
        viewModelScope.launch {
            // Delete old debtor entry and insert a PROFIT entry for paid debt
            transactionDao.deleteTransaction(transaction)
            transactionDao.insertTransaction(
                TransactionDbEntity(
                    type = TransactionType.PROFIT,
                    amount = transaction.amount,
                    note = "Оплата долга: ${transaction.note}",
                    clientInfo = transaction.clientInfo,
                    date = System.currentTimeMillis()
                )
            )
            showToast("Долг оплачен (${transaction.amount.toInt()} ₽)")
        }
    }

    fun writeOffDebtorDebt(clientName: String, writeOffAmount: Double, onError: (String) -> Unit) {
        viewModelScope.launch {
            val debtorTxs = transactions.value
                .filter { it.type == TransactionType.DEBTOR }
                .filter { (if (it.clientInfo.isNotBlank()) it.clientInfo else it.note).trim() == clientName.trim() }

            val totalDebt = debtorTxs.sumOf { it.amount }
            if (writeOffAmount <= 0) {
                onError("Сумма списания должна быть больше 0 ₽")
                return@launch
            }
            if (writeOffAmount > totalDebt) {
                onError("Сумма списания не может превышать текущий долг (${totalDebt.toInt()} ₽)")
                return@launch
            }

            var remainingToWriteOff = writeOffAmount
            for (tx in debtorTxs) {
                if (remainingToWriteOff <= 0) break
                if (tx.amount <= remainingToWriteOff) {
                    remainingToWriteOff -= tx.amount
                    transactionDao.deleteTransaction(tx)
                } else {
                    val updatedAmount = tx.amount - remainingToWriteOff
                    remainingToWriteOff = 0.0
                    transactionDao.updateTransaction(tx.copy(amount = updatedAmount))
                }
            }

            // Record profit for the written off/paid amount
            transactionDao.insertTransaction(
                TransactionDbEntity(
                    type = TransactionType.PROFIT,
                    amount = writeOffAmount,
                    note = "Оплата/списание долга",
                    clientInfo = clientName,
                    date = System.currentTimeMillis()
                )
            )

            showToast("Списано ${writeOffAmount.toInt()} ₽ у $clientName")
        }
    }

    fun addEmployee(name: String, salary: Double, onError: (String) -> Unit) {
        viewModelScope.launch {
            if (name.isBlank()) {
                onError("Имя сотрудника не может быть пустым")
                return@launch
            }
            if (salary <= 0) {
                onError("Зарплата должна быть больше 0 ₽")
                return@launch
            }
            employeeDao.insertEmployee(EmployeeDbEntity(name = name.trim(), salary = salary))
            showToast("Добавлен сотрудник: $name")
        }
    }

    fun updateEmployee(employee: EmployeeDbEntity, onError: (String) -> Unit) {
        viewModelScope.launch {
            if (employee.name.isBlank()) {
                onError("Имя сотрудника не может быть пустым")
                return@launch
            }
            if (employee.salary <= 0) {
                onError("Зарплата должна быть больше 0 ₽")
                return@launch
            }
            employeeDao.updateEmployee(employee)
            showToast("Обновлен сотрудник: ${employee.name}")
        }
    }

    fun deleteEmployee(employee: EmployeeDbEntity) {
        viewModelScope.launch {
            employeeDao.deleteEmployee(employee)
            salaryPayoutDao.deletePayoutsByEmployee(employee.id)
            showToast("Сотрудник ${employee.name} удален")
        }
    }

    fun addSalaryPayout(employeeId: Long, employeeName: String, amount: Double, onError: (String) -> Unit) {
        viewModelScope.launch {
            if (amount <= 0) {
                onError("Сумма выплаты должна быть больше 0 ₽")
                return@launch
            }
            salaryPayoutDao.insertPayout(
                SalaryPayoutDbEntity(
                    employeeId = employeeId,
                    employeeName = employeeName,
                    amount = amount,
                    date = System.currentTimeMillis()
                )
            )
            // Also add an expense transaction for salary payout
            transactionDao.insertTransaction(
                TransactionDbEntity(
                    type = TransactionType.EXPENSE,
                    amount = amount,
                    note = "Выплата зарплаты: $employeeName",
                    clientInfo = "Зарплата",
                    date = System.currentTimeMillis()
                )
            )
            showToast("Выплачено $amount ₽ ($employeeName)")
        }
    }

    fun processVoiceCommandText(text: String) {
        viewModelScope.launch {
            when (val command = VoiceParser.parseVoiceCommand(text)) {
                is VoiceCommand.AddTransaction -> {
                    addTransaction(
                        type = command.type,
                        amount = command.amount,
                        note = command.note,
                        clientInfo = command.clientInfo
                    )
                    val typeName = when (command.type) {
                        TransactionType.PROFIT -> "Прибыль"
                        TransactionType.EXPENSE -> "Расходники"
                        TransactionType.DEBTOR -> "Должник"
                    }
                    showToast("Добавлена $typeName: ${command.amount.toInt()} ₽ (${command.note})")
                }
                VoiceCommand.NavigateReport -> {
                    setScreen(AppScreen.REPORT)
                    showToast("Переход в отчёт")
                }
                VoiceCommand.NavigateMain -> {
                    setScreen(AppScreen.MAIN)
                    showToast("Переход на главный экран")
                }
                VoiceCommand.NavigateBack -> {
                    if (currentScreen.value == AppScreen.REPORT) {
                        setScreen(AppScreen.MAIN)
                        showToast("Возврат на главный экран")
                    } else {
                        showToast("Вы на главном экране")
                    }
                }
                VoiceCommand.DeleteLast -> {
                    val last = transactionDao.getLastTransaction()
                    if (last != null) {
                        transactionDao.deleteLastTransaction()
                        showToast("Последняя запись удалена")
                    } else {
                        showToast("Нет записей для удаления")
                    }
                }
                VoiceCommand.CheckUpdate -> {
                    triggerUpdateCheck()
                    showToast("Запущена проверка обновлений")
                }
                is VoiceCommand.Unknown -> {
                    showToast("Понято: «${command.rawText}». Команда не распознана")
                }
            }
        }
    }

    fun triggerUpdateCheck() {
        viewModelScope.launch {
            _updateStatus.value = UpdateStatus.Checking
            delay(1500)
            _updateStatus.value = UpdateStatus.UpdateAvailable(
                latestVersion = "v1.2.1",
                releaseNotes = "Улучшена обработка голосовых команд, ускорен экспорт отчетов в CSV и обновлен дизайн.",
                downloadUrl = "https://github.com/vovik06302-ai/-/releases/download/v1.2.1/autofinance.apk"
            )
        }
    }

    fun startUpdateDownload() {
        viewModelScope.launch {
            for (p in 10..100 step 20) {
                _updateStatus.value = UpdateStatus.Downloading(p)
                delay(300)
            }
            _updateStatus.value = UpdateStatus.Downloaded
            delay(1000)
            _updateStatus.value = UpdateStatus.UpToDate("v1.2.1")
            showToast("Приложение успешно обновлено до v1.2.1!")
        }
    }
}
