// src/app/(auth)/payments/[id]/receipt/page.tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Receipt from '@/components/payments/receipt'
import PrintButton from '@/components/payments/print-button'
import { serializeDecimal } from '@/lib/utils/convert-decimal'

interface ReceiptPageProps {
    params: Promise<{ id: string }>
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

    const { id } = await params

    // Fetch the payment with detailed information
    const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
            student: {
                include: {
                    grade: true,
                    tutor: true
                }
            },
            schoolYear: true,
            clerk: true
        }
    })

    if (!payment) {
        notFound()
    }

    // Fetch all payments belonging to the same transaction
    const relatedPayments = await prisma.payment.findMany({
        where: {
            transactionId: payment.transactionId, // Find all payments with the same transaction ID
            id: { not: payment.id }, // Exclude the current payment itself
            studentId: payment.studentId // Ensure they are for the same student (redundant but safe)
        },
        include: {
            student: {
                include: {
                    grade: true,
                    tutor: true // Added tutor include here
                }
            },
            schoolYear: true,
            clerk: true
        }
    });

    // If we have related payments, include them with the main payment
    const enhancedPayment = {
        ...payment,
        relatedPayments: relatedPayments.length > 0 ? relatedPayments : undefined
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/payments">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Regresar a pagos</span>
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">Recibo #{payment.receiptNumber}</h1>
                </div>

                {/* <div className="print:hidden">
                    <PrintButton />
                </div> */}
            </div>

            <Receipt
                payment={serializeDecimal(enhancedPayment)}
                schoolName="Sistema de Pago Escolar"
                schoolAddress="Calle Educación 123, Ciudad Aprendizaje"
                schoolPhone="(123) 456-7890"
                schoolEmail="admin@school.edu"
            />
        </div>
    )
}
