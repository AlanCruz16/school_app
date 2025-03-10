// src/app/api/school-years/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'

// GET /api/school-years - Get all school years
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
        const active = searchParams.get('active')

        // Build filters
        const filters: any = {}

        if (active !== null) {
            filters.active = active === 'true'
        }

        const schoolYears = await prisma.schoolYear.findMany({
            where: filters,
            include: {
                _count: {
                    select: { grades: true, payments: true },
                },
            },
            orderBy: {
                startDate: 'desc',
            },
        })

        return NextResponse.json(schoolYears)
    } catch (error) {
        console.error('Error fetching school years:', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

// POST /api/school-years - Create a new school year
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
        if (!data.name || !data.startDate || !data.endDate) {
            return new NextResponse(JSON.stringify({
                error: 'Missing required fields: name, startDate, and endDate are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Convert string dates to Date objects
        const startDate = new Date(data.startDate)
        const endDate = new Date(data.endDate)

        // Validate date range
        if (startDate >= endDate) {
            return new NextResponse(JSON.stringify({
                error: 'Invalid date range: startDate must be before endDate'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Check for date overlap with other active school years
        if (data.active) {
            const overlappingSchoolYears = await prisma.schoolYear.findMany({
                where: {
                    active: true,
                    OR: [
                        {
                            startDate: { lte: endDate },
                            endDate: { gte: startDate },
                        },
                    ],
                },
            })

            if (overlappingSchoolYears.length > 0) {
                // If trying to set as active and it overlaps with another active year
                return new NextResponse(JSON.stringify({
                    error: 'This school year overlaps with another active school year. Please deactivate the other school year first.',
                    overlappingYears: overlappingSchoolYears.map((year: { name: string }) => year.name),
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                })
            }
        }

        // If setting this year to active, deactivate all other years
        if (data.active) {
            await prisma.schoolYear.updateMany({
                where: { active: true },
                data: { active: false },
            })
        }

        // Create the school year
        const schoolYear = await prisma.schoolYear.create({
            data: {
                name: data.name,
                startDate,
                endDate,
                active: data.active || false,
            },
        })

        return new NextResponse(JSON.stringify(schoolYear), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Error creating school year:', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}