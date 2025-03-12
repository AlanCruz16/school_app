// src/app/(auth)/payments/new/page.tsx
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'
import { Button } from '@/components/ui/button'
import PaymentForm from '@/components/payments/payment-form'
import StudentSelector from '@/components/payments/student-selector'

export default async function NewPaymentPage({
    searchParams
}: {
    searchParams: { studentId?: string }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

    // Get the clerk information
    const clerk = await prisma.user.findUnique({
        where: { email: user.email || '' }
    })

    if (!clerk) {
        // This shouldn't happen since middleware ensures user is authenticated
        // But we'll handle it anyway
        return redirect('/login')
    }

    // Get active school year
    const activeSchoolYear = await prisma.schoolYear.findFirst({
        where: { active: true }
    })

    if (!activeSchoolYear) {
        // There should be an active school year
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/dashboard">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">New Payment</h1>
                </div>

                <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                    <h2 className="font-semibold">No Active School Year</h2>
                    <p className="mt-1">
                        There is no active school year. Please activate a school year before recording payments.
                    </p>
                    <Button className="mt-4" asChild variant="outline">
                        <Link href="/settings/school-years">Manage School Years</Link>
                    </Button>
                </div>
            </div>
        )
    }

    // Check if a student ID was provided
    const studentId = searchParams.studentId

    // If no student ID is provided, show student selector
    if (!studentId) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/dashboard">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">New Payment</h1>
                </div>

                <StudentSelector />
            </div>
        )
    }

    // Fetch the student with their grade information
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
            grade: {
                include: {
                    schoolYear: true
                }
            }
        }
    })

    if (!student) {
        notFound()
    }

    // If student has no grade assigned, redirect to edit page
    if (!student.grade) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/payments/new">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">New Payment</h1>
                </div>

                <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                    <h2 className="font-semibold">Missing Grade Information</h2>
                    <p className="mt-1">
                        This student doesn't have a valid grade assignment. Please update the student record first.
                    </p>
                    <div className="flex gap-2 mt-4">
                        <Button asChild variant="outline">
                            <Link href="/payments/new">Choose Another Student</Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/students/${student.id}/edit`}>Edit Student</Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" asChild>
                    <Link href={`/students/${student.id}`}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back to student</span>
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">New Payment</h1>
            </div>

            <PaymentForm
                student={student}
                clerkId={clerk.id}
                clerkName={clerk.name}
                activeSchoolYear={activeSchoolYear}
            />
        </div>
    )
}