// src/app/(auth)/payments/[id]/receipt/page.tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Receipt from '@/components/payments/receipt'
import PrintButton from '@/components/payments/print-button'

interface ReceiptPageProps {
    params: { id: string }
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

    // Fetch the payment with detailed information
    const payment = await prisma.payment.findUnique({
        where: { id: params.id },
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

    // For multi-month payments - check if this payment is part of a batch
    // Payments from the same transaction will have similar receipt numbers (base-month-year pattern)
    const baseReceiptNumber = payment.receiptNumber.split('-')[0]; // Get the base part of the receipt

    const relatedPayments = await prisma.payment.findMany({
        where: {
            receiptNumber: {
                startsWith: baseReceiptNumber + '-'  // Find all with the same base
            },
            id: { not: payment.id }, // Exclude the current payment
            studentId: payment.studentId //only payments for the same student
        },
        include: {
            student: {
                include: {
                    grade: true
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
                            <span className="sr-only">Back to payments</span>
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">Receipt #{payment.receiptNumber}</h1>
                </div>

                {/* <div className="print:hidden">
                    <PrintButton />
                </div> */}
            </div>

            <Receipt
                payment={enhancedPayment}
                schoolName="School Payment System"
                schoolAddress="123 Education Lane, Schooltown"
                schoolPhone="(123) 456-7890"
                schoolEmail="admin@school.edu"
            />
        </div>
    )
}