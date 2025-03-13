// src/app/(auth)/payments/page.tsx
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/utils/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, PlusCircle } from 'lucide-react';
import PaymentHistory from '@/components/payments/payment-history';
import PaymentFilters from '@/components/payments/payment-filters';

export default async function PaymentsPage({
    searchParams
}: {
    searchParams: { studentId?: string; schoolYearId?: string; month?: string; limit?: string }
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null; // Will be handled by middleware
    }

    // Get active school year for default filter
    const activeSchoolYear = await prisma.schoolYear.findFirst({
        where: { active: true }
    });

    // Get filter parameters from URL
    const studentId = searchParams.studentId;
    const schoolYearId = searchParams.schoolYearId || (activeSchoolYear?.id || '');
    const month = searchParams.month ? parseInt(searchParams.month) : undefined;
    const limit = searchParams.limit ? parseInt(searchParams.limit) : 50;

    // Build the filters for prisma
    const filters: any = {};

    if (studentId) {
        filters.studentId = studentId;
    }

    if (schoolYearId) {
        filters.schoolYearId = schoolYearId;
    }

    if (month !== undefined) {
        filters.forMonth = month;
    }

    // Fetch payments with filters
    const payments = await prisma.payment.findMany({
        where: filters,
        include: {
            student: {
                select: {
                    name: true,
                    grade: {
                        select: {
                            name: true
                        }
                    }
                }
            },
            schoolYear: true,
            clerk: true
        },
        orderBy: {
            paymentDate: 'desc'
        },
        take: limit
    });

    // Fetch school years for filter options
    const schoolYears = await prisma.schoolYear.findMany({
        orderBy: {
            startDate: 'desc'
        }
    });

    // Fetch students for filter options
    const students = await prisma.student.findMany({
        where: { active: true },
        orderBy: {
            name: 'asc'
        },
        select: {
            id: true,
            name: true
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Payments</h1>
                    <p className="text-muted-foreground">
                        View and manage payment records
                    </p>
                </div>
                <Button asChild>
                    <Link href="/payments/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Payment
                    </Link>
                </Button>
            </div>

            <PaymentFilters
                students={students}
                schoolYears={schoolYears}
                activeSchoolYear={activeSchoolYear}
            />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment History
                    </CardTitle>
                    <CardDescription>
                        Recent payment transactions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {payments.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No payment records found. Use the filters above or adjust your search criteria.
                        </div>
                    ) : (
                        <PaymentHistory payments={payments} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}