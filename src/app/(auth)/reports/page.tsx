import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { List, FileText, Banknote } from 'lucide-react'; // Added icons

export default function ReportsPage() {
    return (
        <div className="container mx-auto p-4 md:p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <List className="h-6 w-6" />
                Reports Dashboard
            </h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Outstanding Balances Report Card */}
                <Link href="/reports/outstanding-balances" className="block hover:shadow-lg transition-shadow duration-200 rounded-lg">
                    <Card className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-semibold">
                                Outstanding Balances
                            </CardTitle>
                            <FileText className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                View students with pending payments.
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                {/* Payments by Method Report Card (Placeholder) */}
                <Link href="/reports/payments-by-method" className="block hover:shadow-lg transition-shadow duration-200 rounded-lg">
                    <Card className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-semibold">
                                Payments by Method
                            </CardTitle>
                            <Banknote className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <CardDescription>
                                See the last 10 payments for each payment method.
                            </CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                {/* Add more report cards here as needed */}

            </div>
        </div>
    );
}
