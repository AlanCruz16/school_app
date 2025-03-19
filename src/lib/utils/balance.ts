// src/lib/utils/balance.ts

/**
 * Type definitions with flexible structures to accommodate different component needs
 */
export type StudentWithGrade = {
    id: string;
    name: string;
    grade: {
        tuitionAmount: any; // Handle both Prisma Decimal and regular number/string
        schoolYear?: {
            id: string;
            name: string;
        }
    }
};

export type SchoolYearParam = {
    id: string;
    name: string;
    startDate: Date | string;  // Accept either Date or string
    endDate: Date | string;    // Accept either Date or string
    active?: boolean;
};

export type PaymentParam = {
    id: string;
    studentId?: string;
    amount: any; // Handle Prisma Decimal, number or string
    paymentDate: Date | string;
    forMonth: number;
    schoolYearId: string;
    isPartial?: boolean;
};

/**
 * Calculate the expected balance for a student based on the current date, 
 * the active school year, and their payment history
 */
export function calculateExpectedBalance(
    student: StudentWithGrade,
    activeSchoolYear: SchoolYearParam,
    payments: PaymentParam[]
): number {
    // Get the monthly tuition fee
    const monthlyFee = typeof student.grade.tuitionAmount === 'object'
        ? parseFloat(student.grade.tuitionAmount.toString())
        : typeof student.grade.tuitionAmount === 'string'
            ? parseFloat(student.grade.tuitionAmount)
            : student.grade.tuitionAmount;

    if (isNaN(monthlyFee)) {
        console.error('Invalid tuition amount for student:', student.name);
        return 0;
    }

    // Get the months that should be paid by now
    const monthsToPay = getMonthsToPay(activeSchoolYear);

    // Calculate total expected payment
    const expectedTotal = monthlyFee * monthsToPay.length;

    // Calculate total amount already paid for this school year
    const totalPaid = payments
        .filter(payment => payment.schoolYearId === activeSchoolYear.id)
        .reduce((sum, payment) => {
            const amount = typeof payment.amount === 'object'
                ? parseFloat(payment.amount.toString())
                : typeof payment.amount === 'string'
                    ? parseFloat(payment.amount)
                    : payment.amount;

            return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

    // Return the difference (expected - paid)
    return Math.max(expectedTotal - totalPaid, 0);
}

/**
 * Get a list of months with their payment status for a student in the current school year
 */
export function getUnpaidMonths(
    student: StudentWithGrade,
    activeSchoolYear: SchoolYearParam,
    payments: PaymentParam[]
): { month: number; status: 'paid' | 'partial' | 'unpaid'; expectedAmount: number }[] {
    // Get the monthly tuition fee
    const monthlyFee = typeof student.grade.tuitionAmount === 'object'
        ? parseFloat(student.grade.tuitionAmount.toString())
        : typeof student.grade.tuitionAmount === 'string'
            ? parseFloat(student.grade.tuitionAmount)
            : student.grade.tuitionAmount;

    if (isNaN(monthlyFee)) {
        console.error('Invalid tuition amount for student:', student.name);
        return [];
    }

    // Get the months that should be paid by now
    const monthsToPay = getMonthsToPay(activeSchoolYear);

    // Create a map to track payments by month
    const paymentsByMonth = new Map<number, number>();

    // Initialize all months with zero
    monthsToPay.forEach(month => {
        paymentsByMonth.set(month, 0);
    });

    // Sum up payments for each month in this school year
    payments
        .filter(payment => payment.schoolYearId === activeSchoolYear.id)
        .forEach(payment => {
            const month = payment.forMonth;
            if (monthsToPay.includes(month)) {
                const currentTotal = paymentsByMonth.get(month) || 0;

                const paymentAmount = typeof payment.amount === 'object'
                    ? parseFloat(payment.amount.toString())
                    : typeof payment.amount === 'string'
                        ? parseFloat(payment.amount)
                        : payment.amount;

                if (!isNaN(paymentAmount)) {
                    paymentsByMonth.set(month, currentTotal + paymentAmount);
                }
            }
        });

    // Create the result array
    return monthsToPay.map(month => {
        const paid = paymentsByMonth.get(month) || 0;
        let status: 'paid' | 'partial' | 'unpaid';

        if (paid >= monthlyFee) {
            status = 'paid';
        } else if (paid > 0) {
            status = 'partial';
        } else {
            status = 'unpaid';
        }

        return {
            month,
            status,
            expectedAmount: monthlyFee
        };
    });
}

/**
 * Determine which months of the school year should be paid by now
 */
function getMonthsToPay(schoolYear: SchoolYearParam): number[] {
    // Convert string dates to Date objects if needed
    const startDate = schoolYear.startDate instanceof Date
        ? schoolYear.startDate
        : new Date(schoolYear.startDate);

    const endDate = schoolYear.endDate instanceof Date
        ? schoolYear.endDate
        : new Date(schoolYear.endDate);

    const today = new Date();

    // Use the earlier of today or the school year end date
    const cutoffDate = today < endDate ? today : endDate;

    const result: number[] = [];
    let currentDate = new Date(startDate);

    // Loop through all months from start date to cutoff date
    while (currentDate <= cutoffDate) {
        const month = currentDate.getMonth() + 1; // 1-12 format

        if (!result.includes(month)) {
            result.push(month);
        }

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
        // Reset the day to avoid issues with different month lengths
        currentDate.setDate(1);
    }

    return result;
}