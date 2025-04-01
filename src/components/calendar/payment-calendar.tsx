// src/components/calendar/payment-calendar.tsx
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
import { getAllSchoolYearMonths, formatMonthYear, type MonthYearPair } from '@/lib/utils/balance'

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
    forMonth: number | null // Allow null for backward compatibility or optional payments
    forYear?: number // Optional year field
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
    startDate: Date | string
    endDate: Date | string
    active: boolean
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
    const [selectedMonthYear, setSelectedMonthYear] = useState<MonthYearPair | null>(null)

    // Get the currently selected school year object
    const currentSchoolYear = schoolYears.find(year => year.id === selectedSchoolYear)

    // Generate all month-year pairs for the selected school year
    const allMonthYears = currentSchoolYear
        ? getAllSchoolYearMonths(currentSchoolYear)
        : []

    // Update selectedMonthYear when school year changes
    useEffect(() => {
        // Default to the first month of the school year when it changes
        if (allMonthYears.length > 0) {
            setSelectedMonthYear(allMonthYears[0])
        } else {
            setSelectedMonthYear(null)
        }
    }, [selectedSchoolYear])

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

        if (selectedMonthYear && match) {
            // Match on both month and year if payment has forYear field
            if (payment.forYear) {
                match = match &&
                    payment.forMonth === selectedMonthYear.month &&
                    payment.forYear === selectedMonthYear.year
            } else {
                // For backward compatibility
                match = match && payment.forMonth === selectedMonthYear.month
            }
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

    if (selectedMonthYear) {
        filteredStudents.forEach(student => {
            const paymentsForMonthYear = filteredPayments.filter(payment => {
                // Match payment to the specific month-year
                if (payment.studentId === student.id) {
                    if (payment.forYear) {
                        return payment.forMonth === selectedMonthYear.month &&
                            payment.forYear === selectedMonthYear.year
                    } else {
                        return payment.forMonth === selectedMonthYear.month
                    }
                }
                return false
            })

            const totalPaid = paymentsForMonthYear.reduce((sum, payment) => {
                const amount = typeof payment.amount === 'string'
                    ? parseFloat(payment.amount)
                    : payment.amount
                return sum + amount
            }, 0)

            let status = 'unpaid'
            if (paymentsForMonthYear.length > 0) {
                status = paymentsForMonthYear.some(p => p.isPartial) ? 'partial' : 'paid'
            }

            studentPaymentMap.set(student.id, {
                status,
                totalPaid,
                payments: paymentsForMonthYear
            })
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Calendario de Pagos</CardTitle>
                <CardDescription>
                    Vista mensual de los pagos de todos los estudiantes
                </CardDescription>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    {/* School Year Selector */}
                    <div>
                        <Select
                            value={selectedSchoolYear}
                            onValueChange={setSelectedSchoolYear}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar Año Escolar" />
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

                    {/* Grade Selector */}
                    <div>
                        <Select
                            value={selectedGrade}
                            onValueChange={setSelectedGrade}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todos los Grados" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_grades">Todos los Grados</SelectItem>
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

                    {/* Student Selector */}
                    <div>
                        <Select
                            value={selectedStudent}
                            onValueChange={setSelectedStudent}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todos los Estudiantes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_students">Todos los Estudiantes</SelectItem>
                                {filteredStudents.map(student => (
                                    <SelectItem key={student.id} value={student.id}>
                                        {student.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Month-Year Selector */}
                    <div>
                        <Select
                            value={selectedMonthYear ? selectedMonthYear.key : ''}
                            onValueChange={(value) => {
                                const monthYear = allMonthYears.find(my => my.key === value)
                                if (monthYear) {
                                    setSelectedMonthYear(monthYear)
                                }
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar Mes" />
                            </SelectTrigger>
                            <SelectContent>
                                {allMonthYears.map(monthYear => (
                                    <SelectItem key={monthYear.key} value={monthYear.key}>
                                        {formatMonthYear(monthYear)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-green-50 border border-green-200"></div>
                        <span className="text-sm">Pagado Completo</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-yellow-50 border border-yellow-200"></div>
                        <span className="text-sm">Pagado Parcial</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-gray-50 border border-gray-200"></div>
                        <span className="text-sm">No Pagado</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {!selectedMonthYear ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Por favor, seleccione un año escolar y un mes para ver el estado de los pagos.
                    </div>
                ) : (
                    <>
                        <div className="text-lg font-medium mb-4">
                            Estado de Pagos de {formatMonthYear(selectedMonthYear)}
                        </div>

                        {filteredStudents.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No se encontraron estudiantes que coincidan con sus criterios.
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
                                        paid: 'Pagado',
                                        partial: 'Parcial',
                                        unpaid: 'No Pagado'
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
                    </>
                )}

                {/* Month Selector Buttons */}
                <div className="mt-8">
                    <div className="text-sm font-medium mb-2">Navegación Rápida de Mes</div>
                    <div className="flex flex-wrap gap-2">
                        {allMonthYears.map((monthYear) => (
                            <Button
                                key={monthYear.key}
                                variant={selectedMonthYear?.key === monthYear.key ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedMonthYear(monthYear)}
                            >
                                {formatMonth(monthYear.month)} {monthYear.year.toString().slice(2)}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
