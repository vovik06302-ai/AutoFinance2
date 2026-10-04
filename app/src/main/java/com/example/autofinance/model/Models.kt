package com.example.autofinance.model

import androidx.compose.ui.graphics.Color

enum class TransactionType {
    PROFIT,
    EXPENSE,
    DEBTOR
}

enum class AppTheme(val label: String) {
    BLUE("Синяя (по умолчанию)"),
    GREEN("Изумрудная"),
    PURPLE("Фиолетовая"),
    ORANGE("Оранжевая"),
    RED("Красная")
}

data class ThemeConfig(
    val label: String,
    val primaryColor: Color,
    val primaryContainerColor: Color,
    val bgLightColor: Color,
    val borderColor: Color
)

enum class FilterPeriod(val label: String) {
    TODAY("Сегодня"),
    WEEK("Неделя"),
    MONTH("Месяц"),
    ALL_TIME("Всё время")
}

data class DebtorSummaryGroup(
    val name: String,
    val totalDebt: Double,
    val transactions: List<com.example.autofinance.data.local.TransactionDbEntity>
)

enum class AppScreen {
    MAIN,
    REPORT
}

sealed class UpdateStatus {
    object Idle : UpdateStatus()
    object Checking : UpdateStatus()
    data class UpToDate(val currentVersion: String) : UpdateStatus()
    data class UpdateAvailable(
        val latestVersion: String,
        val releaseNotes: String,
        val downloadUrl: String
    ) : UpdateStatus()
    data class Downloading(val progress: Int) : UpdateStatus()
    object Downloaded : UpdateStatus()
    data class Error(val message: String) : UpdateStatus()
}

sealed class VoiceCommand {
    data class AddTransaction(
        val type: TransactionType,
        val amount: Double,
        val note: String,
        val clientInfo: String
    ) : VoiceCommand()
    object NavigateReport : VoiceCommand()
    object NavigateMain : VoiceCommand()
    object NavigateBack : VoiceCommand()
    object DeleteLast : VoiceCommand()
    object CheckUpdate : VoiceCommand()
    data class Unknown(val rawText: String) : VoiceCommand()
}
