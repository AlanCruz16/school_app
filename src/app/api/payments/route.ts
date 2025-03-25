// src/app/api/payments/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'

// POST /api/payments - Create a new payment
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
        if (!data.studentId || !data.amount || !data.paymentMethod ||
            !data.forMonth || !data.schoolYearId || !data.clerkId || !data.receiptNumber) {
            return new NextResponse(JSON.stringify({
                error: 'Missing required fields for payment'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Validate month is in range 1-12
        if (data.forMonth < 1 || data.forMonth > 12) {
            return new NextResponse(JSON.stringify({
                error: 'Month must be between 1 and 12'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Determine year if not provided (use current year as default)
        const forYear = data.forYear || new Date().getFullYear()

        // Get student to update balance
        const student = await prisma.student.findUnique({
            where: { id: data.studentId },
        })

        if (!student) {
            return new NextResponse(JSON.stringify({ error: 'Student not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Start a transaction to update both payment and student balance
        const payment = await prisma.$transaction(async (prisma) => {
            // Create the payment
            const newPayment = await prisma.payment.create({
                data: {
                    studentId: data.studentId,
                    amount: data.amount,
                    paymentMethod: data.paymentMethod,
                    forMonth: data.forMonth,
                    forYear: forYear, // Include the year
                    schoolYearId: data.schoolYearId,
                    clerkId: data.clerkId,
                    receiptNumber: data.receiptNumber,
                    isPartial: data.isPartial === true,
                    notes: data.notes,
                },
            })

            // Update student balance (reduce it by the payment amount)
            const currentBalance = parseFloat(student.balance.toString())
            const paymentAmount = parseFloat(data.amount.toString())
            const newBalance = Math.max(currentBalance - paymentAmount, 0) // Don't go below zero

            await prisma.student.update({
                where: { id: data.studentId },
                data: { balance: newBalance },
            })

            return newPayment
        })

        return new NextResponse(JSON.stringify(payment), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Error creating payment:', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}

// GET /api/payments - Get all payments
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

        // Get query parameters for filtering
        const searchParams = request.nextUrl.searchParams
        const studentId = searchParams.get('studentId')
        const schoolYearId = searchParams.get('schoolYearId')
        const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined
        const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

        // Build filters
        const filters: any = {}

        if (studentId) {
            filters.studentId = studentId
        }

        if (schoolYearId) {
            filters.schoolYearId = schoolYearId
        }

        if (month !== undefined) {
            filters.forMonth = month
        }

        if (year !== undefined) {
            filters.forYear = year
        }

        // Fetch payments with the applied filters
        const payments = await prisma.payment.findMany({
            where: filters,
            include: {
                student: {
                    select: {
                        name: true,
                        grade: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                schoolYear: true,
                clerk: true
            },
            orderBy: {
                paymentDate: 'desc'
            },
            take: limit
        })

        return NextResponse.json(payments)
    } catch (error) {
        console.error('Error fetching payments:', error)
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}