package com.example.autofinance

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognizerIntent
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat
import com.example.autofinance.data.local.TransactionDbEntity
import com.example.autofinance.model.AppScreen
import com.example.autofinance.model.TransactionType
import com.example.autofinance.ui.MainViewModel
import com.example.autofinance.ui.components.Navbar
import com.example.autofinance.ui.dialogs.AddEditDialog
import com.example.autofinance.ui.dialogs.DebtorSearchDialog
import com.example.autofinance.ui.dialogs.SalaryDialog
import com.example.autofinance.ui.dialogs.ThemeSelectionDialog
import com.example.autofinance.ui.dialogs.UpdateDialog
import com.example.autofinance.ui.dialogs.VoiceInputDialog
import com.example.autofinance.ui.screens.MainScreen
import com.example.autofinance.ui.screens.ReportScreen
import com.example.autofinance.ui.theme.AutoFinanceTheme

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            val appTheme by viewModel.appTheme.collectAsState()

            AutoFinanceTheme(appTheme = appTheme) {
                AutoFinanceApp(viewModel = viewModel)
            }
        }
    }
}

@Composable
fun AutoFinanceApp(viewModel: MainViewModel) {
    val context = LocalContext.current

    val transactions by viewModel.transactions.collectAsState()
    val debtorSummaries by viewModel.debtorSummaries.collectAsState()
    val employees by viewModel.employees.collectAsState()
    val payouts by viewModel.salaryPayouts.collectAsState()
    val selectedFilter by viewModel.selectedFilter.collectAsState()
    val currentScreen by viewModel.currentScreen.collectAsState()
    val appTheme by viewModel.appTheme.collectAsState()
    val updateStatus by viewModel.updateStatus.collectAsState()
    val toastMessage by viewModel.toastMessage.collectAsState()

    // Modals state
    var activeAddType by remember { mutableStateOf<TransactionType?>(null) }
    var editingTransaction by remember { mutableStateOf<TransactionDbEntity?>(null) }
    var showDebtorSearch by remember { mutableStateOf(false) }
    var showSalary by remember { mutableStateOf(false) }
    var showTheme by remember { mutableStateOf(false) }
    var showUpdate by remember { mutableStateOf(false) }
    var showVoiceInput by remember { mutableStateOf(false) }

    // Voice listening animation state
    var isVoiceListening by remember { mutableStateOf(false) }

    val snackbarHostState = remember { SnackbarHostState() }

    // Toast listener
    LaunchedEffect(toastMessage) {
        toastMessage?.let { msg ->
            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
            viewModel.clearToast()
        }
    }

    // Speech Recognizer Launcher
    val speechLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        isVoiceListening = false
        if (result.resultCode == Activity.RESULT_OK) {
            val spokenText = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)?.getOrNull(0)
            if (!spokenText.isNullOrBlank()) {
                viewModel.processVoiceCommandText(spokenText)
            }
        } else {
            showVoiceInput = true
        }
    }

    // Permission launcher for RECORD_AUDIO
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            try {
                isVoiceListening = true
                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ru-RU")
                    putExtra(RecognizerIntent.EXTRA_PROMPT, "Произнесите финансовую команду...")
                }
                speechLauncher.launch(intent)
            } catch (e: Exception) {
                isVoiceListening = false
                showVoiceInput = true
            }
        } else {
            showVoiceInput = true
        }
    }

    fun triggerVoiceRecognition() {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            try {
                isVoiceListening = true
                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ru-RU")
                    putExtra(RecognizerIntent.EXTRA_PROMPT, "Произнесите финансовую команду...")
                }
                speechLauncher.launch(intent)
            } catch (e: Exception) {
                isVoiceListening = false
                showVoiceInput = true
            }
        } else {
            permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }
    }

    // BackHandler for secondary screen
    if (currentScreen == AppScreen.REPORT) {
        BackHandler {
            viewModel.setScreen(AppScreen.MAIN)
        }
    }

    Scaffold(
        topBar = {
            if (currentScreen == AppScreen.MAIN) {
                Navbar(
                    onOpenTheme = { showTheme = true },
                    onOpenUpdate = { showUpdate = true },
                    onOpenReport = { viewModel.setScreen(AppScreen.REPORT) },
                    hasUpdateAvailable = updateStatus is com.example.autofinance.model.UpdateStatus.UpdateAvailable
                )
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = Color(0xFFF1F5F9)
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (currentScreen) {
                AppScreen.MAIN -> {
                    MainScreen(
                        transactions = transactions,
                        updateStatus = updateStatus,
                        appTheme = appTheme,
                        isVoiceListening = isVoiceListening,
                        onStartVoiceInput = { triggerVoiceRecognition() },
                        onOpenReport = { viewModel.setScreen(AppScreen.REPORT) },
                        onOpenDebtorSearch = { showDebtorSearch = true },
                        onOpenSalary = { showSalary = true },
                        onOpenUpdate = { showUpdate = true },
                        onOpenAddModal = { type -> activeAddType = type },
                        onEditTransaction = { tx -> editingTransaction = tx },
                        onDeleteTransaction = { tx -> viewModel.deleteTransaction(tx) },
                        onMarkPaid = { tx -> viewModel.markDebtorPaid(tx) }
                    )
                }
                AppScreen.REPORT -> {
                    ReportScreen(
                        transactions = transactions,
                        selectedFilter = selectedFilter,
                        onSelectFilter = { period -> viewModel.setFilter(period) },
                        onNavigateBack = { viewModel.setScreen(AppScreen.MAIN) },
                        onMarkPaid = { tx -> viewModel.markDebtorPaid(tx) }
                    )
                }
            }
        }
    }

    // Dialogs
    activeAddType?.let { type ->
        AddEditDialog(
            type = type,
            existingTransaction = null,
            appTheme = appTheme,
            onDismiss = { activeAddType = null },
            onSave = { amount, note, clientInfo ->
                viewModel.addTransaction(type, amount, note, clientInfo)
                activeAddType = null
            }
        )
    }

    editingTransaction?.let { tx ->
        AddEditDialog(
            type = tx.type,
            existingTransaction = tx,
            appTheme = appTheme,
            onDismiss = { editingTransaction = null },
            onSave = { amount, note, clientInfo ->
                viewModel.updateTransaction(
                    tx.copy(amount = amount, note = note, clientInfo = clientInfo)
                )
                editingTransaction = null
            }
        )
    }

    if (showDebtorSearch) {
        DebtorSearchDialog(
            debtorSummaries = debtorSummaries,
            onDismiss = { showDebtorSearch = false },
            onWriteOff = { clientName, amount, onError ->
                viewModel.writeOffDebtorDebt(clientName, amount, onError)
            }
        )
    }

    if (showSalary) {
        SalaryDialog(
            employees = employees,
            payouts = payouts,
            onDismiss = { showSalary = false },
            onAddEmployee = { name, salary, onError ->
                viewModel.addEmployee(name, salary, onError)
            },
            onUpdateEmployee = { employee, onError ->
                viewModel.updateEmployee(employee, onError)
            },
            onDeleteEmployee = { employee ->
                viewModel.deleteEmployee(employee)
            },
            onAddSalaryPayout = { employeeId, employeeName, amount, onError ->
                viewModel.addSalaryPayout(employeeId, employeeName, amount, onError)
            }
        )
    }

    if (showTheme) {
        ThemeSelectionDialog(
            currentTheme = appTheme,
            onDismiss = { showTheme = false },
            onSelectTheme = { theme ->
                viewModel.setTheme(theme)
            }
        )
    }

    if (showUpdate) {
        UpdateDialog(
            updateStatus = updateStatus,
            onDismiss = { showUpdate = false },
            onCheckUpdate = { viewModel.triggerUpdateCheck() },
            onStartDownload = { viewModel.startUpdateDownload() }
        )
    }

    if (showVoiceInput) {
        VoiceInputDialog(
            onDismiss = { showVoiceInput = false },
            onSubmitCommand = { cmdText ->
                viewModel.processVoiceCommandText(cmdText)
                showVoiceInput = false
            },
            onStartSpeechRecognition = {
                showVoiceInput = false
                triggerVoiceRecognition()
            }
        )
    }
}
