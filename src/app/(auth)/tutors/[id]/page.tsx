// src/app/(auth)/tutors/[id]/page.tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    ArrowLeft,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Plus,
    Trash,
    User
} from 'lucide-react'
import TutorStudentsList from '@/components/tutors/tutor-students-list'
import DeleteTutorButton from '@/components/tutors/delete-tutor-button'
import TutorDetailSkeleton from '@/components/skeletons/tutor-detail-skeleton'
import { SuspenseWrapper } from '@/lib/utils/suspense-wrapper'

// This component fetches and displays the actual tutor details
async function TutorDetailContent({
    params
}: {
    params: { id: string }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

    const tutor = await prisma.tutor.findUnique({
        where: { id: params.id },
        include: {
            students: {
                include: {
                    grade: {
                        include: {
                            schoolYear: true
                        }
                    }
                },
                orderBy: {
                    name: 'asc'
                }
            }
        }
    })

    if (!tutor) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/tutors">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Regresar a tutores</span>
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">{tutor.name}</h1>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href={`/tutors/${tutor.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar Tutor
                        </Link>
                    </Button>

                    <DeleteTutorButton
                        tutorId={tutor.id}
                        tutorName={tutor.name}
                        hasStudents={tutor.students.length > 0}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Tutor Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Información de Contacto
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <div className="text-sm font-medium">Correo Electrónico</div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <a href={`mailto:${tutor.email}`} className="hover:underline">
                                    {tutor.email}
                                </a>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <div className="text-sm font-medium">Teléfono</div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <a href={`tel:${tutor.phone}`} className="hover:underline">
                                    {tutor.phone}
                                </a>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <div className="text-sm font-medium">Dirección</div>
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span>
                                    {tutor.address || 'Dirección no proporcionada'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Students Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Estudiantes</CardTitle>
                        <CardDescription>
                            {tutor.students.length === 0
                                ? 'No hay estudiantes asociados con este tutor'
                                : `Este tutor es responsable de ${tutor.students.length} estudiante${tutor.students.length === 1 ? '' : 's'}`
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center">
                            <div className="text-5xl font-bold mb-2">
                                {tutor.students.length}
                            </div>
                            <div className="text-sm text-muted-foreground mb-4">
                                Total de Estudiantes
                            </div>

                            <Button asChild>
                                <Link href={`/students/new?tutorId=${tutor.id}`}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Agregar Nuevo Estudiante
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Student List */}
            <Card>
                <CardHeader>
                    <CardTitle>Estudiantes Asociados</CardTitle>
                    <CardDescription>
                        Estudiantes con {tutor.name} como su tutor
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TutorStudentsList students={tutor.students} />
                </CardContent>
            </Card>
        </div>
    )
}

export default function TutorDetailPage({
    params
}: {
    params: { id: string }
}) {
    return (
        <Suspense fallback={<TutorDetailSkeleton />}>
            <SuspenseWrapper>
                <TutorDetailContent params={params} />
            </SuspenseWrapper>
        </Suspense>
    )
}
