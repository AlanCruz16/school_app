// src/components/skeletons/tutors-list-skeleton.tsx
import { Card, CardContent, CardFooter } from '@/components/ui/card'
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
 * Skeleton for tutor search component
 */
export function TutorSearchSkeleton() {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Skeleton className="h-9 w-full" />
                    </div>
                    <Skeleton className="h-9 w-24" />
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Skeleton for tutor table row
 */
export function TutorTableRowSkeleton() {
    return (
        <TableRow>
            <TableCell className="font-medium">
                <Skeleton className="h-5 w-36" />
            </TableCell>
            <TableCell>
                <div className="space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </TableCell>
            <TableCell>
                <Skeleton className="h-4 w-48" />
            </TableCell>
            <TableCell className="text-center">
                <Skeleton className="h-5 w-10 mx-auto" />
            </TableCell>
            <TableCell className="text-right">
                <Skeleton className="h-8 w-8 rounded-md ml-auto" />
            </TableCell>
        </TableRow>
    )
}

/**
 * Skeleton for tutors table
 */
export function TutorsTableSkeleton() {
    return (
        <Card>
            <CardContent className="p-0">
                <div className="rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact Information</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead className="text-center">Students</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <TutorTableRowSkeleton key={i} />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="py-4">
                <Skeleton className="h-4 w-32" />
            </CardFooter>
        </Card>
    )
}

/**
 * Complete tutors list page skeleton
 */
export default function TutorsListSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Tutors</h1>
                    <p className="text-muted-foreground">
                        Manage tutor records and contact information
                    </p>
                </div>
                <Skeleton className="h-10 w-28" />
            </div>

            <TutorSearchSkeleton />
            <TutorsTableSkeleton />
        </div>
    )
}