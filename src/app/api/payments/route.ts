// src/app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { PaymentType } from '@prisma/client' // Import PaymentType
import { createClient } from '@/lib/utils/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import { generateReceiptNumber } from '@/lib/utils/receipt'

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
        const paymentType = data.paymentType || PaymentType.TUITION; // Default to TUITION
        const description = data.description;

        // Debugging
        console.log('Payment request data:', JSON.stringify(data, null, 2));
        console.log('Determined Payment Type:', paymentType);

        // Basic required fields for ALL payment types
        if (!data.studentId || !data.amount || !data.paymentMethod || !data.schoolYearId || !data.clerkId) {
            return new NextResponse(JSON.stringify({
                error: 'Missing required fields: studentId, amount, paymentMethod, schoolYearId, clerkId'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Type-specific validation and logic determination
        let isMultiMonth = false;
        let isBulkPayment = false;

        if (paymentType === PaymentType.TUITION) {
            isMultiMonth = Array.isArray(data.months) && data.months.length > 0 && !data.isBulkPayment;
            isBulkPayment = data.isBulkPayment === true && Array.isArray(data.months) && data.months.length > 0;

            // --- TUITION Validation ---
            if (!isMultiMonth && !isBulkPayment) {
                // Single TUITION payment validation
                if (!data.forMonth) {
                    return new NextResponse(JSON.stringify({
                        error: 'Missing required field for TUITION payment: forMonth'
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
            } else if (isMultiMonth) {
                // Multi-month TUITION validation (existing logic)
                if (!data.months || !Array.isArray(data.months) || data.months.length === 0) {
                    console.error('Missing required fields for multi-month TUITION payment:', { /* ... */ });
                    return new NextResponse(JSON.stringify({
                        error: 'Missing required fields for multi-month TUITION payment'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' },
                    })
                }
                // Validate each month in the array
                for (const monthData of data.months) {
                    if (!monthData.month || monthData.month < 1 || monthData.month > 12 || !monthData.year) {
                        return new NextResponse(JSON.stringify({
                            error: 'Invalid month or year in months array for multi-month TUITION'
                        }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' },
                        })
                    }
                }
            } else if (isBulkPayment) {
                // Bulk TUITION validation (existing logic)
                if (!data.months || !Array.isArray(data.months) || data.months.length === 0) {
                    console.error('Missing required fields for bulk TUITION payment:', { /* ... */ });
                    return new NextResponse(JSON.stringify({
                        error: 'Missing required fields for bulk TUITION payment'
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
                            error: 'Invalid month, year, or allocation in months array for bulk TUITION'
                        }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' },
                        });
                    }
                }
            }
        } else if (paymentType === PaymentType.INSCRIPTION || paymentType === PaymentType.OPTIONAL) {
            // --- INSCRIPTION / OPTIONAL Validation ---
            // These types should not have month arrays
            if (data.months || data.isBulkPayment) {
                return new NextResponse(JSON.stringify({
                    error: `Multi-month/bulk data (months, isBulkPayment) is not applicable for ${paymentType} payments.`
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            // forMonth is not applicable
            if (data.forMonth) {
                return new NextResponse(JSON.stringify({
                    error: `forMonth is not applicable for ${paymentType} payments.`
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
            // Optional: Validate description for OPTIONAL type if needed
            // if (paymentType === PaymentType.OPTIONAL && !description) { ... }
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
        // Create a single transaction ID for all payments in this transaction
        const transactionId = uuidv4();

        // Start a transaction to update payment(s), student balance, and receipt counter atomically
        const result = await prisma.$transaction(async (prisma) => {
            // Generate the sequential receipt number WITHIN the transaction
            const receiptNumber = await generateReceiptNumber(prisma, data.schoolYearId);

            let payments = [];
            const paymentAmount = parseFloat(data.amount.toString());
            const currentBalance = parseFloat(student.balance.toString());
            const newBalance = Math.max(currentBalance - paymentAmount, 0); // Don't go below zero

            // --- Payment Creation Logic based on Type ---
            if (paymentType === PaymentType.TUITION) {
                // --- TUITION Payment Creation ---
                if (!isMultiMonth && !isBulkPayment) {
                    // Single TUITION payment
                    const newPayment = await prisma.payment.create({
                        data: {
                            studentId: data.studentId,
                            amount: data.amount,
                            paymentMethod: data.paymentMethod,
                            paymentType: PaymentType.TUITION, // Explicitly set type
                            forMonth: data.forMonth, // Required for single tuition
                            forYear: data.forYear || new Date().getFullYear(),
                            schoolYearId: data.schoolYearId,
                            clerkId: data.clerkId,
                            receiptNumber: receiptNumber,
                            transactionId: transactionId,
                            isPartial: data.isPartial === true,
                            notes: data.notes,
                        },
                    });
                    payments.push(newPayment);
                } else if (isMultiMonth) {
                    // Multi-month TUITION payment (existing logic)
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
                                paymentType: PaymentType.TUITION, // Explicitly set type
                                forMonth: month,
                                forYear: year,
                                schoolYearId: data.schoolYearId,
                                clerkId: data.clerkId,
                                receiptNumber: receiptNumber,
                                transactionId: transactionId,
                                isPartial: isPartial,
                                notes: data.notes,
                            },
                        });

                        payments.push(newPayment);

                        // Stop if we've allocated all the money
                        if (remainingAmount <= 0) break;
                    }
                } else if (isBulkPayment) {
                    // Bulk TUITION payment mode (existing logic)
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
                                paymentType: PaymentType.TUITION, // Explicitly set type
                                forMonth: month,
                                forYear: year,
                                schoolYearId: data.schoolYearId,
                                clerkId: data.clerkId,
                                receiptNumber: receiptNumber,
                                transactionId: transactionId,
                                isPartial: isPartial,
                                notes: data.notes,
                            },
                        });

                        payments.push(newPayment);
                    }
                }
            } else if (paymentType === PaymentType.INSCRIPTION || paymentType === PaymentType.OPTIONAL) {
                // --- INSCRIPTION / OPTIONAL Payment Creation ---
                // These are treated as single payments
                const newPayment = await prisma.payment.create({
                    data: {
                        studentId: data.studentId,
                        amount: data.amount,
                        paymentMethod: data.paymentMethod,
                        paymentType: paymentType, // Set the specific type
                        description: description, // Add the description
                        // forMonth is intentionally omitted
                        forYear: data.forYear || new Date().getFullYear(), // Keep year for context
                        schoolYearId: data.schoolYearId,
                        clerkId: data.clerkId,
                        receiptNumber: receiptNumber,
                        transactionId: transactionId,
                        isPartial: false, // Typically not partial, but could be adjusted if needed
                        notes: data.notes,
                    },
                });
                payments.push(newPayment);
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

        // Handle Prisma error for unique constraint violation
        // Type check for Prisma errors
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'P2002' &&
            'meta' in error &&
            error.meta &&
            typeof error.meta === 'object' &&
            'target' in error.meta
        ) {
            const target = error.meta.target;
            if (Array.isArray(target) && target.includes('receiptNumber')) {
                return new NextResponse(JSON.stringify({
                    error: 'Receipt number already exists. Please try again.',
                    details: 'A database conflict occurred with the receipt number generation.'
                }), {
                    status: 409, // Conflict status code
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        // Get error details safely
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;

        return new NextResponse(JSON.stringify({
            error: 'Internal Server Error',
            message: errorMessage,
            stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
