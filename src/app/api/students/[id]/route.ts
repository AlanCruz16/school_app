// src/app/api/students/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'

// GET /api/students/[id] - Get a student by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        const { id } = await params

        const student = await prisma.student.findUnique({
            where: { id },
            include: {
                grade: true,
                tutor: true,
                payments: {
                    orderBy: {
                        paymentDate: 'desc',
                    },
                    include: {
                        schoolYear: true,
                        clerk: true,
                    },
                },
            },
        })

        if (!student) {
            return new NextResponse(JSON.stringify({ error: 'Student not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        return NextResponse.json(student)
    } catch (error) {
        console.error('Error fetching student:', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

// PUT /api/students/[id] - Update a student
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        const { id } = await params
        const data = await request.json()

        // Check if the student exists
        const existingStudent = await prisma.student.findUnique({
            where: { id },
        })

        if (!existingStudent) {
            return new NextResponse(JSON.stringify({ error: 'Student not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Update the student
        const student = await prisma.student.update({
            where: { id },
            data: {
                name: data.name !== undefined ? data.name : existingStudent.name,
                gradeId: data.gradeId !== undefined ? data.gradeId : existingStudent.gradeId,
                tutorId: data.tutorId !== undefined ? data.tutorId : existingStudent.tutorId,
                active: data.active !== undefined ? data.active : existingStudent.active,
                balance: data.balance !== undefined ? data.balance : existingStudent.balance,
            },
            include: {
                grade: true,
                tutor: true,
            },
        })

        return NextResponse.json(student)
    } catch (error) {
        console.error('Error updating student:', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

// DELETE /api/students/[id] - Delete a student
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        const { id } = await params

        // Check if student has payments before deletion
        const studentWithPayments = await prisma.student.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { payments: true },
                },
            },
        })

        if (!studentWithPayments) {
            return new NextResponse(JSON.stringify({ error: 'Student not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // If student has payments, we should not delete them but deactivate instead
        if (studentWithPayments._count.payments > 0) {
            const updatedStudent = await prisma.student.update({
                where: { id },
                data: { active: false },
            })

            return new NextResponse(JSON.stringify({
                message: 'Student has payment records and cannot be deleted. Student has been deactivated instead.',
                student: updatedStudent
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // If no payments, we can safely delete
        await prisma.student.delete({
            where: { id },
        })

        return new NextResponse(JSON.stringify({
            message: 'Student deleted successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Error deleting student:', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}