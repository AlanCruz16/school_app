// src/app/(auth)/students/new/page.tsx
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'
import { Button } from '@/components/ui/button'
import StudentForm from '@/components/students/student-form'

export default async function NewStudentPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

    // Fetch grades and tutors for the form
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

    const tutors = await prisma.tutor.findMany({
        orderBy: {
            name: 'asc'
        }
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/students">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back to students</span>
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Add New Student</h1>
            </div>

            <StudentForm
                grades={grades}
                tutors={tutors}
            />
        </div>
    )
}