'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
import { Trash } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface DeleteTutorButtonProps {
    tutorId: string
    tutorName: string
    hasStudents: boolean
}

export default function DeleteTutorButton({
    tutorId,
    tutorName,
    hasStudents
}: DeleteTutorButtonProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (hasStudents) return

        setIsDeleting(true)

        try {
            const response = await fetch(`/api/tutors/${tutorId}`, {
                method: 'DELETE',
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error al eliminar tutor')
            }

            toast({
                title: 'Tutor Eliminado',
                description: `${tutorName} ha sido eliminado exitosamente.`,
            })

            // Redirect to tutors list
            router.push('/tutors')
            router.refresh()
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'An error occurred',
                variant: 'destructive',
            })
        } finally {
            setIsDeleting(false)
            setIsOpen(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Eliminar Tutor
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Eliminación</DialogTitle>
                    <DialogDescription>
                        ¿Está seguro que desea eliminar a {tutorName}?
                        {hasStudents ? (
                            <div className="mt-2 text-destructive">
                                Este tutor tiene estudiantes asociados.
                                Por favor, reasigne o elimine esos estudiantes primero.
                            </div>
                        ) : (
                            <div className="mt-2">
                                Esta acción no se puede deshacer.
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting || hasStudents}
                    >
                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
