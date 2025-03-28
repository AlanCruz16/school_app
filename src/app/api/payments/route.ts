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

        // Debugging
        console.log('Payment request data:', JSON.stringify(data, null, 2));

        // Check if this is a multi-month payment
        const isMultiMonth = Array.isArray(data.months) && data.months.length > 0;
        const isBulkPayment = data.isBulkPayment === true;

        // Standard validation for single month payment
        if (!isMultiMonth) {
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
        } else {
            // Validate multi-month data
            if (!data.studentId || !data.amount || !data.paymentMethod ||
                !data.schoolYearId || !data.clerkId || !data.receiptNumber ||
                !data.months || !Array.isArray(data.months) || data.months.length === 0) {

                console.error('Missing required fields for multi-month payment:', {
                    studentId: !!data.studentId,
                    amount: !!data.amount,
                    paymentMethod: !!data.paymentMethod,
                    schoolYearId: !!data.schoolYearId,
                    clerkId: !!data.clerkId,
                    receiptNumber: !!data.receiptNumber,
                    months: !!data.months,
                    monthsIsArray: Array.isArray(data.months),
                    monthsLength: data.months ? data.months.length : 0
                });

                return new NextResponse(JSON.stringify({
                    error: 'Missing required fields for multi-month payment'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                })
            }

            // Validate each month in the array
            for (const monthData of data.months) {
                if (!monthData.month || monthData.month < 1 || monthData.month > 12 || !monthData.year) {
                    return new NextResponse(JSON.stringify({
                        error: 'Invalid month or year in months array'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' },
                    })
                }
            }
        }
        if (isBulkPayment) {
            // Validate bulk payment data
            if (!data.studentId || !data.amount || !data.paymentMethod ||
                !data.schoolYearId || !data.clerkId || !data.receiptNumber ||
                !data.months || !Array.isArray(data.months) || data.months.length === 0) {

                console.error('Missing required fields for bulk payment:', {
                    studentId: !!data.studentId,
                    amount: !!data.amount,
                    paymentMethod: !!data.paymentMethod,
                    schoolYearId: !!data.schoolYearId,
                    clerkId: !!data.clerkId,
                    receiptNumber: !!data.receiptNumber,
                    months: !!data.months,
                    monthsIsArray: Array.isArray(data.months),
                    monthsLength: data.months ? data.months.length : 0
                });

                return new NextResponse(JSON.stringify({
                    error: 'Missing required fields for bulk payment'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // Validate each month has allocation data
            for (const monthData of data.months) {
                if (!monthData.month || monthData.month < 1 || monthData.month > 12 ||
                    !monthData.year || !monthData.allocation) {
                    return new NextResponse(JSON.stringify({
                        error: 'Invalid month, year, or allocation in months array'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
            }
        }


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
        const result = await prisma.$transaction(async (prisma) => {
            let payments = [];
            const paymentAmount = parseFloat(data.amount.toString());
            const currentBalance = parseFloat(student.balance.toString());
            const newBalance = Math.max(currentBalance - paymentAmount, 0); // Don't go below zero

            if (!isMultiMonth && !isBulkPayment) {
                // Single month payment
                const newPayment = await prisma.payment.create({
                    data: {
                        studentId: data.studentId,
                        amount: data.amount,
                        paymentMethod: data.paymentMethod,
                        forMonth: data.forMonth,
                        forYear: data.forYear || new Date().getFullYear(),
                        schoolYearId: data.schoolYearId,
                        clerkId: data.clerkId,
                        receiptNumber: data.receiptNumber,
                        isPartial: data.isPartial === true,
                        notes: data.notes,
                    },
                });
                payments.push(newPayment);
            } else if (isMultiMonth) {
                // Multi-month payment (existing code)
                let totalMonthlyFees = 0;
                for (const monthData of data.months) {
                    totalMonthlyFees += (monthData.fee || 0);
                }
                let remainingAmount = paymentAmount;
                const isDistributionNeeded = paymentAmount < totalMonthlyFees;

                for (const monthData of data.months) {
                    const month = monthData.month;
                    const year = monthData.year;
                    const monthlyFee = monthData.fee || 0;

                    // Determine amount to allocate to this month
                    let amountForMonth;
                    if (isDistributionNeeded) {
                        // Distribute proportionally if partial payment
                        const proportion = monthlyFee / totalMonthlyFees;
                        amountForMonth = Math.min(remainingAmount, Math.round((paymentAmount * proportion) * 100) / 100);
                    } else {
                        // Otherwise pay the full fee for each month
                        amountForMonth = Math.min(remainingAmount, monthlyFee);
                    }

                    remainingAmount = Math.max(0, remainingAmount - amountForMonth);

                    // Determine if this is a partial payment
                    const isPartial = amountForMonth < monthlyFee;

                    const newPayment = await prisma.payment.create({
                        data: {
                            studentId: data.studentId,
                            amount: amountForMonth,
                            paymentMethod: data.paymentMethod,
                            forMonth: month,
                            forYear: year,
                            schoolYearId: data.schoolYearId,
                            clerkId: data.clerkId,
                            receiptNumber: `${data.receiptNumber}-${month}-${year}`, // Make each receipt number unique
                            isPartial: isPartial,
                            notes: data.notes,
                        },
                    });

                    payments.push(newPayment);

                    // Stop if we've allocated all the money
                    if (remainingAmount <= 0) break;
                }
            } else if (isBulkPayment) {
                // Bulk payment mode - use precomputed allocations
                for (const monthData of data.months) {
                    const month = monthData.month;
                    const year = monthData.year;
                    const allocation = monthData.allocation || 0;
                    const monthlyFee = monthData.fee || 0;

                    // Skip if no allocation for this month
                    if (allocation <= 0) continue;

                    // Determine if this is a partial payment
                    const isPartial = allocation < monthlyFee;

                    const newPayment = await prisma.payment.create({
                        data: {
                            studentId: data.studentId,
                            amount: allocation,
                            paymentMethod: data.paymentMethod,
                            forMonth: month,
                            forYear: year,
                            schoolYearId: data.schoolYearId,
                            clerkId: data.clerkId,
                            receiptNumber: `${data.receiptNumber}-${month}-${year}`, // Make each receipt number unique
                            isPartial: isPartial,
                            notes: data.notes,
                        },
                    });

                    payments.push(newPayment);
                }
            }

            // Update student balance
            await prisma.student.update({
                where: { id: data.studentId },
                data: { balance: newBalance },
            });

            return payments;
        });

        // Return the first payment (for receipt redirection) or all payments
        return new NextResponse(JSON.stringify({
            payment: result[0],
            allPayments: result
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error creating payment:', error)
        // Return more detailed error information
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : '';

        return new NextResponse(JSON.stringify({
            error: 'Internal Server Error',
            message: errorMessage,
            stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
        }), {
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
        const receiptNumber = searchParams.get('receiptNumber')
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

        if (receiptNumber) {
            filters.receiptNumber = receiptNumber
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