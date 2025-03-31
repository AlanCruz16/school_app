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
// Import the display map along with other formatters
import { formatCurrency, formatDate, formatMonth, paymentMethodDisplayMap } from '@/lib/utils/format'
import PaymentActionButtons from '@/components/payments/payment-action-buttons'
import { Tooltip } from '@/components/ui/tooltip'
import { CalendarDays, BookOpen, Gift } from 'lucide-react' // Added icons

// Import PaymentMethod and PaymentType enum types
import { PaymentMethod as PrismaPaymentMethod, PaymentType } from '@prisma/client';

interface Payment {
    id: string
    amount: any
    paymentDate: string | Date
    paymentMethod: PrismaPaymentMethod // Use enum type
    paymentType?: PaymentType // Added
    description?: string // Added
    forMonth?: number | null // Made nullable
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
            // Handle potentially null/undefined forMonth
            const monthA = a.forMonth ?? 0; // Default to 0 if null/undefined
            const monthB = b.forMonth ?? 0; // Default to 0 if null/undefined
            return monthA - monthB;
        });

        // Generate a readable list of months
        const monthsList = sortedMonths.map(p =>
            `${formatMonth(p.forMonth!)} ${p.forYear || ''}`.trim() // Added non-null assertion for formatMonth
        ).join(', ');

        // Determine the primary concept for the group
        let concept = 'Payment'; // Default
        if (firstPayment.paymentType === PaymentType.TUITION) {
            concept = isMultiMonth ? `Tuition - Multiple (${group.length})` : `Tuition - ${formatMonth(firstPayment.forMonth!)} ${firstPayment.forYear || ''}`.trim();
        } else if (firstPayment.paymentType === PaymentType.INSCRIPTION) {
            concept = `Inscription ${firstPayment.forYear || ''}`.trim();
        } else if (firstPayment.paymentType === PaymentType.OPTIONAL) {
            concept = firstPayment.description || 'Optional Payment';
        } else if (firstPayment.forMonth) { // Fallback for older data
            concept = isMultiMonth ? `Tuition - Multiple (${group.length})` : `Tuition - ${formatMonth(firstPayment.forMonth!)} ${firstPayment.forYear || ''}`.trim();
        }


        return {
            ...firstPayment, // Keep all original properties
            isMultiMonth,
            totalAmount,
            monthsList, // Keep for tooltip if needed
            relatedPayments: isMultiMonth ? group : undefined,
            displayConcept: concept // Use the determined concept
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
                            <TableHead>Concept</TableHead> {/* Changed Header */}
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
                                    {/* Display Concept */}
                                    <span>{payment.displayConcept}</span>
                                    {/* Optional: Keep tooltip for multi-month tuition details */}
                                    {payment.isMultiMonth && payment.paymentType === PaymentType.TUITION && (
                                        <Tooltip content={`Months: ${payment.monthsList}`}>
                                            <div className="ml-1 cursor-help inline-block">
                                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </Tooltip>
                                    )}
                                </TableCell>
                                <TableCell>{payment.schoolYear.name}</TableCell>
                                <TableCell>
                                    {/* Use the display map, fallback to raw value */}
                                    <Badge variant="outline">{paymentMethodDisplayMap[payment.paymentMethod] || payment.paymentMethod}</Badge>
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
