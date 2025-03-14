// src/components/skeletons/dashboard-skeleton.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * A skeleton component for the dashboard metrics cards
 */
export function MetricCardSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-7 w-20" />
            </CardContent>
        </Card>
    )
}

/**
 * A skeleton for the payment summary card
 */
export function PaymentSummarySkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-5 w-52 mb-2" />
                <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="text-center p-4 rounded-lg border">
                            <Skeleton className="h-7 w-8 mx-auto mb-2" />
                            <Skeleton className="h-4 w-16 mx-auto" />
                        </div>
                    ))}
                </div>

                <Skeleton className="h-5 w-40 mb-4" />
                <div className="flex flex-wrap gap-2 mb-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-14 rounded-md" />
                    ))}
                </div>

                <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20" />
                </div>

                <div className="space-y-3 max-h-64">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-3 rounded-lg border">
                            <div className="flex justify-between mb-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <Skeleton className="h-3 w-24" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * A skeleton for the outstanding payments card
 */
export function OutstandingPaymentsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-5 w-44" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between border-b pb-2">
                            <div>
                                <Skeleton className="h-4 w-40 mb-2" />
                                <Skeleton className="h-3 w-28" />
                            </div>
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Complete dashboard skeleton
 */
export default function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                    Overview of the school payment system
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <PaymentSummarySkeleton />
                <OutstandingPaymentsSkeleton />
            </div>
        </div>
    )
}