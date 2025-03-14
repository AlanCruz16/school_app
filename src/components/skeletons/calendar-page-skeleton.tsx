// src/components/skeletons/calendar-page-skeleton.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton for the filters section of the calendar page
 */
export function CalendarFiltersSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
            ))}
        </div>
    )
}

/**
 * Skeleton for the legends/indicators
 */
export function CalendarLegendsSkeleton() {
    return (
        <div className="flex flex-wrap gap-2 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                    <Skeleton className="w-3 h-3 rounded" />
                    <Skeleton className="h-4 w-16" />
                </div>
            ))}
        </div>
    )
}

/**
 * Skeleton for the calendar month grid items
 */
export function CalendarGridItemSkeleton() {
    return (
        <div className="p-4 rounded-lg border">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-4 w-24" />
        </div>
    )
}

/**
 * Skeleton for the month navigation buttons
 */
export function MonthNavigationSkeleton() {
    return (
        <div className="mt-8">
            <Skeleton className="h-5 w-40 mb-2" />
            <div className="flex flex-wrap gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-14 rounded-md" />
                ))}
            </div>
        </div>
    )
}

/**
 * Complete calendar page skeleton
 */
export default function CalendarPageSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Payment Calendar</h1>
                <p className="text-muted-foreground">
                    Visual overview of payments across all students
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Payment Calendar</CardTitle>
                    <CardDescription>
                        Monthly view of all student payments
                    </CardDescription>

                    <CalendarFiltersSkeleton />
                    <CalendarLegendsSkeleton />
                </CardHeader>

                <CardContent>
                    <div className="text-lg font-medium mb-4">
                        <Skeleton className="h-6 w-48" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <CalendarGridItemSkeleton key={i} />
                        ))}
                    </div>

                    <MonthNavigationSkeleton />
                </CardContent>
            </Card>
        </div>
    )
}