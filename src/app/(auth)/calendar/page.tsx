// src/app/(auth)/calendar/page.tsx
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'
import PaymentCalendar from '@/components/calendar/payment-calendar'

export default async function CalendarPage() {
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
                <h1 className="text-3xl font-bold">Payment Calendar</h1>
                <p className="text-muted-foreground">
                    No active school year found. Please activate a school year to view the payment calendar.
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
            <h1 className="text-3xl font-bold">Payment Calendar</h1>
            <p className="text-muted-foreground">
                Visual overview of payments across all students
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