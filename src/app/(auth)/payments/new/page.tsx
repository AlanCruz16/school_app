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
    searchParams: { studentId?: string, month?: string, year?: string }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

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
                <h1 className="text-xl font-bold mb-4">Configuración de Cuenta Requerida</h1>
                <p>Su cuenta de usuario no está configurada correctamente en el sistema. Por favor, contacte a un administrador.</p>
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
                            <span className="sr-only">Regresar</span>
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">Nuevo Pago</h1>
                </div>

                <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                    <h2 className="font-semibold">No Hay Año Escolar Activo</h2>
                    <p className="mt-1">
                        No hay un año escolar activo. Por favor, active un año escolar antes de registrar pagos.
                    </p>
                    <Button className="mt-4" asChild variant="outline">
                        <Link href="/settings/school-years">Gestionar Años Escolares</Link>
                    </Button>
                </div>
            </div>
        )
    }

    // Check if a student ID was provided
    const studentId = searchParams.studentId

    // Parse month and year parameters if provided
    const initialMonth = searchParams.month ? parseInt(searchParams.month) : undefined
    const initialYear = searchParams.year ? parseInt(searchParams.year) : undefined

    // If no student ID is provided, show student selector
    if (!studentId) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/dashboard">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Regresar</span>
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">Nuevo Pago</h1>
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

    // Fetch student's payments for the active school year
    const studentPayments = await prisma.payment.findMany({
        where: {
            studentId: studentId,
            schoolYearId: activeSchoolYear.id,
        },
        orderBy: {
            paymentDate: 'asc' // Optional: order by date
        }
    });

    // If student has no grade assigned, redirect to edit page
    if (!student.grade) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/payments/new">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Regresar</span>
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">Nuevo Pago</h1>
                </div>

                <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                    <h2 className="font-semibold">Falta Información de Grado</h2>
                    <p className="mt-1">
                        Este estudiante no tiene una asignación de grado válida. Por favor, actualice el registro del estudiante primero.
                    </p>
                    <div className="flex gap-2 mt-4">
                        <Button asChild variant="outline">
                            <Link href="/payments/new">Elegir Otro Estudiante</Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/students/${student.id}/edit`}>Editar Estudiante</Link>
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
                        <span className="sr-only">Regresar al estudiante</span>
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Nuevo Pago</h1>
            </div>

            <PaymentForm
                student={student}
                clerkId={clerk.id}
                clerkName={clerk.name}
                activeSchoolYear={activeSchoolYear}
                initialMonth={initialMonth}
                initialYear={initialYear}
                studentPayments={studentPayments} // Pass fetched payments
            />
        </div>
    )
}
