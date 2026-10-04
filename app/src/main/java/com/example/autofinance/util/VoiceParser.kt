package com.example.autofinance.util

import com.example.autofinance.model.TransactionType
import com.example.autofinance.model.VoiceCommand
import java.util.Locale

object VoiceParser {

    private val wordToNumberMap = mapOf(
        "ноль" to 0.0,
        "один" to 1.0, "одна" to 1.0, "одно" to 1.0,
        "два" to 2.0, "две" to 2.0,
        "три" to 3.0,
        "четыре" to 4.0,
        "пять" to 5.0,
        "шесть" to 6.0,
        "семь" to 7.0,
        "восемь" to 8.0,
        "девять" to 9.0,
        "десять" to 10.0,
        "одиннадцать" to 11.0,
        "двенадцать" to 12.0,
        "тринадцать" to 13.0,
        "четырнадцать" to 14.0,
        "пятнадцать" to 15.0,
        "шестнадцать" to 16.0,
        "семнадцать" to 17.0,
        "восемнадцать" to 18.0,
        "девятнадцать" to 19.0,
        "двадцать" to 20.0,
        "тридцать" to 30.0,
        "сорок" to 40.0,
        "пятьдесят" to 50.0,
        "шестьдесят" to 60.0,
        "семьдесят" to 70.0,
        "восемьдесят" to 80.0,
        "девяносто" to 90.0,
        "сто" to 100.0,
        "двести" to 200.0,
        "триста" to 300.0,
        "четыреста" to 400.0,
        "пятьсот" to 500.0,
        "шестьсот" to 600.0,
        "семьсот" to 700.0,
        "восемьсот" to 800.0,
        "девятьсот" to 900.0
    )

    private val wordToScaleMap = mapOf(
        "тысяча" to 1000.0, "тысячи" to 1000.0, "тысяч" to 1000.0, "тыс" to 1000.0, "к" to 1000.0,
        "миллион" to 1000000.0, "миллиона" to 1000000.0, "миллионов" to 1000000.0, "млн" to 1000000.0
    )

    private data class VerbalParseResult(val amount: Double, val usedIndices: Set<Int>)

    private fun parseRussianVerbalNumberInWords(words: List<String>): VerbalParseResult {
        val usedIndices = mutableSetOf<Int>()
        var totalAmount = 0.0
        var currentChunk = 0.0

        var i = 0
        while (i < words.size) {
            val w = words[i].lowercase(Locale.getDefault()).replace(Regex("[.,]"), "")

            if (w == "с" && i + 1 < words.size && words[i + 1].lowercase(Locale.getDefault()).replace(Regex("[.,]"), "") == "половиной") {
                usedIndices.add(i)
                usedIndices.add(i + 1)
                if (currentChunk > 0) {
                    currentChunk += 0.5
                }
                i += 2
                continue
            }

            val numValue = wordToNumberMap[w]
            if (numValue != null) {
                usedIndices.add(i)
                currentChunk += numValue
                i++
                continue
            }

            val scaleValue = wordToScaleMap[w]
            if (scaleValue != null) {
                usedIndices.add(i)
                if (currentChunk == 0.0) currentChunk = 1.0
                totalAmount += currentChunk * scaleValue
                currentChunk = 0.0
                i++
                continue
            }

            if (w == "полтора" || w == "полторы") {
                usedIndices.add(i)
                currentChunk += 1.5
                i++
                continue
            }

            i++
        }

        totalAmount += currentChunk
        return VerbalParseResult(totalAmount, usedIndices)
    }

    private data class AmountRemainder(val amount: Double, val remainder: String)

    private fun extractAmountAndRemainder(text: String): AmountRemainder {
        val digitRegex = Regex("(\\d+[\\d\\s.,]*\\d|\\d+)")
        val match = digitRegex.find(text)
        if (match != null) {
            val rawNumStr = match.value.replace("\\s+".toRegex(), "").replace(',', '.')
            val parsed = rawNumStr.toDoubleOrNull()
            if (parsed != null && parsed > 0) {
                val remainder = text.replace(match.value, "").trim()
                return AmountRemainder(parsed, remainder)
            }
        }

        val words = text.split(Regex("\\s+"))
        val verbalResult = parseRussianVerbalNumberInWords(words)
        if (verbalResult.amount > 0) {
            val remainderWords = words.filterIndexed { idx, _ -> !verbalResult.usedIndices.contains(idx) }
            return AmountRemainder(verbalResult.amount, remainderWords.joinToString(" "))
        }

        return AmountRemainder(0.0, text)
    }

    fun parseVoiceCommand(rawText: String): VoiceCommand {
        val text = rawText.lowercase(Locale.getDefault()).trim()
        if (text.isEmpty()) return VoiceCommand.Unknown(rawText)

        // Navigation & Control
        if (text.contains("отчёт") || text.contains("отчет")) {
            return VoiceCommand.NavigateReport
        }
        if (text.contains("главная") || text.contains("домой") || text.contains("на главную")) {
            return VoiceCommand.NavigateMain
        }
        if (text == "назад" || text.contains("вернись") || text.contains("страница назад")) {
            return VoiceCommand.NavigateBack
        }
        if (text.contains("удали последнее") || text.contains("удалить последнее") || text.contains("стереть последнее")) {
            return VoiceCommand.DeleteLast
        }
        if (text.contains("обнови") || text.contains("проверь обновления") || text.contains("проверить обновления") || text.contains("обновление")) {
            return VoiceCommand.CheckUpdate
        }

        // Transaction keywords
        val isProfit = text.contains("прибыль") || text.contains("доход") || text.contains("оплата") || text.contains("заработок")
        val isExpense = text.contains("трата") || text.contains("траты") || text.contains("расход") || text.contains("расходы") || text.contains("расходники") || text.contains("расходник") || text.contains("покупка")
        val isDebtor = text.contains("должник") || text.contains("долг") || text.contains("должники") || text.contains("в долг")

        if (isProfit || isExpense || isDebtor) {
            val type = if (isDebtor) TransactionType.DEBTOR else if (isExpense) TransactionType.EXPENSE else TransactionType.PROFIT

            val (amount, rawRemainder) = extractAmountAndRemainder(text)
            var remainder = rawRemainder
                .replace(Regex("прибыль|доход|трата|траты|расход|расходы|должник|должники|долг"), "")
                .replace(Regex("\\s+"), " ")
                .trim()

            if (amount > 0) {
                var clientInfo = ""
                var note = remainder

                if (type == TransactionType.DEBTOR) {
                    val parts = remainder.split(" ")
                    if (parts.size >= 2) {
                        clientInfo = "${parts[0]} ${parts[1]}".trim()
                        note = if (parts.size > 2) parts.subList(2, parts.size).joinToString(" ") else remainder
                    } else {
                        clientInfo = remainder
                    }
                } else {
                    val words = remainder.split(" ")
                    if (words.size > 1 && words.last().length > 2 && words.last()[0].isUpperCase()) {
                        clientInfo = words.last()
                        note = words.subList(0, words.size - 1).joinToString(" ")
                    }
                }

                return VoiceCommand.AddTransaction(
                    type = type,
                    amount = amount,
                    note = note.ifEmpty { "Голосовая запись" },
                    clientInfo = clientInfo
                )
            }
        }

        return VoiceCommand.Unknown(rawText)
    }
}
