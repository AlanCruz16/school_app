// src/app/api/students/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'

// GET /api/students - Get all students
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Get query parameters
        const searchParams = request.nextUrl.searchParams
        const query = searchParams.get('query') || ''
        const active = searchParams.get('active')
        const gradeId = searchParams.get('gradeId')
        const tutorId = searchParams.get('tutorId')

        // Build filters
        const filters: any = {}

        if (active !== null) {
            filters.active = active === 'true'
        }

        if (gradeId) {
            filters.gradeId = gradeId
        }

        if (tutorId) {
            filters.tutorId = tutorId
        }

        if (query) {
            filters.OR = [
                { name: { contains: query, mode: 'insensitive' } }
            ]
        }

        const students = await prisma.student.findMany({
            where: filters,
            include: {
                grade: {
                    include: {
                        schoolYear: true
                    }
                },
                tutor: true,
            },
            orderBy: {
                name: 'asc',
            },
        })

        return NextResponse.json(students)
    } catch (error) {
        console.error('Error fetching students:', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

// POST /api/students - Create a new student
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        const data = await request.json()

        // Validate required fields
        if (!data.name || !data.gradeId || !data.tutorId) {
            return new NextResponse(JSON.stringify({
                error: 'Missing required fields: name, gradeId, and tutorId are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        const student = await prisma.student.create({
            data: {
                name: data.name,
                gradeId: data.gradeId,
                tutorId: data.tutorId,
                active: data.active !== undefined ? data.active : true,
                balance: data.balance || 0,
            },
            include: {
                grade: true,
                tutor: true,
            },
        })

        return new NextResponse(JSON.stringify(student), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Error creating student:', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}