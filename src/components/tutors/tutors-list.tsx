'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from '@/components/ui/dialog'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { MoreHorizontal, Pencil, Trash, Users } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Tutor {
    id: string
    name: string
    email: string
    phone: string
    address?: string | null
    _count: {
        students: number
    }
}

interface TutorsListProps {
    tutors: Tutor[]
}

export default function TutorsList({ tutors }: TutorsListProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [tutorToDelete, setTutorToDelete] = useState<Tutor | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!tutorToDelete) return

        setIsDeleting(true)

        try {
            const response = await fetch(`/api/tutors/${tutorToDelete.id}`, {
                method: 'DELETE',
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete tutor')
            }

            toast({
                title: 'Tutor Deleted',
                description: `${tutorToDelete.name} has been removed successfully.`,
            })

            router.refresh()
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'An error occurred',
                variant: 'destructive',
            })
        } finally {
            setIsDeleting(false)
            setTutorToDelete(null)
        }
    }

    if (tutors.length === 0) {
        return (
            <Card>
                <CardContent className="py-10">
                    <div className="text-center">
                        <p className="text-muted-foreground">No tutors found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Try adjusting your search or add a new tutor
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardContent className="p-0">
                <div className="max-h-[600px] overflow-auto rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card z-10">
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact Information</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead className="text-center">Students</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tutors.map((tutor) => (
                                <TableRow key={tutor.id}>
                                    <TableCell className="font-medium">
                                        <Link
                                            href={`/tutors/${tutor.id}`}
                                            className="hover:underline"
                                        >
                                            {tutor.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="text-sm">{tutor.email}</div>
                                            <div className="text-sm">{tutor.phone}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        {tutor.address || 'Not provided'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Link
                                            href={`/tutors/${tutor.id}`}
                                            className="inline-flex items-center justify-center gap-1 hover:underline"
                                        >
                                            <Users className="h-4 w-4" />
                                            <span>{tutor._count.students}</span>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Open menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/tutors/${tutor.id}/edit`}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => setTutorToDelete(tutor)}
                                                    className="text-destructive"
                                                    disabled={tutor._count.students > 0}
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="py-4">
                <div className="text-sm text-muted-foreground">
                    Total: {tutors.length} tutors
                </div>
            </CardFooter>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!tutorToDelete} onOpenChange={(open) => !open && setTutorToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {tutorToDelete?.name}?
                            {tutorToDelete?._count.students ? (
                                <div className="mt-2 text-destructive">
                                    This tutor has {tutorToDelete._count.students} associated students.
                                    Please reassign or remove those students first.
                                </div>
                            ) : (
                                <div className="mt-2">
                                    This action cannot be undone.
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>

                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting || (tutorToDelete?._count.students ?? 0) > 0}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}