/**
 * Format a number as currency
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount)
}

/**
 * Format a date as a string
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

/**
 * Format a month number (1-12) as a month name
 */
export function formatMonth(month: number): string {
    const date = new Date(2000, month - 1, 1)
    return date.toLocaleDateString('en-US', { month: 'long' })
}

// Import PaymentMethod enum
import { PaymentMethod } from '@prisma/client';

// Define a map for displaying ALL possible payment method values (including legacy)
export const paymentMethodDisplayMap: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: 'CASH', // Display legacy as is
    [PaymentMethod.CARD]: 'CARD', // Display legacy as is
    [PaymentMethod.EFECTIVO]: '01 Efectivo',
    [PaymentMethod.CHEQUE_NOMINATIVO]: '02 Cheque nominativo',
    [PaymentMethod.TRANSFERENCIA]: '03 Transferencia electrónica de fondos',
    [PaymentMethod.TARJETA_CREDITO]: '04 Tarjeta de crédito',
    [PaymentMethod.TARJETA_DEBITO]: '28 Tarjeta de débito',
};
