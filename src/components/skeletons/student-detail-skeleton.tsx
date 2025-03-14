// src/components/skeletons/student-detail-skeleton.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
 * Skeleton for the student information card
 */
export function StudentInfoCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-5 w-40" />
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <div className="text-sm font-medium">Grade</div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
                <div className="grid gap-2">
                    <div className="text-sm font-medium">Tuition Fee</div>
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="grid gap-2">
                    <div className="text-sm font-medium">Current Balance</div>
                    <Skeleton className="h-7 w-20" />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Skeleton className="h-9 w-28" />
                    <Skeleton className="h-9 w-28" />
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Skeleton for the tutor information card
 */
export function TutorInfoCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-5 w-36" /></CardTitle>
                <CardDescription><Skeleton className="h-4 w-52" /></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <div className="text-sm font-medium">Name</div>
                    <Skeleton className="h-5 w-40" />
                </div>
                <div className="grid gap-2">
                    <div className="text-sm font-medium">Contact</div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                </div>
                <div className="grid gap-2">
                    <div className="text-sm font-medium">Address</div>
                    <Skeleton className="h-4 w-full" />
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Skeleton for the payment calendar
 */
export function PaymentCalendarSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-5 w-52" /></CardTitle>
                <CardDescription>
                    <Skeleton className="h-4 w-64" />
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="p-4 rounded-lg border flex flex-col items-center justify-center">
                            <Skeleton className="h-5 w-16 mb-1" />
                            <Skeleton className="h-4 w-12 mb-2" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Skeleton for the payment history table
 */
export function PaymentHistorySkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-5 w-36" /></CardTitle>
                <CardDescription>
                    <Skeleton className="h-4 w-64" />
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <div className="max-h-[600px] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Receipt No.</TableHead>
                                    <TableHead>Month</TableHead>
                                    <TableHead>School Year</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Processed By</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
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
 * Complete student detail page skeleton
 */
export default function StudentDetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-8 w-48" />
                <div className="ml-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <StudentInfoCardSkeleton />
                <TutorInfoCardSkeleton />
            </div>

            <PaymentCalendarSkeleton />
            <PaymentHistorySkeleton />
        </div>
    )
}