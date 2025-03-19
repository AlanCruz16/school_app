// src/app/(auth)/students/[id]/page.tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    CreditCard,
    Pencil,
    UserCircle,
    School,
    Phone,
    Mail
} from 'lucide-react'
import { formatCurrency, formatDate, formatMonth } from '@/lib/utils/format'
import { calculateExpectedBalance } from '@/lib/utils/balance' // Add this import
import StudentPaymentHistory from '@/components/students/student-payment-history'
import StudentPaymentCalendar from '@/components/students/student-payment-calendar'
import StudentDetailSkeleton from '@/components/skeletons/student-detail-skeleton'
import BalanceAdjustment from '@/components/students/balance-adjustement' // Add this import

// This component fetches and displays the actual student details
async function StudentDetailContent({
    params
}: {
    params: { id: string }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

    const student = await prisma.student.findUnique({
        where: { id: params.id },
        include: {
            grade: {
                include: {
                    schoolYear: true
                }
            },
            tutor: true,
            payments: {
                include: {
                    schoolYear: true,
                    clerk: true
                },
                orderBy: {
                    paymentDate: 'desc'
                }
            }
        }
    })

    if (!student) {
        notFound()
    }

    // Get the active school year for the payment calendar and expected balance calculation
    const activeSchoolYear = await prisma.schoolYear.findFirst({
        where: { active: true }
    })

    // Calculate expected balance if we have an active school year
    let expectedBalance = 0
    if (activeSchoolYear && student.grade) {
        // Adapt student format for the balance utility
        const adaptedStudent = {
            id: student.id,
            name: student.name,
            grade: {
                tuitionAmount: student.grade.tuitionAmount,
                schoolYear: student.grade.schoolYear
            }
        }

        expectedBalance = calculateExpectedBalance(
            adaptedStudent,
            activeSchoolYear,
            student.payments.filter(p => p.schoolYearId === activeSchoolYear.id)
        )
    }

    // Convert stored balance to number for comparison
    const currentBalance = parseFloat(student.balance.toString())

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/students">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back to students</span>
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">{student.name}</h1>
                <div className="ml-2">
                    {student.active ? (
                        <Badge variant="default">Active</Badge>
                    ) : (
                        <Badge variant="secondary">Inactive</Badge>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Student Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCircle className="h-5 w-5" />
                            Student Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <div className="text-sm font-medium">Grade</div>
                            <div className="flex items-center gap-2">
                                <School className="h-4 w-4 text-muted-foreground" />
                                <span>
                                    {student.grade.name} ({student.grade.schoolYear.name})
                                </span>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <div className="text-sm font-medium">Tuition Fee</div>
                            <div>
                                {formatCurrency(parseFloat(student.grade.tuitionAmount.toString()))} / month
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <div className="text-sm font-medium">Current Balance</div>
                            <div className={`text-xl font-bold ${currentBalance > 0 ? 'text-destructive' : ''}`}>
                                {formatCurrency(currentBalance)}
                            </div>

                            {/* Show expected balance if it's different from current balance */}
                            {expectedBalance > currentBalance && (
                                <div className="text-sm text-yellow-600 font-medium">
                                    Expected Balance: {formatCurrency(expectedBalance)}
                                    <span className="block text-xs mt-1">
                                        Based on school year from {formatDate(activeSchoolYear!.startDate)} to {formatDate(activeSchoolYear!.endDate)}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            {/* Add Balance Adjustment component */}
                            <BalanceAdjustment
                                studentId={student.id}
                                studentName={student.name}
                                currentBalance={currentBalance}
                                expectedBalance={expectedBalance > currentBalance ? expectedBalance : undefined}
                            />

                            <Button variant="outline" asChild>
                                <Link href={`/students/${student.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Student
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href={`/payments/new?studentId=${student.id}`}>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    New Payment
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Tutor Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tutor Information</CardTitle>
                        <CardDescription>Primary contact for {student.name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <div className="text-sm font-medium">Name</div>
                            <div className="font-medium">{student.tutor.name}</div>
                        </div>
                        <div className="grid gap-2">
                            <div className="text-sm font-medium">Contact</div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{student.tutor.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{student.tutor.email}</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <div className="text-sm font-medium">Address</div>
                            <div>{student.tutor.address || 'No address provided'}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Calendar */}
            {activeSchoolYear && (
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Calendar ({activeSchoolYear.name})</CardTitle>
                        <CardDescription>
                            Monthly payment status for the current school year
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <StudentPaymentCalendar
                            payments={student.payments}
                            schoolYearId={activeSchoolYear.id}
                            monthlyFee={parseFloat(student.grade.tuitionAmount.toString())}
                            studentId={student.id}
                            student={student} // Pass student object
                            activeSchoolYear={activeSchoolYear} // Pass active school year
                        />
                    </CardContent>
                </Card>
            )}

            {/* Payment History */}
            <Card>
                <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>
                        Record of all payments made by this student
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <StudentPaymentHistory payments={student.payments} />
                </CardContent>
            </Card>
        </div>
    )
}

export default function StudentDetailPage({
    params
}: {
    params: { id: string }
}) {
    return (
        <Suspense fallback={<StudentDetailSkeleton />}>
            <StudentDetailContent params={params} />
        </Suspense>
    )
}