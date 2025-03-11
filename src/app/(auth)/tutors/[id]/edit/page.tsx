// src/app/(auth)/tutors/[id]/edit/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'
import { Button } from '@/components/ui/button'
import TutorForm from '@/components/tutors/tutor-form'

export default async function EditTutorPage({
    params
}: {
    params: { id: string }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

    // Fetch the tutor data
    const tutor = await prisma.tutor.findUnique({
        where: { id: params.id }
    })

    if (!tutor) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" asChild>
                    <Link href={`/tutors/${tutor.id}`}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back to tutor</span>
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Edit Tutor</h1>
            </div>

            <TutorForm
                tutor={tutor}
                isEditing={true}
            />
        </div>
    )
}