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
    forMonth: number | null; // Allow null for backward compatibility or optional payments
    forYear?: number; // Optional year field for backward compatibility
    schoolYearId: string;
    isPartial?: boolean;
};

// New type to represent a month with its year
export type MonthYearPair = {
    month: number; // 1-12
    year: number;  // Full year (e.g., 2024)
    key: string;   // Unique identifier (e.g., "2024-09")
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
): { monthYear: MonthYearPair; status: 'paid' | 'partial' | 'unpaid'; expectedAmount: number }[] {
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

    // Create a map to track payments by month-year key
    const paymentsByMonth = new Map<string, number>();

    // Initialize all months with zero
    monthsToPay.forEach(monthYear => {
        paymentsByMonth.set(monthYear.key, 0);
    });

    // Sum up payments for each month in this school year
    payments
        .filter(payment => payment.schoolYearId === activeSchoolYear.id)
        .forEach(payment => {
            // Try to find a matching month-year
            const matchingMonthYear = monthsToPay.find(monthYear =>
                monthYear.month === payment.forMonth &&
                // If forYear is provided, use it for exact matching
                (payment.forYear ? monthYear.year === payment.forYear : true)
            );

            if (matchingMonthYear) {
                const currentTotal = paymentsByMonth.get(matchingMonthYear.key) || 0;

                const paymentAmount = typeof payment.amount === 'object'
                    ? parseFloat(payment.amount.toString())
                    : typeof payment.amount === 'string'
                        ? parseFloat(payment.amount)
                        : payment.amount;

                if (!isNaN(paymentAmount)) {
                    paymentsByMonth.set(matchingMonthYear.key, currentTotal + paymentAmount);
                }
            }
        });

    // Create the result array
    return monthsToPay.map(monthYear => {
        const paid = paymentsByMonth.get(monthYear.key) || 0;
        let status: 'paid' | 'partial' | 'unpaid';

        if (paid >= monthlyFee) {
            status = 'paid';
        } else if (paid > 0) {
            status = 'partial';
        } else {
            status = 'unpaid';
        }

        return {
            monthYear,
            status,
            expectedAmount: monthlyFee
        };
    });
}

/**
 * Determine which months of the school year should be paid by now
 * Now returns an array of month-year objects instead of just month numbers
 */
export function getMonthsToPay(schoolYear: SchoolYearParam): MonthYearPair[] {
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

    const result: MonthYearPair[] = [];
    let currentDate = new Date(startDate);

    // Loop through all months from start date to cutoff date
    while (currentDate <= cutoffDate) {
        const month = currentDate.getMonth() + 1; // 1-12 format
        const year = currentDate.getFullYear();
        const key = `${year}-${month.toString().padStart(2, '0')}`;

        // Only add this month-year pair if we haven't seen it yet
        if (!result.some(item => item.key === key)) {
            result.push({ month, year, key });
        }

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
        // Reset the day to avoid issues with different month lengths
        currentDate.setDate(1);
    }

    return result;
}

/**
 * Format a month-year pair for display
 */
export function formatMonthYear(monthYear: MonthYearPair): string {
    const date = new Date(monthYear.year, monthYear.month - 1, 1);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Get an ordered array of all month-year pairs in a school year
 * Useful for displaying the full school year calendar
 */
export function getAllSchoolYearMonths(schoolYear: SchoolYearParam): MonthYearPair[] {
    // Convert string dates to Date objects if needed
    const startDate = schoolYear.startDate instanceof Date
        ? schoolYear.startDate
        : new Date(schoolYear.startDate);

    const endDate = schoolYear.endDate instanceof Date
        ? schoolYear.endDate
        : new Date(schoolYear.endDate);

    const result: MonthYearPair[] = [];
    let currentDate = new Date(startDate);

    // Loop through all months from start date to end date
    while (currentDate <= endDate) {
        const month = currentDate.getMonth() + 1; // 1-12 format
        const year = currentDate.getFullYear();
        const key = `${year}-${month.toString().padStart(2, '0')}`;

        result.push({ month, year, key });

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
        // Reset the day to avoid issues with different month lengths
        currentDate.setDate(1);
    }

    return result;
}

/**
 * Distribute a payment amount across unpaid months
 * This function takes a payment amount and distributes it across months based on priority
 * (oldest unpaid months first)
 */
export function distributePayment(
    paymentAmount: number,
    unpaidMonths: Array<{
        monthYear: MonthYearPair;
        status: 'paid' | 'partial' | 'unpaid';
        expectedAmount: number;
        paidAmount?: number;
    }>
): Array<{
    monthYear: MonthYearPair;
    amount: number;
    isPartial: boolean;
}> {
    // Make a copy of unpaid months to avoid mutation
    const months = [...unpaidMonths];

    // Sort months by date (oldest first)
    months.sort((a, b) => {
        // First sort by year
        if (a.monthYear.year !== b.monthYear.year) {
            return a.monthYear.year - b.monthYear.year;
        }
        // Then by month
        return a.monthYear.month - b.monthYear.month;
    });

    // Now allocate payments starting with oldest months
    let remainingAmount = paymentAmount;
    const allocations: Array<{
        monthYear: MonthYearPair;
        amount: number;
        isPartial: boolean;
    }> = [];

    for (const month of months) {
        // Skip already fully paid months
        if (month.status === 'paid') continue;

        // Calculate remaining to pay for this month
        const paidAmount = month.paidAmount || 0;
        const remainingForMonth = month.expectedAmount - paidAmount;

        // Determine how much to allocate
        const allocation = Math.min(remainingAmount, remainingForMonth);

        // Only create allocation if there's money to allocate
        if (allocation > 0) {
            allocations.push({
                monthYear: month.monthYear,
                amount: allocation,
                isPartial: allocation < remainingForMonth
            });

            remainingAmount -= allocation;
        }

        // Stop if we've allocated all the money
        if (remainingAmount <= 0) break;
    }

    return allocations;
}
