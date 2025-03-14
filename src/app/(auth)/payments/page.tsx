// src/app/(auth)/payments/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/utils/supabase/server'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatMonth } from '@/lib/utils/format'
import { PlusCircle } from 'lucide-react'
import PaymentsListSkeleton from '@/components/skeletons/payments-list-skeleton'
import { SuspenseWrapper } from '@/lib/utils/suspense-wrapper'
import PaymentActionButtons from '@/components/payments/payment-action-buttons'
import PaymentFilters from '@/components/payments/payment-filters'

// This component fetches and displays the actual payments list
async function PaymentsContent({
    searchParams
}: {
    searchParams: {
        query?: string;
        studentId?: string;
        month?: string;
        schoolYearId?: string;
    }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

    // Get active students for the filter
    const students = await prisma.student.findMany({
        where: {
            active: true
        },
        select: {
            id: true,
            name: true
        },
        orderBy: {
            name: 'asc'
        }
    })

    // Get school years for the filter
    const schoolYears = await prisma.schoolYear.findMany({
        orderBy: {
            startDate: 'desc'
        }
    })

    // Build query filters
    const filters: any = {}

    // Text search filter (receipt number or student name)
    if (searchParams.query) {
        filters.OR = [
            {
                receiptNumber: {
                    contains: searchParams.query,
                    mode: 'insensitive'
                }
            },
            {
                student: {
                    name: {
                        contains: searchParams.query,
                        mode: 'insensitive'
                    }
                }
            }
        ]
    }

    // Student filter
    if (searchParams.studentId && searchParams.studentId !== 'all_students') {
        filters.studentId = searchParams.studentId
    }

    // Month filter
    if (searchParams.month && searchParams.month !== 'all_months') {
        filters.forMonth = parseInt(searchParams.month)
    }

    // School year filter
    if (searchParams.schoolYearId && searchParams.schoolYearId !== 'all_years') {
        filters.schoolYearId = searchParams.schoolYearId
    }

    // Fetch payments with filters
    const payments = await prisma.payment.findMany({
        where: filters,
        orderBy: {
            paymentDate: 'desc'
        },
        take: 50, // Limit to 50 payments at a time
        include: {
            student: {
                select: {
                    id: true,
                    name: true,
                    grade: {
                        select: {
                            name: true
                        }
                    }
                }
            },
            schoolYear: true
        }
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Payments</h1>
                    <p className="text-muted-foreground">
                        Manage payment records and view payment history
                    </p>
                </div>
                <Button asChild>
                    <Link href="/payments/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Payment
                    </Link>
                </Button>
            </div>

            <PaymentFilters
                students={students}
                schoolYears={schoolYears}
            />

            <Card>
                <CardContent className="p-0">
                    <div className="rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Receipt No.</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Month</TableHead>
                                    <TableHead>School Year</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            No payments found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-medium">
                                                {payment.receiptNumber}
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={`/students/${payment.studentId}`}
                                                    className="hover:underline"
                                                >
                                                    {payment.student.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                                            <TableCell>{formatMonth(payment.forMonth)}</TableCell>
                                            <TableCell>{payment.schoolYear.name}</TableCell>
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
                                            <TableCell>
                                                <PaymentActionButtons paymentId={payment.id} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function PaymentsPage({
    searchParams
}: {
    searchParams: {
        query?: string;
        studentId?: string;
        month?: string;
        schoolYearId?: string;
    }
}) {
    return (
        <Suspense fallback={<PaymentsListSkeleton />}>
            <SuspenseWrapper>
                <PaymentsContent searchParams={searchParams} />
            </SuspenseWrapper>
        </Suspense>
    )
}