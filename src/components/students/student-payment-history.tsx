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
import { Tooltip } from '@/components/ui/tooltip'
import { CalendarDays } from 'lucide-react'

interface Payment {
    id: string
    amount: any
    paymentDate: string | Date
    paymentMethod: string
    forMonth: number
    forYear?: number
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

    // Group payments by receipt number to identify multi-month payments
    const paymentsByReceipt = payments.reduce((groups, payment) => {
        if (!groups[payment.receiptNumber]) {
            groups[payment.receiptNumber] = [];
        }
        groups[payment.receiptNumber].push(payment);
        return groups;
    }, {} as Record<string, Payment[]>);

    // Create a derived list of payments with multi-month info
    const groupedPayments = Object.values(paymentsByReceipt).map(group => {
        const isMultiMonth = group.length > 1;
        const firstPayment = group[0];

        // Calculate total amount for the receipt
        const totalAmount = group.reduce((sum, payment) => {
            const amount = typeof payment.amount === 'object'
                ? parseFloat(payment.amount.toString())
                : (typeof payment.amount === 'string'
                    ? parseFloat(payment.amount)
                    : payment.amount);
            return sum + amount;
        }, 0);

        // Sort the months for display
        const sortedMonths = [...group].sort((a, b) => {
            if (a.forYear !== undefined && b.forYear !== undefined) {
                if (a.forYear !== b.forYear) return a.forYear - b.forYear;
            }
            return a.forMonth - b.forMonth;
        });

        // Generate a readable list of months
        const monthsList = sortedMonths.map(p =>
            `${formatMonth(p.forMonth)}${p.forYear ? ` ${p.forYear}` : ''}`
        ).join(', ');

        return {
            ...firstPayment, // Keep all original properties
            isMultiMonth,
            totalAmount,
            monthsList,
            relatedPayments: isMultiMonth ? group : undefined,
            displayMonth: isMultiMonth
                ? `Multiple (${group.length})`
                : formatMonth(firstPayment.forMonth)
        };
    });

    // Sort grouped payments by date (newest first)
    const sortedGroupedPayments = groupedPayments.sort((a, b) => {
        return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
    });

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
                        {sortedGroupedPayments.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                                <TableCell>{payment.receiptNumber}</TableCell>
                                <TableCell>
                                    {payment.isMultiMonth ? (
                                        <div className="flex items-center">
                                            <span>{payment.displayMonth}</span>
                                            <Tooltip content={payment.monthsList}>
                                                <div className="ml-1 cursor-help">
                                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            </Tooltip>
                                        </div>
                                    ) : (
                                        payment.displayMonth
                                    )}
                                </TableCell>
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
                                    {formatCurrency(payment.isMultiMonth
                                        ? payment.totalAmount
                                        : parseFloat(payment.amount.toString())
                                    )}
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