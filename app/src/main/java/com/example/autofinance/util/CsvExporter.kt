package com.example.autofinance.util

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import com.example.autofinance.data.local.TransactionDbEntity
import com.example.autofinance.model.TransactionType
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object CsvExporter {

    fun exportAndShareCsv(context: Context, transactions: List<TransactionDbEntity>, filterName: String) {
        val bom = "\uFEFF"
        val header = "ID;Дата;Тип;Сумма;Описание/Заметка;Клиент/Авто\n"

        val dateFormat = SimpleDateFormat("dd.MM.yyyy HH:mm", Locale("ru"))

        val rows = transactions.map { item ->
            val dateStr = dateFormat.format(Date(item.date))
            val typeStr = when (item.type) {
                TransactionType.PROFIT -> "Прибыль"
                TransactionType.EXPENSE -> "Расходники"
                TransactionType.DEBTOR -> "Должник"
            }
            val noteEscaped = item.note.replace(";", ",").replace("\n", " ")
            val clientEscaped = item.clientInfo.replace(";", ",").replace("\n", " ")

            "${item.id};$dateStr;$typeStr;${item.amount.toLong()};$noteEscaped;$clientEscaped"
        }

        val csvContent = bom + header + rows.joinToString("\n")
        val fileName = "finance_report_${SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())}.csv"

        try {
            val cacheDir = File(context.cacheDir, "reports")
            if (!cacheDir.exists()) cacheDir.mkdirs()

            val file = File(cacheDir, fileName)
            file.writeText(csvContent, Charsets.UTF_8)

            val uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                file
            )

            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "text/csv"
                putExtra(Intent.EXTRA_SUBJECT, "Финансовый отчёт ($filterName)")
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            context.startActivity(Intent.createChooser(intent, "Поделиться отчётом CSV"))
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
