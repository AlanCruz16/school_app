'use client'

import { useRef } from 'react'
// Import PaymentMethod and PaymentType enum types and display map
import { PaymentMethod as PrismaPaymentMethod, PaymentType } from '@prisma/client';
import { formatCurrency, formatDate, formatMonth, paymentMethodDisplayMap } from '@/lib/utils/format'

interface PaymentReceiptProps {
    payment: {
        id: string
        amount: any
        paymentDate: string | Date
        paymentMethod: PrismaPaymentMethod // Use enum type
        paymentType?: PaymentType // Added
        description?: string // Added
        forMonth?: number | null // Made nullable
        forYear?: number // Added
        isPartial: boolean
        receiptNumber: string
        notes?: string | null
        student: {
            name: string
            grade?: {
                name: string
            }
            tutor?: {
                name: string
                email: string
                phone: string
            }
        }
        schoolYear: {
            name: string
        }
        clerk: {
            name: string
        }
    }
}

export default function PaymentReceipt({ payment }: PaymentReceiptProps) {
    const receiptRef = useRef<HTMLDivElement>(null)

    return (
        <div ref={receiptRef} className="space-y-6 print:p-0">
            {/* School Header (would have logo in production) */}
            <div className="text-center space-y-1">
                <h1 className="text-xl font-bold">School Payment System</h1>
                <p className="text-sm text-muted-foreground">123 Education St, Learning City</p>
            </div>

            {/* Receipt Details */}
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-sm font-semibold">Receipt Information</h3>
                        <div className="mt-1 space-y-1">
                            <p className="text-sm">
                                <span className="font-medium">Date: </span>
                                {formatDate(payment.paymentDate)}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium">Receipt #: </span>
                                {payment.receiptNumber}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium">Payment Method: </span>
                                {/* Use display map */}
                                {paymentMethodDisplayMap[payment.paymentMethod] || payment.paymentMethod}
                            </p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold">Student Information</h3>
                        <div className="mt-1 space-y-1">
                            <p className="text-sm">
                                <span className="font-medium">Name: </span>
                                {payment.student.name}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium">Grade: </span>
                                {payment.student.grade?.name || 'N/A'}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium">Tutor: </span>
                                {payment.student.tutor?.name || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Payment Details */}
                <div className="mt-6">
                    <h3 className="text-sm font-semibold">Payment Details</h3>
                    <div className="mt-2 border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted">
                                <tr>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium">Description</th>
                                    <th scope="col" className="px-4 py-2 text-right text-xs font-medium">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <tr>
                                    <td className="px-4 py-3 text-sm">
                                        {/* Display Concept based on type */}
                                        {payment.paymentType === PaymentType.TUITION && payment.forMonth
                                            ? `Tuition - ${formatMonth(payment.forMonth)} ${payment.forYear || ''}`.trim()
                                            : payment.paymentType === PaymentType.INSCRIPTION
                                                ? `Inscription ${payment.forYear || ''}`.trim()
                                                : payment.paymentType === PaymentType.OPTIONAL
                                                    ? payment.description || 'Optional Payment'
                                                    : payment.forMonth // Fallback for older data
                                                        ? `Tuition - ${formatMonth(payment.forMonth)} ${payment.forYear || ''}`.trim()
                                                        : 'Payment'
                                        }
                                        {payment.isPartial && <span className="text-muted-foreground ml-1">(Partial)</span>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium">
                                        {formatCurrency(parseFloat(payment.amount.toString()))}
                                    </td>
                                </tr>
                                {payment.notes && (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-2 text-xs text-muted-foreground">
                                            <span className="font-medium">Notes: </span>
                                            {payment.notes}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-muted">
                                <tr>
                                    <th scope="row" className="px-4 py-2 text-left text-sm font-medium">Total</th>
                                    <td className="px-4 py-2 text-right text-sm font-bold">
                                        {formatCurrency(parseFloat(payment.amount.toString()))}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Receipt Footer */}
                <div className="mt-8 flex justify-between items-center text-sm">
                    <div>
                        <p className="font-medium">Received by:</p>
                        <p>{payment.clerk.name}</p>
                    </div>

                    <div className="text-right">
                        <p className="font-medium">Official Receipt</p>
                        <p className="text-xs text-muted-foreground">Issued on {formatDate(payment.paymentDate)}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
