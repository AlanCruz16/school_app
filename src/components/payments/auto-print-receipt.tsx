'use client'

// src/components/payments/auto-print-receipt.tsx
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface AutoPrintReceiptProps {
    printFunction: () => void
}

export default function AutoPrintReceipt({ printFunction }: AutoPrintReceiptProps) {
    const searchParams = useSearchParams()
    const shouldPrint = searchParams.get('print') === 'true'

    useEffect(() => {
        // Make sure this runs only on the client side
        if (typeof window !== 'undefined' && shouldPrint) {
            // Add a longer delay to ensure the receipt is fully rendered
            const timer = setTimeout(() => {
                console.log('Auto-printing receipt...')
                printFunction()
            }, 800)

            return () => clearTimeout(timer)
        }
    }, [shouldPrint, printFunction])

    return null
}