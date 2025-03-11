'use client'

import { formatCurrency, formatMonth } from '@/lib/utils/format'

interface Payment {
    id: string
    amount: any
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
}

export default function StudentPaymentCalendar({
    payments,
    schoolYearId,
    monthlyFee
}: StudentPaymentCalendarProps) {
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
        }
    })

    return (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {monthPayments.map(({ month, status, totalPaid }) => (
                <div
                    key={month}
                    className={`p-4 rounded-lg border flex flex-col items-center justify-center
            ${status === 'paid' ? 'bg-green-50 border-green-200' : ''} 
            ${status === 'partial' ? 'bg-yellow-50 border-yellow-200' : ''}
            ${status === 'unpaid' ? 'bg-gray-50' : ''}
          `}
                >
                    <div className="text-lg font-semibold">{formatMonth(month)}</div>
                    <div className={`
            text-sm font-medium mt-1
            ${status === 'paid' ? 'text-green-600' : ''} 
            ${status === 'partial' ? 'text-yellow-600' : ''} 
            ${status === 'unpaid' ? 'text-gray-600' : ''}
          `}>
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
    )
}