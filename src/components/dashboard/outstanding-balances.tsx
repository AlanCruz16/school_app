// src/components/dashboard/outstanding-balances.tsx
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
import { CreditCard, ArrowUpRight, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { calculateExpectedBalance } from '@/lib/utils/balance'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'

interface Student {
    id: string
    name: string
    active: boolean
    balance: any
    grade?: {
        name: string
        tuitionAmount: any
        schoolYear?: {
            id: string
            name: string
        }
    }
    tutor?: {
        name: string
    }
    payments?: any[]
}

interface SchoolYear {
    id: string
    name: string
    startDate: Date | string
    endDate: Date | string
    active: boolean
}

interface OutstandingBalancesProps {
    students: Student[];
    activeSchoolYear?: SchoolYear;
    limit?: number;
}

export default function OutstandingBalances({
    students,
    activeSchoolYear,
    limit
}: OutstandingBalancesProps) {
    const { toast } = useToast();
    const [syncingStudentId, setSyncingStudentId] = useState<string | null>(null);

    // Helper function to adapt student object for balance calculation
    function adaptStudentForBalanceCalculation(student: Student) {
        if (!student.grade) return null;

        return {
            id: student.id,
            name: student.name,
            grade: {
                tuitionAmount: student.grade.tuitionAmount,
                schoolYear: student.grade.schoolYear
            }
        };
    }

    // Calculate expected balances for all students
    const studentsWithExpectedBalance = students.map(student => {
        // Default to current balance
        let expectedBalance = parseFloat(student.balance.toString());
        let needsSync = false;

        // Calculate expected balance if we have an active school year and grade info
        if (activeSchoolYear && student.grade && student.payments) {
            const adaptedStudent = adaptStudentForBalanceCalculation(student);

            if (adaptedStudent) {
                const calculatedBalance = calculateExpectedBalance(
                    adaptedStudent,
                    activeSchoolYear,
                    student.payments.filter(p => p.schoolYearId === activeSchoolYear.id)
                );

                // Use the higher of the two balances
                if (calculatedBalance > expectedBalance) {
                    needsSync = true;
                    expectedBalance = calculatedBalance;
                }
            }
        }

        return {
            ...student,
            expectedBalance,
            needsSync
        };
    });

    // Filter students with any balance (current or expected)
    const studentsWithBalance = studentsWithExpectedBalance
        .filter(student => student.expectedBalance > 0)
        .sort((a, b) => b.expectedBalance - a.expectedBalance);

    // Apply limit if specified
    const limitedStudents = limit ? studentsWithBalance.slice(0, limit) : studentsWithBalance;

    // Calculate total outstanding balance using expected balances
    const totalOutstanding = studentsWithBalance.reduce(
        (total, student) => total + student.expectedBalance,
        0
    );

    // Function to sync a student's balance with their expected balance
    const syncStudentBalance = async (studentId: string, expectedBalance: number) => {
        setSyncingStudentId(studentId);

        try {
            const response = await fetch(`/api/students/${studentId}/sync-balance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Error al sincronizar el saldo');
            }

            toast({
                title: 'Saldo Actualizado',
                description: 'El saldo del estudiante ha sido actualizado para coincidir con el monto esperado.',
            });

            // In a real app, we might want to refresh the data here
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error al actualizar el saldo del estudiante.',
                variant: 'destructive',
            });
        } finally {
            setSyncingStudentId(null);
        }
    };

    if (studentsWithBalance.length === 0) {
        return (
            <div className="text-center py-6 text-muted-foreground">
                No hay estudiantes con saldos pendientes.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    {studentsWithBalance.length}
                    {studentsWithBalance.length === 1 ? ' estudiante' : ' estudiantes'} con saldo pendiente
                </div>
                <div className="font-medium">
                    Total: {formatCurrency(totalOutstanding)}
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Estudiante</TableHead>
                            <TableHead>Grado</TableHead>
                            <TableHead>Tutor</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
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
                                            <Badge variant="secondary" className="ml-2">Inactivo</Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{student.grade?.name || 'No asignado'}</TableCell>
                                <TableCell>{student.tutor?.name || 'No asignado'}</TableCell>
                                <TableCell className="text-right">
                                    <div className="font-bold text-destructive">
                                        {formatCurrency(student.expectedBalance)}
                                    </div>

                                    {student.needsSync && (
                                        <div className="text-xs text-yellow-600 flex items-center justify-end mt-1">
                                            <span>Actual: {formatCurrency(parseFloat(student.balance.toString()))}</span>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 ml-1"
                                                disabled={syncingStudentId === student.id}
                                                onClick={() => syncStudentBalance(student.id, student.expectedBalance)}
                                            >
                                                <RefreshCw className="h-3 w-3" />
                                                <span className="sr-only">Sincronizar saldo</span>
                                            </Button>
                                        </div>
                                    )}
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
                                                Ver
                                            </Link>
                                        </Button>
                                        <Button
                                            size="sm"
                                            asChild
                                        >
                                            <Link href={`/payments/new?studentId=${student.id}`}>
                                                <CreditCard className="h-4 w-4 mr-1" />
                                                Pagar
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
                            Ver Todos los Saldos Pendientes
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
