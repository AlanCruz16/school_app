// src/components/students/student-payment-history.tsx
'use client'

import Link from 'next/link'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatMonth } from '@/lib/utils/format'
import PaymentActionButtons from '@/components/payments/payment-action-buttons'

interface Payment {
    id: string
    amount: any
    paymentDate: string | Date
    paymentMethod: string
    forMonth: number
    isPartial: boolean
    receiptNumber: string
    notes?: string | null
    schoolYear: {
        name: string
    }
    clerk: {
        name: string
    }
}

interface StudentPaymentHistoryProps {
    payments: Payment[]
}

export default function StudentPaymentHistory({ payments }: StudentPaymentHistoryProps) {
    if (payments.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No payment records found for this student.
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <div className="max-h-[600px] overflow-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Receipt No.</TableHead>
                            <TableHead>Month</TableHead>
                            <TableHead>School Year</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Processed By</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                                <TableCell>{payment.receiptNumber}</TableCell>
                                <TableCell>{formatMonth(payment.forMonth)}</TableCell>
                                <TableCell>{payment.schoolYear.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{payment.paymentMethod}</Badge>
                                </TableCell>
                                <TableCell>
                                    {payment.isPartial ? (
                                        <Badge variant="secondary">Partial</Badge>
                                    ) : (
                                        <Badge variant="default">Full</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(parseFloat(payment.amount.toString()))}
                                </TableCell>
                                <TableCell>{payment.clerk.name}</TableCell>
                                <TableCell>
                                    <PaymentActionButtons paymentId={payment.id} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}