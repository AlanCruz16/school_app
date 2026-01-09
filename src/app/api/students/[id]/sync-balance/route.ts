// src/app/api/students/[id]/sync-balance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'
import { calculateExpectedBalance } from '@/lib/utils/balance'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        const { id } = await params

        // Get the student with grade info
        const student = await prisma.student.findUnique({
            where: { id },
            include: {
                grade: true,
                payments: true
            }
        })

        if (!student) {
            return new NextResponse(JSON.stringify({ error: 'Student not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Get active school year
        const activeSchoolYear = await prisma.schoolYear.findFirst({
            where: { active: true }
        })

        if (!activeSchoolYear) {
            return new NextResponse(JSON.stringify({ error: 'No active school year found' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Calculate the expected balance
        const expectedBalance = calculateExpectedBalance(
            student,
            activeSchoolYear,
            student.payments.filter(p => p.schoolYearId === activeSchoolYear.id)
        )

        // Update the student's balance
        const updatedStudent = await prisma.student.update({
            where: { id },
            data: { balance: expectedBalance }
        })

        return NextResponse.json({
            message: 'Balance synced successfully',
            student: updatedStudent
        })
    } catch (error) {
        console.error('Error syncing balance:', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}