// src/app/api/tutors/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'

// GET /api/tutors - Get all tutors
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
        const query = searchParams.get('query') || ''

        // Build filters
        const filters: any = {}

        if (query) {
            filters.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query, mode: 'insensitive' } }
            ]
        }

        const tutors = await prisma.tutor.findMany({
            where: filters,
            include: {
                _count: {
                    select: { students: true },
                },
            },
            orderBy: {
                name: 'asc',
            },
        })

        return NextResponse.json(tutors)
    } catch (error) {
        console.error('Error fetching tutors:', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

// POST /api/tutors - Create a new tutor
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
        if (!data.name || !data.phone || !data.email) {
            return new NextResponse(JSON.stringify({
                error: 'Missing required fields: name, phone, and email are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        const tutor = await prisma.tutor.create({
            data: {
                name: data.name,
                phone: data.phone,
                email: data.email,
                address: data.address,
            },
        })

        return new NextResponse(JSON.stringify(tutor), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Error creating tutor:', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}