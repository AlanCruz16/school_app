// src/app/(auth)/tutors/new/page.tsx
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/utils/supabase/server'
import { Button } from '@/components/ui/button'
import TutorForm from '@/components/tutors/tutor-form'

export default async function NewTutorPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/tutors">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Regresar a tutores</span>
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Agregar Nuevo Tutor</h1>
            </div>

            <TutorForm />
        </div>
    )
}
