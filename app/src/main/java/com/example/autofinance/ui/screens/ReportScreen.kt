package com.example.autofinance.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Download
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.autofinance.data.local.TransactionDbEntity
import com.example.autofinance.model.FilterPeriod
import com.example.autofinance.model.TransactionType
import com.example.autofinance.util.CsvExporter
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportScreen(
    transactions: List<TransactionDbEntity>,
    selectedFilter: FilterPeriod,
    onSelectFilter: (FilterPeriod) -> Unit,
    onNavigateBack: () -> Unit,
    onMarkPaid: (TransactionDbEntity) -> Unit
) {
    val context = LocalContext.current

    val filtered = rememberFilteredTransactions(transactions, selectedFilter)

    val profitItems = filtered.filter { it.type == TransactionType.PROFIT }
    val debtorItems = filtered.filter { it.type == TransactionType.DEBTOR }
    val expenseItems = filtered.filter { it.type == TransactionType.EXPENSE }

    val profitSum = profitItems.sumOf { it.amount }
    val debtorsSum = debtorItems.sumOf { it.amount }
    val expensesSum = expenseItems.sumOf { it.amount }
    val grandTotal = profitSum + debtorsSum - expensesSum

    val numberFormat = NumberFormat.getCurrencyInstance(Locale("ru", "RU")).apply {
        maximumFractionDigits = 0
    }
    val dateFormat = SimpleDateFormat("dd.MM.yyyy HH:mm", Locale("ru"))

    Scaffold(
        topBar = {
            TopAppBar(
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF1E293B),
                    titleContentColor = Color.White
                ),
                title = {
                    Text(
                        text = "Финансовый отчёт",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack, modifier = Modifier.testTag("report_back_button")) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Назад",
                            tint = Color.White
                        )
                    }
                },
                actions = {
                    IconButton(
                        onClick = {
                            CsvExporter.exportAndShareCsv(context, filtered, selectedFilter.label)
                        },
                        modifier = Modifier.testTag("export_csv_icon_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Download,
                            contentDescription = "Экспорт в CSV",
                            tint = Color(0xFFCBD5E1)
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
                .testTag("report_screen"),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item { Spacer(modifier = Modifier.height(4.dp)) }

            // Period Filter Chips Row
            item {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(FilterPeriod.values()) { period ->
                        val isSelected = period == selectedFilter
                        Box(
                            modifier = Modifier
                                .background(
                                    color = if (isSelected) Color(0xFF1D4ED8) else Color.White,
                                    shape = RoundedCornerShape(20.dp)
                                )
                                .clickable { onSelectFilter(period) }
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = period.label,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) Color.White else Color(0xFF334155)
                            )
                        }
                    }
                }
            }

            // 1. Profit Summary Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFECFDF5)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFA7F3D0))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Прибыль (Оплачено)",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = Color(0xFF064E3B)
                            )
                            Text(
                                text = "Записей: ${profitItems.size}",
                                fontSize = 12.sp,
                                color = Color(0xFF64748B)
                            )
                        }

                        Text(
                            text = numberFormat.format(profitSum),
                            fontWeight = FontWeight.Black,
                            fontSize = 20.sp,
                            color = Color(0xFF047857)
                        )
                    }
                }
            }

            // 2. Debtors Summary Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF7ED)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFED7AA))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Должники (Не оплачено)",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = Color(0xFF7C2D12)
                            )
                            Text(
                                text = "Записей: ${debtorItems.size}",
                                fontSize = 12.sp,
                                color = Color(0xFF64748B)
                            )
                        }

                        Text(
                            text = numberFormat.format(debtorsSum),
                            fontWeight = FontWeight.Black,
                            fontSize = 20.sp,
                            color = Color(0xFFEA580C)
                        )
                    }
                }
            }

            // Debtors Detailed List if available
            if (debtorItems.isNotEmpty()) {
                item {
                    Text(
                        text = "СПИСОК ДОЛЖНИКОВ (Кто, авто, за что, сколько):",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF9A3412),
                        letterSpacing = 0.5.sp
                    )
                }

                items(debtorItems, key = { it.id }) { debtor ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0))
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = debtor.clientInfo.ifEmpty { "Клиент не указан" },
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    color = Color(0xFF7C2D12)
                                )
                                Text(
                                    text = numberFormat.format(debtor.amount),
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 15.sp,
                                    color = Color(0xFFEA580C)
                                )
                            }

                            Spacer(modifier = Modifier.height(4.dp))

                            Text(
                                text = "За что: ${debtor.note.ifEmpty { "Замена деталей / услуга" }}",
                                fontSize = 12.sp,
                                color = Color(0xFF334155)
                            )

                            Spacer(modifier = Modifier.height(8.dp))
                            HorizontalDivider(color = Color(0xFFF1F5F9))
                            Spacer(modifier = Modifier.height(6.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = dateFormat.format(Date(debtor.date)),
                                    fontSize = 11.sp,
                                    color = Color(0xFF94A3B8)
                                )

                                Button(
                                    onClick = { onMarkPaid(debtor) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFECFDF5)),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFA7F3D0)),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = Color(0xFF059669),
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Должник оплатил",
                                        color = Color(0xFF065F46),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 3. Expenses Summary Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFECACA))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Расходники",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = Color(0xFF7F1D1D)
                            )
                            Text(
                                text = "Записей: ${expenseItems.size}",
                                fontSize = 12.sp,
                                color = Color(0xFF64748B)
                            )
                        }

                        Text(
                            text = numberFormat.format(expensesSum),
                            fontWeight = FontWeight.Black,
                            fontSize = 20.sp,
                            color = Color(0xFFB91C1C)
                        )
                    }
                }
            }

            // 4. Grand Total Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E3A8A))
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text(
                            text = "ОБЩИЙ ИТОГ (Прибыль + Должники − Расходники)",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFBFDBFE),
                            letterSpacing = 0.5.sp
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = numberFormat.format(grandTotal),
                            fontSize = 32.sp,
                            fontWeight = FontWeight.Black,
                            color = if (grandTotal >= 0) Color(0xFF34D399) else Color(0xFFF87171)
                        )
                    }
                }
            }

            // 5. CSV Export Button
            item {
                Button(
                    onClick = {
                        CsvExporter.exportAndShareCsv(context, filtered, selectedFilter.label)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                        .testTag("export_csv_button"),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1D4ED8)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(imageVector = Icons.Default.Download, contentDescription = null, tint = Color.White)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Экспортировать отчёт в CSV", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }
}

@Composable
private fun rememberFilteredTransactions(
    transactions: List<TransactionDbEntity>,
    period: FilterPeriod
): List<TransactionDbEntity> {
    val now = System.currentTimeMillis()
    val startTime = when (period) {
        FilterPeriod.TODAY -> {
            val date = Date(now)
            date.hours = 0
            date.minutes = 0
            date.seconds = 0
            date.time
        }
        FilterPeriod.WEEK -> now - 7L * 24 * 3600 * 1000
        FilterPeriod.MONTH -> now - 30L * 24 * 3600 * 1000
        FilterPeriod.ALL_TIME -> 0L
    }

    return transactions.filter { it.date >= startTime }
}
