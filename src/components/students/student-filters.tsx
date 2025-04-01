'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, X } from 'lucide-react'
import { debounce } from 'lodash'

interface Grade {
    id: string
    name: string
    schoolYear: {
        name: string
    }
}

interface StudentFiltersProps {
    grades: Grade[]
}

export default function StudentFilters({ grades }: StudentFiltersProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [query, setQuery] = useState(searchParams.get('query') || '')
    const [gradeId, setGradeId] = useState(searchParams.get('gradeId') || '__all__')
    const [active, setActive] = useState(searchParams.get('active') || '__all__')

    // Create a debounced function for the search input
    const debouncedSearch = debounce((value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value) {
            params.set('query', value)
        } else {
            params.delete('query')
        }

        router.push(`${pathname}?${params.toString()}`)
    }, 300)

    // Update filters
    const updateFilters = () => {
        const params = new URLSearchParams(searchParams)

        if (gradeId && gradeId !== '__all__') {
            params.set('gradeId', gradeId)
        } else {
            params.delete('gradeId')
        }

        if (active && active !== '__all__') {
            params.set('active', active)
        } else {
            params.delete('active')
        }

        router.push(`${pathname}?${params.toString()}`)
    }

    // Reset all filters
    const resetFilters = () => {
        setQuery('')
        setGradeId('__all__')
        setActive('__all__')
        router.push(pathname)
    }

    // Apply filters when select values change
    useEffect(() => {
        updateFilters()
    }, [gradeId, active])

    // Clean up debounced function on unmount
    useEffect(() => {
        return () => {
            debouncedSearch.cancel()
        }
    }, [debouncedSearch])

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar estudiantes..."
                            className="pl-8"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                debouncedSearch(e.target.value)
                            }}
                        />
                    </div>

                    <Select
                        value={gradeId}
                        onValueChange={setGradeId}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filtrar por grado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">Todos los Grados</SelectItem>
                            {grades.map((grade) => (
                                <SelectItem key={grade.id} value={grade.id}>
                                    {grade.name} ({grade.schoolYear.name})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={active}
                        onValueChange={setActive}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">Todos los Estudiantes</SelectItem>
                            <SelectItem value="true">Solo Activos</SelectItem>
                            <SelectItem value="false">Solo Inactivos</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        onClick={resetFilters}
                        className="flex gap-2"
                    >
                        <X className="h-4 w-4" />
                        Restablecer Filtros
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
