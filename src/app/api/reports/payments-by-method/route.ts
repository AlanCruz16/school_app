import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Payment, PaymentMethod, Student } from '@prisma/client'; // Import PaymentMethod

// Define the shape of the payment data including student
type PaymentWithStudent = Payment & {
    student: Pick<Student, 'id' | 'name'> | null;
};

// Define the shape of the final response: an object keyed by payment method
type PaymentsByMethodReportData = {
    [key in PaymentMethod]?: PaymentWithStudent[]; // Key is enum value, value is array of payments
};

export async function GET() {
    try {
        const paymentMethods = Object.values(PaymentMethod); // Get all PaymentMethod enum values
        const reportData: PaymentsByMethodReportData = {};

        for (const method of paymentMethods) {
            const last10Payments = await prisma.payment.findMany({
                where: {
                    paymentMethod: method, // Filter by method
                },
                orderBy: [
                    { paymentDate: 'desc' },
                    { id: 'desc' } // Secondary sort
                ],
                take: 10, // Limit to last 10
                include: {
                    student: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });

            // Add the results to the report object if any payments were found
            if (last10Payments.length > 0) {
                // Map to ensure consistent student object structure (handling null)
                const paymentsWithStudent = last10Payments.map(p => ({
                    ...p,
                    student: p.student ? { id: p.student.id, name: p.student.name } : null
                }));
                reportData[method] = paymentsWithStudent;
            }
        }

        return NextResponse.json(reportData);

    } catch (error) {
        console.error('Error fetching last 10 payments by method:', error); // Updated error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch report data', details: errorMessage },
            { status: 500 }
        );
    }
}
