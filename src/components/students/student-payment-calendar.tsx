// src/components/students/student-payment-calendar.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatMonth } from '@/lib/utils/format'
import { cn } from '@/lib/utils/utils'
import Link from 'next/link'
import { CreditCard, ArrowRight } from 'lucide-react'

interface Payment {
    id: string
    amount: any // This handles Prisma Decimal type
    paymentDate: string | Date
    forMonth: number
    isPartial: boolean
    schoolYear: {
        id: string
    }
}

interface StudentPaymentCalendarProps {
    payments: Payment[]
    schoolYearId: string
    monthlyFee: number
    studentId: string
}

export default function StudentPaymentCalendar({
    payments,
    schoolYearId,
    monthlyFee,
    studentId
}: StudentPaymentCalendarProps) {
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

    // Filter payments for the current school year
    const currentYearPayments = payments.filter(
        (payment) => payment.schoolYear.id === schoolYearId
    )

    // Create a map of months to payment status
    const monthPayments = Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
        const paymentsForMonth = currentYearPayments.filter(
            (payment) => payment.forMonth === month
        )

        const totalPaid = paymentsForMonth.reduce(
            (sum, payment) => sum + parseFloat(payment.amount.toString()),
            0
        )

        let status = 'unpaid'
        if (totalPaid >= monthlyFee) {
            status = 'paid'
        } else if (totalPaid > 0) {
            status = 'partial'
        }

        return {
            month,
            status,
            totalPaid,
            remainingBalance: Math.max(0, monthlyFee - totalPaid),
            payments: paymentsForMonth
        }
    })

    const statusColors = {
        paid: 'bg-green-50 border-green-200 border-l-green-500',
        partial: 'bg-yellow-50 border-yellow-200 border-l-yellow-500',
        unpaid: 'bg-gray-50 border-gray-200'
    }

    const statusTextColors = {
        paid: 'text-green-600',
        partial: 'text-yellow-600',
        unpaid: 'text-gray-500'
    }

    // Handle month click
    const handleMonthClick = (month: number) => {
        setSelectedMonth(selectedMonth === month ? null : month)
    }

    return (
        <>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {monthPayments.map(({ month, status, totalPaid }) => (
                    <div
                        key={month}
                        onClick={() => handleMonthClick(month)}
                        className={cn(
                            "p-4 rounded-lg border border-l-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow",
                            statusColors[status as keyof typeof statusColors],
                            selectedMonth === month ? 'ring-2 ring-primary' : ''
                        )}
                    >
                        <div className="text-lg font-semibold">{formatMonth(month)}</div>
                        <div className={cn(
                            "text-sm font-medium mt-1",
                            statusTextColors[status as keyof typeof statusTextColors]
                        )}>
                            {status === 'paid' && 'Paid'}
                            {status === 'partial' && 'Partial'}
                            {status === 'unpaid' && 'Unpaid'}
                        </div>
                        <div className="mt-2 text-sm">
                            {formatCurrency(totalPaid)} / {formatCurrency(monthlyFee)}
                        </div>
                    </div>
                ))}
            </div>

            {selectedMonth && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">
                            {formatMonth(selectedMonth)} Details
                        </h3>

                        {monthPayments[selectedMonth - 1].status !== 'paid' && (
                            <Button asChild size="sm">
                                <Link href={`/payments/new?studentId=${studentId}&month=${selectedMonth}`}>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Record Payment
                                </Link>
                            </Button>
                        )}
                    </div>

                    <div className="rounded-lg border p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Monthly Fee</div>
                                <div className="text-lg font-semibold">{formatCurrency(monthlyFee)}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Amount Paid</div>
                                <div className="text-lg font-semibold">{formatCurrency(monthPayments[selectedMonth - 1].totalPaid)}</div>
                            </div>
                        </div>

                        {monthPayments[selectedMonth - 1].remainingBalance > 0 && (
                            <div className="rounded-md bg-yellow-50 p-3 border border-yellow-200">
                                <div className="text-sm font-medium text-yellow-700">Remaining Balance</div>
                                <div className="text-lg font-bold text-yellow-800">
                                    {formatCurrency(monthPayments[selectedMonth - 1].remainingBalance)}
                                </div>
                            </div>
                        )}

                        {monthPayments[selectedMonth - 1].payments.length > 0 ? (
                            <div>
                                <div className="text-sm font-medium mb-2">Payment History</div>
                                <div className="space-y-2">
                                    {monthPayments[selectedMonth - 1].payments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="flex items-center justify-between p-2 rounded-md bg-background border"
                                        >
                                            <div>
                                                <div className="text-sm font-medium">
                                                    {new Date(payment.paymentDate).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {payment.isPartial ? 'Partial Payment' : 'Full Payment'}
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
                                No payments recorded for this month
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}