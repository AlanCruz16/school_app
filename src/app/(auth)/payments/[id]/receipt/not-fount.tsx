// src/app/(auth)/payments/[id]/receipt/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReceiptNotFound() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Receipt Not Found</CardTitle>
                    <CardDescription>
                        The receipt you're looking for doesn't exist or has been removed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>
                        Please check the payment ID and try again, or return to the payments list
                        to find the correct receipt.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/payments">
                            Back to Payments
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}