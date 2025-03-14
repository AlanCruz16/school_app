// src/app/(auth)/tutors/page.tsx
import { Suspense } from 'react'
import { createClient } from '@/lib/utils/supabase/server'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import TutorsList from '@/components/tutors/tutors-list'
import TutorSearch from '@/components/tutors/tutor-search'
import TutorsListSkeleton from '@/components/skeletons/tutors-list-skeleton'
import { SuspenseWrapper } from '@/lib/utils/suspense-wrapper'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'

// This component fetches and displays the actual tutors list
async function TutorsContent({
    searchParams
}: {
    searchParams: { query?: string }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

    // Get search query from URL params
    const query = searchParams.query || ''

    // Build filters for prisma
    const filters: any = {}

    if (query) {
        filters.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } }
        ]
    }

    // Fetch tutors with filtering
    const tutors = await prisma.tutor.findMany({
        where: filters,
        include: {
            _count: {
                select: { students: true }
            }
        },
        orderBy: {
            name: 'asc'
        }
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Tutors</h1>
                    <p className="text-muted-foreground">
                        Manage tutor records and contact information
                    </p>
                </div>
                <Button asChild>
                    <Link href="/tutors/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Tutor
                    </Link>
                </Button>
            </div>

            <TutorSearch />

            <TutorsList tutors={tutors} />
        </div>
    )
}

export default function TutorsPage({
    searchParams
}: {
    searchParams: { query?: string }
}) {
    return (
        <Suspense fallback={<TutorsListSkeleton />}>
            <SuspenseWrapper>
                <TutorsContent searchParams={searchParams} />
            </SuspenseWrapper>
        </Suspense>
    )
}