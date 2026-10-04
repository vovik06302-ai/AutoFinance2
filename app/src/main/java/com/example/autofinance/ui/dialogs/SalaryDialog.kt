package com.example.autofinance.ui.dialogs

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
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
import com.example.autofinance.data.local.EmployeeDbEntity
import com.example.autofinance.data.local.SalaryPayoutDbEntity
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun SalaryDialog(
    employees: List<EmployeeDbEntity>,
    payouts: List<SalaryPayoutDbEntity>,
    onDismiss: () -> Unit,
    onAddEmployee: (name: String, salary: Double, onError: (String) -> Unit) -> Unit,
    onUpdateEmployee: (employee: EmployeeDbEntity, onError: (String) -> Unit) -> Unit,
    onDeleteEmployee: (employee: EmployeeDbEntity) -> Unit,
    onAddSalaryPayout: (employeeId: Long, employeeName: String, amount: Double, onError: (String) -> Unit) -> Unit
) {
    var showAddEditSubDialog by remember { mutableStateOf(false) }
    var editingEmployee by remember { mutableStateOf<EmployeeDbEntity?>(null) }

    val numberFormat = NumberFormat.getCurrencyInstance(Locale("ru", "RU")).apply {
        maximumFractionDigits = 0
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f)
                .padding(8.dp)
                .testTag("salary_dialog"),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Badge,
                            contentDescription = null,
                            tint = Color(0xFFDC2626)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Учёт зарплат",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF1E293B)
                        )
                    }

                    IconButton(onClick = onDismiss) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Закрыть",
                            tint = Color(0xFF94A3B8)
                        )
                    }
                }

                HorizontalDivider(color = Color(0xFFF1F5F9))
                Spacer(modifier = Modifier.height(12.dp))

                // Overall Metrics Summary Card
                if (employees.isNotEmpty()) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0))
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = "ОБЩАЯ ЗАРПЛАТА ПО ВСЕМ СОТРУДНИКАМ",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF64748B),
                                letterSpacing = 0.5.sp
                            )
                            Spacer(modifier = Modifier.height(8.dp))

                            Row(modifier = Modifier.fillMaxWidth()) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("Общий оклад", fontSize = 11.sp, color = Color(0xFF64748B))
                                    Text(
                                        text = numberFormat.format(employees.sumOf { it.salary }),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = Color(0xFF0F172A)
                                    )
                                }

                                Column(modifier = Modifier.weight(1f)) {
                                    Text("Выдано всего", fontSize = 11.sp, color = Color(0xFF64748B))
                                    Text(
                                        text = numberFormat.format(payouts.sumOf { it.amount }),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = Color(0xFF047857)
                                    )
                                }

                                Column(modifier = Modifier.weight(1f)) {
                                    Text("К выплате", fontSize = 11.sp, color = Color(0xFF64748B))
                                    val remainingTotal = employees.sumOf { e ->
                                        val paid = payouts.filter { it.employeeId == e.id }.sumOf { it.amount }
                                        maxOf(0.0, e.salary - paid)
                                    }
                                    Text(
                                        text = numberFormat.format(remainingTotal),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = Color(0xFFB91C1C)
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                }

                // Add Employee Button
                Button(
                    onClick = {
                        editingEmployee = null
                        showAddEditSubDialog = true
                    },
                    modifier = Modifier.fillMaxWidth().testTag("add_employee_button"),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1D4ED8)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = null, tint = Color.White)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Добавить сотрудника", fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Employee Cards List
                if (employees.isEmpty()) {
                    Column(
                        modifier = Modifier.weight(1f).fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = "Список сотрудников пуст.\nНажмите «Добавить сотрудника», чтобы начать.",
                            color = Color(0xFF64748B),
                            fontSize = 13.sp
                        )
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(employees) { emp ->
                            val empPayouts = payouts.filter { it.employeeId == emp.id }
                            EmployeeCardItem(
                                employee = emp,
                                payouts = empPayouts,
                                numberFormat = numberFormat,
                                onEdit = {
                                    editingEmployee = emp
                                    showAddEditSubDialog = true
                                },
                                onDelete = { onDeleteEmployee(emp) },
                                onAddPayout = { amount, onError ->
                                    onAddSalaryPayout(emp.id, emp.name, amount, onError)
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = onDismiss) {
                        Text("Закрыть", color = Color(0xFF64748B))
                    }
                }
            }
        }
    }

    if (showAddEditSubDialog) {
        AddEditEmployeeSubDialog(
            existingEmployee = editingEmployee,
            onDismiss = { showAddEditSubDialog = false },
            onSave = { name, salary, onError ->
                if (editingEmployee != null) {
                    onUpdateEmployee(editingEmployee!!.copy(name = name, salary = salary), onError)
                } else {
                    onAddEmployee(name, salary, onError)
                }
                showAddEditSubDialog = false
            }
        )
    }
}

@Composable
private fun EmployeeCardItem(
    employee: EmployeeDbEntity,
    payouts: List<SalaryPayoutDbEntity>,
    numberFormat: NumberFormat,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onAddPayout: (amount: Double, onError: (String) -> Unit) -> Unit
) {
    var payoutInput by remember { mutableStateOf("") }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    var showHistory by remember { mutableStateOf(false) }

    val totalPaid = payouts.sumOf { it.amount }
    val remaining = employee.salary - totalPaid
    val dateFormat = SimpleDateFormat("dd.MM.yyyy HH:mm", Locale("ru"))

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0))
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = employee.name,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = Color(0xFF0F172A)
                )

                Row {
                    IconButton(onClick = onEdit, modifier = Modifier.padding(0.dp)) {
                        Icon(imageVector = Icons.Default.Edit, contentDescription = "Редактировать", tint = Color(0xFF64748B))
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.padding(0.dp)) {
                        Icon(imageVector = Icons.Default.Delete, contentDescription = "Удалить", tint = Color(0xFFEF4444))
                    }
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Месячный оклад: ${numberFormat.format(employee.salary)}",
                fontSize = 12.sp,
                color = Color(0xFF475569)
            )
            Text(
                text = "Выдано частями: ${numberFormat.format(totalPaid)}",
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = Color(0xFF047857)
            )
            Text(
                text = "Остаток к выплате: ${numberFormat.format(maxOf(0.0, remaining))}",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = if (remaining > 0) Color(0xFFB91C1C) else Color(0xFF047857)
            )

            if (payouts.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                HorizontalDivider(color = Color(0xFFE2E8F0))
                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth().clickable { showHistory = !showHistory },
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "История выплат (${payouts.size}):",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF475569)
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = if (showHistory) "Скрыть" else "Показать",
                            fontSize = 12.sp,
                            color = Color(0xFF1D4ED8)
                        )
                        Icon(
                            imageVector = if (showHistory) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                            contentDescription = null,
                            tint = Color(0xFF1D4ED8)
                        )
                    }
                }

                AnimatedVisibility(visible = showHistory) {
                    Column(
                        modifier = Modifier.padding(top = 6.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        payouts.forEach { p ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color.White, RoundedCornerShape(6.dp))
                                    .padding(6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = dateFormat.format(Date(p.date)),
                                    fontSize = 11.sp,
                                    color = Color(0xFF64748B)
                                )
                                Text(
                                    text = numberFormat.format(p.amount),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFFDC2626)
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = payoutInput,
                    onValueChange = {
                        payoutInput = it
                        errorMsg = null
                    },
                    placeholder = { Text("Сумма выплаты") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.weight(1f).testTag("payout_input"),
                    shape = RoundedCornerShape(8.dp)
                )

                Spacer(modifier = Modifier.width(8.dp))

                Button(
                    onClick = {
                        val amount = payoutInput.replace(',', '.').toDoubleOrNull()
                        if (amount == null || amount <= 0) {
                            errorMsg = "Введите сумму > 0"
                        } else {
                            onAddPayout(amount) { err -> errorMsg = err }
                            payoutInput = ""
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFB91C1C)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Выплатить", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }

            errorMsg?.let {
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = it, color = Color(0xFFDC2626), fontSize = 11.sp)
            }
        }
    }
}

@Composable
private fun AddEditEmployeeSubDialog(
    existingEmployee: EmployeeDbEntity?,
    onDismiss: () -> Unit,
    onSave: (name: String, salary: Double, onError: (String) -> Unit) -> Unit
) {
    var nameText by remember { mutableStateOf(existingEmployee?.name ?: "") }
    var salaryText by remember { mutableStateOf(existingEmployee?.salary?.let { if (it % 1 == 0.0) it.toLong().toString() else it.toString() } ?: "") }
    var errorText by remember { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = if (existingEmployee != null) "Редактировать сотрудника" else "Добавить сотрудника",
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp,
                    color = Color(0xFF1E293B)
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = nameText,
                    onValueChange = {
                        nameText = it
                        errorText = null
                    },
                    label = { Text("Имя сотрудника") },
                    placeholder = { Text("Иван Иванов") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("employee_name_input")
                )

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = salaryText,
                    onValueChange = {
                        salaryText = it
                        errorText = null
                    },
                    label = { Text("Месячная зарплата (₽)") },
                    placeholder = { Text("70000") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("employee_salary_input")
                )

                errorText?.let {
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(text = it, color = Color(0xFFDC2626), fontSize = 12.sp)
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = onDismiss) { Text("Отмена", color = Color(0xFF64748B)) }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            val salaryParsed = salaryText.replace(',', '.').toDoubleOrNull()
                            if (nameText.isBlank()) {
                                errorText = "Имя не может быть пустым"
                            } else if (salaryParsed == null || salaryParsed <= 0) {
                                errorText = "Введите зарплату больше 0 ₽"
                            } else {
                                onSave(nameText.trim(), salaryParsed) { err -> errorText = err }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1D4ED8))
                    ) {
                        Text("Сохранить", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
