// src/app/(auth)/calendar/page.tsx
import { Suspense } from 'react'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'
import PaymentCalendar from '@/components/calendar/payment-calendar'
import CalendarPageSkeleton from '@/components/skeletons/calendar-page-skeleton'

// This component fetches and displays the actual calendar data
async function CalendarContent() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

    // Get active school year
    const activeSchoolYear = await prisma.schoolYear.findFirst({
        where: { active: true }
    })

    if (!activeSchoolYear) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Calendario de Pagos</h1>
                <p className="text-muted-foreground">
                    No se encontró un año escolar activo. Por favor, active un año escolar para ver el calendario de pagos.
                </p>
            </div>
        )
    }

    // Get all school years
    const schoolYears = await prisma.schoolYear.findMany({
        orderBy: {
            startDate: 'desc'
        }
    })

    // Get all grades
    const grades = await prisma.grade.findMany({
        include: {
            schoolYear: true
        }
    })

    // Get all active students
    const students = await prisma.student.findMany({
        where: {
            active: true
        },
        include: {
            grade: true
        }
    })

    // Get all payments for the active school year
    const payments = await prisma.payment.findMany({
        where: {
            schoolYearId: activeSchoolYear.id
        },
        include: {
            student: {
                include: {
                    grade: true
                }
            }
        }
    })

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Calendario de Pagos</h1>
            <p className="text-muted-foreground">
                Resumen visual de los pagos de todos los estudiantes
            </p>

            <PaymentCalendar
                payments={payments}
                students={students}
                grades={grades}
                schoolYears={schoolYears}
                currentSchoolYearId={activeSchoolYear.id}
            />
        </div>
    )
}

export default function CalendarPage() {
    return (
        <Suspense fallback={<CalendarPageSkeleton />}>
            <CalendarContent />
        </Suspense>
    )
}
