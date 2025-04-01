'use client';

import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2, Banknote } from 'lucide-react'; // Changed icon
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { Payment, PaymentMethod, Student } from '@prisma/client'; // Import PaymentMethod

// Define the shape of the payment data including student
type PaymentWithStudent = Payment & {
    student: Pick<Student, 'id' | 'name'> | null;
};

// Define the shape of the data expected from the API
type PaymentsByMethodReportData = {
    [key in PaymentMethod]?: PaymentWithStudent[];
};

// Helper function to format PaymentMethod names (e.g., TARJETA_CREDITO -> Tarjeta Credito)
function formatPaymentMethodName(method: string) {
    return method
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}


export default function PaymentsByMethodReportPage() { // Renamed component
    // State now holds an object, not an array
    const [data, setData] = useState<PaymentsByMethodReportData>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                // Fetch from the correct endpoint
                const response = await fetch('/api/reports/payments-by-method');
                if (!response.ok) {
                    throw new Error(`Failed to fetch data: ${response.statusText}`);
                }
                // Expecting the object structure now
                const result: PaymentsByMethodReportData = await response.json();
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Check if the data object is empty
    const noDataFound = !loading && !error && Object.keys(data).length === 0;

    return (
        <div className="container mx-auto p-4 md:p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Banknote className="h-6 w-6" /> {/* Changed icon */}
                Reporte de Últimos 10 Pagos por Método {/* Updated title */}
            </h1>

            {loading && (
                <Card>
                    <CardContent className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Cargando datos del reporte...</span>
                    </CardContent>
                </Card>
            )}
            {error && (
                <Card>
                    <CardContent className="flex justify-center items-center py-10 text-destructive">
                        <AlertCircle className="h-8 w-8" />
                        <span className="ml-2">Error al cargar el reporte: {error}</span>
                    </CardContent>
                </Card>
            )}
            {noDataFound && (
                <Card>
                    <CardContent>
                        <p className="text-center text-muted-foreground py-10">No se encontraron datos de pago para este reporte.</p>
                    </CardContent>
                </Card>
            )}

            {/* Render a card and table for each payment method */}
            {!loading && !error && Object.keys(data).length > 0 && (
                <div className="space-y-6">
                    {(Object.keys(data) as PaymentMethod[]).map((method) => (
                        <Card key={method}>
                            <CardHeader>
                                {/* Format the method name for display */}
                                <CardTitle>{formatPaymentMethodName(method)}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {/* Removed Payment Type/Method column as it's grouped */}
                                            <TableHead>Estudiante</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                            <TableHead>Fecha de Pago</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead>Recibo #</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data[method]?.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>{payment.student?.name ?? 'N/A'}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(parseFloat(payment.amount as any))}</TableCell>
                                                <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                                                <TableCell>{payment.description ?? '-'}</TableCell>
                                                <TableCell>{payment.receiptNumber}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
