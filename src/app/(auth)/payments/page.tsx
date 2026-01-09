// src/app/(auth)/payments/new/page.tsx
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'
import { Button } from '@/components/ui/button'
import PaymentForm from '@/components/payments/payment-form'
import StudentSelector from '@/components/payments/student-selector'
import { serializeDecimal } from '@/lib/utils/convert-decimal'

export default async function NewPaymentPage({
    searchParams
}: {
    searchParams: Promise<{ studentId?: string, month?: string, year?: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

    const { studentId, month, year } = await searchParams

    // Get or create the clerk information
    let clerk = await prisma.user.findUnique({
        where: { email: user.email || '' }
    })

    if (!clerk && user.email) {
        // Create a new clerk record for this authenticated user
        clerk = await prisma.user.create({
            data: {
                name: user.email.split('@')[0], // Basic name from email
                email: user.email,
                role: 'clerk' // Default role
            }
        });
    }

    // Now we should have a clerk, but just in case
    if (!clerk) {
        // Show a meaningful error instead of redirecting
        return (
            <div className="p-8">
                <h1 className="text-xl font-bold mb-4">Account Setup Required</h1>
                <p>Your user account isn't properly set up in the system. Please contact an administrator.</p>
            </div>
        )
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

    // Parse month and year parameters if provided
    const initialMonth = month ? parseInt(month) : undefined
    const initialYear = year ? parseInt(year) : undefined

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

    // Fetch the student's payment history for the active school year
    const studentPayments = await prisma.payment.findMany({
        where: {
            studentId: student.id,
            schoolYearId: activeSchoolYear.id
        }
    });

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
                student={serializeDecimal(student)}
                clerkId={clerk.id}
                clerkName={clerk.name}
                activeSchoolYear={activeSchoolYear}
                initialMonth={initialMonth}
                initialYear={initialYear}
                studentPayments={serializeDecimal(studentPayments)}
            />
        </div>
    )
}