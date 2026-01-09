// src/app/api/tutors/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'

// GET /api/tutors/[id] - Get a tutor by ID
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

        const tutor = await prisma.tutor.findUnique({
            where: { id },
            include: {
                students: {
                    include: {
                        grade: true,
                    },
                    orderBy: {
                        name: 'asc',
                    },
                },
            },
        })

        if (!tutor) {
            return new NextResponse(JSON.stringify({ error: 'Tutor not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        return NextResponse.json(tutor)
    } catch (error) {
        console.error('Error fetching tutor:', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

// PUT /api/tutors/[id] - Update a tutor
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

        // Check if the tutor exists
        const existingTutor = await prisma.tutor.findUnique({
            where: { id },
        })

        if (!existingTutor) {
            return new NextResponse(JSON.stringify({ error: 'Tutor not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Update the tutor
        const tutor = await prisma.tutor.update({
            where: { id },
            data: {
                name: data.name !== undefined ? data.name : existingTutor.name,
                phone: data.phone !== undefined ? data.phone : existingTutor.phone,
                email: data.email !== undefined ? data.email : existingTutor.email,
                address: data.address !== undefined ? data.address : existingTutor.address,
            },
        })

        return NextResponse.json(tutor)
    } catch (error) {
        console.error('Error updating tutor:', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

// DELETE /api/tutors/[id] - Delete a tutor
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

        // Check if tutor has students
        const tutorWithStudents = await prisma.tutor.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { students: true },
                },
            },
        })

        if (!tutorWithStudents) {
            return new NextResponse(JSON.stringify({ error: 'Tutor not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // If tutor has students, we can't delete them
        if (tutorWithStudents._count.students > 0) {
            return new NextResponse(JSON.stringify({
                error: 'Cannot delete tutor with associated students. Please reassign or delete the students first.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Delete the tutor if no students
        await prisma.tutor.delete({
            where: { id },
        })

        return new NextResponse(JSON.stringify({
            message: 'Tutor deleted successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Error deleting tutor:', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}