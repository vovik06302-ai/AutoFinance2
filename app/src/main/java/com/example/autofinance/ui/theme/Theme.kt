package com.example.autofinance.ui.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import com.example.autofinance.model.AppTheme
import com.example.autofinance.model.ThemeConfig

val BluePrimary = Color(0xFF1D4ED8)
val BlueContainer = Color(0xFFDBEAFE)
val BlueBgLight = Color(0xFFEFF6FF)

val GreenPrimary = Color(0xFF047857)
val GreenContainer = Color(0xD1D1FAE5)
val GreenBgLight = Color(0xFFECFDF5)

val PurplePrimary = Color(0xFF7E22CE)
val PurpleContainer = Color(0xFFF3E8FF)
val PurpleBgLight = Color(0xFFFAF5FF)

val OrangePrimary = Color(0xFFC2410C)
val OrangeContainer = Color(0xFFFFEDD5)
val OrangeBgLight = Color(0xFFFFF7ED)

val RedPrimary = Color(0xFFB91C1C)
val RedContainer = Color(0xFFFEE2E2)
val RedBgLight = Color(0xFFFEF2F2)

fun getThemeConfig(theme: AppTheme): ThemeConfig {
    return when (theme) {
        AppTheme.BLUE -> ThemeConfig(
            label = "Синяя (по умолчанию)",
            primaryColor = BluePrimary,
            primaryContainerColor = BlueContainer,
            bgLightColor = BlueBgLight,
            borderColor = Color(0xFFBFDBFE)
        )
        AppTheme.GREEN -> ThemeConfig(
            label = "Изумрудная",
            primaryColor = GreenPrimary,
            primaryContainerColor = GreenContainer,
            bgLightColor = GreenBgLight,
            borderColor = Color(0xFFA7F3D0)
        )
        AppTheme.PURPLE -> ThemeConfig(
            label = "Фиолетовая",
            primaryColor = PurplePrimary,
            primaryContainerColor = PurpleContainer,
            bgLightColor = PurpleBgLight,
            borderColor = Color(0xFFE9D5FF)
        )
        AppTheme.ORANGE -> ThemeConfig(
            label = "Оранжевая",
            primaryColor = OrangePrimary,
            primaryContainerColor = OrangeContainer,
            bgLightColor = OrangeBgLight,
            borderColor = Color(0xFFFED7AA)
        )
        AppTheme.RED -> ThemeConfig(
            label = "Красная",
            primaryColor = RedPrimary,
            primaryContainerColor = RedContainer,
            bgLightColor = RedBgLight,
            borderColor = Color(0xFFFECACA)
        )
    }
}

@Composable
fun AutoFinanceTheme(
    appTheme: AppTheme = AppTheme.BLUE,
    content: @Composable () -> Unit
) {
    val config = getThemeConfig(appTheme)

    val colorScheme: ColorScheme = lightColorScheme(
        primary = config.primaryColor,
        onPrimary = Color.White,
        primaryContainer = config.primaryContainerColor,
        onPrimaryContainer = config.primaryColor,
        background = Color(0xFFF1F5F9), // Slate 100
        onBackground = Color(0xFF0F172A),
        surface = Color.White,
        onSurface = Color(0xFF0F172A),
        surfaceVariant = config.bgLightColor,
        outline = config.borderColor
    )

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
