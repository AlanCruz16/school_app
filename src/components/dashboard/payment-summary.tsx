// src/components/dashboard/payment-summary.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatMonth } from '@/lib/utils/format'
import { cn } from '@/lib/utils/utils'
import { ChevronRight } from 'lucide-react'
import { getAllSchoolYearMonths, formatMonthYear, type MonthYearPair } from '@/lib/utils/balance'

interface Payment {
    id: string
    studentId: string
    amount: any // This allows for Prisma Decimal type
    forMonth: number | null // Allow null for backward compatibility or optional payments
    forYear?: number // Added to handle year information
    isPartial: boolean
    schoolYearId: string // Added to relate to school year
    student: {
        name: string
        grade: {
            name: string
        }
    }
}

interface PaymentSummaryProps {
    payments: Payment[]
    totalStudents: number
    currentMonth: number
    activeSchoolYear?: {  // Make it optional with ? and match your actual data structure
        id: string
        name: string
        startDate: string | Date  // Accept either string or Date
        endDate: string | Date    // Accept either string or Date
        active?: boolean          // Make these optional
        createdAt?: Date | string
        updatedAt?: Date | string
    }

}


export default function PaymentSummary({
    payments,
    totalStudents,
    currentMonth,
    activeSchoolYear
}: PaymentSummaryProps) {
    // Add the null check here, replacing the existing allMonthYears calculation
    const allMonthYears = activeSchoolYear
        ? getAllSchoolYearMonths(activeSchoolYear)
        : [{
            month: currentMonth,
            year: new Date().getFullYear(),
            key: `${new Date().getFullYear()}-${currentMonth.toString().padStart(2, '0')}`
        }];
    // Find current month-year (closest to today's date)
    const today = new Date()
    const currentMonthYear = allMonthYears.find(my =>
        my.month === today.getMonth() + 1 &&
        my.year === today.getFullYear()
    ) || allMonthYears[0] // Fallback to first month if not found

    // State for selected month-year
    const [selectedMonthYear, setSelectedMonthYear] = useState<MonthYearPair>(currentMonthYear)

    // Filter payments for the selected month-year
    const paymentsForMonthYear = payments.filter(payment => {
        if (payment.forYear) {
            // If forYear is available, use exact matching
            return payment.forMonth === selectedMonthYear.month &&
                payment.forYear === selectedMonthYear.year
        } else {
            // For backward compatibility, just use month
            return payment.forMonth === selectedMonthYear.month
        }
    })

    // Group payments by student
    const studentPayments = new Map()
    paymentsForMonthYear.forEach(payment => {
        if (!studentPayments.has(payment.studentId)) {
            studentPayments.set(payment.studentId, {
                name: payment.student.name,
                grade: payment.student.grade.name,
                totalPaid: 0,
                isPartial: false,
                payments: []
            })
        }

        const entry = studentPayments.get(payment.studentId)
        const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount

        entry.totalPaid += amount
        entry.isPartial = entry.isPartial || payment.isPartial
        entry.payments.push(payment)

        studentPayments.set(payment.studentId, entry)
    })

    // Calculate statistics
    const paidStudents = Array.from(studentPayments.values()).filter(student => !student.isPartial).length
    const partialStudents = Array.from(studentPayments.values()).filter(student => student.isPartial).length
    const unpaidStudents = totalStudents - paidStudents - partialStudents

    // Get total amount collected for the month-year
    const totalCollected = paymentsForMonthYear.reduce((sum, payment) => {
        // Handle Prisma Decimal, string, or number types
        const amount = typeof payment.amount === 'object' ?
            parseFloat(payment.amount.toString()) :
            (typeof payment.amount === 'string' ?
                parseFloat(payment.amount) :
                payment.amount)
        return sum + amount
    }, 0)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Resumen de Pagos - {formatMonthYear(selectedMonthYear)}</CardTitle>
                <CardDescription>
                    Resumen del estado de pagos para {formatMonthYear(selectedMonthYear)}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{paidStudents}</div>
                        <div className="text-sm text-muted-foreground">Pagado Completo</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{partialStudents}</div>
                        <div className="text-sm text-muted-foreground">Pagado Parcial</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-600">{unpaidStudents}</div>
                        <div className="text-sm text-muted-foreground">No Pagado</div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="text-lg font-medium mb-2">Navegación del Año Escolar</div>
                    <div className="flex flex-wrap gap-2">
                        {allMonthYears.map(monthYear => {
                            // Check if there are any payments for this month-year
                            const hasPayments = payments.some(payment => {
                                if (payment.forYear) {
                                    return payment.forMonth === monthYear.month &&
                                        payment.forYear === monthYear.year
                                } else {
                                    return payment.forMonth === monthYear.month
                                }
                            })

                            return (
                                <Button
                                    key={monthYear.key}
                                    variant={selectedMonthYear.key === monthYear.key ? "default" : hasPayments ? "outline" : "ghost"}
                                    size="sm"
                                    onClick={() => setSelectedMonthYear(monthYear)}
                                    className={hasPayments ? "" : "opacity-50"}
                                >
                                    {formatMonth(monthYear.month).substring(0, 3)} {monthYear.year.toString().slice(2)}
                                    {hasPayments && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary-foreground inline-block"></span>}
                                </Button>
                            )
                        })}
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-medium">Pagos Recientes</div>
                    <div className="text-lg font-bold">
                        {formatCurrency(totalCollected)}
                    </div>
                </div>

                {paymentsForMonthYear.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                        No hay pagos registrados para {formatMonthYear(selectedMonthYear)}
                    </div>
                ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {paymentsForMonthYear.slice(0, 5).map(payment => (
                            <div
                                key={payment.id}
                                className={cn(
                                    "p-3 rounded-lg border-l-4",
                                    payment.isPartial
                                        ? "bg-yellow-50 border-yellow-200"
                                        : "bg-green-50 border-green-200"
                                )}
                            >
                                <div className="flex justify-between">
                                    <div className="font-medium">{payment.student.name}</div>
                                    <div className="font-semibold">
                                        {formatCurrency(
                                            typeof payment.amount === 'object'
                                                ? parseFloat(payment.amount.toString())
                                                : (typeof payment.amount === 'string'
                                                    ? parseFloat(payment.amount)
                                                    : payment.amount)
                                        )}
                                    </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {payment.student.grade.name}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button asChild variant="outline" className="w-full">
                    <Link href="/calendar" className="flex items-center justify-center">
                        Ver Calendario Completo
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
