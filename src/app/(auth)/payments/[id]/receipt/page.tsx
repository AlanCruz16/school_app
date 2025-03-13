// src/app/(auth)/payments/[id]/receipt/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate, formatMonth } from '@/lib/utils/format'
import PaymentReceipt from '@/components/payments/payment-receipt'
import PrintButton from '@/components/payments/print-button'

export default async function PaymentReceiptPage({
    params
}: {
    params: { id: string }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

    // Fetch the payment with related data
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
                    <h1 className="text-3xl font-bold">Payment Receipt</h1>
                </div>
                <PrintButton />
            </div>

            <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <CardTitle>PAYMENT RECEIPT</CardTitle>
                    <CardDescription>
                        Receipt #{payment.receiptNumber}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PaymentReceipt payment={payment} />
                </CardContent>
                <CardFooter className="flex justify-center border-t pt-4 text-xs text-muted-foreground">
                    <p>Thank you for your payment.</p>
                </CardFooter>
            </Card>
        </div>
    )
}