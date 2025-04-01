// src/components/payments/receipt.tsx
'use client'

import React, { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
// Import the display map along with other formatters
import { formatCurrency, formatDate, formatMonth, paymentMethodDisplayMap } from '@/lib/utils/format'
import { Printer } from 'lucide-react'
import AutoPrintReceipt from './auto-print-receipt'

// Import PaymentMethod enum type
import { PaymentMethod as PrismaPaymentMethod } from '@prisma/client';

interface PaymentDetails {
    id: string
    receiptNumber: string
    amount: any
    paymentDate: string | Date
    paymentMethod: PrismaPaymentMethod // Use enum type
    forMonth: number
    forYear?: number
    isPartial: boolean
    notes?: string | null
    transactionId: string
    student: {
        name: string
        grade: {
            name: string
            tuitionAmount: any
        }
        tutor: { // Added tutor object
            name: string | null // Assuming tutor might be optional or name nullable
        } | null // Assuming tutor relation might be optional
    }
    schoolYear: {
        name: string
    }
    clerk: {
        name: string
    }
    relatedPayments?: PaymentDetails[]  // For multiple month payments from the same transaction
}

interface ReceiptProps {
    payment: PaymentDetails
    schoolName?: string
    schoolLogo?: string
    schoolAddress?: string
    schoolPhone?: string
    schoolEmail?: string
}

const Receipt = ({
    payment,
    schoolName = "School Payment System",
    schoolLogo = "/logo.png",
    schoolAddress = "123 Education Lane, Schooltown",
    schoolPhone = "(123) 456-7890",
    schoolEmail = "admin@school.edu"
}: ReceiptProps) => {
    const receiptRef = useRef<HTMLDivElement>(null)

    // Check if this is a multi-month payment based on related payments
    const isMultiMonthPayment = payment.relatedPayments &&
        Array.isArray(payment.relatedPayments) &&
        payment.relatedPayments.length > 0;

    const printReceipt = () => {
        const printWindow = window.open('', '', 'width=800,height=600')
        if (!printWindow) return

        const content = receiptRef.current?.innerHTML || ''

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payment Receipt #${payment.receiptNumber}</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    /* Base styling */
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.5;
                        margin: 0;
                        padding: 0;
                        background: white;
                        color: black;
                    }
                    
                    /* Receipt container */
                    .receipt {
                        width: 80mm; /* Standard receipt width */
                        max-width: 100%;
                        margin: 0 auto;
                        padding: 10px;
                        box-sizing: border-box;
                    }
                    
                    /* Receipt header */
                    .receipt-header {
                        text-align: center;
                        margin-bottom: 10px;
                    }
                    
                    .receipt-header h1 {
                        font-size: 16px;
                        font-weight: bold;
                        margin: 5px 0;
                    }
                    
                    .receipt-header p {
                        font-size: 12px;
                        margin: 2px 0;
                    }
                    
                    /* Receipt body */
                    .receipt-title {
                        text-align: center;
                        font-weight: bold;
                        margin: 10px 0;
                        font-size: 14px;
                        text-transform: uppercase;
                        border-top: 1px dashed #000;
                        border-bottom: 1px dashed #000;
                        padding: 5px 0;
                    }
                    
                    .receipt-info {
                        font-size: 12px;
                    }
                    
                    .receipt-info div {
                        display: flex;
                        justify-content: space-between;
                        margin: 4px 0;
                    }
                    
                    .receipt-info .label {
                        font-weight: bold;
                    }
                    
                    /* Receipt total */
                    .receipt-total {
                        margin-top: 10px;
                        padding: 5px 0;
                        border-top: 1px dashed #000;
                        font-weight: bold;
                        font-size: 14px;
                        display: flex;
                        justify-content: space-between;
                    }
                    
                    /* Receipt footer */
                    .receipt-footer {
                        margin-top: 10px;
                        text-align: center;
                        font-size: 12px;
                        border-top: 1px dashed #000;
                        padding-top: 10px;
                    }
                    
                    /* Print button - hide when printing */
                    @media print {
                        .no-print {
                            display: none !important;
                        }
                    }

                    /* Table styles for payment breakdown */
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 8px 0;
                        font-size: 12px;
                    }
                    
                    table th, table td {
                        padding: 4px;
                        text-align: left;
                        border-bottom: 1px solid #eee;
                    }
                    
                    table th {
                        font-weight: bold;
                    }
                    
                    table tr:last-child td {
                        border-bottom: none;
                    }
                    
                    .text-right {
                        text-align: right;
                    }
                </style>
            </head>
            <body>
                <div class="receipt">
                    ${content}
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `)

        printWindow.document.close()
    }

    // Format payment data
    const paymentAmount = typeof payment.amount === 'object' ?
        parseFloat(payment.amount.toString()) :
        (typeof payment.amount === 'string' ?
            parseFloat(payment.amount) :
            payment.amount)

    const tuitionAmount = typeof payment.student.grade.tuitionAmount === 'object' ?
        parseFloat(payment.student.grade.tuitionAmount.toString()) :
        (typeof payment.student.grade.tuitionAmount === 'string' ?
            parseFloat(payment.student.grade.tuitionAmount) :
            payment.student.grade.tuitionAmount)

    // Calculate total amount from all related payments if present
    // These will only be payments from the same transaction now
    const totalAmount = isMultiMonthPayment && Array.isArray(payment.relatedPayments)
        ? paymentAmount + payment.relatedPayments.reduce((sum, p) => {
            const amount = typeof p.amount === 'object'
                ? parseFloat(p.amount.toString())
                : (typeof p.amount === 'string'
                    ? parseFloat(p.amount)
                    : p.amount);
            return sum + amount;
        }, 0)
        : paymentAmount;

    // Get all payments (current + related) for display
    const allPayments = isMultiMonthPayment && Array.isArray(payment.relatedPayments)
        ? [payment, ...payment.relatedPayments]
        : [payment];

    // Sort payments by month/year
    const sortedPayments = [...allPayments].sort((a, b) => {
        // If we have years, compare years first
        if (a.forYear !== undefined && b.forYear !== undefined) {
            if (a.forYear !== b.forYear) return a.forYear - b.forYear;
        }
        // Then compare months
        return a.forMonth - b.forMonth;
    });

    // Calculate balance remaining for partial payments
    const balanceRemaining = payment.isPartial ? tuitionAmount - paymentAmount : 0;

    return (
        <div>
            <AutoPrintReceipt printFunction={printReceipt} />

            <div className="print:hidden mb-4 flex justify-between">
                <h1 className="text-xl font-bold">Receipt #{payment.receiptNumber}</h1>
                <Button variant="outline" onClick={printReceipt}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Receipt
                </Button>
            </div>

            <Card className="p-6 max-w-[80mm] mx-auto border bg-white receipt-container">
                <div ref={receiptRef}>
                    {/* Receipt Header */}
                    <div className="receipt-header">
                        {schoolLogo && (
                            <div className="flex justify-center mb-2">
                                <img
                                    src={schoolLogo}
                                    alt={schoolName}
                                    className="h-12 print:h-10"
                                />
                            </div>
                        )}
                        <h1>{schoolName}</h1>
                        <p className="text-sm">{schoolAddress}</p>
                        <p className="text-sm">{schoolPhone}</p>
                        <p className="text-sm">{schoolEmail}</p>
                    </div>

                    {/* Receipt Title */}
                    <div className="receipt-title border-t border-b border-dashed py-1 my-3 text-center font-bold uppercase text-sm">
                        Payment Receipt
                    </div>

                    {/* Receipt Info */}
                    <div className="receipt-info space-y-1 text-sm">
                        <div>
                            <span className="label">Receipt #:</span>
                            <span>{payment.receiptNumber}</span>
                        </div>
                        <div>
                            <span className="label">Date:</span>
                            <span>{formatDate(payment.paymentDate)}</span>
                        </div>
                        <div>
                            <span className="label">Student:</span>
                            <span>{payment.student.name}</span>
                        </div>
                        <div>
                            <span className="label">Grade:</span>
                            <span>{payment.student.grade.name}</span>
                        </div>
                        <div>
                            <span className="label">School Year:</span>
                            <span>{payment.schoolYear.name}</span>
                        </div>
                        <div>
                            <span className="label">Payment Method:</span>
                            {/* Use the display map, fallback to raw value if not found */}
                            <span>{paymentMethodDisplayMap[payment.paymentMethod] || payment.paymentMethod}</span>
                        </div>
                        {/* Replaced Payment Type with Tutor */}
                        <div>
                            <span className="label">Tutor:</span>
                            <span>{payment.student.tutor?.name ?? 'N/A'}</span>
                        </div>

                        {/* Payment breakdown table for multiple months */}
                        {isMultiMonthPayment && (
                            <div className="mt-2 w-full">
                                <div className="label mb-1">Payment Breakdown:</div>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr>
                                            <th>Month</th>
                                            <th className="text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Only showing payments from the same transaction */}
                                        {sortedPayments
                                            // Create a unique key for each month/year combination
                                            .filter((p, index, self) => {
                                                const key = `${p.forMonth}-${p.forYear || ''}`;
                                                // Keep only the first occurrence of each month/year
                                                return index === self.findIndex(t =>
                                                    `${t.forMonth}-${t.forYear || ''}` === key
                                                );
                                            })
                                            .map((p, index) => (
                                                <tr key={`payment-${index}-${p.forMonth}-${p.forYear || ''}`}>
                                                    <td>{formatMonth(p.forMonth)} {p.forYear}</td>
                                                    <td className="text-right">
                                                        {formatCurrency(
                                                            typeof p.amount === 'object'
                                                                ? parseFloat(p.amount.toString())
                                                                : (typeof p.amount === 'string'
                                                                    ? parseFloat(p.amount)
                                                                    : p.amount)
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {payment.isPartial && !isMultiMonthPayment && (
                            <>
                                <div>
                                    <span className="label">Monthly Fee:</span>
                                    <span>{formatCurrency(tuitionAmount)}</span>
                                </div>
                                <div>
                                    <span className="label">Balance Remaining:</span>
                                    <span>{formatCurrency(balanceRemaining)}</span>
                                </div>
                            </>
                        )}

                        {payment.notes && (
                            <div>
                                <span className="label">Notes:</span>
                                <span>{payment.notes}</span>
                            </div>
                        )}
                    </div>

                    {/* Receipt Total */}
                    <div className="receipt-total border-t border-dashed pt-2 mt-3 font-bold">
                        <span>TOTAL PAID:</span>
                        <span>{formatCurrency(totalAmount)}</span>
                    </div>

                    {/* Receipt Footer */}
                    <div className="receipt-footer border-t border-dashed pt-2 mt-3 text-center text-sm">
                        <p>Processed by: {payment.clerk.name}</p>
                        <p>Thank you!</p>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default Receipt
