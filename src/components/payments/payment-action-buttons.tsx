// src/components/payments/payment-action-buttons.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Printer, Eye } from 'lucide-react'

interface PaymentActionButtonsProps {
    paymentId: string
}

export default function PaymentActionButtons({ paymentId }: PaymentActionButtonsProps) {
    const router = useRouter()
    const [isPrinting, setIsPrinting] = useState(false)

    const handleViewReceipt = () => {
        router.push(`/payments/${paymentId}/receipt`)
    }

    const handlePrintReceipt = () => {
        setIsPrinting(true)

        // Open the receipt in a new window for printing
        const printWindow = window.open(`/payments/${paymentId}/receipt?print=true`, '_blank')

        // Reset button state after a short delay
        setTimeout(() => {
            setIsPrinting(false)
        }, 1000)

        // Handle case where popup is blocked
        if (!printWindow) {
            alert('Por favor, permita las ventanas emergentes para imprimir recibos')
            setIsPrinting(false)
        }
    }

    return (
        <div className="flex justify-end gap-2">
            <Button
                variant="outline"
                size="icon"
                onClick={handlePrintReceipt}
                disabled={isPrinting}
            >
                <Printer className="h-4 w-4" />
                <span className="sr-only">Imprimir Recibo</span>
            </Button>

            <Button
                variant="outline"
                size="icon"
                onClick={handleViewReceipt}
            >
                <Eye className="h-4 w-4" />
                <span className="sr-only">Ver Recibo</span>
            </Button>
        </div>
    )
}
