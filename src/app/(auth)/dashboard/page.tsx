// src/app/(auth)/dashboard/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/utils/supabase/server'
import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/utils/format'
import PaymentSummary from '@/components/dashboard/payment-summary'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

    // Get active school year
    const activeSchoolYear = await prisma.schoolYear.findFirst({
        where: { active: true }
    })

    // Get total students count
    const totalStudents = await prisma.student.count({
        where: { active: true }
    })

    // Calculate total outstanding balance
    const totalOutstandingBalance = await prisma.student.aggregate({
        _sum: {
            balance: true
        },
        where: {
            active: true
        }
    })

    // Get current month
    const currentMonth = new Date().getMonth() + 1

    // Get all payments for the active school year (instead of just current month)
    const allPayments = await prisma.payment.findMany({
        where: {
            schoolYearId: activeSchoolYear?.id
        },
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
            }
        },
        orderBy: {
            paymentDate: 'desc'
        }
    })

    // Calculate total payments for current month
    const currentMonthPayments = allPayments.filter(payment => payment.forMonth === currentMonth)
    const totalMonthlyPayments = currentMonthPayments.reduce((sum, payment) => {
        // Handle Prisma Decimal type safely
        return sum + parseFloat(payment.amount.toString())
    }, 0)

    // Get recent payments (across all months)
    const recentPayments = await prisma.payment.findMany({
        take: 10,
        orderBy: {
            paymentDate: 'desc'
        },
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
        }
    })

    // Get students with outstanding balances
    const studentsWithBalance = await prisma.student.findMany({
        where: {
            active: true,
            balance: {
                gt: 0
            }
        },
        orderBy: {
            balance: 'desc'
        },
        take: 10,
        include: {
            grade: true
        }
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
                        <div className="text-2xl font-bold">{totalStudents}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Outstanding Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                            {formatCurrency(Number(totalOutstandingBalance._sum.balance || 0))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Payments This Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(totalMonthlyPayments)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active School Year
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {activeSchoolYear?.name || "None"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <PaymentSummary
                    payments={allPayments}
                    totalStudents={totalStudents}
                    currentMonth={currentMonth}
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Outstanding Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {studentsWithBalance.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No outstanding payments to display.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {studentsWithBalance.map(student => (
                                    <div key={student.id} className="flex items-center justify-between border-b pb-2">
                                        <div>
                                            <div className="font-medium">
                                                <a href={`/students/${student.id}`} className="hover:underline">
                                                    {student.name}
                                                </a>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {student.grade.name}
                                            </div>
                                        </div>
                                        <div className="font-semibold text-destructive">
                                            {formatCurrency(Number(student.balance))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}