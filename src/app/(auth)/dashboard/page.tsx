// src/app/(auth)/dashboard/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/format'
import OutstandingBalances from '@/components/dashboard/outstanding-balances'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

    // Get statistics
    const studentCount = await prisma.student.count({
        where: { active: true }
    })

    // Calculate total outstanding balance
    const students = await prisma.student.findMany({
        where: { active: true },
        select: {
            id: true,
            name: true,
            active: true,
            balance: true,
            grade: {
                select: {
                    name: true
                }
            },
            tutor: {
                select: {
                    name: true
                }
            }
        }
    })

    const totalOutstanding = students.reduce(
        (total, student) => total + parseFloat(student.balance.toString()),
        0
    )

    // Get payments for current month
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const monthlyPayments = await prisma.payment.findMany({
        where: {
            paymentDate: {
                gte: firstDayOfMonth,
                lte: lastDayOfMonth
            }
        }
    })

    const totalMonthlyPayments = monthlyPayments.reduce(
        (total, payment) => total + parseFloat(payment.amount.toString()),
        0
    )

    // Get active school year
    const activeSchoolYear = await prisma.schoolYear.findFirst({
        where: { active: true }
    })

    // Get recent payments
    const recentPayments = await prisma.payment.findMany({
        include: {
            student: {
                select: {
                    name: true,
                    grade: {
                        select: {
                            name: true
                        }
                    }
                }
            },
            schoolYear: true
        },
        orderBy: {
            paymentDate: 'desc'
        },
        take: 5
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                    Overview of the school payment system
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Students
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{studentCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Outstanding Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{formatCurrency(totalOutstanding)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Payments This Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalMonthlyPayments)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active School Year
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeSchoolYear?.name || "None"}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle>Recent Payments</CardTitle>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/payments">View All</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {recentPayments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No recent payments to display.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {recentPayments.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{payment.student.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {payment.student.grade?.name || "No grade"} - {new Date(payment.paymentDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="font-medium">{formatCurrency(parseFloat(payment.amount.toString()))}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle>Outstanding Payments</CardTitle>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/reports/outstanding-balances">View All</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <OutstandingBalances students={students} limit={5} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}