import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Payment, PaymentMethod, Student } from '@prisma/client';
import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns';

const prisma = new PrismaClient();

// Define the shape of the payment data including student
type PaymentWithStudent = Payment & {
    student: Pick<Student, 'id' | 'name'> | null;
};

// Define the shape of the data expected from the API when fetching payments for a month
type PaymentsByMonthReportData = {
    [key in PaymentMethod]?: PaymentWithStudent[];
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get('month'); // Expecting 'YYYY-MM' format

    try {
        if (monthParam) {
            // --- Fetch Payments for a Specific Month ---

            // Validate month format (basic check)
            if (!/^\d{4}-\d{2}$/.test(monthParam)) {
                return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM.' }, { status: 400 });
            }

            const targetMonth = parseISO(`${monthParam}-01`); // Parse YYYY-MM into a Date object
            const startDate = startOfMonth(targetMonth);
            const endDate = endOfMonth(targetMonth);

            const payments = await prisma.payment.findMany({
                where: {
                    paymentDate: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                include: {
                    student: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    paymentDate: 'desc', // Or any preferred order
                },
            });

            // Group payments by method
            const groupedPayments = payments.reduce((acc, payment) => {
                const method = payment.paymentMethod;
                if (!acc[method]) {
                    acc[method] = [];
                }
                acc[method]?.push(payment);
                return acc;
            }, {} as PaymentsByMonthReportData);

            return NextResponse.json(groupedPayments);

        } else {
            // --- Fetch Available Months ---

            const paymentsWithDates = await prisma.payment.findMany({
                select: {
                    paymentDate: true,
                },
                orderBy: {
                    paymentDate: 'desc',
                },
            });

            // Extract unique months in 'YYYY-MM' format
            const availableMonths = Array.from(
                new Set(
                    paymentsWithDates.map(p => format(p.paymentDate, 'yyyy-MM'))
                )
            );

            return NextResponse.json(availableMonths);
        }
    } catch (error) {
        console.error('Error fetching payments by month report:', error);
        return NextResponse.json({ error: 'Failed to fetch report data' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
