// src/app/(auth)/dashboard/page.tsx
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/utils/supabase/server'
import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/utils/format'
import { serializeDecimal } from '@/lib/utils/convert-decimal'
import PaymentSummary from '@/components/dashboard/payment-summary'
import DashboardSkeleton from '@/components/skeletons/dashboard-skeleton'

// This component fetches and displays the actual dashboard content
async function DashboardContent() {
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

    // Get current month and year for filtering payments *received*
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonthIndex = today.getMonth() // 0-indexed for Date object calculations

    // Calculate start and end dates of the current calendar month
    const startDate = new Date(currentYear, currentMonthIndex, 1) // First day, 00:00:00
    const endDate = new Date(currentYear, currentMonthIndex + 1, 0, 23, 59, 59, 999) // Last day, 23:59:59

    // Fetch payments received this month
    const paymentsReceivedThisMonth = await prisma.payment.findMany({
        where: {
            paymentDate: {
                gte: startDate,
                lte: endDate,
            },
        },
        select: {
            amount: true, // Only need the amount for summing
        },
    })

    // Calculate total received this month
    const totalReceivedThisMonth = paymentsReceivedThisMonth.reduce((sum, payment) => {
        const amount = typeof payment.amount === 'object' ?
            parseFloat(payment.amount.toString()) :
            (typeof payment.amount === 'string' ?
                parseFloat(payment.amount) :
                payment.amount)
        return sum + amount
    }, 0)

    // --- Data for PaymentSummary component (still needed) ---
    const currentMonthForSummary = today.getMonth() + 1 // 1-indexed for component prop
    // Get all payments for the active school year (for PaymentSummary)
    const allPaymentsForSummary = await prisma.payment.findMany({
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
    // --- End Data for PaymentSummary ---


    // Get students with outstanding balances (remains the same)
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
                <h1 className="text-3xl font-bold">Tablero</h1>
                <p className="text-muted-foreground">
                    Resumen del sistema de pagos escolares
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total de Estudiantes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalStudents}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Saldo Pendiente
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
                            Pagos Recibidos Este Mes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(totalReceivedThisMonth)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            Año Escolar Activo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {activeSchoolYear?.name || "Ninguno"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <PaymentSummary
                    payments={serializeDecimal(allPaymentsForSummary)} // Use the separate fetch for this component
                    totalStudents={totalStudents}
                    currentMonth={currentMonthForSummary} // Use 1-indexed month
                    activeSchoolYear={activeSchoolYear || undefined}
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Pagos Pendientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {studentsWithBalance.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No hay pagos pendientes para mostrar.
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

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    )
}
