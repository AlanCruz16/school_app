// src/components/skeletons/student-list-skeleton.tsx
import { Card, CardContent } from '@/components/ui/card'
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
 * Skeleton for the student filters section
 */
export function StudentFiltersSkeleton() {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-4">
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
 * Skeleton for the student table rows
 */
export function StudentTableRowSkeleton() {
    return (
        <TableRow>
            <TableCell>
                <Skeleton className="h-5 w-36" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-40" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-32" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-16" />
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
    )
}

/**
 * Skeleton for the students list table
 */
export function StudentTableSkeleton() {
    return (
        <Card>
            <CardContent className="p-0">
                <div className="rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Tutor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 10 }).map((_, i) => (
                                <StudentTableRowSkeleton key={i} />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Complete student list page skeleton
 */
export default function StudentListSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Students</h1>
                    <p className="text-muted-foreground">
                        Manage student records and view payment status
                    </p>
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            <StudentFiltersSkeleton />
            <StudentTableSkeleton />
        </div>
    )
}