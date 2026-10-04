package com.example.autofinance.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.example.autofinance.model.TransactionType

@Entity(tableName = "transactions")
data class TransactionDbEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val type: TransactionType,
    val amount: Double,
    val note: String,
    val clientInfo: String,
    val date: Long
)

@Entity(tableName = "employees")
data class EmployeeDbEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val salary: Double
)

@Entity(tableName = "salary_payouts")
data class SalaryPayoutDbEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val employeeId: Long,
    val employeeName: String,
    val amount: Double,
    val date: Long
)
