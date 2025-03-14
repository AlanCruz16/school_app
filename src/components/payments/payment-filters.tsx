'use client'

// src/components/payments/payment-filters.tsx
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, X } from 'lucide-react'
import { formatMonth } from '@/lib/utils/format'
import { debounce } from 'lodash'

interface Student {
    id: string
    name: string
}

interface SchoolYear {
    id: string
    name: string
}

interface PaymentFiltersProps {
    students: Student[]
    schoolYears: SchoolYear[]
}

export default function PaymentFilters({ students, schoolYears }: PaymentFiltersProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Initialize from URL parameters
    const [query, setQuery] = useState(searchParams.get('query') || '')
    const [studentId, setStudentId] = useState(searchParams.get('studentId') || 'all_students')
    const [month, setMonth] = useState(searchParams.get('month') || 'all_months')
    const [schoolYearId, setSchoolYearId] = useState(searchParams.get('schoolYearId') || 'all_years')

    // Create a debounced search function
    const debouncedSearch = debounce((value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set('query', value)
        } else {
            params.delete('query')
        }
        router.push(`${pathname}?${params.toString()}`)
    }, 300)

    // Apply non-search filters
    const applyFilters = () => {
        const params = new URLSearchParams(searchParams.toString())

        // Handle studentId
        if (studentId && studentId !== 'all_students') {
            params.set('studentId', studentId)
        } else {
            params.delete('studentId')
        }

        // Handle month
        if (month && month !== 'all_months') {
            params.set('month', month)
        } else {
            params.delete('month')
        }

        // Handle schoolYearId
        if (schoolYearId && schoolYearId !== 'all_years') {
            params.set('schoolYearId', schoolYearId)
        } else {
            params.delete('schoolYearId')
        }

        router.push(`${pathname}?${params.toString()}`)
    }

    // Update filters when select values change
    useEffect(() => {
        applyFilters()
    }, [studentId, month, schoolYearId])

    // Reset all filters
    const resetFilters = () => {
        setQuery('')
        setStudentId('all_students')
        setMonth('all_months')
        setSchoolYearId('all_years')
        router.push(pathname)
    }

    // Clean up debounced function on unmount
    useEffect(() => {
        return () => {
            debouncedSearch.cancel()
        }
    }, [debouncedSearch])

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search receipts..."
                            className="pl-8"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                debouncedSearch(e.target.value)
                            }}
                        />
                    </div>

                    <Select
                        value={studentId}
                        onValueChange={setStudentId}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All Students" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all_students">All Students</SelectItem>
                            {students.map(student => (
                                <SelectItem key={student.id} value={student.id}>
                                    {student.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={month}
                        onValueChange={setMonth}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All Months" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all_months">All Months</SelectItem>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <SelectItem key={m} value={m.toString()}>
                                    {formatMonth(m)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={schoolYearId}
                        onValueChange={setSchoolYearId}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All School Years" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all_years">All School Years</SelectItem>
                            {schoolYears.map(year => (
                                <SelectItem key={year.id} value={year.id}>
                                    {year.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {(query || studentId || month || schoolYearId) && (
                    <div className="flex justify-end mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetFilters}
                            className="flex items-center gap-1"
                        >
                            <X className="h-4 w-4" />
                            Reset Filters
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}