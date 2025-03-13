'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'
import { formatMonth } from '@/lib/utils/format'

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
    activeSchoolYear?: SchoolYear | null
}

export default function PaymentFilters({
    students,
    schoolYears,
    activeSchoolYear
}: PaymentFiltersProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Get filter values from URL
    const [studentId, setStudentId] = useState(searchParams.get('studentId') || '__all__')
    const [schoolYearId, setSchoolYearId] = useState(
        searchParams.get('schoolYearId') || (activeSchoolYear?.id || '__all__')
    )
    const [month, setMonth] = useState(searchParams.get('month') || '__all__')

    // Update filters in URL
    const updateFilters = () => {
        const params = new URLSearchParams(searchParams)

        if (studentId && studentId !== '__all__') {
            params.set('studentId', studentId)
        } else {
            params.delete('studentId')
        }

        if (schoolYearId && schoolYearId !== '__all__') {
            params.set('schoolYearId', schoolYearId)
        } else {
            params.delete('schoolYearId')
        }

        if (month && month !== '__all__') {
            params.set('month', month)
        } else {
            params.delete('month')
        }

        router.push(`${pathname}?${params.toString()}`)
    }

    // Reset all filters
    const resetFilters = () => {
        setStudentId('__all__')
        setSchoolYearId(activeSchoolYear?.id || '__all__')
        setMonth('__all__')
        router.push(pathname)
    }

    // Apply filters when select values change
    useEffect(() => {
        updateFilters()
    }, [studentId, schoolYearId, month])

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-4">
                    <Select
                        value={studentId}
                        onValueChange={setStudentId}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All Students" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">All Students</SelectItem>
                            {students.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                    {student.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={schoolYearId}
                        onValueChange={setSchoolYearId}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select School Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">All School Years</SelectItem>
                            {schoolYears.map((year) => (
                                <SelectItem key={year.id} value={year.id}>
                                    {year.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={month}
                        onValueChange={setMonth}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">All Months</SelectItem>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                <SelectItem key={m} value={m.toString()}>
                                    {formatMonth(m)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        onClick={resetFilters}
                        className="flex gap-2"
                    >
                        <X className="h-4 w-4" />
                        Reset Filters
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}