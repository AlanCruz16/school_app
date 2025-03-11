// src/app/(auth)/students/page.tsx
import { createClient } from '@/lib/utils/supabase/server'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import StudentsList from '@/components/students/students-list'
import StudentFilters from '@/components/students/student-filters'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'

export default async function StudentsPage({
    searchParams
}: {
    searchParams: { query?: string; gradeId?: string; active?: string }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

    // Get filters from search params
    const query = searchParams.query || ''
    const active = searchParams.active !== undefined ? searchParams.active === 'true' : undefined
    const gradeId = searchParams.gradeId || undefined

    // Build filters for prisma
    const filters: any = {}

    if (query) {
        filters.OR = [
            { name: { contains: query, mode: 'insensitive' } }
        ]
    }

    if (active !== undefined) {
        filters.active = active
    }

    if (gradeId) {
        filters.gradeId = gradeId
    }

    // Fetch students with filtering
    const students = await prisma.student.findMany({
        where: filters,
        include: {
            grade: {
                include: {
                    schoolYear: true
                }
            },
            tutor: true
        },
        orderBy: {
            name: 'asc'
        }
    })

    // Fetch all grades for filter dropdown
    const grades = await prisma.grade.findMany({
        include: {
            schoolYear: true
        },
        orderBy: [
            {
                schoolYear: {
                    startDate: 'desc'
                }
            },
            {
                name: 'asc'
            }
        ]
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Students</h1>
                    <p className="text-muted-foreground">
                        Manage student records and view payment status
                    </p>
                </div>
                <Button asChild>
                    <Link href="/students/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Student
                    </Link>
                </Button>
            </div>

            <StudentFilters grades={grades} />

            <StudentsList students={students} />
        </div>
    )
}