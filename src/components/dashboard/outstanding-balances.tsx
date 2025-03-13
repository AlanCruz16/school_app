'use client'

import Link from 'next/link'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, ArrowUpRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

interface Student {
    id: string
    name: string
    active: boolean
    balance: any
    grade?: {
        name: string
    }
    tutor?: {
        name: string
    }
}

interface OutstandingBalancesProps {
    students: Student[]
    limit?: number
}

export default function OutstandingBalances({
    students,
    limit
}: OutstandingBalancesProps) {
    // Filter students with outstanding balances and sort by balance amount (highest first)
    const studentsWithBalance = students
        .filter(student => parseFloat(student.balance.toString()) > 0)
        .sort((a, b) => parseFloat(b.balance.toString()) - parseFloat(a.balance.toString()))

    // Apply limit if specified
    const limitedStudents = limit ? studentsWithBalance.slice(0, limit) : studentsWithBalance

    // Calculate total outstanding balance
    const totalOutstanding = studentsWithBalance.reduce(
        (total, student) => total + parseFloat(student.balance.toString()),
        0
    )

    if (studentsWithBalance.length === 0) {
        return (
            <div className="text-center py-6 text-muted-foreground">
                No students with outstanding balances.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {studentsWithBalance.length}
                    {studentsWithBalance.length === 1 ? ' student' : ' students'} with outstanding balance
                </div>
                <div className="font-medium">
                    Total: {formatCurrency(totalOutstanding)}
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Tutor</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {limitedStudents.map((student) => (
                            <TableRow key={student.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/students/${student.id}`}
                                            className="hover:underline"
                                        >
                                            {student.name}
                                        </Link>
                                        {!student.active && (
                                            <Badge variant="secondary" className="ml-2">Inactive</Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{student.grade?.name || 'Not assigned'}</TableCell>
                                <TableCell>{student.tutor?.name || 'Not assigned'}</TableCell>
                                <TableCell className="text-right font-bold text-destructive">
                                    {formatCurrency(parseFloat(student.balance.toString()))}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            asChild
                                        >
                                            <Link href={`/students/${student.id}`}>
                                                <ArrowUpRight className="h-4 w-4 mr-1" />
                                                View
                                            </Link>
                                        </Button>
                                        <Button
                                            size="sm"
                                            asChild
                                        >
                                            <Link href={`/payments/new?studentId=${student.id}`}>
                                                <CreditCard className="h-4 w-4 mr-1" />
                                                Pay
                                            </Link>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {limit && studentsWithBalance.length > limit && (
                <div className="flex justify-center">
                    <Button variant="outline" asChild>
                        <Link href="/reports/outstanding-balances">
                            View All Outstanding Balances
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    )
}