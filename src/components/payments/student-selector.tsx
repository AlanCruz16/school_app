'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/format'
import { debounce } from 'lodash'

interface Student {
    id: string
    name: string
    active: boolean
    balance: any
    grade: {
        name: string
    }
    tutor: {
        name: string
    }
}

export default function StudentSelector() {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(false)

    const searchStudents = async (searchQuery: string) => {
        setLoading(true)
        try {
            // Build the query string
            const params = new URLSearchParams()
            if (searchQuery) params.append('query', searchQuery)
            params.append('active', 'true') // Only search for active students

            const response = await fetch(`/api/students?${params.toString()}`)

            if (!response.ok) {
                throw new Error('Failed to fetch students')
            }

            const data = await response.json()
            setStudents(data)
        } catch (error) {
            console.error('Error searching students:', error)
            setStudents([])
        } finally {
            setLoading(false)
        }
    }

    // Create a debounced version of the search function
    const debouncedSearch = debounce(searchStudents, 300)

    // Fetch students on component mount or when search query changes
    useEffect(() => {
        debouncedSearch(query)

        return () => {
            debouncedSearch.cancel()
        }
    }, [query])

    // Handle student selection
    const selectStudent = (studentId: string) => {
        router.push(`/payments/new?studentId=${studentId}`)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Seleccionar Estudiante</CardTitle>
                <CardDescription>
                    Elija un estudiante para registrar un pago
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre de estudiante..."
                            className="pl-8"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <Button asChild>
                        <Link href="/students/new">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Nuevo Estudiante
                        </Link>
                    </Button>
                </div>

                <div className="rounded-md border">
                    <div className="max-h-[400px] overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-card z-10">
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Grado</TableHead>
                                    <TableHead>Tutor</TableHead>
                                    <TableHead className="text-right">Saldo</TableHead>
                                    <TableHead className="text-right">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4">
                                            Cargando estudiantes...
                                        </TableCell>
                                    </TableRow>
                                ) : students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4">
                                            {query ? 'No se encontraron estudiantes que coincidan con su búsqueda' : 'No se encontraron estudiantes activos'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    students.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium">
                                                {student.name}
                                            </TableCell>
                                            <TableCell>{student.grade?.name || 'Sin grado asignado'}</TableCell>
                                            <TableCell>{student.tutor?.name || 'Sin tutor asignado'}</TableCell>
                                            <TableCell className="text-right">
                                                <span className={`font-medium ${student.balance && parseFloat(student.balance.toString()) > 0 ? 'text-destructive' : ''}`}>
                                                    {formatCurrency(student.balance ? parseFloat(student.balance.toString()) : 0)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    onClick={() => selectStudent(student.id)}
                                                    size="sm"
                                                >
                                                    Seleccionar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
