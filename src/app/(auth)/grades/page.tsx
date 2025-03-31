'use client'

import { useState, useEffect } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format' // Assuming you have a currency formatter

// Define the type for a Grade object based on your API response
// Ensure this matches the structure returned by /api/grades
interface Grade {
    id: string
    name: string
    tuitionAmount: number | string // Prisma Decimal can be string or number
    inscriptionCost: number | string // Prisma Decimal can be string or number
    schoolYear: {
        id: string
        name: string
    }
    // Add other fields if needed, like _count
}

export default function GradesPage() {
    const [grades, setGrades] = useState<Grade[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchGrades() {
            setLoading(true)
            setError(null)
            try {
                // TODO: Ideally, fetch grades for the *active* school year
                // You might need to adjust the API call or add filtering here
                const response = await fetch('/api/grades') // Adjust if filtering by school year is needed
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                const data = await response.json()
                setGrades(data)
            } catch (e: any) {
                console.error('Failed to fetch grades:', e)
                setError('Failed to load grades. Please try again later.')
            } finally {
                setLoading(false)
            }
        }

        fetchGrades()
    }, [])

    return (
        <div className="container mx-auto p-4 md:p-6">
            <h1 className="text-2xl font-semibold mb-4">Grade Fees</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Tuition and Inscription Costs per Grade</CardTitle>
                    {/* Add filtering by School Year if needed */}
                </CardHeader>
                <CardContent>
                    {loading && <p>Loading grades...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                    {!loading && !error && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Grade</TableHead>
                                    <TableHead>School Year</TableHead>
                                    <TableHead className="text-right">Tuition Fee</TableHead>
                                    <TableHead className="text-right">Inscription Cost</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {grades.length > 0 ? (
                                    grades.map((grade) => (
                                        <TableRow key={grade.id}>
                                            <TableCell className="font-medium">{grade.name}</TableCell>
                                            <TableCell>{grade.schoolYear?.name || 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(Number(grade.tuitionAmount))}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(Number(grade.inscriptionCost))}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">
                                            No grades found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
