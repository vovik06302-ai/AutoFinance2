package com.example.autofinance.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Navbar(
    onOpenTheme: () -> Unit,
    onOpenUpdate: () -> Unit,
    onOpenReport: () -> Unit,
    hasUpdateAvailable: Boolean
) {
    TopAppBar(
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = Color(0xFF1E293B), // Slate 800
            titleContentColor = Color.White
        ),
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "Авто",
                    color = Color(0xFF60A5FA), // Blue 400
                    fontWeight = FontWeight.Black,
                    fontSize = 20.sp
                )
                Text(
                    text = "Финансы",
                    color = Color.White,
                    fontWeight = FontWeight.Black,
                    fontSize = 20.sp
                )
            }
        },
        actions = {
            IconButton(
                onClick = onOpenTheme,
                modifier = Modifier.testTag("navbar_theme_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Palette,
                    contentDescription = "Тема оформления",
                    tint = Color(0xFFCBD5E1)
                )
            }

            IconButton(
                onClick = onOpenUpdate,
                modifier = Modifier.testTag("navbar_update_button")
            ) {
                Box {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Обновления",
                        tint = if (hasUpdateAvailable) Color(0xFFF59E0B) else Color(0xFFCBD5E1)
                    )
                    if (hasUpdateAvailable) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .align(Alignment.TopEnd)
                                .offset(x = 2.dp, y = (-2).dp)
                                .background(Color(0xFFF59E0B), CircleShape)
                        )
                    }
                }
            }

            IconButton(
                onClick = onOpenReport,
                modifier = Modifier.testTag("navbar_report_button")
            ) {
                Icon(
                    imageVector = Icons.Default.BarChart,
                    contentDescription = "Отчёт",
                    tint = Color(0xFFCBD5E1)
                )
            }
        },
        modifier = Modifier.fillMaxWidth()
    )
}
