package com.example.autofinance.data.local

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface TransactionDao {
    @Query("SELECT * FROM transactions ORDER BY date DESC")
    fun getAllTransactions(): Flow<List<TransactionDbEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(transaction: TransactionDbEntity): Long

    @Update
    suspend fun updateTransaction(transaction: TransactionDbEntity)

    @Delete
    suspend fun deleteTransaction(transaction: TransactionDbEntity)

    @Query("SELECT * FROM transactions ORDER BY date DESC LIMIT 1")
    suspend fun getLastTransaction(): TransactionDbEntity?

    @Query("DELETE FROM transactions WHERE id = (SELECT id FROM transactions ORDER BY date DESC LIMIT 1)")
    suspend fun deleteLastTransaction()

    @Query("SELECT COUNT(*) FROM transactions")
    suspend fun getCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(transactions: List<TransactionDbEntity>)
}

@Dao
interface EmployeeDao {
    @Query("SELECT * FROM employees ORDER BY id ASC")
    fun getAllEmployees(): Flow<List<EmployeeDbEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEmployee(employee: EmployeeDbEntity): Long

    @Update
    suspend fun updateEmployee(employee: EmployeeDbEntity)

    @Delete
    suspend fun deleteEmployee(employee: EmployeeDbEntity)

    @Query("SELECT COUNT(*) FROM employees")
    suspend fun getCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(employees: List<EmployeeDbEntity>)
}

@Dao
interface SalaryPayoutDao {
    @Query("SELECT * FROM salary_payouts ORDER BY date DESC")
    fun getAllPayouts(): Flow<List<SalaryPayoutDbEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPayout(payout: SalaryPayoutDbEntity): Long

    @Query("DELETE FROM salary_payouts WHERE employeeId = :employeeId")
    suspend fun deletePayoutsByEmployee(employeeId: Long)
}
