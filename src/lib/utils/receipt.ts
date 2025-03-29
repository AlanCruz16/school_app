// src/lib/utils/receipt.ts
// A simplified approach using UUID for guaranteed uniqueness

import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

/**
 * Generates a sequential receipt number for the given school year within a transaction.
 * Format: [SchoolYearName]-[SequentialNumber]
 * Example: "2024-2025-0001"
 *
 * IMPORTANT: This function MUST be called within a prisma.$transaction block
 * where the Payment record(s) using this number are also created to ensure
 * atomicity and prevent race conditions with the counter.
 *
 * @param tx The Prisma transaction client instance
 * @param schoolYearId The ID of the school year
 * @returns A promise that resolves to the generated sequential receipt number
 */
export async function generateReceiptNumber(tx: any, schoolYearId: string): Promise<string> {
    // Get the school year using the transaction client
    const schoolYear = await tx.schoolYear.findUnique({
        where: { id: schoolYearId },
    });

    if (!schoolYear) {
        throw new Error('School year not found');
    }

    // Get or create the counter
    let counter = await tx.receiptCounter.findUnique({
        where: { schoolYearId },
    });

    if (!counter) {
        counter = await tx.receiptCounter.create({
            data: {
                schoolYearId,
                lastNumber: 0,
            },
        });
    }

    // Increment counter
    const nextNumber = counter.lastNumber + 1;

    // Update the counter
    await tx.receiptCounter.update({
        where: { id: counter.id },
        data: { lastNumber: nextNumber },
    });

    // Format the number with padding
    const formattedNumber = nextNumber.toString().padStart(4, '0');

    // Create the sequential receipt number
    return `${schoolYear.name}-${formattedNumber}`;
}
