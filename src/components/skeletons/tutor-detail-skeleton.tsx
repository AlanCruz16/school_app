// src/components/skeletons/tutor-detail-skeleton.tsx
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
 * Skeleton for the tutor contact information card
 */
export function ContactInfoCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-5 w-40" />
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <div className="text-sm font-medium">Email</div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>

                <div className="grid gap-2">
                    <div className="text-sm font-medium">Phone</div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>

                <div className="grid gap-2">
                    <div className="text-sm font-medium">Address</div>
                    <div className="flex items-start gap-2">
                        <Skeleton className="h-4 w-4 mt-0.5" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Skeleton for the students stats card
 */
export function StudentsStatsCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-5 w-20" /></CardTitle>
                <CardDescription>
                    <Skeleton className="h-4 w-56" />
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center">
                    <Skeleton className="h-12 w-10 mb-2" />
                    <Skeleton className="h-4 w-32 mb-4" />
                    <Skeleton className="h-9 w-36" />
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Skeleton for the associated students table
 */
export function AssociatedStudentsTableSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-5 w-44" /></CardTitle>
                <CardDescription>
                    <Skeleton className="h-4 w-64" />
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <Skeleton className="h-5 w-36" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-40" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-20 rounded-full" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="h-5 w-20 ml-auto" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Complete tutor detail page skeleton
 */
export default function TutorDetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-8 w-48" />
                </div>

                <div className="flex gap-2">
                    <Skeleton className="h-9 w-28" />
                    <Skeleton className="h-9 w-32" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <ContactInfoCardSkeleton />
                <StudentsStatsCardSkeleton />
            </div>

            <AssociatedStudentsTableSkeleton />
        </div>
    )
}