// src/components/dashboard/payment-summary.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatMonth } from '@/lib/utils/format'
import { cn } from '@/lib/utils/utils'
import { ChevronRight } from 'lucide-react'

interface Payment {
    id: string
    studentId: string
    amount: any // This allows for Prisma Decimal type
    forMonth: number
    isPartial: boolean
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
}

export default function PaymentSummary({ payments, totalStudents, currentMonth }: PaymentSummaryProps) {
    const [selectedMonth, setSelectedMonth] = useState(currentMonth)

    // Filter payments for the selected month
    const paymentsForMonth = payments.filter(payment => payment.forMonth === selectedMonth)

    // Group payments by student
    const studentPayments = new Map()
    paymentsForMonth.forEach(payment => {
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

    // Get total amount collected for the month
    const totalCollected = paymentsForMonth.reduce((sum, payment) => {
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
                <CardTitle>Payment Summary - {formatMonth(selectedMonth)}</CardTitle>
                <CardDescription>
                    Overview of current month payment status
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{paidStudents}</div>
                        <div className="text-sm text-muted-foreground">Fully Paid</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{partialStudents}</div>
                        <div className="text-sm text-muted-foreground">Partially Paid</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-600">{unpaidStudents}</div>
                        <div className="text-sm text-muted-foreground">Unpaid</div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="text-lg font-medium mb-2">Monthly Navigation</div>
                    <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                            // Check if there are any payments for this month
                            const hasPayments = payments.some(payment => payment.forMonth === month)
                            return (
                                <Button
                                    key={month}
                                    variant={selectedMonth === month ? "default" : hasPayments ? "outline" : "ghost"}
                                    size="sm"
                                    onClick={() => setSelectedMonth(month)}
                                    className={hasPayments ? "" : "opacity-50"}
                                >
                                    {formatMonth(month).substring(0, 3)}
                                    {hasPayments && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary-foreground inline-block"></span>}
                                </Button>
                            )
                        })}
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-medium">Recent Payments</div>
                    <div className="text-lg font-bold">
                        {formatCurrency(totalCollected)}
                    </div>
                </div>

                {paymentsForMonth.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                        No payments recorded for {formatMonth(selectedMonth)}
                    </div>
                ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {paymentsForMonth.slice(0, 5).map(payment => (
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
                        View Full Calendar
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}