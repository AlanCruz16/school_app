// src/components/students/student-payment-calendar.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatMonth } from '@/lib/utils/format'
import { cn } from '@/lib/utils/utils'
import Link from 'next/link'
import { CreditCard, ArrowRight } from 'lucide-react'
import {
    getUnpaidMonths,
    getAllSchoolYearMonths,
    formatMonthYear,
    type MonthYearPair
} from '@/lib/utils/balance'

interface Student {
    id: string
    name: string
    gradeId: string
    active: boolean
    grade: {
        name: string
        tuitionAmount: any
        schoolYear?: {
            id: string
            name: string
        }
    }
    payments?: Payment[]
}

interface Payment {
    id: string
    studentId: string
    amount: any // Changed to handle Prisma Decimal type
    paymentDate: string | Date
    paymentMethod: string
    forMonth: number | null // Allow null for backward compatibility or optional payments
    forYear?: number // Optional: the specific year for the payment
    isPartial: boolean
    schoolYearId: string
    student?: {
        name: string
        grade?: {
            name: string
        }
    }
}

interface SchoolYear {
    id: string
    name: string
    startDate: Date | string
    endDate: Date | string
    active: boolean
}

interface StudentPaymentCalendarProps {
    payments: Payment[]
    schoolYearId: string
    monthlyFee: number
    studentId: string
    student: Student
    activeSchoolYear?: SchoolYear
}

export default function StudentPaymentCalendar({
    payments,
    schoolYearId,
    monthlyFee,
    studentId,
    student,
    activeSchoolYear
}: StudentPaymentCalendarProps) {
    const [selectedMonthYear, setSelectedMonthYear] = useState<MonthYearPair | null>(null)

    // Filter payments for the current school year
    const currentYearPayments = payments.filter(
        (payment) => payment.schoolYearId === schoolYearId
    )

    // If there's no active school year, we can't proceed
    if (!activeSchoolYear) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No hay año escolar activo configurado. Por favor, configure un año escolar primero.
            </div>
        )
    }

    // Get all months in the school year (for display)
    const allSchoolYearMonths = getAllSchoolYearMonths(activeSchoolYear)

    // Calculate months that should be paid using our utility function
    const monthStatusList = getUnpaidMonths(student, activeSchoolYear, currentYearPayments)

    // Create a map for easier lookup using our keys
    const monthStatusMap = new Map(
        monthStatusList.map(item => [item.monthYear.key, item])
    )

    // Create a map of month-years to payment status
    const monthPayments = allSchoolYearMonths.map((monthYear) => {
        // First check if this month is in our status map
        const monthData = monthStatusMap.get(monthYear.key)

        // Find all payments for this specific month and year
        const paymentsForMonth = currentYearPayments.filter(payment => {
            // If payment has a forYear field, use exact matching
            if (payment.forYear) {
                return payment.forMonth === monthYear.month && payment.forYear === monthYear.year
            }
            // Otherwise, just match on month (for backward compatibility)
            return payment.forMonth === monthYear.month
        })

        const totalPaid = paymentsForMonth.reduce(
            (sum, payment) => sum + parseFloat(payment.amount.toString()),
            0
        )

        // Determine status based on our calculated status or fallback logic
        let status = 'future' // Default for future months
        let shouldBePaid = false

        if (monthData) {
            status = monthData.status
            shouldBePaid = true
        } else {
            // Fall back to simple calculation if no month data from utility
            if (totalPaid >= monthlyFee) {
                status = 'paid'
            } else if (totalPaid > 0) {
                status = 'partial'
            } else {
                status = 'unpaid'
            }
        }

        return {
            monthYear, // Now includes both month, year and key
            status,
            totalPaid,
            remainingBalance: Math.max(0, monthlyFee - totalPaid),
            payments: paymentsForMonth,
            shouldBePaid // Flag to indicate if this month should be paid by now
        }
    })

    const statusColors = {
        paid: 'bg-green-50 border-green-200 border-l-green-500',
        partial: 'bg-yellow-50 border-yellow-200 border-l-yellow-500',
        unpaid: 'bg-gray-50 border-gray-200',
        future: 'bg-gray-50 border-gray-200 opacity-60'
    }

    const statusTextColors = {
        paid: 'text-green-600',
        partial: 'text-yellow-600',
        unpaid: 'text-gray-500',
        future: 'text-gray-400'
    }

    // Handle month click
    const handleMonthYearClick = (monthYear: MonthYearPair) => {
        setSelectedMonthYear(selectedMonthYear?.key === monthYear.key ? null : monthYear)
    }

    return (
        <>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {monthPayments.map((monthPayment) => {
                    const { monthYear, status, totalPaid, shouldBePaid } = monthPayment
                    const isSelected = selectedMonthYear?.key === monthYear.key

                    return (
                        <div
                            key={monthYear.key}
                            onClick={() => handleMonthYearClick(monthYear)}
                            className={cn(
                                "p-4 rounded-lg border border-l-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow",
                                statusColors[status as keyof typeof statusColors],
                                shouldBePaid && status === 'unpaid' ? 'border-destructive border-l-destructive animate-pulse' : '',
                                isSelected ? 'ring-2 ring-primary' : ''
                            )}
                        >
                            <div className="text-lg font-semibold">{formatMonth(monthYear.month)}</div>
                            <div className="text-xs text-muted-foreground">{monthYear.year}</div>
                            <div className={cn(
                                "text-sm font-medium mt-1",
                                statusTextColors[status as keyof typeof statusTextColors]
                            )}>
                                {status === 'paid' && 'Pagado'}
                                {status === 'partial' && 'Parcial'}
                                {status === 'unpaid' && (shouldBePaid ? 'Vencido' : 'No Pagado')}
                                {status === 'future' && 'Próximo'}
                            </div>
                            <div className="mt-2 text-sm">
                                {formatCurrency(totalPaid)} / {formatCurrency(monthlyFee)}
                            </div>

                            {shouldBePaid && status === 'unpaid' && (
                                <div className="mt-2 text-xs text-destructive font-semibold">
                                    Pago pendiente
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {selectedMonthYear && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">
                            Detalles de {formatMonthYear(selectedMonthYear)}
                        </h3>

                        {/* Find the payment info for this month */}
                        {(() => {
                            const info = monthPayments.find(mp => mp.monthYear.key === selectedMonthYear.key)
                            return info && info.status !== 'paid' && (
                                <Button asChild size="sm">
                                    <Link
                                        href={`/payments/new?studentId=${studentId}&month=${selectedMonthYear.month}&year=${selectedMonthYear.year}`}
                                    >
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Registrar Pago
                                    </Link>
                                </Button>
                            )
                        })()}
                    </div>

                    <div className="rounded-lg border p-4 space-y-4">
                        {(() => {
                            const info = monthPayments.find(mp => mp.monthYear.key === selectedMonthYear.key)
                            if (!info) return null

                            return (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Cuota Mensual</div>
                                            <div className="text-lg font-semibold">{formatCurrency(monthlyFee)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Monto Pagado</div>
                                            <div className="text-lg font-semibold">{formatCurrency(info.totalPaid)}</div>
                                        </div>
                                    </div>

                                    {/* Enhanced overdue payment highlight */}
                                    {info.shouldBePaid && info.status === 'unpaid' && (
                                        <div className="rounded-md bg-destructive/10 p-3 border border-destructive/20">
                                            <div className="text-sm font-medium text-destructive">Pago Vencido</div>
                                            <div className="text-lg font-bold text-destructive">
                                                {formatCurrency(info.remainingBalance)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Regular remaining balance */}
                                    {info.remainingBalance > 0 &&
                                        !(info.shouldBePaid && info.status === 'unpaid') && (
                                            <div className="rounded-md bg-yellow-50 p-3 border border-yellow-200">
                                                <div className="text-sm font-medium text-yellow-700">Saldo Restante</div>
                                                <div className="text-lg font-bold text-yellow-800">
                                                    {formatCurrency(info.remainingBalance)}
                                                </div>
                                            </div>
                                        )}

                                    {info.payments.length > 0 ? (
                                        <div>
                                            <div className="text-sm font-medium mb-2">Historial de Pagos</div>
                                            <div className="space-y-2">
                                                {info.payments.map((payment) => (
                                                    <div
                                                        key={payment.id}
                                                        className="flex items-center justify-between p-2 rounded-md bg-background border"
                                                    >
                                                        <div>
                                                            <div className="text-sm font-medium">
                                                                {new Date(payment.paymentDate).toLocaleDateString()}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {payment.isPartial ? 'Pago Parcial' : 'Pago Completo'}
                                                            </div>
                                                        </div>
                                                        <div className="font-semibold">
                                                            {formatCurrency(parseFloat(payment.amount.toString()))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-3 text-muted-foreground text-sm">
                                            No hay pagos registrados para este mes
                                        </div>
                                    )}
                                </>
                            )
                        })()}
                    </div>
                </div>
            )}
        </>
    )
}
