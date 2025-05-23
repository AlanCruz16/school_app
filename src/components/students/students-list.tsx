'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { CreditCard, MoreHorizontal, Pencil, XCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

interface Student {
    id: string
    name: string
    active: boolean
    balance: any // Accept Prisma Decimal type
    grade: {
        name: string
        schoolYear: {
            name: string
        }
    }
    tutor: {
        name: string
    }
}

interface StudentsListProps {
    students: Student[]
}

export default function StudentsList({ students }: StudentsListProps) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    // In a real implementation, this would be a server action or API call
    const handleDeactivate = async (id: string) => {
        try {
            const response = await fetch(`/api/students/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: false }),
            })

            if (!response.ok) {
                throw new Error('Error al desactivar estudiante')
            }

            router.refresh()
        } catch (error) {
            console.error('Error deactivating student:', error)
        }
    }

    if (students.length === 0) {
        return (
            <Card>
                <CardContent className="py-10">
                    <div className="text-center">
                        <p className="text-muted-foreground">No se encontraron estudiantes</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Intente ajustar sus filtros o agregue un nuevo estudiante
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardContent className="p-0">
                <div className="max-h-[600px] overflow-auto rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card z-10">
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Grado</TableHead>
                                <TableHead>Tutor</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Saldo</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
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
                                    <TableCell>{student.tutor.name}</TableCell>
                                    <TableCell>
                                        {student.active ? (
                                            <Badge variant="default">Activo</Badge>
                                        ) : (
                                            <Badge variant="secondary">Inactivo</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(parseFloat(student.balance.toString()))}
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
                                                    <span className="sr-only">Nuevo Pago</span>
                                                </Link>
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Más</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/students/${student.id}/edit`}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {student.active && (
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => handleDeactivate(student.id)}
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Desactivar
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="py-4">
                <div className="text-sm text-muted-foreground">
                    Total: {students.length} estudiantes
                </div>
            </CardFooter>
        </Card>
    )
}
