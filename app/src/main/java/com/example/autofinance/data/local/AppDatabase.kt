package com.example.autofinance.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.sqlite.db.SupportSQLiteDatabase
import com.example.autofinance.model.TransactionType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [TransactionDbEntity::class, EmployeeDbEntity::class, SalaryPayoutDbEntity::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {

    abstract fun transactionDao(): TransactionDao
    abstract fun employeeDao(): EmployeeDao
    abstract fun salaryPayoutDao(): SalaryPayoutDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "autofinance.db"
                )
                    .addCallback(object : RoomDatabase.Callback() {
                        override fun onCreate(db: SupportSQLiteDatabase) {
                            super.onCreate(db)
                            CoroutineScope(Dispatchers.IO).launch {
                                populateInitialData(getInstance(context))
                            }
                        }
                    })
                    .build()
                INSTANCE = instance
                instance
            }
        }

        private suspend fun populateInitialData(db: AppDatabase) {
            val now = System.currentTimeMillis()
            db.transactionDao().insertAll(
                listOf(
                    TransactionDbEntity(
                        type = TransactionType.PROFIT,
                        amount = 15000.0,
                        note = "Замена ГРМ и масляного сервиса",
                        clientInfo = "Toyota Camry A777AA77",
                        date = now - 3600000 * 5
                    ),
                    TransactionDbEntity(
                        type = TransactionType.EXPENSE,
                        amount = 4500.0,
                        note = "Покупка моторного масла и фильтров",
                        clientInfo = "Запчасти",
                        date = now - 3600000 * 24
                    ),
                    TransactionDbEntity(
                        type = TransactionType.DEBTOR,
                        amount = 8000.0,
                        note = "Диагностика подвески и замена рычагов",
                        clientInfo = "Сергей Kia Rio B123BB",
                        date = now - 3600000 * 48
                    )
                )
            )

            db.employeeDao().insertAll(
                listOf(
                    EmployeeDbEntity(
                        name = "Алексей (Механик)",
                        salary = 70000.0
                    ),
                    EmployeeDbEntity(
                        name = "Михаил (Электрик)",
                        salary = 85000.0
                    )
                )
            )
        }
    }
}
