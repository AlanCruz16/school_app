'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatMonth } from '@/lib/utils/format'
import { cn } from '@/lib/utils/utils'
import Link from 'next/link'

interface Student {
    id: string
    name: string
    gradeId: string
    active: boolean
    grade: {
        name: string
    }
}

interface Payment {
    id: string
    studentId: string
    amount: any // Changed to handle Prisma Decimal type
    paymentDate: string | Date
    paymentMethod: string
    forMonth: number
    isPartial: boolean
    schoolYearId: string
    student: {
        name: string
        grade: {
            name: string
        }
    }
}

interface SchoolYear {
    id: string
    name: string
}

interface Grade {
    id: string
    name: string
    schoolYearId: string
}

interface PaymentCalendarProps {
    payments: Payment[]
    students: Student[]
    grades: Grade[]
    schoolYears: SchoolYear[]
    currentSchoolYearId: string
}

export default function PaymentCalendar({
    payments,
    students,
    grades,
    schoolYears,
    currentSchoolYearId
}: PaymentCalendarProps) {
    // State for filters
    const [selectedSchoolYear, setSelectedSchoolYear] = useState(currentSchoolYearId)
    const [selectedGrade, setSelectedGrade] = useState('all_grades')
    const [selectedStudent, setSelectedStudent] = useState('all_students')
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)

    // Filter students by grade if grade is selected
    const filteredStudents = selectedGrade !== 'all_grades'
        ? students.filter(student => student.gradeId === selectedGrade && student.active)
        : students.filter(student => student.active)

    // Filter payments based on selections
    const filteredPayments = payments.filter(payment => {
        let match = payment.schoolYearId === selectedSchoolYear

        if (selectedGrade !== 'all_grades' && match) {
            match = match && filteredStudents.some(student =>
                student.id === payment.studentId && student.gradeId === selectedGrade
            )
        }

        if (selectedStudent !== 'all_students' && match) {
            match = match && payment.studentId === selectedStudent
        }

        if (selectedMonth !== null && match) {
            match = match && payment.forMonth === selectedMonth
        }

        return match
    })

    // Get unique students who have payments for the selected filters
    const studentsWithPayments = Array.from(
        new Set(
            filteredPayments.map(payment => payment.studentId)
        )
    ).map(studentId => {
        const student = students.find(s => s.id === studentId)
        return student
    }).filter(Boolean) as Student[]

    // Create a mapping of students to their payment status for the selected month
    const studentPaymentMap = new Map()

    filteredStudents.forEach(student => {
        const payments = filteredPayments.filter(
            payment => payment.studentId === student.id && payment.forMonth === selectedMonth
        )

        const totalPaid = payments.reduce((sum, payment) => {
            const amount = typeof payment.amount === 'string'
                ? parseFloat(payment.amount)
                : payment.amount
            return sum + amount
        }, 0)

        let status = 'unpaid'
        if (payments.length > 0) {
            status = payments.some(p => p.isPartial) ? 'partial' : 'paid'
        }

        studentPaymentMap.set(student.id, {
            status,
            totalPaid,
            payments
        })
    })

    return (
        <Card>
            <CardHeader>
                <CardTitle>Payment Calendar</CardTitle>
                <CardDescription>
                    Monthly view of all student payments
                </CardDescription>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <div>
                        <Select
                            value={selectedSchoolYear}
                            onValueChange={setSelectedSchoolYear}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select School Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {schoolYears.map(year => (
                                    <SelectItem key={year.id} value={year.id}>
                                        {year.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Select
                            value={selectedGrade}
                            onValueChange={setSelectedGrade}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Grades" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_grades">All Grades</SelectItem>
                                {grades
                                    .filter(grade => grade.schoolYearId === selectedSchoolYear)
                                    .map(grade => (
                                        <SelectItem key={grade.id} value={grade.id}>
                                            {grade.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Select
                            value={selectedStudent}
                            onValueChange={setSelectedStudent}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Students" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_students">All Students</SelectItem>
                                {filteredStudents.map(student => (
                                    <SelectItem key={student.id} value={student.id}>
                                        {student.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Select
                            value={selectedMonth.toString()}
                            onValueChange={(value) => setSelectedMonth(parseInt(value))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                    <SelectItem key={month} value={month.toString()}>
                                        {formatMonth(month)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-green-50 border border-green-200"></div>
                        <span className="text-sm">Fully Paid</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-yellow-50 border border-yellow-200"></div>
                        <span className="text-sm">Partially Paid</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-gray-50 border border-gray-200"></div>
                        <span className="text-sm">Unpaid</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="text-lg font-medium mb-4">
                    {formatMonth(selectedMonth)} Payment Status
                </div>

                {filteredStudents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No students found matching your criteria.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredStudents.map(student => {
                            const paymentInfo = studentPaymentMap.get(student.id) || {
                                status: 'unpaid',
                                totalPaid: 0,
                                payments: []
                            }

                            const statusColors = {
                                paid: 'bg-green-50 border-green-200',
                                partial: 'bg-yellow-50 border-yellow-200',
                                unpaid: 'bg-gray-50 border-gray-200'
                            }

                            const statusLabels = {
                                paid: 'Paid',
                                partial: 'Partial',
                                unpaid: 'Unpaid'
                            }

                            const statusTextColors = {
                                paid: 'text-green-600',
                                partial: 'text-yellow-600',
                                unpaid: 'text-gray-600'
                            }

                            return (
                                <Link
                                    href={`/students/${student.id}`}
                                    key={student.id}
                                    className="block"
                                >
                                    <div
                                        className={cn(
                                            "p-4 rounded-lg border-l-4 hover:shadow transition-shadow",
                                            statusColors[paymentInfo.status as keyof typeof statusColors]
                                        )}
                                    >
                                        <div className="font-semibold truncate">{student.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {student.grade.name}
                                        </div>
                                        <div className={cn(
                                            "mt-2 font-medium",
                                            statusTextColors[paymentInfo.status as keyof typeof statusTextColors]
                                        )}>
                                            {statusLabels[paymentInfo.status as keyof typeof statusLabels]}
                                        </div>
                                        <div className="text-sm mt-1">
                                            {formatCurrency(paymentInfo.totalPaid)}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}

                {/* Month Selector Buttons */}
                <div className="mt-8">
                    <div className="text-sm font-medium mb-2">Quick Month Navigation</div>
                    <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <Button
                                key={month}
                                variant={selectedMonth === month ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedMonth(month)}
                            >
                                {formatMonth(month).substring(0, 3)}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}