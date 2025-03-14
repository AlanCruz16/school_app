// src/components/skeletons/payment-page-skeleton.tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'

/**
 * Skeleton for the student selector component
 */
export function StudentSelectorSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-6 w-32" /></CardTitle>
                <CardDescription>
                    <Skeleton className="h-4 w-64" />
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>

                <div className="rounded-md border">
                    <div className="max-h-[400px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Grade</TableHead>
                                    <TableHead>Tutor</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <Skeleton className="h-5 w-32" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-28" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-28" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Skeleton className="h-5 w-20 ml-auto" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Skeleton className="h-8 w-16 ml-auto" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Skeleton for the payment form
 */
export function PaymentFormSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-6 w-32" /></CardTitle>
                <CardDescription>
                    <Skeleton className="h-4 w-48" />
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Student Info */}
                <div className="rounded-md bg-muted p-4">
                    <div className="grid gap-2">
                        <div className="text-sm font-medium">Student</div>
                        <Skeleton className="h-6 w-40" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                            <div className="text-sm font-medium">Grade</div>
                            <Skeleton className="h-5 w-32 mt-1" />
                        </div>
                        <div>
                            <div className="text-sm font-medium">Monthly Fee</div>
                            <Skeleton className="h-5 w-24 mt-1" />
                        </div>
                    </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <div className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    </div>
                </div>

                {/* Payment Month */}
                <div className="space-y-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>

                {/* Partial Payment Toggle */}
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-8 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                </div>

                {/* Payment Amount */}
                <div className="space-y-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-64" />
                </div>

                {/* Notes */}
                <div className="space-y-3">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-24 w-full" />
                </div>

                {/* Receipt Preview */}
                <div className="rounded-md border p-4">
                    <Skeleton className="h-5 w-32 mb-3" />
                    <div className="mt-2 space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-32" />
            </CardFooter>
        </Card>
    )
}

/**
 * Props for the PaymentPageSkeleton component
 */
interface PaymentPageSkeletonProps {
    hasStudent?: boolean;
}

/**
 * Complete payment page skeleton - handles both student selection and payment form states
 */
export default function PaymentPageSkeleton({ hasStudent = false }: PaymentPageSkeletonProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-md" />
                <h1 className="text-3xl font-bold">New Payment</h1>
            </div>

            {hasStudent ? (
                <PaymentFormSkeleton />
            ) : (
                <StudentSelectorSkeleton />
            )}
        </div>
    )
}