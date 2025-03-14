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
import { CreditCard, Eye, PlusCircle, Printer, Search } from 'lucide-react'
import PaymentsListSkeleton from '@/components/skeletons/payment-list-skeleton'
import { SuspenseWrapper } from '@/lib/utils/suspense-wrapper'

// Payment filters component
function PaymentFilters() {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search receipts..."
                            className="w-full rounded-md border border-input pl-8 pr-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground"
                        />
                    </div>

                    <div>
                        <select className="w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm">
                            <option value="">All Students</option>
                            {/* Student options would be populated here */}
                        </select>
                    </div>

                    <div>
                        <select className="w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm">
                            <option value="">All Months</option>
                            <option value="1">January</option>
                            <option value="2">February</option>
                            <option value="3">March</option>
                            <option value="4">April</option>
                            <option value="5">May</option>
                            <option value="6">June</option>
                            <option value="7">July</option>
                            <option value="8">August</option>
                            <option value="9">September</option>
                            <option value="10">October</option>
                            <option value="11">November</option>
                            <option value="12">December</option>
                        </select>
                    </div>

                    <div>
                        <select className="w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm">
                            <option value="">All School Years</option>
                            {/* School year options would be populated here */}
                        </select>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// This component fetches and displays the actual payments list
async function PaymentsContent() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

    // Fetch recent payments
    const payments = await prisma.payment.findMany({
        take: 50, // Limit to 50 most recent payments
        orderBy: {
            paymentDate: 'desc'
        },
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

            <PaymentFilters />

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
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="icon">
                                                        <Printer className="h-4 w-4" />
                                                        <span className="sr-only">Print Receipt</span>
                                                    </Button>
                                                    <Button variant="outline" size="icon" asChild>
                                                        <Link href={`/payments/${payment.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                            <span className="sr-only">View Details</span>
                                                        </Link>
                                                    </Button>
                                                </div>
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

export default function PaymentsPage() {
    return (
        <Suspense fallback={<PaymentsListSkeleton />}>
            <SuspenseWrapper>
                <PaymentsContent />
            </SuspenseWrapper>
        </Suspense>
    )
}