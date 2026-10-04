package com.example.autofinance.ui.dialogs

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.autofinance.data.local.TransactionDbEntity
import com.example.autofinance.model.AppTheme
import com.example.autofinance.model.TransactionType
import com.example.autofinance.ui.theme.getThemeConfig

@Composable
fun AddEditDialog(
    type: TransactionType,
    existingTransaction: TransactionDbEntity? = null,
    appTheme: AppTheme = AppTheme.BLUE,
    onDismiss: () -> Unit,
    onSave: (amount: Double, note: String, clientInfo: String) -> Unit
) {
    var amountText by remember { mutableStateOf(existingTransaction?.amount?.let { if (it % 1 == 0.0) it.toLong().toString() else it.toString() } ?: "") }
    var noteText by remember { mutableStateOf(existingTransaction?.note ?: "") }
    var clientInfoText by remember { mutableStateOf(existingTransaction?.clientInfo ?: "") }
    var errorText by remember { mutableStateOf<String?>(null) }

    val themeConfig = getThemeConfig(appTheme)

    val title = if (existingTransaction != null) {
        "Редактировать запись"
    } else {
        when (type) {
            TransactionType.PROFIT -> "Добавить прибыль"
            TransactionType.EXPENSE -> "Добавить расходники"
            TransactionType.DEBTOR -> "Добавить должника"
        }
    }

    val noteLabel = when (type) {
        TransactionType.PROFIT -> "Работа / заметка"
        TransactionType.EXPENSE -> "Описание / заметка"
        TransactionType.DEBTOR -> "Работа / за что"
    }

    val clientLabel = when (type) {
        TransactionType.PROFIT -> "Авто / номер"
        TransactionType.EXPENSE -> "Детали / инфо (необязательно)"
        TransactionType.DEBTOR -> "Клиент, авто, номер"
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .testTag("add_edit_dialog"),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(
                modifier = Modifier.padding(20.dp)
            ) {
                Text(
                    text = title,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1E293B)
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = amountText,
                    onValueChange = {
                        amountText = it
                        errorText = null
                    },
                    label = { Text("Сумма (₽)") },
                    placeholder = { Text("0") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    isError = errorText != null,
                    supportingText = {
                        errorText?.let {
                            Text(text = it, color = Color(0xFFDC2626), fontSize = 12.sp)
                        }
                    },
                    modifier = Modifier.fillMaxWidth().testTag("amount_input"),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = themeConfig.primaryColor,
                        focusedLabelColor = themeConfig.primaryColor
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = noteText,
                    onValueChange = { noteText = it },
                    label = { Text(noteLabel) },
                    placeholder = { Text("Например: Замена масла") },
                    modifier = Modifier.fillMaxWidth().testTag("note_input"),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = themeConfig.primaryColor,
                        focusedLabelColor = themeConfig.primaryColor
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = clientInfoText,
                    onValueChange = { clientInfoText = it },
                    label = { Text(clientLabel) },
                    placeholder = { Text("Например: Иван Ford Focus A123AA") },
                    modifier = Modifier.fillMaxWidth().testTag("client_info_input"),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = themeConfig.primaryColor,
                        focusedLabelColor = themeConfig.primaryColor
                    )
                )

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Spacer(modifier = Modifier.weight(1f))

                    TextButton(onClick = onDismiss) {
                        Text("Отмена", color = Color(0xFF64748B), fontWeight = FontWeight.Bold)
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    Button(
                        onClick = {
                            val parsed = amountText.replace(',', '.').toDoubleOrNull()
                            if (parsed == null || parsed <= 0) {
                                errorText = "Введите корректную сумму больше 0 ₽"
                            } else {
                                onSave(parsed, noteText.trim(), clientInfoText.trim())
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = themeConfig.primaryColor),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.testTag("save_button")
                    ) {
                        Text("Сохранить", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
