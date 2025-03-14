// src/components/skeletons/payments-list-skeleton.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
 * Skeleton for payment filters section
 */
export function PaymentFiltersSkeleton() {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Skeleton className="h-9 w-full" />
                    </div>
                    <div>
                        <Skeleton className="h-9 w-full" />
                    </div>
                    <div>
                        <Skeleton className="h-9 w-full" />
                    </div>
                    <div>
                        <Skeleton className="h-9 w-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Skeleton for payment table row
 */
export function PaymentTableRowSkeleton() {
    return (
        <TableRow>
            <TableCell>
                <Skeleton className="h-5 w-24" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-36" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-20" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-16" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-24" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-20 rounded-full" />
            </TableCell>
            <TableCell className="text-right">
                <Skeleton className="h-5 w-20 ml-auto" />
            </TableCell>
            <TableCell>
                <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
            </TableCell>
        </TableRow>
    )
}

/**
 * Skeleton for payments table
 */
export function PaymentsTableSkeleton() {
    return (
        <Card>
            <CardContent className="p-0">
                <div className="rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Receipt No.</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Month</TableHead>
                                <TableHead>School Year</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 10 }).map((_, i) => (
                                <PaymentTableRowSkeleton key={i} />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Complete payments list page skeleton
 */
export default function PaymentsListSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Payments</h1>
                    <p className="text-muted-foreground">
                        Manage payment records and view payment history
                    </p>
                </div>
                <Skeleton className="h-10 w-36" />
            </div>

            <PaymentFiltersSkeleton />
            <PaymentsTableSkeleton />
        </div>
    )
}