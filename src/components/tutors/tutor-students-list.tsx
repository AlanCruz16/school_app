'use client'

import Link from 'next/link'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard, Pencil } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

interface Student {
    id: string
    name: string
    active: boolean
    balance: any
    grade: {
        name: string
        schoolYear: {
            name: string
        }
    }
}

interface TutorStudentsListProps {
    students: Student[]
}

export default function TutorStudentsList({ students }: TutorStudentsListProps) {
    if (students.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No students are associated with this tutor.
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student) => (
                            <TableRow key={student.id}>
                                <TableCell className="font-medium">
                                    <Link
                                        href={`/students/${student.id}`}
                                        className="hover:underline"
                                    >
                                        {student.name}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    {student.grade.name} ({student.grade.schoolYear.name})
                                </TableCell>
                                <TableCell>
                                    {student.active ? (
                                        <Badge variant="default">Active</Badge>
                                    ) : (
                                        <Badge variant="secondary">Inactive</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className={`font-medium ${parseFloat(student.balance.toString()) > 0 ? 'text-destructive' : ''}`}>
                                        {formatCurrency(parseFloat(student.balance.toString()))}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            asChild
                                        >
                                            <Link href={`/payments/new?studentId=${student.id}`}>
                                                <CreditCard className="h-4 w-4" />
                                                <span className="sr-only">New Payment</span>
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            asChild
                                        >
                                            <Link href={`/students/${student.id}/edit`}>
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Edit Student</span>
                                            </Link>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}