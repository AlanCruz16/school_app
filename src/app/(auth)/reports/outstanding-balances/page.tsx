// src/app/(auth)/reports/outstanding-balances/page.tsx
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import OutstandingBalances from '@/components/dashboard/outstanding-balances'
import { serializeDecimal } from '@/lib/utils/convert-decimal'

export default async function OutstandingBalancesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null // Will be handled by middleware
    }

    // Fetch all students with their grade and tutor info
    const students = await prisma.student.findMany({
        include: {
            grade: true,
            tutor: true
        },
        orderBy: {
            name: 'asc'
        }
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Regresar al tablero</span>
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Saldos Pendientes</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Estudiantes con Saldos Pendientes</CardTitle>
                    <CardDescription>
                        Ver todos los estudiantes con saldos no pagados
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <OutstandingBalances students={serializeDecimal(students)} />
                </CardContent>
            </Card>
        </div>
    )
}
