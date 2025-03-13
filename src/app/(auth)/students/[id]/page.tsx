// src/app/(auth)/students/[id]/page.tsx
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
import StudentPaymentHistory from '@/components/students/student-payment-history'
import StudentPaymentCalendar from '@/components/students/student-payment-calendar'
import BalanceAdjustment from '@/components/students/balance-adjustement'

export default async function StudentDetailPage({
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

    // Get the active school year for the payment calendar
    const activeSchoolYear = await prisma.schoolYear.findFirst({
        where: { active: true }
    })

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
                                    {student.grade?.name} ({student.grade?.schoolYear?.name || "No school year"})
                                </span>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <div className="text-sm font-medium">Tuition Fee</div>
                            <div>
                                {formatCurrency(student.grade ? parseFloat(student.grade.tuitionAmount.toString()) : 0)} / month
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <div className="text-sm font-medium">Current Balance</div>
                            <div className={`text-xl font-bold ${parseFloat(student.balance.toString()) > 0 ? 'text-destructive' : ''}`}>
                                {formatCurrency(parseFloat(student.balance.toString()))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <BalanceAdjustment
                                studentId={student.id}
                                studentName={student.name}
                                currentBalance={parseFloat(student.balance.toString())}
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
                            <div className="font-medium">{student.tutor?.name || "No tutor assigned"}</div>
                        </div>
                        <div className="grid gap-2">
                            <div className="text-sm font-medium">Contact</div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{student.tutor?.phone || "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{student.tutor?.email || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <div className="text-sm font-medium">Address</div>
                            <div>{student.tutor?.address || 'No address provided'}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Calendar */}
            {activeSchoolYear && student.grade && (
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