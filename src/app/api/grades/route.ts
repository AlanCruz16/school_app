// src/app/api/grades/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'

// GET /api/grades - Get all grades
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Get query parameters
        const searchParams = request.nextUrl.searchParams
        const schoolYearId = searchParams.get('schoolYearId')

        // Build filters
        const filters: any = {}

        if (schoolYearId) {
            filters.schoolYearId = schoolYearId
        }

        const grades = await prisma.grade.findMany({
            where: filters,
            include: {
                schoolYear: true,
                _count: {
                    select: { students: true },
                },
            },
            orderBy: {
                name: 'asc',
            },
        })

        return NextResponse.json(grades)
    } catch (error) {
        console.error('Error fetching grades:', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

// POST /api/grades - Create a new grade
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        const data = await request.json()

        // Validate required fields
        if (!data.name || data.tuitionAmount === undefined || !data.schoolYearId) { // Check tuitionAmount explicitly for undefined
            return new NextResponse(JSON.stringify({
                error: 'Missing required fields: name, tuitionAmount, and schoolYearId are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Check if the school year exists
        const schoolYear = await prisma.schoolYear.findUnique({
            where: { id: data.schoolYearId },
        })

        if (!schoolYear) {
            return new NextResponse(JSON.stringify({ error: 'School year not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Create the grade
        const grade = await prisma.grade.create({
            data: {
                name: data.name,
                tuitionAmount: data.tuitionAmount,
                inscriptionCost: data.inscriptionCost, // Add inscriptionCost (will use DB default if undefined)
                schoolYearId: data.schoolYearId,
            },
            include: {
                schoolYear: true,
            },
        })

        return new NextResponse(JSON.stringify(grade), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Error creating grade:', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
